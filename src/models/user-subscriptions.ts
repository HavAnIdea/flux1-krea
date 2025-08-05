import { userSubscriptions, subscriptionPlans } from "@/db/schema";
import { db } from "@/db";
import { eq, and, gte, desc, lt } from "drizzle-orm";
import { 
  UserSubscription, 
  CreateSubscriptionData, 
  UserSubscriptionWithPlan,
  PaymentStatusEnum,
  SubscriptionPlan
} from "@/types/subscription";

export async function createUserSubscription(
  data: CreateSubscriptionData
): Promise<UserSubscription> {
  try {
    const [subscription] = await db()
      .insert(userSubscriptions)
      .values({
        user_id: data.user_id,
        plan_id: data.plan_id,
        start_date: data.start_date,
        end_date: data.end_date,
        payment_status: data.payment_status,
        payment_method: data.payment_method,
        order_id: data.order_id,
        amount_paid: data.amount_paid.toString(),
      })
      .returning();

    return {
      ...subscription,
      payment_status: subscription.payment_status as PaymentStatusEnum,
      payment_method: subscription.payment_method || undefined,
      order_id: subscription.order_id || undefined,
      amount_paid: parseFloat(subscription.amount_paid),
      start_date: new Date(subscription.start_date),
      end_date: new Date(subscription.end_date),
      created_at: new Date(subscription.created_at),
      updated_at: subscription.updated_at ? new Date(subscription.updated_at) : undefined,
    };
  } catch (error) {
    console.error("Error creating user subscription:", error);
    throw new Error("Failed to create user subscription");
  }
}

export async function getUserActiveSubscription(
  userId: number
): Promise<UserSubscriptionWithPlan | null> {
  try {
    const now = new Date();
    
    const [subscription] = await db()
      .select({
        subscription: userSubscriptions,
        plan: subscriptionPlans,
      })
      .from(userSubscriptions)
      .innerJoin(subscriptionPlans, eq(userSubscriptions.plan_id, subscriptionPlans.id))
      .where(
        and(
          eq(userSubscriptions.user_id, userId),
          eq(userSubscriptions.is_active, true),
          eq(userSubscriptions.payment_status, PaymentStatusEnum.COMPLETED),
          gte(userSubscriptions.end_date, now)
        )
      )
      .orderBy(desc(userSubscriptions.end_date))
      .limit(1);

    if (!subscription) {
      return null;
    }

    return {
      ...subscription.subscription,
      payment_status: subscription.subscription.payment_status as PaymentStatusEnum,
      payment_method: subscription.subscription.payment_method || undefined,
      order_id: subscription.subscription.order_id || undefined,
      amount_paid: parseFloat(subscription.subscription.amount_paid),
      start_date: new Date(subscription.subscription.start_date),
      end_date: new Date(subscription.subscription.end_date),
      created_at: new Date(subscription.subscription.created_at),
      updated_at: subscription.subscription.updated_at 
        ? new Date(subscription.subscription.updated_at) 
        : undefined,
      plan: {
        ...subscription.plan,
        type: subscription.plan.type as SubscriptionPlan['type'],
        period: subscription.plan.period as SubscriptionPlan['period'],
        product_id: subscription.plan.product_id || '',
        created_at: new Date(subscription.plan.created_at),
      },
    };
  } catch (error) {
    console.error("Error fetching user active subscription:", error);
    throw new Error("Failed to fetch user active subscription");
  }
}

export async function getUserSubscriptionHistory(
  userId: number
): Promise<UserSubscriptionWithPlan[]> {
  try {
    const subscriptions = await db()
      .select({
        subscription: userSubscriptions,
        plan: subscriptionPlans,
      })
      .from(userSubscriptions)
      .innerJoin(subscriptionPlans, eq(userSubscriptions.plan_id, subscriptionPlans.id))
      .where(eq(userSubscriptions.user_id, userId))
      .orderBy(desc(userSubscriptions.created_at));

    return subscriptions.map(sub => ({
      ...sub.subscription,
      payment_status: sub.subscription.payment_status as PaymentStatusEnum,
      payment_method: sub.subscription.payment_method || undefined,
      order_id: sub.subscription.order_id || undefined,
      amount_paid: parseFloat(sub.subscription.amount_paid),
      start_date: new Date(sub.subscription.start_date),
      end_date: new Date(sub.subscription.end_date),
      created_at: new Date(sub.subscription.created_at),
      updated_at: sub.subscription.updated_at 
        ? new Date(sub.subscription.updated_at) 
        : undefined,
      plan: {
        ...sub.plan,
        type: sub.plan.type as SubscriptionPlan['type'],
        period: sub.plan.period as SubscriptionPlan['period'],
        product_id: sub.plan.product_id || '',
        created_at: new Date(sub.plan.created_at),
      },
    }));
  } catch (error) {
    console.error("Error fetching user subscription history:", error);
    throw new Error("Failed to fetch user subscription history");
  }
}

export async function updateSubscriptionStatus(
  subscriptionId: number,
  status: PaymentStatusEnum,
  isActive?: boolean
): Promise<UserSubscription | null> {
  try {
    const updateData: any = {
      payment_status: status,
      updated_at: new Date(),
    };

    if (isActive !== undefined) {
      updateData.is_active = isActive;
    }

    const [subscription] = await db()
      .update(userSubscriptions)
      .set(updateData)
      .where(eq(userSubscriptions.id, subscriptionId))
      .returning();

    if (!subscription) {
      return null;
    }

    return {
      ...subscription,
      payment_status: subscription.payment_status as PaymentStatusEnum,
      payment_method: subscription.payment_method || undefined,
      order_id: subscription.order_id || undefined,
      amount_paid: parseFloat(subscription.amount_paid),
      start_date: new Date(subscription.start_date),
      end_date: new Date(subscription.end_date),
      created_at: new Date(subscription.created_at),
      updated_at: subscription.updated_at ? new Date(subscription.updated_at) : undefined,
    };
  } catch (error) {
    console.error("Error updating subscription status:", error);
    throw new Error("Failed to update subscription status");
  }
}

export async function getSubscriptionByOrderId(
  orderId: string
): Promise<UserSubscription | null> {
  try {
    const [subscription] = await db()
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.order_id, orderId))
      .limit(1);

    if (!subscription) {
      return null;
    }

    return {
      ...subscription,
      payment_status: subscription.payment_status as PaymentStatusEnum,
      payment_method: subscription.payment_method || undefined,
      order_id: subscription.order_id || undefined,
      amount_paid: parseFloat(subscription.amount_paid),
      start_date: new Date(subscription.start_date),
      end_date: new Date(subscription.end_date),
      created_at: new Date(subscription.created_at),
      updated_at: subscription.updated_at ? new Date(subscription.updated_at) : undefined,
    };
  } catch (error) {
    console.error("Error fetching subscription by order ID:", error);
    throw new Error("Failed to fetch subscription by order ID");
  }
}

export async function deactivateExpiredSubscriptions(): Promise<number> {
  try {
    const now = new Date();
    
    const result = await db()
      .update(userSubscriptions)
      .set({
        is_active: false,
        updated_at: now,
      })
      .where(
        and(
          eq(userSubscriptions.is_active, true),
          lt(userSubscriptions.end_date, now)
        )
      )
      .returning();

    return result.length;
  } catch (error) {
    console.error("Error deactivating expired subscriptions:", error);
    throw new Error("Failed to deactivate expired subscriptions");
  }
}