"use client";

import { useSubscription } from "@/hooks/useSubscription";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Crown, 
  Calendar, 
  CreditCard, 
  CheckCircle, 
  AlertCircle,
  Loader,
  ArrowRight
} from "lucide-react";
// Simple date formatting function
const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

interface SubscriptionStatusProps {
  showUpgradeButton?: boolean;
  className?: string;
}

export default function SubscriptionStatus({ 
  showUpgradeButton = true,
  className = "" 
}: SubscriptionStatusProps) {
  const { 
    subscription, 
    summary, 
    isLoading, 
    hasActiveSubscription, 
    getCurrentPlan, 
    getDaysRemaining,
    isExpiringSoon 
  } = useSubscription();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-6">
          <Loader className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!hasActiveSubscription()) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">No Active Subscription</CardTitle>
          </div>
          <CardDescription>
            You're currently on the free plan with limited features.
          </CardDescription>
        </CardHeader>
        {showUpgradeButton && (
          <CardContent>
            <Button 
              onClick={() => window.location.href = "/#pricing"}
              className="w-full"
            >
              Upgrade to Pro
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        )}
      </Card>
    );
  }

  const daysRemaining = getDaysRemaining();
  const isExpiring = isExpiringSoon(7);
  const currentPlan = getCurrentPlan();

  // 计算进度百分比（基于30天周期）
  const totalDays = subscription?.plan.period === 'yearly' ? 365 : 30;
  const usedDays = totalDays - daysRemaining;
  const progressPercentage = Math.max(0, Math.min(100, (usedDays / totalDays) * 100));

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'basic':
        return <CreditCard className="h-5 w-5 text-blue-500" />;
      case 'pro':
        return <Crown className="h-5 w-5 text-primary" />;
      case 'premium':
      case 'ultimate':
        return <Crown className="h-5 w-5 text-yellow-500" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  const getPlanColor = (planType: string) => {
    switch (planType) {
      case 'basic':
        return 'bg-blue-100 text-blue-800';
      case 'pro':
        return 'bg-primary/10 text-primary';
      case 'premium':
        return 'bg-yellow-100 text-yellow-800';
      case 'ultimate':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getPlanIcon(currentPlan || '')}
            <CardTitle className="text-lg capitalize">
              {summary?.current_plan?.name} Plan
            </CardTitle>
          </div>
          <Badge className={getPlanColor(currentPlan || '')}>
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        </div>
        <CardDescription>
          Your subscription is active and ready to use.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 订阅详情 */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Plan Type</p>
            <p className="font-medium capitalize">{currentPlan}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Billing Period</p>
            <p className="font-medium capitalize">{subscription?.plan.period}</p>
          </div>
        </div>

        {/* 到期时间 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Time Remaining</span>
            <span className={`font-medium ${isExpiring ? 'text-orange-600' : 'text-green-600'}`}>
              {daysRemaining} days
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Started: {subscription && formatDate(subscription.start_date)}</span>
            <span>Expires: {subscription && formatDate(subscription.end_date)}</span>
          </div>
        </div>

        {/* 过期警告 */}
        {isExpiring && (
          <div className="flex items-center space-x-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-orange-800">
                Subscription expiring soon
              </p>
              <p className="text-xs text-orange-600">
                Renew now to avoid service interruption
              </p>
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        {showUpgradeButton && (
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = "/#pricing"}
              className="flex-1"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Manage Plan
            </Button>
            {currentPlan !== 'ultimate' && (
              <Button 
                size="sm"
                onClick={() => window.location.href = "/#pricing"}
                className="flex-1"
              >
                Upgrade
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}