// Jest setup file for Chrome extension testing

// Create comprehensive chrome mock
global.chrome = {
  storage: {
    local: {
      get: jest.fn((keys, callback) => {
        callback({});
        return Promise.resolve({});
      }),
      set: jest.fn((items, callback) => {
        if (callback) callback();
        return Promise.resolve();
      }),
      remove: jest.fn((keys, callback) => {
        if (callback) callback();
        return Promise.resolve();
      }),
      clear: jest.fn((callback) => {
        if (callback) callback();
        return Promise.resolve();
      })
    },
    sync: {
      get: jest.fn((keys, callback) => {
        callback({});
        return Promise.resolve({});
      }),
      set: jest.fn((items, callback) => {
        if (callback) callback();
        return Promise.resolve();
      })
    }
  },
  runtime: {
    sendMessage: jest.fn((message, callback) => {
      if (callback) callback({});
      return Promise.resolve({});
    }),
    getURL: jest.fn((path) => `chrome-extension://test/${path}`),
    lastError: null,
    id: 'test-extension-id'
  },
  tabs: {
    query: jest.fn((queryInfo, callback) => {
      const tabs = [{ id: 1, active: true, currentWindow: true }];
      if (callback) callback(tabs);
      return Promise.resolve(tabs);
    }),
    sendMessage: jest.fn((tabId, message, callback) => {
      if (callback) callback({});
      return Promise.resolve({});
    }),
    create: jest.fn((createProperties, callback) => {
      const tab = { id: 2, ...createProperties };
      if (callback) callback(tab);
      return Promise.resolve(tab);
    })
  },
  scripting: {
    executeScript: jest.fn((injection, callback) => {
      const results = [{ result: null }];
      if (callback) callback(results);
      return Promise.resolve(results);
    })
  }
};

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  // Reset lastError
  global.chrome.runtime.lastError = null;
});
