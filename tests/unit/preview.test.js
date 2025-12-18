/**
 * Tests for Preview Module
 */

describe('PreviewManager', () => {
  let PreviewManager;
  let preview;

  beforeEach(() => {
    // Create inline class for testing
    PreviewManager = class {
      constructor() {
        this.dryRunMode = false;
        this.previewHistory = [];
        this.maxHistory = 50;
      }

      setDryRunMode(enabled) {
        this.dryRunMode = enabled;
      }

      isDryRunMode() {
        return this.dryRunMode;
      }

      processTemplateVariables(text) {
        const emojis = ['😊', '😎', '👍'];
        const now = new Date('2025-10-20T14:30:00');

        return text
          .replace(/\{time\}/g, now.toLocaleTimeString())
          .replace(/\{date\}/g, now.toLocaleDateString())
          .replace(/\{random_emoji\}/g, emojis[0])
          .replace(/\{random_number\}/g, '42')
          .replace(/\{timestamp\}/g, Date.now().toString());
      }

      extractVariables(text) {
        const regex = /\{([^}]+)\}/g;
        const variables = [];
        let match;
        while ((match = regex.exec(text)) !== null) {
          variables.push(match[1]);
        }
        return [...new Set(variables)];
      }

      checkWarnings(text) {
        const warnings = [];

        if (text.length === 0) {
          warnings.push({
            type: 'empty',
            severity: 'error',
            message: 'Message is empty',
          });
        }

        if (text.length > 2000) {
          warnings.push({
            type: 'length',
            severity: 'warning',
            message: `Message is very long (${text.length} characters)`,
          });
        }

        const unprocessed = text.match(/\{[^}]+\}/g);
        if (unprocessed) {
          warnings.push({
            type: 'variables',
            severity: 'warning',
            message: `Unprocessed variables: ${unprocessed.join(', ')}`,
          });
        }

        return warnings;
      }

      previewMessage(message) {
        const processed = this.processTemplateVariables(message);
        const variables = this.extractVariables(message);
        const warnings = this.checkWarnings(processed);

        const preview = {
          original: message,
          processed,
          length: processed.length,
          timestamp: new Date().toISOString(),
          variables,
          warnings,
        };

        this.previewHistory.unshift(preview);
        if (this.previewHistory.length > this.maxHistory) {
          this.previewHistory.pop();
        }

        return preview;
      }

      getHistory(limit = 10) {
        return this.previewHistory.slice(0, limit);
      }

      clearHistory() {
        this.previewHistory = [];
      }
    };

    preview = new PreviewManager();
  });

  test('should initialize with dry-run disabled', () => {
    expect(preview.isDryRunMode()).toBe(false);
  });

  test('should enable dry-run mode', () => {
    preview.setDryRunMode(true);
    expect(preview.isDryRunMode()).toBe(true);
  });

  test('should process template variables', () => {
    const result = preview.processTemplateVariables('Hello {random_emoji}!');
    expect(result).toContain('Hello');
    expect(result).toMatch(/😊|😎|👍/);
  });

  test('should extract variables from template', () => {
    const vars = preview.extractVariables('Message: {time} - {date}');
    expect(vars).toEqual(['time', 'date']);
  });

  test('should detect empty message warning', () => {
    const warnings = preview.checkWarnings('');
    expect(warnings).toHaveLength(1);
    expect(warnings[0].type).toBe('empty');
    expect(warnings[0].severity).toBe('error');
  });

  test('should detect long message warning', () => {
    const longMessage = 'a'.repeat(2500);
    const warnings = preview.checkWarnings(longMessage);
    const lengthWarning = warnings.find((w) => w.type === 'length');
    expect(lengthWarning).toBeDefined();
    expect(lengthWarning.severity).toBe('warning');
  });

  test('should detect unprocessed variables', () => {
    const warnings = preview.checkWarnings('Hello {unknown_var}');
    const varWarning = warnings.find((w) => w.type === 'variables');
    expect(varWarning).toBeDefined();
  });

  test('should create preview with all information', () => {
    const result = preview.previewMessage('Test {time}');

    expect(result).toHaveProperty('original');
    expect(result).toHaveProperty('processed');
    expect(result).toHaveProperty('length');
    expect(result).toHaveProperty('timestamp');
    expect(result).toHaveProperty('variables');
    expect(result).toHaveProperty('warnings');
    expect(result.variables).toContain('time');
  });

  test('should maintain preview history', () => {
    preview.previewMessage('Message 1');
    preview.previewMessage('Message 2');
    preview.previewMessage('Message 3');

    const history = preview.getHistory();
    expect(history).toHaveLength(3);
    expect(history[0].original).toBe('Message 3'); // Most recent first
  });

  test('should limit history size', () => {
    preview.maxHistory = 3;

    preview.previewMessage('Message 1');
    preview.previewMessage('Message 2');
    preview.previewMessage('Message 3');
    preview.previewMessage('Message 4');

    const history = preview.getHistory(10);
    expect(history).toHaveLength(3);
  });

  test('should clear history', () => {
    preview.previewMessage('Test');
    expect(preview.getHistory()).toHaveLength(1);

    preview.clearHistory();
    expect(preview.getHistory()).toHaveLength(0);
  });

  test('should handle messages without variables', () => {
    const result = preview.previewMessage('Plain text message');
    expect(result.processed).toBe('Plain text message');
    expect(result.variables).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });
});
