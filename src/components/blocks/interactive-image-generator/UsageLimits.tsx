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
      <CardContent className="p-3 space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h6 className="text-xs font-medium">Daily Usage</h6>
            {userLimits.isPaid ? (
              <Badge variant="secondary" className="text-xs h-5">
                <RiVipCrownLine className="w-3 h-3 mr-1" />
                Pro
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs h-5">
                Free
              </Badge>
            )}
          </div>
        </div>

        {/* Usage Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              {usedGenerations} of {userLimits.dailyLimit} used
            </span>
            <span className={`font-medium ${
              isAtLimit ? 'text-destructive' : 
              isNearLimit ? 'text-warning' : 
              'text-muted-foreground'
            }`}>
              {remainingGenerations} left
            </span>
          </div>
          
          <Progress 
            value={usagePercentage} 
            className={`h-1.5 ${
              isAtLimit ? '[&>div]:bg-destructive' : 
              isNearLimit ? '[&>div]:bg-warning' : ''
            }`}
          />
        </div>

        {/* Compact Status Messages */}
        {isAtLimit && (
          <div className="p-2 rounded-md bg-destructive/10 border border-destructive/20">
            <p className="text-xs text-destructive font-medium">
              {config.limits.messages.limitReached}
            </p>
          </div>
        )}

        {isNearLimit && !isAtLimit && (
          <div className="p-2 rounded-md bg-warning/10 border border-warning/20">
            <p className="text-xs text-warning font-medium">
              Almost at your daily limit
            </p>
          </div>
        )}

        {/* Compact Upgrade Prompt */}
        {!userLimits.isPaid && (isAtLimit || isNearLimit) && (
          <div className="flex items-center justify-between pt-2 border-t">
            <p className="text-xs font-medium">{config.limits.upgradePrompt}</p>
            <Button
              size="sm"
              asChild
              className="h-6 px-2 text-xs"
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
        )}
      </CardContent>
    </Card>
  );
}