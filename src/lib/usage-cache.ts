/**
 * Simple in-memory cache for usage status and fingerprints
 * This helps reduce database queries for frequently accessed data
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number; // Time to live in milliseconds
}

class SimpleCache<T> {
    private cache = new Map<string, CacheEntry<T>>();
    private maxSize: number;

    constructor(maxSize: number = 1000) {
        this.maxSize = maxSize;
    }

    set(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
        // Clean up expired entries if cache is getting full
        if (this.cache.size >= this.maxSize) {
            this.cleanup();
        }

        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttlMs,
        });
    }

    get(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        // Check if entry has expired
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    delete(key: string): boolean {
        return this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    private cleanup(): void {
        const now = Date.now();
        const keysToDelete: string[] = [];

        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => this.cache.delete(key));

        // If still too many entries, remove oldest ones
        if (this.cache.size >= this.maxSize) {
            const entries = Array.from(this.cache.entries());
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

            const toRemove = entries.slice(0, Math.floor(this.maxSize * 0.2));
            toRemove.forEach(([key]) => this.cache.delete(key));
        }
    }

    size(): number {
        return this.cache.size;
    }
}

// Cache instances
const usageStatusCache = new SimpleCache<any>(500);
const fingerprintCache = new SimpleCache<string>(100);

// Cache keys
export const getCacheKey = {
    userUsage: (userUuid: string) => `user_usage:${userUuid}`,
    anonymousUsage: (fingerprintHash: string) => `anonymous_usage:${fingerprintHash}`,
    fingerprint: (sessionId: string) => `fingerprint:${sessionId}`,
};

// Usage status caching
export const usageCache = {
    get: (key: string) => usageStatusCache.get(key),
    set: (key: string, data: any, ttlMs: number = 2 * 60 * 1000) =>
        usageStatusCache.set(key, data, ttlMs), // 2 minutes default
    delete: (key: string) => usageStatusCache.delete(key),
    clear: () => usageStatusCache.clear(),
};

// Fingerprint caching (longer TTL since fingerprints don't change often)
export const fingerprintCacheUtil = {
    get: (key: string) => fingerprintCache.get(key),
    set: (key: string, data: string, ttlMs: number = 30 * 60 * 1000) =>
        fingerprintCache.set(key, data, ttlMs), // 30 minutes default
    delete: (key: string) => fingerprintCache.delete(key),
    clear: () => fingerprintCache.clear(),
};

// Cache statistics
export const getCacheStats = () => ({
    usageCache: {
        size: usageStatusCache.size(),
        maxSize: 500,
    },
    fingerprintCache: {
        size: fingerprintCache.size(),
        maxSize: 100,
    },
});

// Utility to generate cache-friendly keys
export const generateCacheKey = (prefix: string, ...parts: (string | number)[]): string => {
    return `${prefix}:${parts.join(':')}`;
};

// Cache warming utilities
export const warmCache = {
    // Pre-load frequently accessed data
    async userUsage(userUuid: string, usageData: any) {
        const key = getCacheKey.userUsage(userUuid);
        usageCache.set(key, usageData, 5 * 60 * 1000); // 5 minutes for user data
    },

    async anonymousUsage(fingerprintHash: string, usageData: any) {
        const key = getCacheKey.anonymousUsage(fingerprintHash);
        usageCache.set(key, usageData, 10 * 60 * 1000); // 10 minutes for anonymous data
    },
};

// Cache invalidation utilities
export const invalidateCache = {
    userUsage: (userUuid: string) => {
        const key = getCacheKey.userUsage(userUuid);
        usageCache.delete(key);
    },

    anonymousUsage: (fingerprintHash: string) => {
        const key = getCacheKey.anonymousUsage(fingerprintHash);
        usageCache.delete(key);
    },

    all: () => {
        usageCache.clear();
        fingerprintCacheUtil.clear();
    },
};

// Performance monitoring
export const cacheMetrics = {
    hits: 0,
    misses: 0,

    recordHit() {
        this.hits++;
    },

    recordMiss() {
        this.misses++;
    },

    getHitRate(): number {
        const total = this.hits + this.misses;
        return total > 0 ? this.hits / total : 0;
    },

    reset() {
        this.hits = 0;
        this.misses = 0;
    },

    getStats() {
        return {
            hits: this.hits,
            misses: this.misses,
            hitRate: this.getHitRate(),
            ...getCacheStats(),
        };
    },
};