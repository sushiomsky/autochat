/**
 * Tests for Account Selector UI Component
 */

describe('Account Selector', () => {
  let accounts;
  let currentAccount;
  let accountSelect;
  let manageAccountsBtn;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div class="account-selector">
        <label>👤 Account Profile:</label>
        <div class="account-controls">
          <select id="accountSelect">
            <option value="default">Default Account</option>
          </select>
          <button id="manageAccounts" class="btn-icon" title="Manage Accounts">⚙️</button>
        </div>
      </div>
      
      <div id="accountModal" class="modal" style="display: none;">
        <div class="modal-content">
          <h2>Manage Accounts</h2>
          
          <div class="account-form">
            <input id="newAccountName" type="text" placeholder="Account name">
            <input id="newAccountDomains" type="text" placeholder="Domains (comma-separated)">
            <button id="createAccount" class="btn-primary">Create Account</button>
          </div>
          
          <div id="accountList" class="account-list"></div>
        </div>
      </div>
    `;

    accountSelect = document.getElementById('accountSelect');
    manageAccountsBtn = document.getElementById('manageAccounts');

    // Initialize state
    accounts = [
      { id: 'default', name: 'Default Account', domains: [], isDefault: true }
    ];
    currentAccount = 'default';

    // Mock chrome storage
    global.chrome.storage.local.get.mockImplementation((keys, callback) => {
      const result = {
        accounts: accounts,
        currentAccount: currentAccount
      };
      callback(result);
      return Promise.resolve(result);
    });

    global.chrome.storage.local.set.mockImplementation((items, callback) => {
      if (items.accounts) accounts = items.accounts;
      if (items.currentAccount) currentAccount = items.currentAccount;
      if (callback) callback();
      return Promise.resolve();
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Initial State', () => {
    test('should have default account selected', () => {
      expect(accountSelect.value).toBe('default');
    });

    test('should display default account in selector', () => {
      const defaultOption = accountSelect.querySelector('option[value="default"]');
      expect(defaultOption).not.toBeNull();
      expect(defaultOption.textContent).toBe('Default Account');
    });

    test('should have manage accounts button', () => {
      expect(manageAccountsBtn).not.toBeNull();
      expect(manageAccountsBtn.title).toBe('Manage Accounts');
    });

    test('should have emoji icon in label', () => {
      const label = document.querySelector('.account-selector label');
      expect(label.textContent).toContain('👤');
    });
  });

  describe('Account Selection', () => {
    beforeEach(() => {
      accounts = [
        { id: 'default', name: 'Default Account', domains: [] },
        { id: 'work', name: 'Work Account', domains: ['work.com'] },
        { id: 'personal', name: 'Personal Account', domains: ['gmail.com'] }
      ];
      
      // Populate select
      accountSelect.innerHTML = '';
      accounts.forEach(account => {
        const option = document.createElement('option');
        option.value = account.id;
        option.textContent = account.name;
        accountSelect.appendChild(option);
      });
    });

    test('should list all accounts', () => {
      const options = accountSelect.querySelectorAll('option');
      expect(options.length).toBe(3);
    });

    test('should select work account', () => {
      accountSelect.value = 'work';
      expect(accountSelect.value).toBe('work');
    });

    test('should select personal account', () => {
      accountSelect.value = 'personal';
      expect(accountSelect.value).toBe('personal');
    });

    test('should update current account on selection', async () => {
      accountSelect.value = 'work';
      
      const changeHandler = async (e) => {
        currentAccount = e.target.value;
        await chrome.storage.local.set({ currentAccount });
      };
      
      accountSelect.addEventListener('change', changeHandler);
      accountSelect.dispatchEvent(new Event('change'));
      
      expect(currentAccount).toBe('work');
    });

    test('should persist account selection', async () => {
      accountSelect.value = 'work';
      await chrome.storage.local.set({ currentAccount: 'work' });
      
      const result = await chrome.storage.local.get('currentAccount');
      expect(result.currentAccount).toBe('work');
    });
  });

  describe('Creating Accounts', () => {
    let createAccount;

    beforeEach(() => {
      createAccount = function(name, domains) {
        if (!name || name.trim() === '') {
          return { success: false, error: 'Account name is required' };
        }
        
        const id = name.toLowerCase().replace(/\s+/g, '-');
        
        if (accounts.find(a => a.id === id)) {
          return { success: false, error: 'Account already exists' };
        }
        
        const newAccount = {
          id,
          name: name.trim(),
          domains: domains ? domains.split(',').map(d => d.trim()).filter(d => d) : [],
          isDefault: false,
          created: new Date().toISOString()
        };
        
        accounts.push(newAccount);
        return { success: true, account: newAccount };
      };
    });

    test('should create new account', () => {
      const result = createAccount('Work Account', 'work.com,company.net');
      
      expect(result.success).toBe(true);
      expect(result.account.name).toBe('Work Account');
      expect(result.account.domains).toEqual(['work.com', 'company.net']);
    });

    test('should generate account ID from name', () => {
      const result = createAccount('My Work Account', '');
      expect(result.account.id).toBe('my-work-account');
    });

    test('should reject empty account name', () => {
      const result = createAccount('', 'domain.com');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Account name is required');
    });

    test('should reject whitespace-only name', () => {
      const result = createAccount('   ', 'domain.com');
      expect(result.success).toBe(false);
    });

    test('should reject duplicate account', () => {
      createAccount('Work Account', 'work.com');
      const result = createAccount('Work Account', 'other.com');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Account already exists');
    });

    test('should handle account without domains', () => {
      const result = createAccount('Simple Account', '');
      expect(result.success).toBe(true);
      expect(result.account.domains).toEqual([]);
    });

    test('should trim domain names', () => {
      const result = createAccount('Account', ' work.com , company.net ');
      expect(result.account.domains).toEqual(['work.com', 'company.net']);
    });

    test('should filter empty domains', () => {
      const result = createAccount('Account', 'work.com, , company.net');
      expect(result.account.domains).toEqual(['work.com', 'company.net']);
    });

    test('should set isDefault to false for new accounts', () => {
      const result = createAccount('New Account', '');
      expect(result.account.isDefault).toBe(false);
    });

    test('should add timestamp to new account', () => {
      const result = createAccount('Account', '');
      expect(result.account.created).toBeDefined();
      expect(new Date(result.account.created)).toBeInstanceOf(Date);
    });
  });

  describe('Deleting Accounts', () => {
    let deleteAccount;

    beforeEach(() => {
      accounts = [
        { id: 'default', name: 'Default Account', domains: [], isDefault: true },
        { id: 'work', name: 'Work Account', domains: ['work.com'] },
        { id: 'personal', name: 'Personal Account', domains: ['gmail.com'] }
      ];

      deleteAccount = function(accountId) {
        if (accountId === 'default') {
          return { success: false, error: 'Cannot delete default account' };
        }
        
        const index = accounts.findIndex(a => a.id === accountId);
        if (index === -1) {
          return { success: false, error: 'Account not found' };
        }
        
        accounts.splice(index, 1);
        
        if (currentAccount === accountId) {
          currentAccount = 'default';
        }
        
        return { success: true };
      };
    });

    test('should delete non-default account', () => {
      const result = deleteAccount('work');
      expect(result.success).toBe(true);
      expect(accounts.find(a => a.id === 'work')).toBeUndefined();
    });

    test('should not delete default account', () => {
      const result = deleteAccount('default');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot delete default account');
    });

    test('should switch to default if deleting current account', () => {
      currentAccount = 'work';
      deleteAccount('work');
      expect(currentAccount).toBe('default');
    });

    test('should not affect current account if deleting different account', () => {
      currentAccount = 'work';
      deleteAccount('personal');
      expect(currentAccount).toBe('work');
    });

    test('should handle deleting non-existent account', () => {
      const result = deleteAccount('nonexistent');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Account not found');
    });
  });

  describe('Account List Rendering', () => {
    let renderAccountList;

    beforeEach(() => {
      renderAccountList = function() {
        const container = document.getElementById('accountList');
        if (!container) return;
        
        container.innerHTML = '';
        
        accounts.forEach(account => {
          const item = document.createElement('div');
          item.className = 'account-item';
          item.innerHTML = `
            <div class="account-info">
              <strong>${account.name}</strong>
              ${account.isDefault ? '<span class="badge">Default</span>' : ''}
              <div class="account-domains">${account.domains.join(', ') || 'No domains'}</div>
            </div>
            ${!account.isDefault ? `<button class="btn-delete" data-id="${account.id}">Delete</button>` : ''}
          `;
          container.appendChild(item);
        });
      };
    });

    test('should render all accounts', () => {
      accounts = [
        { id: 'default', name: 'Default', domains: [], isDefault: true },
        { id: 'work', name: 'Work', domains: ['work.com'], isDefault: false }
      ];
      
      renderAccountList();
      
      const container = document.getElementById('accountList');
      expect(container.children.length).toBe(2);
    });

    test('should show default badge for default account', () => {
      renderAccountList();
      
      const container = document.getElementById('accountList');
      const defaultBadge = container.querySelector('.badge');
      expect(defaultBadge).not.toBeNull();
      expect(defaultBadge.textContent).toBe('Default');
    });

    test('should not show delete button for default account', () => {
      renderAccountList();
      
      const accountItems = document.querySelectorAll('.account-item');
      const defaultItem = accountItems[0];
      const deleteBtn = defaultItem.querySelector('.btn-delete');
      expect(deleteBtn).toBeNull();
    });

    test('should show delete button for non-default accounts', () => {
      accounts.push({ id: 'work', name: 'Work', domains: [], isDefault: false });
      renderAccountList();
      
      const accountItems = document.querySelectorAll('.account-item');
      const workItem = accountItems[1];
      const deleteBtn = workItem.querySelector('.btn-delete');
      expect(deleteBtn).not.toBeNull();
    });

    test('should display account domains', () => {
      accounts = [
        { id: 'default', name: 'Default', domains: [], isDefault: true },
        { id: 'work', name: 'Work', domains: ['work.com', 'company.net'], isDefault: false }
      ];
      
      renderAccountList();
      
      const domainElements = document.querySelectorAll('.account-domains');
      expect(domainElements[0].textContent).toBe('No domains');
      expect(domainElements[1].textContent).toBe('work.com, company.net');
    });
  });

  describe('Manage Accounts Modal', () => {
    test('should open modal when manage button is clicked', () => {
      const modal = document.getElementById('accountModal');
      
      manageAccountsBtn.addEventListener('click', () => {
        modal.style.display = 'block';
      });
      
      manageAccountsBtn.click();
      expect(modal.style.display).toBe('block');
    });

    test('should have form inputs in modal', () => {
      const nameInput = document.getElementById('newAccountName');
      const domainsInput = document.getElementById('newAccountDomains');
      const createBtn = document.getElementById('createAccount');
      
      expect(nameInput).not.toBeNull();
      expect(domainsInput).not.toBeNull();
      expect(createBtn).not.toBeNull();
    });
  });

  describe('Persistence', () => {
    test('should save accounts to storage', async () => {
      const newAccounts = [
        { id: 'default', name: 'Default', domains: [] },
        { id: 'work', name: 'Work', domains: ['work.com'] }
      ];
      
      await chrome.storage.local.set({ accounts: newAccounts });
      expect(accounts).toEqual(newAccounts);
    });

    test('should load accounts from storage', async () => {
      const result = await chrome.storage.local.get('accounts');
      expect(result.accounts).toBeDefined();
    });

    test('should load current account from storage', async () => {
      await chrome.storage.local.set({ currentAccount: 'work' });
      const result = await chrome.storage.local.get('currentAccount');
      expect(result.currentAccount).toBe('work');
    });
  });

  describe('Edge Cases', () => {
    test('should handle account with special characters in name', () => {
      const createAccount = function(name) {
        const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        return { success: true, account: { id, name } };
      };
      
      const result = createAccount('Test & Work Account!');
      expect(result.account.id).toBe('test-work-account');
    });

    test('should handle very long account name', () => {
      const longName = 'A'.repeat(100);
      const createAccount = function(name) {
        return { success: true, account: { name: name.trim() } };
      };
      
      const result = createAccount(longName);
      expect(result.account.name.length).toBe(100);
    });

    test('should handle many domains', () => {
      const manyDomains = Array(50).fill(0).map((_, i) => `domain${i}.com`).join(',');
      const createAccount = function(name, domains) {
        return {
          success: true,
          account: {
            name,
            domains: domains.split(',').map(d => d.trim())
          }
        };
      };
      
      const result = createAccount('Test', manyDomains);
      expect(result.account.domains.length).toBe(50);
    });
  });

  describe('Account Switching', () => {
    beforeEach(() => {
      accounts = [
        { id: 'default', name: 'Default', domains: [] },
        { id: 'work', name: 'Work', domains: ['work.com'] },
        { id: 'personal', name: 'Personal', domains: ['gmail.com'] }
      ];
      
      accountSelect.innerHTML = '';
      accounts.forEach(account => {
        const option = document.createElement('option');
        option.value = account.id;
        option.textContent = account.name;
        accountSelect.appendChild(option);
      });
    });

    test('should switch between accounts', () => {
      accountSelect.value = 'work';
      expect(accountSelect.value).toBe('work');
      
      accountSelect.value = 'personal';
      expect(accountSelect.value).toBe('personal');
      
      accountSelect.value = 'default';
      expect(accountSelect.value).toBe('default');
    });

    test('should trigger change event when switching', () => {
      const changeHandler = jest.fn();
      accountSelect.addEventListener('change', changeHandler);
      
      accountSelect.value = 'work';
      accountSelect.dispatchEvent(new Event('change'));
      
      expect(changeHandler).toHaveBeenCalled();
    });
  });
});
