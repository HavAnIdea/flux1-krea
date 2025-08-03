"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ImageGeneratorConfig, UserLimits } from "@/types/blocks/image-generator";
import { RiVipCrownLine, RiTimeLine, RiArrowUpLine } from "react-icons/ri";

interface UsageLimitsProps {
  config: ImageGeneratorConfig;
  userLimits: UserLimits;
  remainingGenerations: number;
}

export default function UsageLimits({
  config,
  userLimits,
  remainingGenerations
}: UsageLimitsProps) {
  if (!config.limits.showRemaining) {
    return null;
  }

  const usedGenerations = userLimits.dailyLimit - remainingGenerations;
  const usagePercentage = (usedGenerations / userLimits.dailyLimit) * 100;
  const isNearLimit = usagePercentage >= 80;
  const isAtLimit = remainingGenerations <= 0;

  return (
    <Card className={`${isAtLimit ? 'border-destructive/50' : isNearLimit ? 'border-warning/50' : ''}`}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h6 className="text-sm font-medium">Daily Usage</h6>
            {userLimits.isPaid ? (
              <Badge variant="secondary" className="text-xs">
                <RiVipCrownLine className="w-3 h-3 mr-1" />
                Pro
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                Free
              </Badge>
            )}
          </div>

          {userLimits.hasSpeedLimit && userLimits.estimatedWaitTime && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <RiTimeLine className="w-3 h-3" />
              {userLimits.estimatedWaitTime}s wait
            </div>
          )}
        </div>

        {/* Usage Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {usedGenerations} of {userLimits.dailyLimit} used
            </span>
            <span className={`font-medium ${isAtLimit ? 'text-destructive' :
                isNearLimit ? 'text-warning' :
                  'text-muted-foreground'
              }`}>
              {remainingGenerations} left
            </span>
          </div>

          <Progress
            value={usagePercentage}
            className={`h-2 ${isAtLimit ? '[&>div]:bg-destructive' :
                isNearLimit ? '[&>div]:bg-warning' : ''
              }`}
          />
        </div>

        {/* Status Messages */}
        {isAtLimit && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive font-medium">
              {config.limits.messages.limitReached}
            </p>
            <p className="text-xs text-destructive/80 mt-1">
              Upgrade to continue generating images or wait until tomorrow for your limit to reset.
            </p>
          </div>
        )}

        {isNearLimit && !isAtLimit && (
          <div className="p-3 rounded-md bg-warning/10 border border-warning/20">
            <p className="text-sm text-warning font-medium">
              Almost at your daily limit
            </p>
            <p className="text-xs text-warning/80 mt-1">
              Consider upgrading for unlimited generations.
            </p>
          </div>
        )}

        {userLimits.hasSpeedLimit && (
          <div className="p-3 rounded-md bg-blue-50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-800/30">
            <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
              {config.limits.messages.speedLimited}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Free users have a cooldown between generations.
            </p>
          </div>
        )}

        {/* Upgrade Prompt */}
        {!userLimits.isPaid && (isAtLimit || isNearLimit) && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{config.limits.upgradePrompt}</p>
                <p className="text-xs text-muted-foreground">
                  Unlimited generations, no waiting
                </p>
              </div>
              <Button
                size="sm"
                asChild
                className="ml-3"
              >
                <a
                  href={config.limits.upgradeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <RiArrowUpLine className="w-3 h-3 mr-1" />
                  Upgrade
                </a>
              </Button>
            </div>
          </div>
        )}

        {/* Authentication Prompt */}
        {!userLimits.isAuthenticated && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Sign up for more generations</p>
                <p className="text-xs text-muted-foreground">
                  Get 10 free generations daily
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
              >
                Sign Up
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}