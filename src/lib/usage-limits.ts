/**
 * Usage limits configuration and types
 */

// Usage limit constants
export const USAGE_LIMITS = {
    ANONYMOUS: parseInt(process.env.NEXT_PUBLIC_ANONYMOUS_LIMIT || '5', 10),
    FREE_DAILY: parseInt(process.env.NEXT_PUBLIC_FREE_DAILY_LIMIT || '10', 10),
    PAID_DAILY: -1, // -1 means unlimited
} as const;

// User plan types
export type UserPlan = 'free' | 'paid';

// User type for usage tracking
export type UserType = 'anonymous' | 'authenticated';

// Usage status interface
export interface UsageStatus {
    userType: UserType;
    plan?: UserPlan;
    remainingCount: number;
    dailyLimit: number;
    canUse: boolean;
    resetTime?: Date; // For free users - when daily limit resets
    isUnlimited?: boolean; // For paid users
}

// Usage limit error types
export enum UsageLimitErrorType {
    ANONYMOUS_LIMIT_EXCEEDED = 'anonymous_limit_exceeded',
    DAILY_LIMIT_EXCEEDED = 'daily_limit_exceeded',
    FINGERPRINT_GENERATION_FAILED = 'fingerprint_generation_failed',
    DATABASE_ERROR = 'database_error',
    AUTHENTICATION_ERROR = 'authentication_error',
    VALIDATION_ERROR = 'validation_error',
}

// Usage limit error interface
export interface UsageLimitError {
    type: UsageLimitErrorType;
    message: string;
    upgradeRequired?: boolean;
    retryable: boolean;
    resetTime?: Date;
}

// Usage check result interface
export interface UsageCheckResult {
    canUse: boolean;
    usageStatus: UsageStatus;
    error?: UsageLimitError;
}

// Database user interface (extending existing user type)
export interface UserWithUsage {
    id: number;
    uuid: string;
    email: string;
    plan: UserPlan;
    usage_count: number;
    last_usage_date: string | null;
    created_at: Date | null;
    updated_at: Date | null;
}

// Anonymous usage record interface
export interface AnonymousUsageRecord {
    id: number;
    fingerprint_hash: string;
    usage_count: number;
    created_at: Date;
    updated_at: Date;
}

// Utility functions
export function getNextDayReset(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
}

export function getCurrentDateString(): string {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
}

export function isNewDay(lastUsageDate: string | null): boolean {
    if (!lastUsageDate) return true;
    return lastUsageDate !== getCurrentDateString();
}

export function getUsageLimitMessage(usageStatus: UsageStatus): string {
    if (usageStatus.userType === 'anonymous') {
        return `You've reached your limit of ${usageStatus.dailyLimit} free generations. Please sign in for more.`;
    } else if (usageStatus.plan === 'free') {
        const resetTime = usageStatus.resetTime;
        const resetTimeStr = resetTime ? resetTime.toLocaleTimeString() : 'midnight';
        return `You've reached your daily limit of ${usageStatus.dailyLimit} generations. Resets at ${resetTimeStr} or upgrade to Pro for unlimited access.`;
    }
    return 'Usage limit exceeded.';
}

export function createUsageLimitError(
    type: UsageLimitErrorType,
    usageStatus: UsageStatus
): UsageLimitError {
    const message = getUsageLimitMessage(usageStatus);

    return {
        type,
        message,
        upgradeRequired: usageStatus.userType === 'authenticated' && usageStatus.plan === 'free',
        retryable: false,
        resetTime: usageStatus.resetTime,
    };
}

// Validation functions
export function validateUsageCount(count: number): boolean {
    return Number.isInteger(count) && count >= 0;
}

export function validateUserPlan(plan: string): plan is UserPlan {
    return plan === 'free' || plan === 'paid';
}

export function validateDateString(dateStr: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;

    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date.getTime());
}