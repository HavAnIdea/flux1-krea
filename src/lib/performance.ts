/**
 * Performance monitoring utilities for usage limits system
 */

interface PerformanceMetric {
    name: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    metadata?: Record<string, any>;
}

class PerformanceMonitor {
    private metrics: PerformanceMetric[] = [];
    private maxMetrics = 1000;

    startTimer(name: string, metadata?: Record<string, any>): string {
        const id = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        this.metrics.push({
            name: id,
            startTime: performance.now(),
            metadata,
        });

        // Clean up old metrics if we have too many
        if (this.metrics.length > this.maxMetrics) {
            this.metrics = this.metrics.slice(-this.maxMetrics * 0.8);
        }

        return id;
    }

    endTimer(id: string): number | null {
        const metric = this.metrics.find(m => m.name === id);
        if (!metric) return null;

        metric.endTime = performance.now();
        metric.duration = metric.endTime - metric.startTime;

        return metric.duration;
    }

    getMetrics(name?: string): PerformanceMetric[] {
        if (name) {
            return this.metrics.filter(m => m.name.startsWith(name) && m.duration !== undefined);
        }
        return this.metrics.filter(m => m.duration !== undefined);
    }

    getAverageTime(name: string): number {
        const metrics = this.getMetrics(name);
        if (metrics.length === 0) return 0;

        const total = metrics.reduce((sum, m) => sum + (m.duration || 0), 0);
        return total / metrics.length;
    }

    getStats(name?: string) {
        const metrics = this.getMetrics(name);
        if (metrics.length === 0) {
            return {
                count: 0,
                average: 0,
                min: 0,
                max: 0,
                total: 0,
            };
        }

        const durations = metrics.map(m => m.duration || 0);
        const total = durations.reduce((sum, d) => sum + d, 0);

        return {
            count: metrics.length,
            average: total / metrics.length,
            min: Math.min(...durations),
            max: Math.max(...durations),
            total,
        };
    }

    clear(): void {
        this.metrics = [];
    }
}

// Global performance monitor instance
const perfMonitor = new PerformanceMonitor();

// Convenience functions
export const perf = {
    start: (name: string, metadata?: Record<string, any>) => perfMonitor.startTimer(name, metadata),
    end: (id: string) => perfMonitor.endTimer(id),
    getStats: (name?: string) => perfMonitor.getStats(name),
    getAverage: (name: string) => perfMonitor.getAverageTime(name),
    clear: () => perfMonitor.clear(),
};

// Decorator for measuring function performance
export function measurePerformance<T extends (...args: any[]) => any>(
    fn: T,
    name?: string
): T {
    const functionName = name || fn.name || 'anonymous';

    return ((...args: Parameters<T>) => {
        const timerId = perf.start(functionName, { args: args.length });

        try {
            const result = fn(...args);

            // Handle async functions
            if (result instanceof Promise) {
                return result.finally(() => {
                    perf.end(timerId);
                });
            }

            perf.end(timerId);
            return result;
        } catch (error) {
            perf.end(timerId);
            throw error;
        }
    }) as T;
}

// Database query performance tracking
export const dbPerf = {
    async measure<T>(operation: string, query: () => Promise<T>): Promise<T> {
        const timerId = perf.start(`db_${operation}`);

        try {
            const result = await query();
            const duration = perf.end(timerId);

            // Log slow queries (> 100ms)
            if (duration && duration > 100) {
                console.warn(`Slow database query detected: ${operation} took ${duration.toFixed(2)}ms`);
            }

            return result;
        } catch (error) {
            perf.end(timerId);
            throw error;
        }
    },
};

// Usage limits specific performance tracking
export const usageLimitsPerf = {
    checkLimits: (fn: () => Promise<any>) =>
        measurePerformance(fn, 'usage_limits_check'),

    updateUsage: (fn: () => Promise<any>) =>
        measurePerformance(fn, 'usage_update'),

    generateFingerprint: (fn: () => Promise<any>) =>
        measurePerformance(fn, 'fingerprint_generation'),
};

// Performance reporting
export const getPerformanceReport = () => {
    const report = {
        timestamp: new Date().toISOString(),
        cache: {
            // Import cache metrics if available
            hitRate: 0,
            size: 0,
        },
        database: {
            userUsageCheck: perf.getStats('db_getUserUsageInfo'),
            anonymousUsageCheck: perf.getStats('db_findAnonymousUsage'),
            userUsageUpdate: perf.getStats('db_updateUserUsage'),
            anonymousUsageUpdate: perf.getStats('db_upsertAnonymousUsage'),
        },
        usageLimits: {
            checkLimits: perf.getStats('usage_limits_check'),
            updateUsage: perf.getStats('usage_update'),
        },
        fingerprint: {
            generation: perf.getStats('fingerprint_generation'),
        },
    };

    return report;
};

// Performance alerts
export const checkPerformanceAlerts = () => {
    const alerts = [];

    // Check for slow database operations
    const dbStats = [
        { name: 'User Usage Check', stats: perf.getStats('db_getUserUsageInfo') },
        { name: 'Anonymous Usage Check', stats: perf.getStats('db_findAnonymousUsage') },
        { name: 'User Usage Update', stats: perf.getStats('db_updateUserUsage') },
        { name: 'Anonymous Usage Update', stats: perf.getStats('db_upsertAnonymousUsage') },
    ];

    dbStats.forEach(({ name, stats }) => {
        if (stats.average > 100) {
            alerts.push({
                type: 'slow_database_query',
                message: `${name} averaging ${stats.average.toFixed(2)}ms`,
                severity: stats.average > 500 ? 'high' : 'medium',
            });
        }
    });

    // Check for slow fingerprint generation
    const fingerprintStats = perf.getStats('fingerprint_generation');
    if (fingerprintStats.average > 50) {
        alerts.push({
            type: 'slow_fingerprint_generation',
            message: `Fingerprint generation averaging ${fingerprintStats.average.toFixed(2)}ms`,
            severity: fingerprintStats.average > 200 ? 'high' : 'medium',
        });
    }

    return alerts;
};