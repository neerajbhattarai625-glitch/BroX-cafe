/**
 * Generate a unique device fingerprint based on browser characteristics
 * This is used to lock table sessions to specific devices
 */
export function generateDeviceFingerprint(): string {
    if (typeof window === 'undefined') {
        return 'server-side';
    }

    const components = [
        navigator.userAgent,
        navigator.language,
        new Date().getTimezoneOffset().toString(),
        screen.width + 'x' + screen.height,
        screen.colorDepth.toString(),
        navigator.hardwareConcurrency?.toString() || '0',
        navigator.platform,
    ];

    // Create a simple hash
    const fingerprint = components.join('|');
    return simpleHash(fingerprint);
}

/**
 * Simple hash function for fingerprinting
 */
function simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
}

/**
 * Store device ID in localStorage for persistence
 */
export function getOrCreateDeviceId(): string {
    if (typeof window === 'undefined') {
        return 'server-side';
    }

    const stored = localStorage.getItem('device_id');
    if (stored) {
        return stored;
    }

    const deviceId = generateDeviceFingerprint();
    localStorage.setItem('device_id', deviceId);
    document.cookie = `device_id=${deviceId}; path=/; max-age=31536000; SameSite=Lax`;
    return deviceId;
}

export function ensureDeviceCookie() {
    if (typeof window === 'undefined') return;
    const id = getOrCreateDeviceId();
    if (!document.cookie.includes('device_id=')) {
        document.cookie = `device_id=${id}; path=/; max-age=31536000; SameSite=Lax`;
    }
}
