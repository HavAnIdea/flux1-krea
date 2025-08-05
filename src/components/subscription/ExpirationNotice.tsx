"use client";

import { useSubscription } from "@/hooks/useSubscription";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Clock, AlertTriangle } from "lucide-react";

interface ExpirationNoticeProps {
  warningDays?: number;
  className?: string;
}

export default function ExpirationNotice({ 
  warningDays = 7,
  className = "" 
}: ExpirationNoticeProps) {
  const { summary, isLoading, isExpiringSoon, getDaysRemaining } = useSubscription();

  if (isLoading || !summary?.is_active) {
    return null;
  }

  const daysRemaining = getDaysRemaining();
  const isExpiring = isExpiringSoon(warningDays);

  if (!isExpiring) {
    return null;
  }

  const isUrgent = daysRemaining <= 3;

  return (
    <Alert className={`${isUrgent ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'} ${className}`}>
      <div className="flex items-start space-x-2">
        {isUrgent ? (
          <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
        ) : (
          <Clock className="h-4 w-4 text-yellow-600 mt-0.5" />
        )}
        <div className="flex-1">
          <AlertDescription className={isUrgent ? 'text-red-800' : 'text-yellow-800'}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {isUrgent ? 'Subscription Expiring Soon!' : 'Subscription Renewal Reminder'}
                </p>
                <p className="text-sm mt-1">
                  Your {summary.current_plan?.name} subscription expires in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}.
                </p>
              </div>
              <Button
                size="sm"
                variant={isUrgent ? "destructive" : "default"}
                onClick={() => window.location.href = "/#pricing"}
                className="ml-4"
              >
                Renew Now
              </Button>
            </div>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}