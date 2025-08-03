/**
 * Usage verification and permission checking logic
 */

import {
    UsageStatus,
    UsageCheckResult,
    UsageLimitError,
    UsageLimitErrorType,
    USAGE_LIMITS,
    UserPlan,
    getCurrentDateString,
    isNewDay,
    getNextDayReset,
    createUsageLimitError,
    validateUserPlan
} from './usage-limits';

import { getUserUsageInfo, updateUserUsageCount, resetUserDailyUsage, incrementUserUsageCount } from '@/models/user';
import { findAnonymousUsage, upsertAnonymousUsage } from '@/models/anonymous-usage';
import { usageCache, getCacheKey, cacheMetrics, invalidateCache } from './usage-cache';

/**
 * Check usage limits for authenticated users
 */
export async function checkAuthenticatedUserLimits(
    userUuid: string
): Promise<UsageCheckResult> {
    try {
        // Try to get from cache first
        const cacheKey = getCacheKey.userUsage(userUuid);
        let user = usageCache.get(cacheKey);

        if (user) {
            cacheMetrics.recordHit();
        } else {
            cacheMetrics.recordMiss();
            user = await getUserUsageInfo(userUuid);

            if (user) {
                // Cache for 2 minutes
                usageCache.set(cacheKey, user, 2 * 60 * 1000);
            }
        }

        if (!user) {
            return {
                canUse: false,
                usageStatus: {
                    userType: 'authenticated',
                    remainingCount: 0,
                    dailyLimit: 0,
                    canUse: false,
                },
                error: {
                    type: UsageLimitErrorType.AUTHENTICATION_ERROR,
                    message: 'User not found',
                    retryable: false,
                },
            };
        }

        const plan = validateUserPlan(user.plan) ? user.plan : 'free';

        // Paid users have unlimited access
        if (plan === 'paid') {
            return {
                canUse: true,
                usageStatus: {
                    userType: 'authenticated',
                    plan: 'paid',
                    remainingCount: -1,
                    dailyLimit: -1,
                    canUse: true,
                    isUnlimited: true,
                },
            };
        }

        // Free users have daily limits
        const currentDate = getCurrentDateString();
        const isNewDayForUser = isNewDay(user.last_usage_date);

        let currentUsage = user.usage_count;

        // Reset usage if it's a new day
        if (isNewDayForUser) {
            currentUsage = 0;
        }

        const remainingCount = Math.max(0, USAGE_LIMITS.FREE_DAILY - currentUsage);
        const canUse = remainingCount > 0;

        const usageStatus: UsageStatus = {
            userType: 'authenticated',
            plan: 'free',
            remainingCount,
            dailyLimit: USAGE_LIMITS.FREE_DAILY,
            canUse,
            resetTime: getNextDayReset(),
        };

        if (!canUse) {
            return {
                canUse: false,
                usageStatus,
                error: createUsageLimitError(UsageLimitErrorType.DAILY_LIMIT_EXCEEDED, usageStatus),
            };
        }

        return {
            canUse: true,
            usageStatus,
        };
    } catch (error) {
        console.error('Error checking authenticated user limits:', error);

        return {
            canUse: false,
            usageStatus: {
                userType: 'authenticated',
                remainingCount: 0,
                dailyLimit: 0,
                canUse: false,
            },
            error: {
                type: UsageLimitErrorType.DATABASE_ERROR,
                message: 'Failed to check user limits',
                retryable: true,
            },
        };
    }
}

/**
 * Check usage limits for anonymous users
 */
export async function checkAnonymousUserLimits(
    fingerprintHash: string
): Promise<UsageCheckResult> {
    try {
        // Try to get from cache first
        const cacheKey = getCacheKey.anonymousUsage(fingerprintHash);
        let usage = usageCache.get(cacheKey);

        if (usage) {
            cacheMetrics.recordHit();
        } else {
            cacheMetrics.recordMiss();
            usage = await findAnonymousUsage(fingerprintHash);

            if (usage) {
                // Cache for 5 minutes
                usageCache.set(cacheKey, usage, 5 * 60 * 1000);
            }
        }
        const currentUsage = usage?.usage_count || 0;
        const remainingCount = Math.max(0, USAGE_LIMITS.ANONYMOUS - currentUsage);
        const canUse = remainingCount > 0;

        const usageStatus: UsageStatus = {
            userType: 'anonymous',
            remainingCount,
            dailyLimit: USAGE_LIMITS.ANONYMOUS,
            canUse,
        };

        if (!canUse) {
            return {
                canUse: false,
                usageStatus,
                error: createUsageLimitError(UsageLimitErrorType.ANONYMOUS_LIMIT_EXCEEDED, usageStatus),
            };
        }

        return {
            canUse: true,
            usageStatus,
        };
    } catch (error) {
        console.error('Error checking anonymous user limits:', error);

        return {
            canUse: false,
            usageStatus: {
                userType: 'anonymous',
                remainingCount: 0,
                dailyLimit: USAGE_LIMITS.ANONYMOUS,
                canUse: false,
            },
            error: {
                type: UsageLimitErrorType.DATABASE_ERROR,
                message: 'Failed to check usage limits',
                retryable: true,
            },
        };
    }
}

/**
 * Update usage count for authenticated users after successful generation
 */
export async function updateAuthenticatedUserUsage(
    userUuid: string
): Promise<UsageStatus> {
    try {
        const user = await getUserUsageInfo(userUuid);

        if (!user) {
            throw new Error('User not found');
        }

        const plan = validateUserPlan(user.plan) ? user.plan : 'free';

        // Paid users don't need usage tracking
        if (plan === 'paid') {
            return {
                userType: 'authenticated',
                plan: 'paid',
                remainingCount: -1,
                dailyLimit: -1,
                canUse: true,
                isUnlimited: true,
            };
        }

        // Free users need usage tracking
        const currentDate = getCurrentDateString();
        const isNewDayForUser = isNewDay(user.last_usage_date);

        let updatedUser;

        if (isNewDayForUser) {
            // Reset to 1 for new day
            updatedUser = await resetUserDailyUsage(userUuid, currentDate);
        } else {
            // Increment existing count
            updatedUser = await incrementUserUsageCount(userUuid);
        }

        if (!updatedUser) {
            throw new Error('Failed to update user usage');
        }

        // Invalidate cache after update
        invalidateCache.userUsage(userUuid);

        const remainingCount = Math.max(0, USAGE_LIMITS.FREE_DAILY - updatedUser.usage_count);

        const usageStatus = {
            userType: 'authenticated' as const,
            plan: 'free' as const,
            remainingCount,
            dailyLimit: USAGE_LIMITS.FREE_DAILY,
            canUse: remainingCount > 0,
            resetTime: getNextDayReset(),
        };

        // Cache the updated status
        const cacheKey = getCacheKey.userUsage(userUuid);
        usageCache.set(cacheKey, updatedUser, 2 * 60 * 1000);

        return usageStatus;
    } catch (error) {
        console.error('Error updating authenticated user usage:', error);
        throw error;
    }
}

/**
 * Update usage count for anonymous users after successful generation
 */
export async function updateAnonymousUserUsage(
    fingerprintHash: string
): Promise<UsageStatus> {
    try {
        const updatedUsage = await upsertAnonymousUsage(fingerprintHash);

        if (!updatedUsage) {
            throw new Error('Failed to update anonymous usage');
        }

        // Invalidate cache after update
        invalidateCache.anonymousUsage(fingerprintHash);

        const remainingCount = Math.max(0, USAGE_LIMITS.ANONYMOUS - updatedUsage.usage_count);

        const usageStatus = {
            userType: 'anonymous' as const,
            remainingCount,
            dailyLimit: USAGE_LIMITS.ANONYMOUS,
            canUse: remainingCount > 0,
        };

        // Cache the updated status
        const cacheKey = getCacheKey.anonymousUsage(fingerprintHash);
        usageCache.set(cacheKey, updatedUsage, 5 * 60 * 1000);

        return usageStatus;
    } catch (error) {
        console.error('Error updating anonymous user usage:', error);
        throw error;
    }
}

/**
 * Get current usage status without checking limits
 */
export async function getCurrentUsageStatus(
    userUuid: string | null,
    fingerprintHash: string
): Promise<UsageStatus> {
    try {
        if (userUuid) {
            // Authenticated user
            const user = await getUserUsageInfo(userUuid);

            if (!user) {
                throw new Error('User not found');
            }

            const plan = validateUserPlan(user.plan) ? user.plan : 'free';

            if (plan === 'paid') {
                return {
                    userType: 'authenticated',
                    plan: 'paid',
                    remainingCount: -1,
                    dailyLimit: -1,
                    canUse: true,
                    isUnlimited: true,
                };
            }

            // Free user
            const currentDate = getCurrentDateString();
            const isNewDayForUser = isNewDay(user.last_usage_date);
            const currentUsage = isNewDayForUser ? 0 : user.usage_count;
            const remainingCount = Math.max(0, USAGE_LIMITS.FREE_DAILY - currentUsage);

            return {
                userType: 'authenticated',
                plan: 'free',
                remainingCount,
                dailyLimit: USAGE_LIMITS.FREE_DAILY,
                canUse: remainingCount > 0,
                resetTime: getNextDayReset(),
            };
        } else {
            // Anonymous user
            const usage = await findAnonymousUsage(fingerprintHash);
            const currentUsage = usage?.usage_count || 0;
            const remainingCount = Math.max(0, USAGE_LIMITS.ANONYMOUS - currentUsage);

            return {
                userType: 'anonymous',
                remainingCount,
                dailyLimit: USAGE_LIMITS.ANONYMOUS,
                canUse: remainingCount > 0,
            };
        }
    } catch (error) {
        console.error('Error getting current usage status:', error);

        // Return safe default
        return {
            userType: userUuid ? 'authenticated' : 'anonymous',
            remainingCount: 0,
            dailyLimit: userUuid ? USAGE_LIMITS.FREE_DAILY : USAGE_LIMITS.ANONYMOUS,
            canUse: false,
        };
    }
}