import {
  debounce,
  sanitizeInput,
  validateSettings,
  deepClone,
  formatNumber,
  getTimestamp,
  calculateAverage,
  exportJSON,
  importJSON,
  RateLimiter
} from '../../src/utils';

describe('utils', () => {
  beforeEach(() => {
    jest.useRealTimers();
  });

  test('debounce delays calls', () => {
    jest.useFakeTimers();
    const fn = jest.fn();
    const d = debounce(fn, 100);
    d('a');
    expect(fn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledWith('a');
    jest.useRealTimers();
  });

  test('sanitizeInput escapes html', () => {
    const res = sanitizeInput('<img src=x onerror=alert(1)>');
    expect(res).toMatch(/&lt;img/);
    expect(res).not.toContain('<img');
  });

  test('validateSettings works', () => {
    expect(validateSettings({ a: 1 }, ['a'])).toBeTruthy();
    expect(validateSettings(null, ['a'])).toBeFalsy();
    expect(validateSettings({ b: 2 }, ['a'])).toBeFalsy();
  });

  test('deepClone creates independent copy', () => {
    const o = { a: { b: 1 } };
    const c = deepClone(o);
    c.a.b = 2;
    expect(o.a.b).toBe(1);
  });

  test('formatNumber and calculateAverage', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
    expect(calculateAverage(10, 2)).toBe(5);
    expect(calculateAverage(5, 0)).toBe(0);
  });

  test('getTimestamp returns string', () => {
    const t = getTimestamp();
    expect(typeof t).toBe('string');
  });

  test('exportJSON uses URL APIs', () => {
    const createSpy = jest.spyOn(URL, 'createObjectURL');
    const revokeSpy = jest.spyOn(URL, 'revokeObjectURL');

    const origCreate = document.createElement.bind(document);
    const clickSpy = jest.fn();
    jest.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'a') return { href: '', download: '', click: clickSpy };
      return origCreate(tag);
    });

    exportJSON({ test: true }, 'f.json');

    expect(createSpy).toHaveBeenCalled();
    expect(revokeSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();

    document.createElement.mockRestore();
    createSpy.mockRestore();
    revokeSpy.mockRestore();
  });

  test('importJSON resolves and rejects appropriately', async () => {
    // Mock FileReader to return valid JSON
    const originalFileReader = global.FileReader;
    class MockReader {
      constructor() {
        this.onload = null;
        this.onerror = null;
      }
      readAsText(file) {
        if (file && file.content) {
          this.onload({ target: { result: file.content } });
        } else {
          this.onerror && this.onerror();
        }
      }
    }
    global.FileReader = MockReader;

    const origCreate = document.createElement.bind(document);
    // create an input that triggers onchange immediately with a fake file
    jest.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'input') {
        return {
          type: 'file',
          accept: '.json',
          click() {
            // simulate user selecting file
            const evt = { target: { files: [{ content: '{"x":1}' }] } };
            if (this.onchange) this.onchange(evt);
          },
          onchange: null
        };
      }
      return origCreate(tag);
    });

    const res = await importJSON();
    expect(res).toEqual({ x: 1 });

    document.createElement.mockRestore();
    global.FileReader = originalFileReader;
  });
});
