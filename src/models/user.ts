import { users } from "@/db/schema";
import { db } from "@/db";
import { desc, eq, gte, inArray, sql } from "drizzle-orm";
import { dbPerf } from "@/lib/performance";

export async function insertUser(
  data: typeof users.$inferInsert
): Promise<typeof users.$inferSelect | undefined> {
  const [user] = await db().insert(users).values(data).returning();

  return user;
}

export async function findUserByEmail(
  email: string
): Promise<typeof users.$inferSelect | undefined> {
  const [user] = await db()
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return user;
}

export async function findUserByUuid(
  uuid: string
): Promise<typeof users.$inferSelect | undefined> {
  const [user] = await db()
    .select()
    .from(users)
    .where(eq(users.uuid, uuid))
    .limit(1);

  return user;
}

export async function findUserById(
  id: number
): Promise<typeof users.$inferSelect | undefined> {
  const [user] = await db()
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return user;
}

export async function getUsers(
  page: number = 1,
  limit: number = 50
): Promise<(typeof users.$inferSelect)[] | undefined> {
  const offset = (page - 1) * limit;

  const data = await db()
    .select()
    .from(users)
    .orderBy(desc(users.created_at))
    .limit(limit)
    .offset(offset);

  return data;
}

export async function updateUserInviteCode(
  user_uuid: string,
  invite_code: string
): Promise<typeof users.$inferSelect | undefined> {
  const [user] = await db()
    .update(users)
    .set({ invite_code, updated_at: new Date() })
    .where(eq(users.uuid, user_uuid))
    .returning();

  return user;
}

export async function updateUserInvitedBy(
  user_uuid: string,
  invited_by: string
): Promise<typeof users.$inferSelect | undefined> {
  const [user] = await db()
    .update(users)
    .set({ invited_by, updated_at: new Date() })
    .where(eq(users.uuid, user_uuid))
    .returning();

  return user;
}

export async function getUsersByUuids(
  user_uuids: string[]
): Promise<(typeof users.$inferSelect)[] | undefined> {
  const data = await db()
    .select()
    .from(users)
    .where(inArray(users.uuid, user_uuids));

  return data;
}

export async function findUserByInviteCode(
  invite_code: string
): Promise<typeof users.$inferSelect | undefined> {
  const [user] = await db()
    .select()
    .from(users)
    .where(eq(users.invite_code, invite_code))
    .limit(1);

  return user;
}

export async function getUserUuidsByEmail(
  email: string
): Promise<string[] | undefined> {
  const data = await db()
    .select({ uuid: users.uuid })
    .from(users)
    .where(eq(users.email, email));

  return data.map((user) => user.uuid);
}

export async function getUsersTotal(): Promise<number> {
  const total = await db().$count(users);

  return total;
}

export async function getUserCountByDate(
  startTime: string
): Promise<Map<string, number> | undefined> {
  const data = await db()
    .select({ created_at: users.created_at })
    .from(users)
    .where(gte(users.created_at, new Date(startTime)));

  data.sort((a, b) => a.created_at!.getTime() - b.created_at!.getTime());

  const dateCountMap = new Map<string, number>();
  data.forEach((item) => {
    const date = item.created_at!.toISOString().split("T")[0];
    dateCountMap.set(date, (dateCountMap.get(date) || 0) + 1);
  });

  return dateCountMap;
}

// Usage limit related functions

export async function getUserUsageInfo(
  user_uuid: string
): Promise<{
  id: number;
  uuid: string;
  email: string;
  plan: string;
  usage_count: number;
  last_usage_date: string | null;
  created_at: Date | null;
  updated_at: Date | null;
} | undefined> {
  return await dbPerf.measure('getUserUsageInfo', async () => {
    const [user] = await db()
      .select({
        id: users.id,
        uuid: users.uuid,
        email: users.email,
        plan: users.plan,
        usage_count: users.usage_count,
        last_usage_date: users.last_usage_date,
        created_at: users.created_at,
        updated_at: users.updated_at,
      })
      .from(users)
      .where(eq(users.uuid, user_uuid))
      .limit(1);

    return user;
  });
}

export async function updateUserUsageCount(
  user_uuid: string,
  usage_count: number,
  last_usage_date: string
): Promise<typeof users.$inferSelect | undefined> {
  const [user] = await db()
    .update(users)
    .set({
      usage_count,
      last_usage_date,
      updated_at: new Date()
    })
    .where(eq(users.uuid, user_uuid))
    .returning();

  return user;
}

export async function resetUserDailyUsage(
  user_uuid: string,
  current_date: string
): Promise<typeof users.$inferSelect | undefined> {
  const [user] = await db()
    .update(users)
    .set({
      usage_count: 1,
      last_usage_date: current_date,
      updated_at: new Date()
    })
    .where(eq(users.uuid, user_uuid))
    .returning();

  return user;
}

export async function updateUserPlan(
  user_uuid: string,
  plan: string
): Promise<typeof users.$inferSelect | undefined> {
  const [user] = await db()
    .update(users)
    .set({
      plan,
      updated_at: new Date()
    })
    .where(eq(users.uuid, user_uuid))
    .returning();

  return user;
}

export async function incrementUserUsageCount(
  user_uuid: string
): Promise<typeof users.$inferSelect | undefined> {
  return await dbPerf.measure('incrementUserUsageCount', async () => {
    // This is an atomic increment operation using SQL
    const [user] = await db()
      .update(users)
      .set({
        usage_count: sql`${users.usage_count} + 1`,
        updated_at: new Date()
      })
      .where(eq(users.uuid, user_uuid))
      .returning();

    return user;
  });
}
