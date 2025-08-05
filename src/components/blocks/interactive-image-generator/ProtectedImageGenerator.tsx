"use client";

import { PlanTypeEnum } from "@/types/subscription";
import { ImageGeneratorSection } from "@/types/blocks/image-generator";
import SubscriptionGuard from "@/components/auth/SubscriptionGuard";
import InteractiveImageGenerator from "./index";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, Crown, Star } from "lucide-react";

interface ProtectedImageGeneratorProps {
  section: ImageGeneratorSection;
}

// 升级提示组件
function UpgradePrompt() {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Crown className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Unlock AI Image Generation</CardTitle>
        <CardDescription className="text-lg">
          Generate stunning AI images with our advanced models. Choose a plan that fits your needs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-4">
            <Zap className="h-8 w-8 text-blue-500" />
            <h3 className="font-semibold">Basic Plan</h3>
            <p className="text-sm text-muted-foreground text-center">
              Perfect for getting started with AI image generation
            </p>
            <ul className="text-sm space-y-1">
              <li>• 50 images/month</li>
              <li>• Standard quality</li>
              <li>• Email support</li>
            </ul>
          </div>
          
          <div className="flex flex-col items-center space-y-2 rounded-lg border-2 border-primary p-4">
            <Crown className="h-8 w-8 text-primary" />
            <h3 className="font-semibold">Pro Plan</h3>
            <div className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
              Most Popular
            </div>
            <p className="text-sm text-muted-foreground text-center">
              For creators and professionals
            </p>
            <ul className="text-sm space-y-1">
              <li>• 500 images/month</li>
              <li>• High quality</li>
              <li>• Priority support</li>
              <li>• Commercial license</li>
            </ul>
          </div>
          
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-4">
            <Star className="h-8 w-8 text-yellow-500" />
            <h3 className="font-semibold">Premium Plan</h3>
            <p className="text-sm text-muted-foreground text-center">
              For teams and enterprises
            </p>
            <ul className="text-sm space-y-1">
              <li>• Unlimited images</li>
              <li>• Ultra high quality</li>
              <li>• 24/7 support</li>
              <li>• API access</li>
            </ul>
          </div>
        </div>
        
        <div className="text-center space-y-4">
          <Button 
            size="lg"
            onClick={() => window.location.href = "/#pricing"}
            className="w-full md:w-auto"
          >
            View All Plans & Pricing
          </Button>
          <p className="text-sm text-muted-foreground">
            Start generating amazing AI images today!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProtectedImageGenerator({ section }: ProtectedImageGeneratorProps) {
  // 如果组件被禁用，直接返回 null
  if (section.disabled) {
    return null;
  }

  return (
    <SubscriptionGuard
      requiredPlan={[PlanTypeEnum.BASIC, PlanTypeEnum.PRO, PlanTypeEnum.PREMIUM, PlanTypeEnum.ULTIMATE]}
      fallbackComponent={UpgradePrompt}
    >
      <InteractiveImageGenerator section={section} />
    </SubscriptionGuard>
  );
}