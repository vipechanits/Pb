import bcrypt from 'bcryptjs';
import type { User } from '@shared/schema';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Serialize user for session (exclude sensitive data)
export function serializeUser(user: User) {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

// DEPRECATED: Generate next user ID (PB10000, PB10001, etc.)
// This function is no longer used. User IDs are now generated via PostgreSQL sequence.
// See initializeUserIdSequence() in server/storage.ts
export function generateNextUserId(lastUserId: string | null): string {
  if (!lastUserId) {
    return 'PB10000';
  }
  
  const num = parseInt(lastUserId.replace('PB', ''));
  return `PB${num + 1}`;
}
