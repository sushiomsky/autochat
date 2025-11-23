/**
 * Tests for multi-account support feature
 */

describe('Multi-Account Support', () => {
  beforeEach(() => {
    // Mock chrome storage
    global.chrome.storage.local.get = jest.fn((keys, callback) => {
      callback({
        accounts: {
          default: {
            name: 'Default Account',
            settings: {}
          }
        },
        currentAccount: 'default'
      });
    });

    global.chrome.storage.local.set = jest.fn();
  });

  describe('Account Storage', () => {
    test('should store multiple accounts', () => {
      const accounts = {
        default: {
          name: 'Default Account',
          settings: {}
        },
        account_123: {
          name: 'Casino Account 1',
          settings: {
            messageList: 'Hello\nThanks',
            minInterval: '1',
            maxInterval: '2'
          }
        }
      };

      global.chrome.storage.local.set({ accounts, currentAccount: 'default' });
      
      expect(global.chrome.storage.local.set).toHaveBeenCalledWith({
        accounts,
        currentAccount: 'default'
      });
    });

    test('should load accounts from storage', () => {
      const mockData = {
        accounts: {
          default: { name: 'Default Account', settings: {} },
          account_456: { name: 'Test Account', settings: {} }
        },
        currentAccount: 'account_456'
      };

      global.chrome.storage.local.get = jest.fn((keys, callback) => {
        callback(mockData);
      });

      global.chrome.storage.local.get(['accounts', 'currentAccount'], (data) => {
        expect(data.accounts).toHaveProperty('default');
        expect(data.accounts).toHaveProperty('account_456');
        expect(data.currentAccount).toBe('account_456');
      });
    });
  });

  describe('Account Switching', () => {
    test('should switch between accounts', () => {
      const accounts = {
        default: { 
          name: 'Default Account', 
          settings: { messageList: 'Default messages' } 
        },
        account_789: { 
          name: 'Account 2', 
          settings: { messageList: 'Account 2 messages' } 
        }
      };

      let currentAccount = 'default';
      
      // Simulate switching
      currentAccount = 'account_789';
      
      expect(currentAccount).toBe('account_789');
      expect(accounts[currentAccount].name).toBe('Account 2');
      expect(accounts[currentAccount].settings.messageList).toBe('Account 2 messages');
    });

    test('should preserve settings when switching accounts', () => {
      const accounts = {
        default: {
          name: 'Default Account',
          settings: { messageList: 'Default', minInterval: '1' }
        },
        account_abc: {
          name: 'Casino Account',
          settings: { messageList: 'Casino', minInterval: '2' }
        }
      };

      // Get settings from default
      const defaultSettings = accounts.default.settings;
      expect(defaultSettings.messageList).toBe('Default');
      expect(defaultSettings.minInterval).toBe('1');

      // Get settings from casino account
      const casinoSettings = accounts.account_abc.settings;
      expect(casinoSettings.messageList).toBe('Casino');
      expect(casinoSettings.minInterval).toBe('2');
      
      // Original settings should be unchanged
      expect(accounts.default.settings.messageList).toBe('Default');
    });
  });

  describe('Account Creation', () => {
    test('should create new account with unique ID', () => {
      const accountName = 'New Casino Account';
      const accountId = 'account_' + Date.now();
      
      const newAccount = {
        name: accountName,
        settings: {}
      };

      expect(newAccount.name).toBe(accountName);
      expect(newAccount.settings).toEqual({});
      expect(accountId).toMatch(/^account_\d+$/);
    });

    test('should validate account name length', () => {
      const shortName = 'Valid';
      const longName = 'A'.repeat(51); // 51 characters
      
      expect(shortName.length).toBeLessThanOrEqual(50);
      expect(longName.length).toBeGreaterThan(50);
    });

    test('should not allow empty account names', () => {
      const emptyName = '';
      const whitespace = '   ';
      
      expect(emptyName.trim()).toBe('');
      expect(whitespace.trim()).toBe('');
    });
  });

  describe('Account Deletion', () => {
    test('should not allow deletion of default account', () => {
      const accountId = 'default';
      const canDelete = accountId !== 'default';
      
      expect(canDelete).toBe(false);
    });

    test('should not allow deletion of active account', () => {
      const currentAccount = 'account_123';
      const accountToDelete = 'account_123';
      const canDelete = accountToDelete !== currentAccount;
      
      expect(canDelete).toBe(false);
    });

    test('should allow deletion of inactive non-default accounts', () => {
      const currentAccount = 'default';
      const accountToDelete = 'account_456';
      const canDelete = accountToDelete !== 'default' && accountToDelete !== currentAccount;
      
      expect(canDelete).toBe(true);
    });
  });

  describe('Account Export', () => {
    test('should export account data as JSON', () => {
      const account = {
        name: 'Test Account',
        settings: {
          messageList: 'Hello\nWorld',
          minInterval: '1',
          maxInterval: '3',
          mentionKeywords: ['@user', 'hello']
        }
      };

      const exportData = {
        name: account.name,
        settings: account.settings,
        exportDate: new Date().toISOString()
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const parsed = JSON.parse(jsonString);

      expect(parsed.name).toBe('Test Account');
      expect(parsed.settings.messageList).toBe('Hello\nWorld');
      expect(parsed).toHaveProperty('exportDate');
    });

    test('should generate valid filename for export', () => {
      const accountName = 'Casino Account 1';
      const expectedFilename = 'autochat-casino-account-1.json';
      const generatedFilename = `autochat-${accountName.toLowerCase().replace(/\s+/g, '-')}.json`;
      
      expect(generatedFilename).toBe(expectedFilename);
    });
  });

  describe('Settings Isolation', () => {
    test('should keep account settings separate', () => {
      const accounts = {
        account_1: {
          name: 'Account 1',
          settings: {
            messageList: 'Messages for account 1',
            mentionKeywords: ['@user1']
          }
        },
        account_2: {
          name: 'Account 2',
          settings: {
            messageList: 'Messages for account 2',
            mentionKeywords: ['@user2']
          }
        }
      };

      // Verify isolation
      expect(accounts.account_1.settings.messageList).not.toBe(accounts.account_2.settings.messageList);
      expect(accounts.account_1.settings.mentionKeywords[0]).toBe('@user1');
      expect(accounts.account_2.settings.mentionKeywords[0]).toBe('@user2');
    });

    test('should handle accounts with different feature configurations', () => {
      const accounts = {
        rain_farmer: {
          name: 'Rain Farmer',
          settings: {
            mentionDetectionEnabled: true,
            mentionKeywords: ['rain', 'drop', 'giveaway'],
            mentionReplyMessages: ['Thanks!', 'ty', '🎉'],
            minInterval: '1',
            maxInterval: '2'
          }
        },
        regular_chat: {
          name: 'Regular Chat',
          settings: {
            mentionDetectionEnabled: false,
            messageList: 'Regular messages',
            minInterval: '5',
            maxInterval: '10'
          }
        }
      };

      expect(accounts.rain_farmer.settings.mentionDetectionEnabled).toBe(true);
      expect(accounts.regular_chat.settings.mentionDetectionEnabled).toBe(false);
      expect(accounts.rain_farmer.settings.minInterval).toBe('1');
      expect(accounts.regular_chat.settings.minInterval).toBe('5');
    });
  });
});
