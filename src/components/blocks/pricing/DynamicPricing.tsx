"use client";

import { Check, Loader } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAppContext } from "@/contexts/app";
import { SubscriptionPlan } from "@/types/subscription";

interface DynamicPricingProps {
  title?: string;
  description?: string;
}

export default function DynamicPricing({ 
  title = "Choose Your Plan",
  description = "Select the perfect subscription for your needs"
}: DynamicPricingProps) {
  const { user, setShowSignModal } = useAppContext();
  
  // 检查用户是否为付费用户
  const isPaidUser = user?.plan === 'paid' && user?.subscription?.isActive;
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [checkoutPlanId, setCheckoutPlanId] = useState<number | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');

  // 获取套餐数据
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch('/api/subscription-plans');
        const result = await response.json();
        
        if (result.code === 0) {
          setPlans(result.data);
        } else {
          toast.error('Failed to load subscription plans');
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
        toast.error('Failed to load subscription plans');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  // 处理支付
  const handleCheckout = async (planId: number) => {
    try {
      if (!user) {
        setShowSignModal(true);
        return;
      }

      setIsCheckoutLoading(true);
      setCheckoutPlanId(planId);

      const response = await fetch("/api/creem-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan_id: planId }),
      });

      if (response.status === 401) {
        setShowSignModal(true);
        return;
      }

      const { code, message, data } = await response.json();
      if (code !== 0) {
        toast.error(message);
        return;
      }

      const { checkout_url } = data;
      window.location.href = checkout_url;
    } catch (error) {
      console.error("Checkout failed:", error);
      toast.error("Checkout failed");
    } finally {
      setIsCheckoutLoading(false);
      setCheckoutPlanId(null);
    }
  };

  // 格式化价格
  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  // 获取当前周期的套餐
  const getCurrentPeriodPlans = () => {
    return plans.filter(plan => plan.period === billingPeriod);
  };

  // 计算年度套餐的月均价格
  const getMonthlyEquivalent = (yearlyPrice: number) => {
    return Math.round(yearlyPrice);
  };

  // 免费套餐功能
  const freeFeatures = [
    "10 images per day",
    "Standard quality images",
    "Basic image sizes",
    "No watermarks",
    "Community support"
  ];

  // Pro 套餐功能
  const proFeatures = [
    "Unlimited image generation",
    "High-definition images",
    "All image sizes and ratios",
    "No watermarks",
    "Priority access to new features",
    "Priority support",
    "Commercial usage rights"
  ];

  if (loading) {
    return (
      <section id="pricing" className="py-16">
        <div className="container">
          <div className="mx-auto mb-12 text-center">
            <h2 className="mb-4 text-4xl font-semibold lg:text-5xl">
              {title}
            </h2>
            <p className="text-muted-foreground lg:text-lg">
              {description}
            </p>
          </div>
          <div className="flex justify-center">
            <Loader className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </section>
    );
  }

  const currentPlans = getCurrentPeriodPlans();
  const proPlan = currentPlans.find(plan => plan.type === 'pro');

  return (
    <section id="pricing" className="py-16">
      <div className="container">
        <div className="mx-auto mb-12 text-center">
          <h2 className="mb-4 text-4xl font-semibold lg:text-5xl">
            {title}
          </h2>
          <p className="text-muted-foreground lg:text-lg">
            {description}
          </p>
        </div>

        {/* 月度/年度切换 */}
        <div className="flex justify-center mb-12">
          <div className="flex h-12 items-center rounded-md bg-muted p-1 text-lg">
            <RadioGroup
              value={billingPeriod}
              className="h-full grid-cols-2"
              onValueChange={(value) => setBillingPeriod(value as 'monthly' | 'yearly')}
            >
              <div className='h-full rounded-md transition-all has-[button[data-state="checked"]]:bg-white'>
                <RadioGroupItem
                  value="monthly"
                  id="monthly"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="monthly"
                  className="flex h-full cursor-pointer items-center justify-center px-7 font-semibold text-muted-foreground peer-data-[state=checked]:text-primary"
                >
                  Monthly
                </Label>
              </div>
              <div className='h-full rounded-md transition-all has-[button[data-state="checked"]]:bg-white'>
                <RadioGroupItem
                  value="yearly"
                  id="yearly"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="yearly"
                  className="flex h-full cursor-pointer items-center justify-center px-7 font-semibold text-muted-foreground peer-data-[state=checked]:text-primary"
                >
                  Yearly
                  <Badge
                    variant="outline"
                    className="border-primary bg-primary px-1.5 ml-1 text-primary-foreground"
                  >
                    Save 20%
                  </Badge>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* 套餐卡片 */}
        <div className="w-full grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          {/* 免费套餐 */}
          <div className="rounded-lg p-6 border-muted border">
            <div className="flex h-full flex-col justify-between gap-5">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-xl font-semibold">Free</h3>
                </div>
                <div className="flex items-end gap-2 mb-4">
                  <span className="text-5xl font-semibold">$0</span>
                  <span className="block font-semibold">/ month</span>
                </div>
                <p className="text-muted-foreground mb-6">
                  Perfect for getting started with AI image generation
                </p>
                <p className="mb-3 font-semibold">What's included:</p>
                <ul className="flex flex-col gap-3">
                  {freeFeatures.map((feature, index) => (
                    <li className="flex gap-2" key={index}>
                      <Check className="mt-1 size-4 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="w-full font-semibold"
                  disabled={!!user}
                  onClick={() => {
                    if (!user) {
                      setShowSignModal(true);
                    } else if (!isPaidUser) {
                      toast.success("You're already on the free plan!");
                    }
                  }}
                >
                  {!user ? "Get Started" : (isPaidUser ? "Free Plan" : "Current Plan")}
                </Button>
              </div>
            </div>
          </div>

          {/* Pro 套餐 */}
          <div className="rounded-lg p-6 border-primary border-2 bg-card text-card-foreground relative">
            <Badge
              variant="outline"
              className="absolute -top-3 left-1/2 transform -translate-x-1/2 border-primary bg-primary px-3 py-1 text-primary-foreground"
            >
              Most Popular
            </Badge>
            <div className="flex h-full flex-col justify-between gap-5">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-xl font-semibold">Pro</h3>
                </div>
                <div className="flex items-end gap-2 mb-4">
                  {proPlan ? (
                    <>
                      <span className="text-5xl font-semibold">
                        {formatPrice(proPlan.price, proPlan.currency)}
                      </span>
                      <span className="block font-semibold">
                        / month
                      </span>
                      {billingPeriod === 'yearly' && (
                        <div className="flex flex-col items-start ml-2">
                          <span className="text-sm text-green-600 font-medium">
                            Save 20%
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="text-5xl font-semibold">$19</span>
                      <span className="block font-semibold">/ month</span>
                    </>
                  )}
                </div>
                <p className="text-muted-foreground mb-6">
                  Unlimited access to all premium features
                </p>
                <p className="mb-3 font-semibold">Everything in Free, plus:</p>
                <ul className="flex flex-col gap-3">
                  {proFeatures.map((feature, index) => (
                    <li className="flex gap-2" key={index}>
                      <Check className="mt-1 size-4 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  className="w-full font-semibold"
                  disabled={isCheckoutLoading || isPaidUser}
                  onClick={() => {
                    if (proPlan && !isPaidUser) {
                      handleCheckout(proPlan.id);
                    } else if (isPaidUser) {
                      toast.success("You're already on the Pro plan!");
                    } else {
                      toast.error("Pro plan not available");
                    }
                  }}
                >
                  {isCheckoutLoading && checkoutPlanId === proPlan?.id ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : isPaidUser ? (
                    "Current Plan"
                  ) : (
                    "Upgrade to Pro"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}