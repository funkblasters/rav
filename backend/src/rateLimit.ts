/**
 * In-memory rate limiting for authentication mutations
 * Only blocks after multiple FAILED attempts (not successful ones)
 */

interface AttemptRecord {
  failedCount: number;
  lastAttempt: number;
  blockedUntil?: number;
}

const attemptMap = new Map<string, AttemptRecord>();

const CONFIG = {
  MAX_FAILED_ATTEMPTS: 5,        // Block after 5 failed attempts
  WINDOW_MS: 15 * 60 * 1000,    // 15-minute window
  BLOCK_DURATION_MS: 15 * 60 * 1000, // Block for 15 minutes
  CLEANUP_INTERVAL_MS: 60 * 1000, // Clean up old entries every minute
};

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of attemptMap.entries()) {
    // Remove if no attempt in last hour
    if (now - record.lastAttempt > 60 * 60 * 1000) {
      attemptMap.delete(key);
    }
  }
}, CONFIG.CLEANUP_INTERVAL_MS);

export function recordFailedAttempt(email: string): void {
  const key = email.toLowerCase();
  const now = Date.now();

  const record = attemptMap.get(key) || {
    failedCount: 0,
    lastAttempt: now,
  };

  // Reset counter if outside window
  if (now - record.lastAttempt > CONFIG.WINDOW_MS) {
    record.failedCount = 0;
  }

  record.failedCount++;
  record.lastAttempt = now;

  // Block after max failed attempts
  if (record.failedCount >= CONFIG.MAX_FAILED_ATTEMPTS) {
    record.blockedUntil = now + CONFIG.BLOCK_DURATION_MS;
  }

  attemptMap.set(key, record);
}

export function recordSuccessfulAttempt(email: string): void {
  const key = email.toLowerCase();
  // Reset on successful login
  attemptMap.delete(key);
}

export function checkRateLimit(email: string): void {
  const key = email.toLowerCase();
  const record = attemptMap.get(key);

  if (!record) return;

  const now = Date.now();

  // Check if currently blocked
  if (record.blockedUntil && now < record.blockedUntil) {
    const remainingMs = record.blockedUntil - now;
    const remainingSeconds = Math.ceil(remainingMs / 1000);
    throw new Error(
      `Too many failed login attempts. Please try again in ${remainingSeconds} seconds.`
    );
  }

  // Reset if outside window
  if (now - record.lastAttempt > CONFIG.WINDOW_MS) {
    attemptMap.delete(key);
    return;
  }

  // Warn if approaching limit
  if (record.failedCount >= CONFIG.MAX_FAILED_ATTEMPTS - 1) {
    console.warn(`High login failure rate for ${email}: ${record.failedCount} attempts`);
  }
}
