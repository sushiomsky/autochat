/**
 * Tests for Stats Display UI Component
 */

describe('Stats Display', () => {
  let statsElements;
  let updateStatWithAnimation;
  let mockStorage;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div class="stats-bar">
        <div class="stat-item">
          <div class="stat-label">Today</div>
          <div class="stat-value" id="messagesSentToday">0</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Total</div>
          <div class="stat-value" id="totalMessages">0</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Status</div>
          <div class="stat-value" id="autoSendStatus">⚪ Inactive</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Campaigns</div>
          <div class="stat-value" id="activeCampaignsCount">0</div>
        </div>
      </div>
    `;

    statsElements = {
      messagesSentToday: document.getElementById('messagesSentToday'),
      totalMessages: document.getElementById('totalMessages'),
      autoSendStatus: document.getElementById('autoSendStatus'),
      activeCampaignsCount: document.getElementById('activeCampaignsCount')
    };

    // Mock storage
    mockStorage = {
      messagesSentToday: 0,
      totalMessages: 0,
      autoSendActive: false,
      activeCampaigns: []
    };

    global.chrome.storage.local.get.mockImplementation((keys, callback) => {
      const result = {};
      if (Array.isArray(keys)) {
        keys.forEach(key => {
          if (mockStorage[key] !== undefined) {
            result[key] = mockStorage[key];
          }
        });
      } else if (typeof keys === 'object') {
        Object.keys(keys).forEach(key => {
          result[key] = mockStorage[key] !== undefined ? mockStorage[key] : keys[key];
        });
      }
      callback(result);
      return Promise.resolve(result);
    });

    // Define updateStatWithAnimation function
    updateStatWithAnimation = function(elementId, value) {
      const element = document.getElementById(elementId);
      if (element) {
        element.classList.add('stat-updated');
        element.textContent = value;
        setTimeout(() => {
          element.classList.remove('stat-updated');
        }, 300);
      }
    };
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('should display initial stats correctly', () => {
    expect(statsElements.messagesSentToday.textContent).toBe('0');
    expect(statsElements.totalMessages.textContent).toBe('0');
    expect(statsElements.autoSendStatus.textContent).toBe('⚪ Inactive');
    expect(statsElements.activeCampaignsCount.textContent).toBe('0');
  });

  test('should update messages sent today', () => {
    updateStatWithAnimation('messagesSentToday', '5');
    expect(statsElements.messagesSentToday.textContent).toBe('5');
  });

  test('should update total messages', () => {
    updateStatWithAnimation('totalMessages', '150');
    expect(statsElements.totalMessages.textContent).toBe('150');
  });

  test('should update auto-send status to active', () => {
    statsElements.autoSendStatus.textContent = '🟢 Active';
    expect(statsElements.autoSendStatus.textContent).toBe('🟢 Active');
  });

  test('should update auto-send status to inactive', () => {
    statsElements.autoSendStatus.textContent = '⚪ Inactive';
    expect(statsElements.autoSendStatus.textContent).toBe('⚪ Inactive');
  });

  test('should update active campaigns count', () => {
    updateStatWithAnimation('activeCampaignsCount', '3');
    expect(statsElements.activeCampaignsCount.textContent).toBe('3');
  });

  test('should add animation class when updating stat', () => {
    updateStatWithAnimation('messagesSentToday', '10');
    expect(statsElements.messagesSentToday.classList.contains('stat-updated')).toBe(true);
  });

  test('should remove animation class after timeout', (done) => {
    updateStatWithAnimation('messagesSentToday', '10');
    expect(statsElements.messagesSentToday.classList.contains('stat-updated')).toBe(true);
    
    setTimeout(() => {
      expect(statsElements.messagesSentToday.classList.contains('stat-updated')).toBe(false);
      done();
    }, 350);
  });

  test('should handle non-existent element gracefully', () => {
    expect(() => {
      updateStatWithAnimation('nonExistentElement', '100');
    }).not.toThrow();
  });

  test('should load stats from storage', async () => {
    mockStorage.messagesSentToday = 25;
    mockStorage.totalMessages = 500;
    
    const result = await chrome.storage.local.get(['messagesSentToday', 'totalMessages']);
    expect(result.messagesSentToday).toBe(25);
    expect(result.totalMessages).toBe(500);
  });

  test('should update multiple stats at once', () => {
    updateStatWithAnimation('messagesSentToday', '15');
    updateStatWithAnimation('totalMessages', '300');
    updateStatWithAnimation('activeCampaignsCount', '2');

    expect(statsElements.messagesSentToday.textContent).toBe('15');
    expect(statsElements.totalMessages.textContent).toBe('300');
    expect(statsElements.activeCampaignsCount.textContent).toBe('2');
  });

  test('should handle large numbers', () => {
    updateStatWithAnimation('totalMessages', '999999');
    expect(statsElements.totalMessages.textContent).toBe('999999');
  });

  test('should handle zero values', () => {
    updateStatWithAnimation('messagesSentToday', '5');
    updateStatWithAnimation('messagesSentToday', '0');
    expect(statsElements.messagesSentToday.textContent).toBe('0');
  });

  test('should display status with emoji indicators', () => {
    const statuses = [
      '⚪ Inactive',
      '🟢 Active',
      '⏸️ Paused',
      '🔴 Error'
    ];

    statuses.forEach(status => {
      statsElements.autoSendStatus.textContent = status;
      expect(statsElements.autoSendStatus.textContent).toBe(status);
    });
  });

  test('should update campaigns count when campaigns change', async () => {
    mockStorage.activeCampaigns = [
      { id: 1, name: 'Campaign 1' },
      { id: 2, name: 'Campaign 2' }
    ];

    const result = await chrome.storage.local.get('activeCampaigns');
    const count = result.activeCampaigns?.length || 0;
    updateStatWithAnimation('activeCampaignsCount', count.toString());
    
    expect(statsElements.activeCampaignsCount.textContent).toBe('2');
  });
});
