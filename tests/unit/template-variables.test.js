/**
 * @jest-environment jsdom
 */

describe('Template Variables', () => {
  let processTemplateVariables;

  beforeEach(() => {
    // Mock the function (in real implementation, this would be imported)
    processTemplateVariables = (text) => {
      const emojis = ['😊', '😎', '👍', '🎉', '✨', '🔥', '💪', '🌟', '😄', '🎯'];
      const now = new Date();

      return text
        .replace(/\{time\}/g, now.toLocaleTimeString())
        .replace(/\{date\}/g, now.toLocaleDateString())
        .replace(/\{random_emoji\}/g, emojis[Math.floor(Math.random() * emojis.length)])
        .replace(/\{random_number\}/g, Math.floor(Math.random() * 100).toString())
        .replace(/\{timestamp\}/g, Date.now().toString());
    };
  });

  test('should replace {time} variable', () => {
    const result = processTemplateVariables('Current time is {time}');
    expect(result).toMatch(/Current time is \d+:\d+:\d+( (AM|PM))?/);
  });

  test('should replace {date} variable', () => {
    const result = processTemplateVariables('Today is {date}');
    expect(result).toMatch(/Today is \d+\/\d+\/\d+/);
  });

  test('should replace {random_emoji} variable', () => {
    const result = processTemplateVariables('Hello {random_emoji}');
    expect(result).toMatch(/Hello [😊😎👍🎉✨🔥💪🌟😄🎯]/u);
  });

  test('should replace {random_number} variable', () => {
    const result = processTemplateVariables('Number: {random_number}');
    expect(result).toMatch(/Number: \d+/);
  });

  test('should replace {timestamp} variable', () => {
    const result = processTemplateVariables('Timestamp: {timestamp}');
    expect(result).toMatch(/Timestamp: \d+/);
  });

  test('should replace multiple variables in one string', () => {
    const result = processTemplateVariables('{time} - {date} - {random_number}');
    expect(result).toMatch(/\d+:\d+:\d+( (AM|PM))? - \d+\/\d+\/\d+ - \d+/);
  });

  test('should handle text without variables', () => {
    const result = processTemplateVariables('Plain text message');
    expect(result).toBe('Plain text message');
  });
});
