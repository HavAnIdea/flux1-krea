/**
 * Device fingerprint generation library
 * Collects browser and device characteristics to create a unique identifier
 */

export interface DeviceFingerprint {
    userAgent: string;
    language: string;
    screenResolution: string;
    timezone: string;
    platform: string;
    colorDepth: string;
    hardwareConcurrency: string;
    deviceMemory: string;
    cookieEnabled: string;
    doNotTrack: string;
}

/**
 * Generate device fingerprint from browser characteristics
 */
export async function generateDeviceFingerprint(): Promise<string> {
    try {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
            throw new Error('Device fingerprint can only be generated in browser environment');
        }

        // Check for cached fingerprint
        const cached = getCachedFingerprint();
        if (cached) {
            return cached;
        }

        const components: DeviceFingerprint = {
            userAgent: navigator.userAgent || '',
            language: navigator.language || '',
            screenResolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
            platform: navigator.platform || '',
            colorDepth: screen.colorDepth?.toString() || '',
            hardwareConcurrency: navigator.hardwareConcurrency?.toString() || '',
            deviceMemory: (navigator as any).deviceMemory?.toString() || '',
            cookieEnabled: navigator.cookieEnabled?.toString() || '',
            doNotTrack: navigator.doNotTrack || '',
        };

        // Create fingerprint string
        const fingerprintString = Object.values(components).join('|');

        // Generate hash
        const hash = await hashFingerprint(fingerprintString);

        // Cache the result
        cacheFingerprint(hash);

        return hash;
    } catch (error) {
        console.error('Failed to generate device fingerprint:', error);

        // Fallback to a basic fingerprint
        return generateFallbackFingerprint();
    }
}

/**
 * Hash fingerprint using SHA-256
 */
export async function hashFingerprint(fingerprint: string): Promise<string> {
    try {
        // Use Web Crypto API for secure hashing
        const encoder = new TextEncoder();
        const data = encoder.encode(fingerprint);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
        console.error('Failed to hash fingerprint:', error);

        // Fallback to simple hash
        return simpleHash(fingerprint);
    }
}

/**
 * Get cached fingerprint from sessionStorage with fallback to memory cache
 */
function getCachedFingerprint(): string | null {
    try {
        if (typeof window !== 'undefined') {
            // Try sessionStorage first
            if (window.sessionStorage) {
                const cached = sessionStorage.getItem('device_fingerprint');
                if (cached) return cached;
            }

            // Fallback to memory cache (for cases where sessionStorage is disabled)
            const memoryCache = (window as any).__fingerprintCache;
            if (memoryCache && memoryCache.fingerprint && memoryCache.timestamp) {
                // Check if cache is still valid (1 hour)
                if (Date.now() - memoryCache.timestamp < 60 * 60 * 1000) {
                    return memoryCache.fingerprint;
                }
            }
        }
    } catch (error) {
        console.warn('Failed to get cached fingerprint:', error);
    }
    return null;
}

/**
 * Cache fingerprint in sessionStorage with memory fallback
 */
function cacheFingerprint(fingerprint: string): void {
    try {
        if (typeof window !== 'undefined') {
            // Try sessionStorage first
            if (window.sessionStorage) {
                sessionStorage.setItem('device_fingerprint', fingerprint);
            }

            // Always set memory cache as fallback
            (window as any).__fingerprintCache = {
                fingerprint,
                timestamp: Date.now(),
            };
        }
    } catch (error) {
        console.warn('Failed to cache fingerprint:', error);
    }
}

/**
 * Generate fallback fingerprint when main method fails
 */
function generateFallbackFingerprint(): string {
    try {
        const fallbackComponents = [
            navigator.userAgent || 'unknown',
            screen.width?.toString() || '0',
            screen.height?.toString() || '0',
            new Date().getTimezoneOffset().toString(),
            navigator.language || 'unknown',
        ];

        const fallbackString = fallbackComponents.join('|');
        return simpleHash(fallbackString);
    } catch (error) {
        // Ultimate fallback - random string with timestamp
        return simpleHash(`fallback_${Date.now()}_${Math.random()}`);
    }
}

/**
 * Simple hash function as fallback
 */
function simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Clear cached fingerprint (useful for testing)
 */
export function clearCachedFingerprint(): void {
    try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
            sessionStorage.removeItem('device_fingerprint');
        }
    } catch (error) {
        console.warn('Failed to clear cached fingerprint:', error);
    }
}

/**
 * Validate fingerprint format
 */
export function isValidFingerprint(fingerprint: string): boolean {
    // Check if it's a valid hex string of appropriate length
    return /^[a-f0-9]{8,64}$/i.test(fingerprint);
}