/**
 * Rate limiting utilities to prevent abuse
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
    lastRequest: number;
}

class RateLimiter {
    private limits = new Map<string, RateLimitEntry>();
    private maxEntries = 10000;

    constructor(maxEntries: number = 10000) {
        this.maxEntries = maxEntries;

        // Clean up expired entries every 5 minutes
        setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }

    /**
     * Check if a request is allowed
     * @param key - Unique identifier (IP, user ID, fingerprint, etc.)
     * @param limit - Maximum requests allowed
     * @param windowMs - Time window in milliseconds
     * @returns Object with allowed status and remaining requests
     */
    check(key: string, limit: number, windowMs: number): {
        allowed: boolean;
        remaining: number;
        resetTime: number;
        retryAfter?: number;
    } {
        const now = Date.now();
        const entry = this.limits.get(key);

        if (!entry || now >= entry.resetTime) {
            // First request or window has reset
            this.limits.set(key, {
                count: 1,
                resetTime: now + windowMs,
                lastRequest: now,
            });

            return {
                allowed: true,
                remaining: limit - 1,
                resetTime: now + windowMs,
            };
        }

        // Check if limit exceeded
        if (entry.count >= limit) {
            return {
                allowed: false,
                remaining: 0,
                resetTime: entry.resetTime,
                retryAfter: entry.resetTime - now,
            };
        }

        // Increment count
        entry.count++;
        entry.lastRequest = now;
        this.limits.set(key, entry);

        return {
            allowed: true,
            remaining: limit - entry.count,
            resetTime: entry.resetTime,
        };
    }

    /**
     * Reset rate limit for a specific key
     */
    reset(key: string): void {
        this.limits.delete(key);
    }

    /**
     * Get current status for a key
     */
    getStatus(key: string, limit: number): {
        count: number;
        remaining: number;
        resetTime: number;
    } {
        const entry = this.limits.get(key);
        const now = Date.now();

        if (!entry || now >= entry.resetTime) {
            return {
                count: 0,
                remaining: limit,
                resetTime: now,
            };
        }

        return {
            count: entry.count,
            remaining: Math.max(0, limit - entry.count),
            resetTime: entry.resetTime,
        };
    }

    /**
     * Clean up expired entries
     */
    private cleanup(): void {
        const now = Date.now();
        const keysToDelete: string[] = [];

        for (const [key, entry] of this.limits.entries()) {
            if (now >= entry.resetTime) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => this.limits.delete(key));

        // If still too many entries, remove oldest ones
        if (this.limits.size > this.maxEntries) {
            const entries = Array.from(this.limits.entries());
            entries.sort((a, b) => a[1].lastRequest - b[1].lastRequest);

            const toRemove = entries.slice(0, Math.floor(this.maxEntries * 0.1));
            toRemove.forEach(([key]) => this.limits.delete(key));
        }
    }

    /**
     * Get statistics
     */
    getStats(): {
        totalEntries: number;
        maxEntries: number;
        activeEntries: number;
    } {
        const now = Date.now();
        let activeEntries = 0;

        for (const entry of this.limits.values()) {
            if (now < entry.resetTime) {
                activeEntries++;
            }
        }

        return {
            totalEntries: this.limits.size,
            maxEntries: this.maxEntries,
            activeEntries,
        };
    }
}

// Global rate limiter instances
const globalRateLimiter = new RateLimiter(10000);
const imageGenerationLimiter = new RateLimiter(5000);
const fingerprintLimiter = new RateLimiter(1000);

// Rate limit configurations
export const RATE_LIMITS = {
    // Image generation limits
    IMAGE_GENERATION: {
        ANONYMOUS: { limit: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour
        FREE_USER: { limit: 10, windowMs: 24 * 60 * 60 * 1000 }, // 10 per day
        PAID_USER: { limit: 1000, windowMs: 60 * 60 * 1000 }, // 1000 per hour
    },

    // General API limits
    API_REQUESTS: {
        PER_IP: { limit: 100, windowMs: 60 * 1000 }, // 100 per minute
        PER_USER: { limit: 200, windowMs: 60 * 1000 }, // 200 per minute
    },

    // Fingerprint generation limits
    FINGERPRINT: {
        PER_IP: { limit: 10, windowMs: 60 * 1000 }, // 10 per minute
    },
} as const;

// Rate limiting functions
export const rateLimiters = {
    // Check image generation rate limit
    checkImageGeneration: (
        key: string,
        userType: 'anonymous' | 'free' | 'paid' = 'anonymous'
    ) => {
        const config = RATE_LIMITS.IMAGE_GENERATION[
            userType === 'anonymous' ? 'ANONYMOUS' :
                userType === 'free' ? 'FREE_USER' : 'PAID_USER'
        ];

        return imageGenerationLimiter.check(key, config.limit, config.windowMs);
    },

    // Check general API rate limit
    checkApiRequest: (key: string, type: 'ip' | 'user' = 'ip') => {
        const config = RATE_LIMITS.API_REQUESTS[
            type === 'ip' ? 'PER_IP' : 'PER_USER'
        ];

        return globalRateLimiter.check(key, config.limit, config.windowMs);
    },

    // Check fingerprint generation rate limit
    checkFingerprint: (key: string) => {
        const config = RATE_LIMITS.FINGERPRINT.PER_IP;
        return fingerprintLimiter.check(key, config.limit, config.windowMs);
    },

    // Reset specific rate limits
    reset: {
        imageGeneration: (key: string) => imageGenerationLimiter.reset(key),
        apiRequest: (key: string) => globalRateLimiter.reset(key),
        fingerprint: (key: string) => fingerprintLimiter.reset(key),
    },

    // Get status
    getStatus: {
        imageGeneration: (key: string, userType: 'anonymous' | 'free' | 'paid' = 'anonymous') => {
            const config = RATE_LIMITS.IMAGE_GENERATION[
                userType === 'anonymous' ? 'ANONYMOUS' :
                    userType === 'free' ? 'FREE_USER' : 'PAID_USER'
            ];
            return imageGenerationLimiter.getStatus(key, config.limit);
        },
        apiRequest: (key: string, type: 'ip' | 'user' = 'ip') => {
            const config = RATE_LIMITS.API_REQUESTS[
                type === 'ip' ? 'PER_IP' : 'PER_USER'
            ];
            return globalRateLimiter.getStatus(key, config.limit);
        },
    },
};

// Utility to get client IP from request
export const getClientIp = (request: Request): string => {
    // Try to get IP from various headers
    const headers = [
        'x-forwarded-for',
        'x-real-ip',
        'x-client-ip',
        'cf-connecting-ip', // Cloudflare
        'x-forwarded',
        'forwarded-for',
        'forwarded',
    ];

    for (const header of headers) {
        const value = request.headers.get(header);
        if (value) {
            // Take the first IP if there are multiple
            const ip = value.split(',')[0].trim();
            if (ip && ip !== 'unknown') {
                return ip;
            }
        }
    }

    return 'unknown';
};

// Rate limit middleware for server actions
export const withRateLimit = <T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    getRateLimitKey: (...args: T) => string,
    rateLimitCheck: (key: string) => ReturnType<typeof globalRateLimiter.check>
) => {
    return async (...args: T): Promise<R> => {
        const key = getRateLimitKey(...args);
        const result = rateLimitCheck(key);

        if (!result.allowed) {
            const retryAfterSeconds = result.retryAfter ? Math.ceil(result.retryAfter / 1000) : 60;
            throw new Error(`Rate limit exceeded. Try again in ${retryAfterSeconds} seconds.`);
        }

        return await fn(...args);
    };
};

// Get rate limit statistics
export const getRateLimitStats = () => ({
    global: globalRateLimiter.getStats(),
    imageGeneration: imageGenerationLimiter.getStats(),
    fingerprint: fingerprintLimiter.getStats(),
});