/**
 * Tests for RateLimiter utility
 */

// Mock RateLimiter implementation for testing
class RateLimiter {
  constructor(maxAttempts = 5, windowMs = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.attempts = new Map();
  }

  isAllowed(key) {
    const now = Date.now();
    const userAttempts = this.attempts.get(key) || [];
    const recentAttempts = userAttempts.filter(
      timestamp => now - timestamp < this.windowMs
    );

    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }

    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    return true;
  }

  reset(key) {
    this.attempts.delete(key);
  }

  getRemainingAttempts(key) {
    const now = Date.now();
    const userAttempts = this.attempts.get(key) || [];
    const recentAttempts = userAttempts.filter(
      timestamp => now - timestamp < this.windowMs
    );
    return Math.max(0, this.maxAttempts - recentAttempts.length);
  }

  getTimeUntilReset(key) {
    const now = Date.now();
    const userAttempts = this.attempts.get(key) || [];
    if (userAttempts.length === 0) return 0;
    
    const oldestAttempt = Math.min(...userAttempts);
    return Math.max(0, this.windowMs - (now - oldestAttempt));
  }
}

describe('RateLimiter', () => {
  let limiter;

  beforeEach(() => {
    // Create a rate limiter: 3 attempts per 1000ms
    limiter = new RateLimiter(3, 1000);
  });

  test('should allow attempts within limit', () => {
    expect(limiter.isAllowed('user1')).toBe(true);
    expect(limiter.isAllowed('user1')).toBe(true);
    expect(limiter.isAllowed('user1')).toBe(true);
  });

  test('should block attempts exceeding limit', () => {
    limiter.isAllowed('user2');
    limiter.isAllowed('user2');
    limiter.isAllowed('user2');
    expect(limiter.isAllowed('user2')).toBe(false);
  });

  test('should track different keys separately', () => {
    limiter.isAllowed('user1');
    limiter.isAllowed('user1');
    limiter.isAllowed('user1');
    
    // user2 should still have attempts
    expect(limiter.isAllowed('user2')).toBe(true);
    expect(limiter.isAllowed('user2')).toBe(true);
  });

  test('should reset attempts for a key', () => {
    limiter.isAllowed('user3');
    limiter.isAllowed('user3');
    limiter.isAllowed('user3');
    
    expect(limiter.isAllowed('user3')).toBe(false);
    
    limiter.reset('user3');
    expect(limiter.isAllowed('user3')).toBe(true);
  });

  test('should return correct remaining attempts', () => {
    expect(limiter.getRemainingAttempts('user4')).toBe(3);
    
    limiter.isAllowed('user4');
    expect(limiter.getRemainingAttempts('user4')).toBe(2);
    
    limiter.isAllowed('user4');
    expect(limiter.getRemainingAttempts('user4')).toBe(1);
    
    limiter.isAllowed('user4');
    expect(limiter.getRemainingAttempts('user4')).toBe(0);
  });

  test('should allow attempts after window expires', async () => {
    // Use a very short window for testing
    const shortLimiter = new RateLimiter(2, 100);
    
    shortLimiter.isAllowed('user5');
    shortLimiter.isAllowed('user5');
    expect(shortLimiter.isAllowed('user5')).toBe(false);
    
    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 150));
    
    expect(shortLimiter.isAllowed('user5')).toBe(true);
  });

  test('should return time until reset', () => {
    limiter.isAllowed('user6');
    const timeUntilReset = limiter.getTimeUntilReset('user6');
    
    expect(timeUntilReset).toBeGreaterThan(0);
    expect(timeUntilReset).toBeLessThanOrEqual(1000);
  });

  test('should return 0 time until reset for new key', () => {
    expect(limiter.getTimeUntilReset('newuser')).toBe(0);
  });

  test('should handle concurrent requests correctly', () => {
    const results = [];
    for (let i = 0; i < 5; i++) {
      results.push(limiter.isAllowed('concurrent'));
    }
    
    // First 3 should succeed, next 2 should fail
    expect(results).toEqual([true, true, true, false, false]);
  });
});
