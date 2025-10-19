// Jest setup file for Chrome extension testing
const chrome = require('jest-chrome');

global.chrome = chrome;

// Mock chrome.storage
chrome.storage.local.get.mockImplementation((keys, callback) => {
  callback({});
});

chrome.storage.local.set.mockImplementation((items, callback) => {
  if (callback) callback();
});

// Mock chrome.runtime
chrome.runtime.sendMessage.mockImplementation((message, callback) => {
  if (callback) callback({});
});

chrome.runtime.getURL.mockImplementation((path) => `chrome-extension://test/${path}`);

// Mock chrome.tabs
chrome.tabs.query.mockImplementation((queryInfo, callback) => {
  callback([{ id: 1, active: true, currentWindow: true }]);
});

chrome.tabs.sendMessage.mockImplementation((tabId, message, callback) => {
  if (callback) callback({});
});

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
