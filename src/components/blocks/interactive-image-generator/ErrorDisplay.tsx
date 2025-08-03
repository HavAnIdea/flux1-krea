"use client";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GenerationError, GenerationErrorType } from "@/types/blocks/image-generator";
import { UsageLimitErrorType } from "@/lib/usage-limits";
import { AlertTriangle, Wifi, RefreshCw, UserPlus, Crown } from "lucide-react";
import Link from "next/link";

interface ErrorDisplayProps {
    error: GenerationError;
    onRetry?: () => void;
    className?: string;
}

export default function ErrorDisplay({ error, onRetry, className = "" }: ErrorDisplayProps) {
    const getErrorIcon = () => {
        switch (error.type) {
            case GenerationErrorType.NETWORK_ERROR:
                return <Wifi className="w-4 h-4" />;
            case GenerationErrorType.LIMIT_EXCEEDED:
                return <AlertTriangle className="w-4 h-4" />;
            default:
                return <AlertTriangle className="w-4 h-4" />;
        }
    };

    const getErrorTitle = () => {
        switch (error.type) {
            case GenerationErrorType.NETWORK_ERROR:
                return "Connection Error";
            case GenerationErrorType.LIMIT_EXCEEDED:
                return "Usage Limit Reached";
            case GenerationErrorType.API_ERROR:
                return "Service Error";
            case GenerationErrorType.GENERATION_FAILED:
                return "Generation Failed";
            case GenerationErrorType.VALIDATION_ERROR:
                return "Invalid Input";
            default:
                return "Error";
        }
    };

    const getErrorVariant = () => {
        switch (error.type) {
            case GenerationErrorType.LIMIT_EXCEEDED:
                return "default";
            case GenerationErrorType.NETWORK_ERROR:
                return "destructive";
            case GenerationErrorType.API_ERROR:
                return "destructive";
            default:
                return "destructive";
        }
    };

    const renderActionButtons = () => {
        const buttons = [];

        // Retry button for retryable errors
        if (error.retryable && onRetry) {
            buttons.push(
                <Button
                    key="retry"
                    variant="outline"
                    size="sm"
                    onClick={onRetry}
                    className="flex items-center gap-2"
                >
                    <RefreshCw className="w-3 h-3" />
                    Try Again
                </Button>
            );
        }

        // Upgrade button for upgrade required errors
        if (error.upgradeRequired) {
            buttons.push(
                <Button
                    key="upgrade"
                    asChild
                    size="sm"
                    className="flex items-center gap-2"
                >
                    <Link href="/pricing">
                        <Crown className="w-3 h-3" />
                        Upgrade to Pro
                    </Link>
                </Button>
            );
        }

        // Sign in button for anonymous limit exceeded
        if (error.type === GenerationErrorType.LIMIT_EXCEEDED &&
            error.message.includes("sign in")) {
            buttons.push(
                <Button
                    key="signin"
                    asChild
                    size="sm"
                    className="flex items-center gap-2"
                >
                    <Link href="/auth/signin">
                        <UserPlus className="w-3 h-3" />
                        Sign In
                    </Link>
                </Button>
            );
        }

        return buttons;
    };

    return (
        <Alert variant={getErrorVariant()} className={className}>
            <div className="flex items-start gap-3">
                {getErrorIcon()}
                <div className="flex-1 space-y-2">
                    <div className="font-medium text-sm">
                        {getErrorTitle()}
                    </div>
                    <AlertDescription className="text-sm">
                        {error.message}
                    </AlertDescription>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-2">
                        {renderActionButtons()}
                    </div>

                    {/* Additional help text for specific errors */}
                    {error.type === GenerationErrorType.LIMIT_EXCEEDED && (
                        <div className="text-xs text-muted-foreground pt-2 border-t">
                            {error.upgradeRequired ? (
                                <span>Upgrade to Pro for unlimited generations and priority support.</span>
                            ) : (
                                <span>Sign in to get more free generations and track your usage.</span>
                            )}
                        </div>
                    )}

                    {error.type === GenerationErrorType.NETWORK_ERROR && (
                        <div className="text-xs text-muted-foreground pt-2 border-t">
                            <span>Check your internet connection and try again. If the problem persists, please contact support.</span>
                        </div>
                    )}

                    {error.type === GenerationErrorType.VALIDATION_ERROR && (
                        <div className="text-xs text-muted-foreground pt-2 border-t">
                            <span>Make sure your prompt is between 3-500 characters and describes what you want to create.</span>
                        </div>
                    )}
                </div>
            </div>
        </Alert>
    );
}