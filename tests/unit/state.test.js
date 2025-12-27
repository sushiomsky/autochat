const { StateManager } = require('../../src/state');

describe('StateManager', () => {
  let sm;

  beforeEach(async () => {
    sm = new StateManager();
    // ensure chrome.storage mock returns empty object
    global.chrome.storage.local.get.mockImplementation((keys) => Promise.resolve({}));
    await sm.init();
  });

  test('init sets defaults', () => {
    expect(sm.initialized).toBe(true);
    expect(sm.get('sendMode')).toBe('random');
  });

  test('set/get and save to storage', async () => {
    await sm.set('theme', 'dark');
    expect(sm.get('theme')).toBe('dark');
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ theme: 'dark' });
  });

  test('subscribe and notify', async () => {
    const cb = jest.fn();
    const unsub = sm.subscribe('theme', cb);
    await sm.set('theme', 'blue');
    expect(cb).toHaveBeenCalledWith('blue', 'light');
    unsub();
    await sm.set('theme', 'green');
    expect(cb).toHaveBeenCalledTimes(1);
  });

  test('wildcard listeners get key and values', async () => {
    const cb = jest.fn();
    sm.subscribe('*', cb);
    await sm.set('sendMode', 'sequential');
    expect(cb).toHaveBeenCalledWith('sendMode', 'sequential', 'random');
  });

  test('setMultiple saves multiple keys', async () => {
    await sm.setMultiple({ minInterval: 10, maxInterval: 20 });
    expect(chrome.storage.local.set).toHaveBeenCalledWith(expect.objectContaining({ minInterval: 10, maxInterval: 20 }));
  });

  test('resetStats clears counters', async () => {
    await sm.set('messagesSentToday', 5);
    await sm.resetStats();
    expect(sm.get('messagesSentToday')).toBe(0);
  });

  test('export and import', async () => {
    const exported = sm.export();
    const parsed = JSON.parse(exported);
    expect(parsed).toHaveProperty('version');
    expect(parsed).toHaveProperty('state');

    await sm.import({ state: { theme: 'imported-theme' } });
    expect(sm.get('theme')).toBe('imported-theme');
  });

  test('getSnapshot returns copy', () => {
    const snap = sm.getSnapshot();
    expect(snap).toHaveProperty('sendMode');
    snap.sendMode = 'mutated';
    expect(sm.get('sendMode')).toBe('random');
  });
});
