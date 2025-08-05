"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  XCircle, 
  RefreshCw, 
  ArrowLeft, 
  Mail,
  AlertTriangle,
  CreditCard
} from "lucide-react";

interface PaymentError {
  code?: string;
  message?: string;
  type?: 'card_declined' | 'insufficient_funds' | 'network_error' | 'unknown';
}

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<PaymentError>({});
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // 从 URL 参数中获取错误信息
    const errorCode = searchParams.get('error_code');
    const errorMessage = searchParams.get('error_message');
    const errorType = searchParams.get('error_type') as PaymentError['type'];

    setError({
      code: errorCode || undefined,
      message: errorMessage || "Payment could not be processed",
      type: errorType || 'unknown'
    });
  }, [searchParams]);

  const getErrorDetails = (errorType: PaymentError['type']) => {
    switch (errorType) {
      case 'card_declined':
        return {
          title: "Card Declined",
          description: "Your payment method was declined by your bank or card issuer.",
          suggestions: [
            "Check that your card details are correct",
            "Ensure you have sufficient funds",
            "Contact your bank to authorize the payment",
            "Try a different payment method"
          ],
          icon: <CreditCard className="h-6 w-6 text-red-600" />
        };
      case 'insufficient_funds':
        return {
          title: "Insufficient Funds",
          description: "There are not enough funds available on your payment method.",
          suggestions: [
            "Add funds to your account",
            "Try a different payment method",
            "Contact your bank for assistance"
          ],
          icon: <XCircle className="h-6 w-6 text-red-600" />
        };
      case 'network_error':
        return {
          title: "Network Error",
          description: "There was a temporary network issue during payment processing.",
          suggestions: [
            "Check your internet connection",
            "Try again in a few minutes",
            "Contact support if the problem persists"
          ],
          icon: <AlertTriangle className="h-6 w-6 text-orange-600" />
        };
      default:
        return {
          title: "Payment Failed",
          description: "We couldn't process your payment at this time.",
          suggestions: [
            "Check your payment details",
            "Try a different payment method",
            "Contact support for assistance"
          ],
          icon: <XCircle className="h-6 w-6 text-red-600" />
        };
    }
  };

  const errorDetails = getErrorDetails(error.type);

  const handleRetryPayment = () => {
    setRetryCount(prev => prev + 1);
    // 重定向到定价页面重新开始支付流程
    window.location.href = "/#pricing";
  };

  const handleContactSupport = () => {
    const subject = encodeURIComponent("Payment Failed - Need Assistance");
    const body = encodeURIComponent(
      `Hello,\n\nI encountered an issue while trying to make a payment:\n\n` +
      `Error Code: ${error.code || 'N/A'}\n` +
      `Error Message: ${error.message || 'N/A'}\n` +
      `Error Type: ${error.type || 'N/A'}\n` +
      `Retry Attempts: ${retryCount}\n\n` +
      `Please help me resolve this issue.\n\nThank you!`
    );
    
    window.open(`mailto:support@flux1-krea.dev?subject=${subject}&body=${body}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            {errorDetails.icon}
          </div>
          <CardTitle className="text-2xl text-red-900">{errorDetails.title}</CardTitle>
          <CardDescription className="text-lg text-red-700">
            {errorDetails.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* 错误详情 */}
          {error.message && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Error Details:</strong> {error.message}
                {error.code && (
                  <span className="block text-sm mt-1">
                    Error Code: {error.code}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* 解决建议 */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="font-semibold mb-3">What you can do:</h3>
            <ul className="space-y-2">
              {errorDetails.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span className="text-sm">{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 重试次数提示 */}
          {retryCount > 0 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                You have attempted payment {retryCount} time{retryCount > 1 ? 's' : ''}. 
                If you continue to experience issues, please contact our support team.
              </AlertDescription>
            </Alert>
          )}

          {/* 操作按钮 */}
          <div className="grid gap-3 md:grid-cols-2">
            <Button 
              onClick={handleRetryPayment}
              className="w-full"
              disabled={retryCount >= 3}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {retryCount >= 3 ? 'Max Retries Reached' : 'Try Again'}
            </Button>
            <Button 
              variant="outline"
              onClick={handleContactSupport}
              className="w-full"
            >
              <Mail className="mr-2 h-4 w-4" />
              Contact Support
            </Button>
          </div>

          {/* 返回选项 */}
          <div className="text-center">
            <Button 
              variant="ghost"
              onClick={() => window.location.href = "/"}
              className="text-muted-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Home
            </Button>
          </div>

          {/* 支持信息 */}
          <div className="bg-gray-50 border rounded-lg p-4">
            <h4 className="font-medium mb-2">Need immediate help?</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                Email: <a 
                  href="mailto:support@flux1-krea.dev" 
                  className="text-primary hover:underline"
                >
                  support@flux1-krea.dev
                </a>
              </p>
              <p>
                Our support team typically responds within 24 hours.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <PaymentFailedContent />
    </Suspense>
  );
}