"use client";

import { UsageStatus as UsageStatusType } from "@/lib/usage-limits";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Zap, Crown, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface UsageStatusProps {
    usageStatus: UsageStatusType | null;
    className?: string;
}

export default function UsageStatus({ usageStatus, className = "" }: UsageStatusProps) {
    if (!usageStatus) {
        return (
            <div className={`p-4 bg-muted/50 rounded-lg border ${className}`}>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse" />
                    <span className="text-sm">Loading usage status...</span>
                </div>
            </div>
        );
    }

    const { userType, plan, remainingCount, dailyLimit, canUse, resetTime, isUnlimited } = usageStatus;

    // Paid users with unlimited access
    if (isUnlimited) {
        return (
            <div className={`p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg ${className}`}>
                <div className="flex items-center gap-3">
                    <Crown className="w-5 h-5 text-yellow-600" />
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                Pro User
                            </Badge>
                            <span className="text-sm font-medium text-yellow-800">Unlimited generations</span>
                        </div>
                        <p className="text-xs text-yellow-700 mt-1">
                            Enjoy unlimited image generations with your Pro subscription
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Calculate usage percentage for progress indication
    const usagePercentage = dailyLimit > 0 ? ((dailyLimit - remainingCount) / dailyLimit) * 100 : 0;

    // Determine status color and icon based on remaining count
    const getStatusColor = () => {
        if (!canUse) return "destructive";
        if (remainingCount <= 1) return "warning";
        if (remainingCount <= 3) return "secondary";
        return "default";
    };

    const getStatusIcon = () => {
        if (!canUse) return <AlertTriangle className="w-4 h-4" />;
        if (remainingCount <= 1) return <AlertTriangle className="w-4 h-4" />;
        return <Zap className="w-4 h-4" />;
    };

    const statusColor = getStatusColor();
    const statusIcon = getStatusIcon();

    return (
        <div className={`p-4 bg-card border rounded-lg ${className}`}>
            <div className="space-y-3">
                {/* Header with status */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {statusIcon}
                        <span className="font-medium text-sm">
                            {userType === 'authenticated' ? 'Daily Usage' : 'Free Trial'}
                        </span>
                    </div>
                    <Badge
                        variant={statusColor === "destructive" ? "destructive" : "secondary"}
                        className={
                            statusColor === "warning"
                                ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                                : ""
                        }
                    >
                        {remainingCount} / {dailyLimit} left
                    </Badge>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                    <div className="w-full bg-muted rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all duration-300 ${!canUse
                                    ? "bg-destructive"
                                    : usagePercentage > 80
                                        ? "bg-yellow-500"
                                        : "bg-primary"
                                }`}
                            style={{ width: `${usagePercentage}%` }}
                        />
                    </div>

                    {/* Status message */}
                    <div className="text-xs text-muted-foreground">
                        {!canUse ? (
                            <div className="flex items-center gap-1 text-destructive">
                                <AlertTriangle className="w-3 h-3" />
                                <span>
                                    {userType === 'anonymous'
                                        ? "Free trial limit reached. Sign in for more generations."
                                        : "Daily limit reached."
                                    }
                                </span>
                            </div>
                        ) : remainingCount <= 1 ? (
                            <div className="flex items-center gap-1 text-yellow-700">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Almost at your limit! Consider upgrading for unlimited access.</span>
                            </div>
                        ) : (
                            <span>
                                {userType === 'authenticated' && resetTime
                                    ? `Resets daily at ${resetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                    : "Generate amazing images with AI"
                                }
                            </span>
                        )}
                    </div>
                </div>

                {/* Action buttons */}
                {!canUse && (
                    <div className="flex gap-2 pt-2">
                        {userType === 'anonymous' ? (
                            <Button asChild size="sm" className="flex-1">
                                <Link href="/auth/signin">
                                    Sign In for More
                                </Link>
                            </Button>
                        ) : (
                            <>
                                <Button asChild size="sm" variant="outline" className="flex-1">
                                    <Link href="/pricing">
                                        Upgrade to Pro
                                    </Link>
                                </Button>
                                {resetTime && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground px-2">
                                        <Clock className="w-3 h-3" />
                                        <span>
                                            Resets in {Math.ceil((resetTime.getTime() - Date.now()) / (1000 * 60 * 60))}h
                                        </span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Upgrade suggestion for authenticated free users */}
                {canUse && userType === 'authenticated' && plan === 'free' && remainingCount <= 3 && (
                    <div className="pt-2 border-t">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                                Want unlimited generations?
                            </span>
                            <Button asChild size="sm" variant="outline">
                                <Link href="/pricing">
                                    Upgrade
                                </Link>
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}