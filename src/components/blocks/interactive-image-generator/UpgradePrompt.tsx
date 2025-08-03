"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Zap, Check, ArrowRight } from "lucide-react";
import Link from "next/link";

interface UpgradePromptProps {
    trigger: 'limit_reached' | 'low_remaining' | 'anonymous';
    remainingCount?: number;
    className?: string;
}

export default function UpgradePrompt({ trigger, remainingCount, className = "" }: UpgradePromptProps) {
    const getPromptContent = () => {
        switch (trigger) {
            case 'limit_reached':
                return {
                    title: "Daily Limit Reached",
                    description: "You've used all your free generations for today. Upgrade to Pro for unlimited access.",
                    urgency: "high"
                };
            case 'low_remaining':
                return {
                    title: "Almost at Your Limit",
                    description: `Only ${remainingCount} generations left today. Upgrade now to avoid interruptions.`,
                    urgency: "medium"
                };
            case 'anonymous':
                return {
                    title: "Free Trial Complete",
                    description: "Sign in to get more free generations, or upgrade to Pro for unlimited access.",
                    urgency: "high"
                };
            default:
                return {
                    title: "Upgrade to Pro",
                    description: "Get unlimited generations and priority support.",
                    urgency: "low"
                };
        }
    };

    const content = getPromptContent();
    const isHighUrgency = content.urgency === "high";

    return (
        <Card className={`${isHighUrgency ? 'border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50' : 'border-border'} ${className}`}>
            <CardContent className="p-4">
                <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${isHighUrgency ? 'bg-yellow-100' : 'bg-primary/10'}`}>
                            <Crown className={`w-4 h-4 ${isHighUrgency ? 'text-yellow-600' : 'text-primary'}`} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-sm">{content.title}</h3>
                                {isHighUrgency && (
                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                        Action Required
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {content.description}
                            </p>
                        </div>
                    </div>

                    {/* Features */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1">
                            <Check className="w-3 h-3 text-green-600" />
                            <span>Unlimited generations</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Check className="w-3 h-3 text-green-600" />
                            <span>Priority support</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Check className="w-3 h-3 text-green-600" />
                            <span>Higher resolution</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Check className="w-3 h-3 text-green-600" />
                            <span>Faster generation</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        {trigger === 'anonymous' ? (
                            <>
                                <Button asChild size="sm" className="flex-1">
                                    <Link href="/auth/signin" className="flex items-center gap-1">
                                        <ArrowRight className="w-3 h-3" />
                                        Sign In
                                    </Link>
                                </Button>
                                {/* <Button asChild size="sm" variant="outline" className="flex-1">
                                    <Link href="/pricing" className="flex items-center gap-1">
                                        <Crown className="w-3 h-3" />
                                        Upgrade
                                    </Link>
                                </Button> */}
                            </>
                        ) : (
                            <>
                                {/* <Button asChild size="sm" className="flex-1">
                                    <Link href="/pricing" className="flex items-center gap-1">
                                        <Crown className="w-3 h-3" />
                                        Upgrade to Pro
                                    </Link>
                                </Button> */}
                                <Button size="sm" variant="outline" className="px-3">
                                    <Zap className="w-3 h-3" />
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Pricing hint */}
                    <div className="text-center">
                        <p className="text-xs text-muted-foreground">
                            Starting at <span className="font-medium">$9/month</span> • Cancel anytime
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}