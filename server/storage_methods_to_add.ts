// Add to IStorage interface (around line 37):
getUserByVerificationToken(token: string): Promise<User | undefined>;
markEmailAsVerified(userId: string): Promise<void>;

// Add to DbStorage class implementation (around line 210):
async getUserByVerificationToken(token: string): Promise<User | undefined> {
  const result = await db.select().from(users).where(eq(users.emailVerificationToken, token)).limit(1);
  return result[0];
}

async markEmailAsVerified(userId: string): Promise<void> {
  await db.update(users)
    .set({ 
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpiry: null 
    })
    .where(eq(users.id, userId));
}
