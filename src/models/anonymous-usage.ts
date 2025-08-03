import { anonymousUsage } from "@/db/schema";
import { db } from "@/db";
import { eq, gte, sql } from "drizzle-orm";
import { dbPerf } from "@/lib/performance";

export async function findAnonymousUsage(
  fingerprint_hash: string
): Promise<typeof anonymousUsage.$inferSelect | undefined> {
  return await dbPerf.measure('findAnonymousUsage', async () => {
    const [usage] = await db()
      .select()
      .from(anonymousUsage)
      .where(eq(anonymousUsage.fingerprint_hash, fingerprint_hash))
      .limit(1);

    return usage;
  });
}

export async function createAnonymousUsage(
  fingerprint_hash: string,
  initial_count: number = 1
): Promise<typeof anonymousUsage.$inferSelect | undefined> {
  const [usage] = await db()
    .insert(anonymousUsage)
    .values({
      fingerprint_hash,
      usage_count: initial_count,
    })
    .returning();

  return usage;
}

export async function updateAnonymousUsageCount(
  fingerprint_hash: string,
  usage_count: number
): Promise<typeof anonymousUsage.$inferSelect | undefined> {
  const [usage] = await db()
    .update(anonymousUsage)
    .set({
      usage_count,
      updated_at: new Date(),
    })
    .where(eq(anonymousUsage.fingerprint_hash, fingerprint_hash))
    .returning();

  return usage;
}

export async function incrementAnonymousUsageCount(
  fingerprint_hash: string
): Promise<typeof anonymousUsage.$inferSelect | undefined> {
  // Atomic increment operation using SQL
  const [usage] = await db()
    .update(anonymousUsage)
    .set({
      usage_count: sql`${anonymousUsage.usage_count} + 1`,
      updated_at: new Date(),
    })
    .where(eq(anonymousUsage.fingerprint_hash, fingerprint_hash))
    .returning();

  return usage;
}

export async function upsertAnonymousUsage(
  fingerprint_hash: string
): Promise<typeof anonymousUsage.$inferSelect | undefined> {
  return await dbPerf.measure('upsertAnonymousUsage', async () => {
    try {
      // First try to find existing record
      const existing = await findAnonymousUsage(fingerprint_hash);

      if (existing) {
        // Update existing record
        return await incrementAnonymousUsageCount(fingerprint_hash);
      } else {
        // Create new record
        return await createAnonymousUsage(fingerprint_hash, 1);
      }
    } catch (error) {
      console.error('Error in upsertAnonymousUsage:', error);
      throw error;
    }
  });
}

export async function getAnonymousUsageStats(
  days: number = 7
): Promise<{
  total_records: number;
  total_usage: number;
  recent_records: number;
}> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  // Get total counts
  const totalRecords = await db().$count(anonymousUsage);

  // Get total usage sum
  const totalUsageResult = await db()
    .select({
      total: anonymousUsage.usage_count,
    })
    .from(anonymousUsage);

  const totalUsage = totalUsageResult.reduce((sum, record) => sum + record.total, 0);

  // Get recent records count
  const recentRecords = await db().$count(
    anonymousUsage,
    gte(anonymousUsage.created_at, cutoffDate)
  );

  return {
    total_records: totalRecords,
    total_usage: totalUsage,
    recent_records: recentRecords,
  };
}

export async function cleanupOldAnonymousUsage(
  days: number = 30
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  try {
    const result = await db()
      .delete(anonymousUsage)
      .where(gte(anonymousUsage.created_at, cutoffDate));

    // Return the number of affected rows (Drizzle returns an array)
    return Array.isArray(result) ? result.length : 0;
  } catch (error) {
    console.error('Error cleaning up old anonymous usage:', error);
    return 0;
  }
}