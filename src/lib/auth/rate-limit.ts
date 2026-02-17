interface RateLimitEntry {
  attempts: number;
  windowStart: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      const windowMs = 60 * 60 * 1000; // max 1 hour window for cleanup
      if (now - entry.windowStart > windowMs) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
  // Allow process to exit without waiting for this timer
  if (cleanupTimer && typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
    cleanupTimer.unref();
  }
}

export function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMinutes: number
): { allowed: boolean; remainingAttempts: number; resetAt: Date } {
  ensureCleanup();

  const now = Date.now();
  const windowMs = windowMinutes * 60 * 1000;
  const entry = store.get(key);

  // No entry or window expired: reset
  if (!entry || now - entry.windowStart > windowMs) {
    store.set(key, { attempts: 1, windowStart: now });
    return {
      allowed: true,
      remainingAttempts: maxAttempts - 1,
      resetAt: new Date(now + windowMs),
    };
  }

  // Within window
  entry.attempts += 1;

  const allowed = entry.attempts <= maxAttempts;
  const remainingAttempts = Math.max(0, maxAttempts - entry.attempts);
  const resetAt = new Date(entry.windowStart + windowMs);

  return { allowed, remainingAttempts, resetAt };
}
