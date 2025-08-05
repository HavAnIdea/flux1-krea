import { subscriptionPlans } from "@/db/schema";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { SubscriptionPlan } from "@/types/subscription";

export async function getAllSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    const plans = await db()
      .select()
      .from(subscriptionPlans)
      .orderBy(subscriptionPlans.price);

    return plans.map(plan => ({
      ...plan,
      type: plan.type as SubscriptionPlan['type'],
      period: plan.period as SubscriptionPlan['period'],
      product_id: plan.product_id || '',
      created_at: new Date(plan.created_at)
    }));
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    throw new Error("Failed to fetch subscription plans");
  }
}

export async function getSubscriptionPlanById(id: number): Promise<SubscriptionPlan | null> {
  try {
    const [plan] = await db()
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, id))
      .limit(1);

    if (!plan) {
      return null;
    }

    return {
      ...plan,
      type: plan.type as SubscriptionPlan['type'],
      period: plan.period as SubscriptionPlan['period'],
      product_id: plan.product_id || '',
      created_at: new Date(plan.created_at)
    };
  } catch (error) {
    console.error("Error fetching subscription plan by ID:", error);
    throw new Error("Failed to fetch subscription plan");
  }
}

export async function getSubscriptionPlanByProductId(productId: string): Promise<SubscriptionPlan | null> {
  try {
    const [plan] = await db()
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.product_id, productId))
      .limit(1);

    if (!plan) {
      return null;
    }

    return {
      ...plan,
      type: plan.type as SubscriptionPlan['type'],
      period: plan.period as SubscriptionPlan['period'],
      product_id: plan.product_id || '',
      created_at: new Date(plan.created_at)
    };
  } catch (error) {
    console.error("Error fetching subscription plan by product ID:", error);
    throw new Error("Failed to fetch subscription plan");
  }
}

export async function createSubscriptionPlan(
  data: Omit<SubscriptionPlan, 'id' | 'created_at'>
): Promise<SubscriptionPlan> {
  try {
    const [plan] = await db()
      .insert(subscriptionPlans)
      .values({
        name: data.name,
        type: data.type,
        price: data.price,
        currency: data.currency,
        period: data.period,
        product_id: data.product_id,
      })
      .returning();

    return {
      ...plan,
      type: plan.type as SubscriptionPlan['type'],
      period: plan.period as SubscriptionPlan['period'],
      product_id: plan.product_id || '',
      created_at: new Date(plan.created_at)
    };
  } catch (error) {
    console.error("Error creating subscription plan:", error);
    throw new Error("Failed to create subscription plan");
  }
}

export async function updateSubscriptionPlan(
  id: number,
  data: Partial<Omit<SubscriptionPlan, 'id' | 'created_at'>>
): Promise<SubscriptionPlan | null> {
  try {
    const [plan] = await db()
      .update(subscriptionPlans)
      .set(data)
      .where(eq(subscriptionPlans.id, id))
      .returning();

    if (!plan) {
      return null;
    }

    return {
      ...plan,
      type: plan.type as SubscriptionPlan['type'],
      period: plan.period as SubscriptionPlan['period'],
      product_id: plan.product_id || '',
      created_at: new Date(plan.created_at)
    };
  } catch (error) {
    console.error("Error updating subscription plan:", error);
    throw new Error("Failed to update subscription plan");
  }
}

export async function deleteSubscriptionPlan(id: number): Promise<boolean> {
  try {
    const result = await db()
      .delete(subscriptionPlans)
      .where(eq(subscriptionPlans.id, id))
      .returning();

    return result.length > 0;
  } catch (error) {
    console.error("Error deleting subscription plan:", error);
    throw new Error("Failed to delete subscription plan");
  }
}