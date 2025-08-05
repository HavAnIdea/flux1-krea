"use client";

import { useEffect, useState } from "react";
import { useAppContext } from "@/contexts/app";
import { subscriptionService } from "@/services/subscription";
import { PlanTypeEnum } from "@/types/subscription";
import { Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SubscriptionGuardProps {
  requiredPlan?: PlanTypeEnum[];
  fallbackComponent?: React.ComponentType;
  children: React.ReactNode;
}

export default function SubscriptionGuard({
  requiredPlan = [PlanTypeEnum.BASIC],
  fallbackComponent: FallbackComponent,
  children,
}: SubscriptionGuardProps) {
  const { user, setShowSignModal } = useAppContext();
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
        // 检查用户是否有任何一个所需的套餐权限
        const permissions = await Promise.all(
          requiredPlan.map(plan => 
            subscriptionService.checkUserPermission(user.id, plan)
          )
        );

        const hasAnyPermission = permissions.some(permission => permission);
        setHasPermission(hasAnyPermission);
      } catch (error) {
        console.error("Error checking subscription permission:", error);
        setHasPermission(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkPermission();
  }, [user, requiredPlan]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Sign In Required</CardTitle>
          <CardDescription>
            Please sign in to access this feature.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => setShowSignModal(true)}
            className="w-full"
          >
            Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!hasPermission) {
    if (FallbackComponent) {
      return <FallbackComponent />;
    }

    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Upgrade Required</CardTitle>
          <CardDescription>
            This feature requires a {requiredPlan.join(" or ")} subscription.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => window.location.href = "/#pricing"}
            className="w-full"
          >
            Upgrade Now
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}