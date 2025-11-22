import { db } from './db';
import { users, activations, activationPayments, incomeTransactions, notifications, reentries, activationMatrixPositions, binaryMatchQueue, userIncomeSummaries, backupHistory, systemConfig } from '@shared/schema';
import { uploadBackupToDrive } from './google-drive-backup';
import { eq, count, sql } from 'drizzle-orm';

let currentBackupInterval = 24 * 60 * 60 * 1000; // Default 24 hours in milliseconds
let backupIntervalHandle: NodeJS.Timeout | null = null;

async function createAndUploadBackup() {
  try {
    // Check if auto-backup is enabled in system config
    const configCheck = await db.query.systemConfig.findFirst();
    if (configCheck && !configCheck.autoBackupEnabled) {
      console.log('[AUTO-BACKUP] Auto-backup is disabled. Skipping backup...');
      return;
    }
    
    console.log('[AUTO-BACKUP] Starting automatic backup...');
    
    // Create backup entry in database
    const backupName = `payback247-auto-backup-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`;
    
    const backupHistoryId = await db.insert(backupHistory).values({
      backupName,
      status: 'pending',
      isAutomatic: true,
    }).returning({ id: backupHistory.id });

    // Fetch all data
    const allUsers = await db.select().from(users);
    const allActivations = await db.select().from(activations);
    const allActivationPayments = await db.select().from(activationPayments);
    const allIncomeTransactions = await db.select().from(incomeTransactions);
    const allNotifications = await db.select().from(notifications);
    const allReentries = await db.select().from(reentries);
    const allActivationMatrixPositions = await db.select().from(activationMatrixPositions);
    const allBinaryMatchQueue = await db.select().from(binaryMatchQueue);
    const allUserIncomeSummaries = await db.select().from(userIncomeSummaries);
    const systemConfigData = await db.select().from(sql`system_config`);

    const backup = {
      version: '2.0',
      timestamp: new Date().toISOString(),
      tables: {
        users: { count: allUsers.length, data: allUsers },
        activations: { count: allActivations.length, data: allActivations },
        activationPayments: { count: allActivationPayments.length, data: allActivationPayments },
        incomeTransactions: { count: allIncomeTransactions.length, data: allIncomeTransactions },
        notifications: { count: allNotifications.length, data: allNotifications },
        reentries: { count: allReentries.length, data: allReentries },
        activationMatrixPositions: { count: allActivationMatrixPositions.length, data: allActivationMatrixPositions },
        binaryMatchQueue: { count: allBinaryMatchQueue.length, data: allBinaryMatchQueue },
        userIncomeSummaries: { count: allUserIncomeSummaries.length, data: allUserIncomeSummaries },
        systemConfig: { count: 1, data: systemConfigData },
      },
      summary: {
        totalUsers: allUsers.length,
        totalActivations: allActivations.length,
        totalPayments: allActivationPayments.length,
        totalIncomeTransactions: allIncomeTransactions.length,
      },
    };

    const backupContent = JSON.stringify(backup, null, 2);
    const fileSizeBytes = Buffer.byteLength(backupContent, 'utf8');

    // Upload to Google Drive
    try {
      console.log('[AUTO-BACKUP] Uploading to Google Drive...');
      const driveFile = await uploadBackupToDrive(backupName, backupContent);
      
      // Update backup history with success
      await db.update(backupHistory)
        .set({
          status: 'completed',
          completedAt: new Date(),
          fileSizeBytes,
          googleDriveFileId: driveFile.id,
          googleDriveFolderLink: driveFile.webViewLink,
          backupData: backupContent,
          recordCount: backup.tables,
        })
        .where(eq(backupHistory.id, backupHistoryId[0].id));

      console.log(`[AUTO-BACKUP] Successfully created and uploaded backup to Google Drive: ${backupName}`);
      console.log(`[AUTO-BACKUP] Google Drive File ID: ${driveFile.id}`);
      console.log(`[AUTO-BACKUP] File Size: ${(fileSizeBytes / 1024 / 1024).toFixed(2)} MB`);
    } catch (driveError) {
      console.error('[AUTO-BACKUP] Google Drive upload failed, saving backup locally only:', driveError);
      
      // Update backup history with local-only backup
      await db.update(backupHistory)
        .set({
          status: 'completed',
          completedAt: new Date(),
          fileSizeBytes,
          backupData: backupContent,
          recordCount: backup.tables,
          notes: 'Backup saved locally only - Google Drive upload failed',
        })
        .where(eq(backupHistory.id, backupHistoryId[0].id));
    }
  } catch (error) {
    console.error('[AUTO-BACKUP] Failed to create backup:', error);
    
    // Try to update backup history with failed status
    try {
      await db.update(backupHistory)
        .set({
          status: 'failed',
          notes: error instanceof Error ? error.message : 'Unknown error',
        })
        .where(eq(backupHistory.id, backupHistoryId?.[0]?.id || ''));
    } catch (updateError) {
      console.error('[AUTO-BACKUP] Failed to update backup history:', updateError);
    }
  }
}

async function updateBackupSchedule() {
  try {
    const config = await db.select().from(systemConfig).limit(1);
    if (config.length > 0) {
      const scheduleHours = config[0].autoBackupScheduleHours || 24;
      const newInterval = scheduleHours * 60 * 60 * 1000;
      
      if (newInterval !== currentBackupInterval) {
        currentBackupInterval = newInterval;
        console.log(`[AUTO-BACKUP] Backup schedule updated to every ${scheduleHours} hour(s)`);
        
        // Clear old interval and restart with new interval
        if (backupIntervalHandle) {
          clearInterval(backupIntervalHandle);
        }
        
        backupIntervalHandle = setInterval(() => {
          createAndUploadBackup().catch(err => console.error('[AUTO-BACKUP] Scheduled backup failed:', err));
        }, currentBackupInterval);
      }
    }
  } catch (error) {
    console.error('[AUTO-BACKUP] Failed to update backup schedule:', error);
  }
}

export function startBackupScheduler() {
  console.log('[AUTO-BACKUP] Starting backup scheduler...');
  
  // Run backup immediately on startup
  createAndUploadBackup().catch(err => console.error('[AUTO-BACKUP] Initial backup failed:', err));
  
  // Load initial schedule from config
  updateBackupSchedule().catch(err => console.error('[AUTO-BACKUP] Failed to load initial schedule:', err));
  
  // Schedule backup with current interval
  backupIntervalHandle = setInterval(() => {
    createAndUploadBackup().catch(err => console.error('[AUTO-BACKUP] Scheduled backup failed:', err));
  }, currentBackupInterval);
  
  // Check for schedule updates every 5 minutes
  setInterval(() => {
    updateBackupSchedule().catch(err => console.error('[AUTO-BACKUP] Failed to check schedule update:', err));
  }, 5 * 60 * 1000);

  console.log('[AUTO-BACKUP] Backup scheduler initialized');
}
