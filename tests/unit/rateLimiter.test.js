import { RateLimiter } from '../../src/utils';

describe('RateLimiter', () => {
  beforeEach(() => {
    jest.useFakeTimers('modern');
    jest.setSystemTime(new Date(2020, 0, 1).getTime());
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('enforces max attempts and window', () => {
    const rl = new RateLimiter(2, 1000);
    expect(rl.isAllowed('u')).toBe(true);
    expect(rl.isAllowed('u')).toBe(true);
    // third attempt within window should fail
    expect(rl.isAllowed('u')).toBe(false);
    expect(rl.getRemainingAttempts('u')).toBe(0);
    expect(rl.getTimeUntilReset('u')).toBeGreaterThan(0);

    // advance past window
    jest.advanceTimersByTime(1001);
    expect(rl.isAllowed('u')).toBe(true);
    expect(rl.getRemainingAttempts('u')).toBe(1);
  });

  test('reset clears attempts', () => {
    const rl = new RateLimiter(1, 1000);
    expect(rl.isAllowed('k')).toBe(true);
    expect(rl.isAllowed('k')).toBe(false);
    rl.reset('k');
    expect(rl.getRemainingAttempts('k')).toBe(1);
  });
});
