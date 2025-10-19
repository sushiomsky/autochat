/**
 * @jest-environment jsdom
 */

describe('Active Hours Validation', () => {
  let isWithinActiveHours;
  let activeHoursEnabled;
  let activeHoursStart;
  let activeHoursEnd;

  beforeEach(() => {
    activeHoursEnabled = false;
    activeHoursStart = 9;
    activeHoursEnd = 22;

    isWithinActiveHours = () => {
      if (!activeHoursEnabled) return true;

      const hour = new Date().getHours();
      if (activeHoursStart <= activeHoursEnd) {
        return hour >= activeHoursStart && hour < activeHoursEnd;
      } else {
        // Wraps around midnight
        return hour >= activeHoursStart || hour < activeHoursEnd;
      }
    };
  });

  test('should return true when active hours disabled', () => {
    activeHoursEnabled = false;
    expect(isWithinActiveHours()).toBe(true);
  });

  test('should validate normal active hours (9-22)', () => {
    activeHoursEnabled = true;
    activeHoursStart = 9;
    activeHoursEnd = 22;

    const currentHour = new Date().getHours();
    const expected = currentHour >= 9 && currentHour < 22;
    expect(isWithinActiveHours()).toBe(expected);
  });

  test('should handle midnight wraparound (22-6)', () => {
    activeHoursEnabled = true;
    activeHoursStart = 22;
    activeHoursEnd = 6;

    const currentHour = new Date().getHours();
    const expected = currentHour >= 22 || currentHour < 6;
    expect(isWithinActiveHours()).toBe(expected);
  });

  test('should handle 24-hour active period', () => {
    activeHoursEnabled = true;
    activeHoursStart = 0;
    activeHoursEnd = 24;

    expect(isWithinActiveHours()).toBe(true);
  });
});
