import {
  getUserActiveSubscription,
  createUserSubscription,
  updateSubscriptionStatus,
  getUserSubscriptionHistory,
  getSubscriptionByOrderId,
  deactivateExpiredSubscriptions,
} from "@/models/user-subscriptions";
import { getSubscriptionPlanById } from "@/models/subscription-plans";
import {
  UserSubscription,
  CreateSubscriptionData,
  UserSubscriptionWithPlan,
  SubscriptionSummary,
  PaymentStatusEnum,
  PlanTypeEnum,
} from "@/types/subscription";

export class SubscriptionService {
  /**
   * 获取用户当前有效的订阅
   */
  async getUserActiveSubscription(userId: number): Promise<UserSubscriptionWithPlan | null> {
    return await getUserActiveSubscription(userId);
  }

  /**
   * 创建新的订阅记录
   */
  async createSubscription(data: CreateSubscriptionData): Promise<UserSubscription> {
    return await createUserSubscription(data);
  }

  /**
   * 更新订阅状态
   */
  async updateSubscriptionStatus(
    subscriptionId: number,
    status: PaymentStatusEnum,
    isActive?: boolean
  ): Promise<UserSubscription | null> {
    return await updateSubscriptionStatus(subscriptionId, status, isActive);
  }

  /**
   * 检查用户是否有访问特定功能的权限
   */
  async checkUserPermission(userId: number, requiredPlan: PlanTypeEnum): Promise<boolean> {
    try {
      const activeSubscription = await this.getUserActiveSubscription(userId);
      
      if (!activeSubscription) {
        return false;
      }

      // 检查订阅是否仍然有效
      const now = new Date();
      if (activeSubscription.end_date < now || !activeSubscription.is_active) {
        return false;
      }

      // 检查套餐类型是否满足要求
      return this.isPlanSufficient(activeSubscription.plan.type as PlanTypeEnum, requiredPlan);
    } catch (error) {
      console.error("Error checking user permission:", error);
      return false;
    }
  }

  /**
   * 获取用户订阅摘要信息
   */
  async getUserSubscriptionSummary(userId: number): Promise<SubscriptionSummary> {
    try {
      const activeSubscription = await this.getUserActiveSubscription(userId);
      
      if (!activeSubscription) {
        return {
          user_id: userId,
          is_active: false,
        };
      }

      const now = new Date();
      const daysRemaining = Math.max(
        0,
        Math.ceil((activeSubscription.end_date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      );

      return {
        user_id: userId,
        current_plan: activeSubscription.plan,
        is_active: activeSubscription.is_active && activeSubscription.end_date > now,
        expires_at: activeSubscription.end_date,
        days_remaining: daysRemaining,
      };
    } catch (error) {
      console.error("Error getting user subscription summary:", error);
      return {
        user_id: userId,
        is_active: false,
      };
    }
  }

  /**
   * 获取用户订阅历史
   */
  async getUserSubscriptionHistory(userId: number): Promise<UserSubscriptionWithPlan[]> {
    return await getUserSubscriptionHistory(userId);
  }

  /**
   * 根据订单ID查找订阅
   */
  async getSubscriptionByOrderId(orderId: string): Promise<UserSubscription | null> {
    return await getSubscriptionByOrderId(orderId);
  }

  /**
   * 处理支付成功后的订阅创建
   */
  async handlePaymentSuccess(
    userId: number,
    planId: number,
    orderId: string,
    amountPaid: number,
    paymentMethod?: string
  ): Promise<UserSubscription> {
    try {
      // 获取套餐信息
      const plan = await getSubscriptionPlanById(planId);
      if (!plan) {
        throw new Error("Subscription plan not found");
      }

      // 计算订阅开始和结束时间
      const startDate = new Date();
      const endDate = new Date();
      
      if (plan.period === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (plan.period === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      // 创建订阅记录
      const subscriptionData: CreateSubscriptionData = {
        user_id: userId,
        plan_id: planId,
        start_date: startDate,
        end_date: endDate,
        payment_status: PaymentStatusEnum.COMPLETED,
        payment_method: paymentMethod,
        order_id: orderId,
        amount_paid: amountPaid,
      };

      return await this.createSubscription(subscriptionData);
    } catch (error) {
      console.error("Error handling payment success:", error);
      throw new Error("Failed to create subscription after payment");
    }
  }

  /**
   * 停用过期的订阅
   */
  async deactivateExpiredSubscriptions(): Promise<number> {
    return await deactivateExpiredSubscriptions();
  }

  /**
   * 检查套餐类型是否满足要求
   */
  private isPlanSufficient(userPlan: PlanTypeEnum, requiredPlan: PlanTypeEnum): boolean {
    const planHierarchy = {
      [PlanTypeEnum.BASIC]: 1,
      [PlanTypeEnum.PRO]: 2,
      [PlanTypeEnum.PREMIUM]: 3,
      [PlanTypeEnum.ULTIMATE]: 4,
    };

    return planHierarchy[userPlan] >= planHierarchy[requiredPlan];
  }

  /**
   * 检查用户是否有有效订阅
   */
  async hasActiveSubscription(userId: number): Promise<boolean> {
    try {
      const activeSubscription = await this.getUserActiveSubscription(userId);
      
      if (!activeSubscription) {
        return false;
      }

      const now = new Date();
      return activeSubscription.is_active && activeSubscription.end_date > now;
    } catch (error) {
      console.error("Error checking active subscription:", error);
      return false;
    }
  }

  /**
   * 获取用户当前套餐类型
   */
  async getUserPlanType(userId: number): Promise<PlanTypeEnum | null> {
    try {
      const activeSubscription = await this.getUserActiveSubscription(userId);
      
      if (!activeSubscription) {
        return null;
      }

      return activeSubscription.plan.type as PlanTypeEnum;
    } catch (error) {
      console.error("Error getting user plan type:", error);
      return null;
    }
  }
}

// 导出单例实例
export const subscriptionService = new SubscriptionService();