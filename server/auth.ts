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

// Generate next user ID (PB1, PB2, etc.)
export function generateNextUserId(lastUserId: string | null): string {
  if (!lastUserId) {
    return 'PB1';
  }
  
  const num = parseInt(lastUserId.replace('PB', ''));
  return `PB${num + 1}`;
}
