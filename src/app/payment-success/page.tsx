"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Crown, 
  Calendar, 
  CreditCard, 
  ArrowRight,
  Loader,
  AlertCircle
} from "lucide-react";
import { SubscriptionPlan, UserSubscription } from "@/types/subscription";

interface PaymentSuccessData {
  message: string;
  subscription: UserSubscription;
  plan: SubscriptionPlan;
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<PaymentSuccessData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processPaymentReturn = async () => {
      try {
        // 构建完整的 URL 包含查询参数
        const currentUrl = window.location.href;
        
        // 调用我们的返回处理 API
        const response = await fetch(`/api/creem-return?${searchParams.toString()}`);
        const result = await response.json();

        if (result.code === 0) {
          setData(result.data);
        } else {
          setError(result.message || "Failed to process payment");
        }
      } catch (err) {
        console.error("Error processing payment return:", err);
        setError("An error occurred while processing your payment");
      } finally {
        setIsLoading(false);
      }
    };

    // 只有当有查询参数时才处理
    if (searchParams.toString()) {
      processPaymentReturn();
    } else {
      setError("Invalid payment return URL");
      setIsLoading(false);
    }
  }, [searchParams]);

  const formatDate = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'basic':
        return <CreditCard className="h-8 w-8 text-blue-500" />;
      case 'pro':
        return <Crown className="h-8 w-8 text-primary" />;
      case 'premium':
      case 'ultimate':
        return <Crown className="h-8 w-8 text-yellow-500" />;
      default:
        return <CreditCard className="h-8 w-8" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader className="h-8 w-8 animate-spin mb-4" />
            <p className="text-muted-foreground">Processing your payment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-900">Payment Processing Error</CardTitle>
            <CardDescription className="text-red-700">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => window.location.href = "/#pricing"}
              className="w-full"
            >
              Return to Pricing
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.open("mailto:support@flux1-krea.dev", "_blank")}
              className="w-full"
            >
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <p className="text-muted-foreground">No payment data found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-900">Payment Successful!</CardTitle>
          <CardDescription className="text-lg text-green-700">
            Welcome to your new subscription plan
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* 订阅详情卡片 */}
          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getPlanIcon(data.plan.type)}
                <div>
                  <h3 className="text-xl font-semibold capitalize">
                    {data.plan.name} Plan
                  </h3>
                  <p className="text-muted-foreground">
                    Your subscription is now active
                  </p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Plan Type</p>
                <p className="font-medium capitalize">{data.plan.type}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Billing Period</p>
                <p className="font-medium capitalize">{data.plan.period}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Amount Paid</p>
                <p className="font-medium">
                  ${data.subscription.amount_paid.toFixed(2)} {data.plan.currency.toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Payment Method</p>
                <p className="font-medium">{data.subscription.payment_method || 'Creem'}</p>
              </div>
            </div>
          </div>

          {/* 订阅期限信息 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium text-blue-900">Subscription Period</h4>
            </div>
            <div className="text-sm text-blue-800">
              <p>Started: {formatDate(data.subscription.start_date)}</p>
              <p>Expires: {formatDate(data.subscription.end_date)}</p>
            </div>
          </div>

          {/* 下一步操作 */}
          <div className="space-y-3">
            <h4 className="font-medium">What's next?</h4>
            <div className="grid gap-3 md:grid-cols-2">
              <Button 
                onClick={() => window.location.href = "/"}
                className="w-full"
              >
                Start Using Features
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = "/subscription"}
                className="w-full"
              >
                Manage Subscription
              </Button>
            </div>
          </div>

          {/* 支持信息 */}
          <div className="text-center text-sm text-muted-foreground">
            <p>
              Need help? Contact our support team at{" "}
              <a 
                href="mailto:support@flux1-krea.dev" 
                className="text-primary hover:underline"
              >
                support@flux1-krea.dev
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading payment details...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}