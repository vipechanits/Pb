/**
 * Migration Script: Place Completed Re-Entry Activations in Global Matrix
 * 
 * This script finds all completed Cycle 2+ activations that don't have matrix positions
 * and places them in the global matrix using the BFS algorithm.
 * 
 * Run with: npx tsx server/migrate-reentry-matrix-positions.ts
 */

import { db } from './db';
import { activations, users, reentries, activationMatrixPositions } from '@shared/schema';
import { eq, isNull, and, sql } from 'drizzle-orm';

async function migrateReentryMatrixPositions() {
  console.log('='.repeat(80));
  console.log('MIGRATION: Place Completed Re-Entry Activations in Global Matrix');
  console.log('='.repeat(80));

  try {
    // Find all completed re-entry activations (Cycle 2+) without matrix positions
    const completedReentries = await db
      .select({
        cycleNumber: reentries.cycleNumber,
        activationId: reentries.newActivationId,
        userId: reentries.userId,
        completedAt: activations.completedAt,
      })
      .from(reentries)
      .innerJoin(activations, eq(reentries.newActivationId, activations.id))
      .leftJoin(activationMatrixPositions, eq(activations.id, activationMatrixPositions.activationId))
      .where(
        and(
          eq(activations.status, 'completed'),
          isNull(activationMatrixPositions.activationId) // No matrix position exists
        )
      )
      .orderBy(reentries.cycleNumber, activations.completedAt);

    console.log(`\n✓ Found ${completedReentries.length} completed re-entry activations without matrix positions\n`);

    if (completedReentries.length === 0) {
      console.log('✓ All completed re-entry activations already have matrix positions. No migration needed.\n');
      return;
    }

    // Display summary
    console.log('Activations to place in matrix:');
    console.log('-'.repeat(80));
    for (const entry of completedReentries) {
      const user = await db.select().from(users).where(eq(users.userId, entry.userId!)).limit(1);
      console.log(`  Cycle ${entry.cycleNumber} - ${user[0]?.userId} (${user[0]?.name}) - ${entry.activationId}`);
    }
    console.log('-'.repeat(80));

    // Place each activation in the matrix using BFS algorithm
    let successCount = 0;
    let errorCount = 0;

    for (const entry of completedReentries) {
      try {
        console.log(`\nPlacing Cycle ${entry.cycleNumber} activation ${entry.activationId} in matrix...`);
        
        await db.transaction(async (tx) => {
          // Find next available matrix slot using BFS
          let currentLevel = 1;
          const maxSearchLevels = 100;
          let placed = false;

          while (currentLevel <= maxSearchLevels && !placed) {
            // Get all positions at this level
            const levelPositions = await tx
              .select()
              .from(activationMatrixPositions)
              .where(eq(activationMatrixPositions.matrixLevel, currentLevel))
              .orderBy(activationMatrixPositions.createdAt);

            // If level 1 is empty, this is the root
            if (currentLevel === 1 && levelPositions.length === 0) {
              // This is the first activation ever - make it root
              await tx.insert(activationMatrixPositions).values({
                activationId: entry.activationId!,
                matrixLevel: 1,
                matrixPath: entry.activationId!,
                matrixPosition: null,
                matrixParentActivationId: null,
                createdAt: entry.completedAt!,
              });
              console.log(`  ✓ Placed as ROOT (Level 1)`);
              placed = true;
              break;
            }

            // Check each position at this level for available child slots
            for (const parent of levelPositions) {
              // Count children of this parent
              const children = await tx
                .select()
                .from(activationMatrixPositions)
                .where(eq(activationMatrixPositions.matrixParentActivationId, parent.activationId));

              if (children.length < 2) {
                // Found available slot - determine position (0 = left, 1 = right)
                const position = children.length === 0 ? 0 : 1;
                const positionLabel = position === 0 ? 'L' : 'R';
                const newPath = `${parent.matrixPath}.${positionLabel}`;

                await tx.insert(activationMatrixPositions).values({
                  activationId: entry.activationId!,
                  matrixLevel: currentLevel + 1,
                  matrixPath: newPath,
                  matrixPosition: position,
                  matrixParentActivationId: parent.activationId,
                  createdAt: entry.completedAt!,
                });

                console.log(`  ✓ Placed under ${parent.activationId} at ${newPath} (Level ${currentLevel + 1})`);
                placed = true;
                break;
              }
            }

            if (!placed) {
              currentLevel++;
            }
          }

          if (!placed) {
            throw new Error(`Failed to find available matrix slot after searching ${maxSearchLevels} levels`);
          }
        });

        successCount++;
      } catch (error) {
        console.error(`  ✗ Error placing activation ${entry.activationId}:`, error);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('MIGRATION SUMMARY:');
    console.log('='.repeat(80));
    console.log(`✓ Successfully placed: ${successCount} activations`);
    if (errorCount > 0) {
      console.log(`✗ Failed to place: ${errorCount} activations`);
    }
    console.log('='.repeat(80));

    // Verify migration by querying final state
    const verifyQuery = await db
      .select({
        cycleNumber: reentries.cycleNumber,
        activationId: reentries.newActivationId,
        matrixLevel: activationMatrixPositions.matrixLevel,
        matrixPath: activationMatrixPositions.matrixPath,
      })
      .from(reentries)
      .innerJoin(activations, eq(reentries.newActivationId, activations.id))
      .leftJoin(activationMatrixPositions, eq(activations.id, activationMatrixPositions.activationId))
      .where(eq(activations.status, 'completed'))
      .orderBy(reentries.cycleNumber);

    console.log('\nVerification - All Completed Activations Matrix Status:');
    console.log('-'.repeat(80));
    for (const v of verifyQuery) {
      const status = v.matrixLevel ? `Level ${v.matrixLevel} - ${v.matrixPath}` : '⚠ NOT PLACED';
      console.log(`  Cycle ${v.cycleNumber}: ${status}`);
    }
    console.log('-'.repeat(80));

    console.log('\n✓ Migration completed successfully!\n');

  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateReentryMatrixPositions()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration error:', err);
    process.exit(1);
  });
