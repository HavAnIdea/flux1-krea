"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Zap, Star, ArrowRight } from "lucide-react";
import { PlanTypeEnum } from "@/types/subscription";

interface UpgradePromptProps {
  title?: string;
  description?: string;
  requiredPlan?: PlanTypeEnum[];
  feature?: string;
  className?: string;
}

export default function UpgradePrompt({
  title = "Upgrade Required",
  description = "This feature requires a subscription to access.",
  requiredPlan = [PlanTypeEnum.BASIC],
  feature = "this feature",
  className = "",
}: UpgradePromptProps) {
  const getPlanIcon = (plan: PlanTypeEnum) => {
    switch (plan) {
      case PlanTypeEnum.BASIC:
        return <Zap className="h-5 w-5 text-blue-500" />;
      case PlanTypeEnum.PRO:
        return <Crown className="h-5 w-5 text-primary" />;
      case PlanTypeEnum.PREMIUM:
        return <Star className="h-5 w-5 text-yellow-500" />;
      case PlanTypeEnum.ULTIMATE:
        return <Star className="h-5 w-5 text-purple-500" />;
      default:
        return <Zap className="h-5 w-5" />;
    }
  };

  const getPlanName = (plan: PlanTypeEnum) => {
    return plan.charAt(0).toUpperCase() + plan.slice(1);
  };

  return (
    <Card className={`max-w-md mx-auto ${className}`}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Crown className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <p className="text-sm font-medium">Required subscription:</p>
          <div className="space-y-2">
            {requiredPlan.map((plan) => (
              <div key={plan} className="flex items-center space-x-2 text-sm">
                {getPlanIcon(plan)}
                <span>{getPlanName(plan)} Plan</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="pt-4 space-y-3">
          <Button 
            onClick={() => window.location.href = "/#pricing"}
            className="w-full"
          >
            View Plans & Pricing
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Upgrade now to unlock {feature} and more premium features.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}