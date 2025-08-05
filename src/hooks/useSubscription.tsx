"use client";

import { useEffect, useState } from "react";
import { useAppContext } from "@/contexts/app";
import { subscriptionService } from "@/services/subscription";
import { 
  PlanTypeEnum, 
  SubscriptionSummary, 
  UserSubscriptionWithPlan 
} from "@/types/subscription";

export function useSubscription() {
  const { user } = useAppContext();
  const [subscription, setSubscription] = useState<UserSubscriptionWithPlan | null>(null);
  const [summary, setSummary] = useState<SubscriptionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) {
        setSubscription(null);
        setSummary(null);
        setIsLoading(false);
        return;
      }

      try {
        const [activeSubscription, subscriptionSummary] = await Promise.all([
          subscriptionService.getUserActiveSubscription(user.id),
          subscriptionService.getUserSubscriptionSummary(user.id),
        ]);

        setSubscription(activeSubscription);
        setSummary(subscriptionSummary);
      } catch (error) {
        console.error("Error fetching subscription:", error);
        setSubscription(null);
        setSummary(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscription();
  }, [user]);

  const hasPermission = async (requiredPlan: PlanTypeEnum): Promise<boolean> => {
    if (!user) return false;
    
    try {
      return await subscriptionService.checkUserPermission(user.id, requiredPlan);
    } catch (error) {
      console.error("Error checking permission:", error);
      return false;
    }
  };

  const hasActiveSubscription = (): boolean => {
    return summary?.is_active || false;
  };

  const getCurrentPlan = (): string | null => {
    return summary?.current_plan?.type || null;
  };

  const getDaysRemaining = (): number => {
    return summary?.days_remaining || 0;
  };

  const isExpiringSoon = (days: number = 7): boolean => {
    const remaining = getDaysRemaining();
    return remaining > 0 && remaining <= days;
  };

  return {
    subscription,
    summary,
    isLoading,
    hasPermission,
    hasActiveSubscription,
    getCurrentPlan,
    getDaysRemaining,
    isExpiringSoon,
  };
}

export function usePermissionCheck(requiredPlan: PlanTypeEnum) {
  const { user } = useAppContext();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      if (!user) {
        setHasPermission(false);
        setIsLoading(false);
        return;
      }

      try {
        const permission = await subscriptionService.checkUserPermission(user.id, requiredPlan);
        setHasPermission(permission);
      } catch (error) {
        console.error("Error checking permission:", error);
        setHasPermission(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkPermission();
  }, [user, requiredPlan]);

  return { hasPermission, isLoading };
}