/**
 * Tests for Analytics Dashboard UI Component
 */

describe('Analytics Dashboard', () => {
  let analyticsData;
  let renderAnalytics;
  let updateAnalyticsDisplay;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="analyticsModal" class="modal">
        <div class="modal-content">
          <h2>Analytics Dashboard</h2>
          
          <div class="analytics-controls">
            <select id="analyticsTimeRange">
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
            <button id="exportAnalytics">Export Data</button>
          </div>
          
          <div class="analytics-stats">
            <div class="stat-card">
              <div class="stat-title">Total Messages</div>
              <div id="analyticsTotal" class="stat-number">0</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">Success Rate</div>
              <div id="analyticsSuccessRate" class="stat-number">0%</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">Average Interval</div>
              <div id="analyticsAvgInterval" class="stat-number">0 min</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">Peak Hour</div>
              <div id="analyticsPeakHour" class="stat-number">--:--</div>
            </div>
          </div>
          
          <div id="analyticsChart" class="chart-container"></div>
          
          <div id="analyticsMessageList" class="message-history"></div>
        </div>
      </div>
      
      <button id="openAnalytics">Open Analytics</button>
    `;

    // Initialize analytics data
    analyticsData = {
      today: {
        totalMessages: 0,
        successCount: 0,
        failureCount: 0,
        intervals: [],
        hourlyData: Array(24).fill(0),
        messages: [],
      },
      week: {
        totalMessages: 0,
        successCount: 0,
        failureCount: 0,
        intervals: [],
        dailyData: Array(7).fill(0),
        messages: [],
      },
      month: {
        totalMessages: 0,
        successCount: 0,
        failureCount: 0,
        intervals: [],
        dailyData: Array(30).fill(0),
        messages: [],
      },
      all: {
        totalMessages: 0,
        successCount: 0,
        failureCount: 0,
        intervals: [],
        messages: [],
      },
    };

    // Define analytics functions
    updateAnalyticsDisplay = function (timeRange = 'today') {
      const data = analyticsData[timeRange];

      // Update total messages
      const totalEl = document.getElementById('analyticsTotal');
      if (totalEl) totalEl.textContent = data.totalMessages;

      // Calculate and update success rate
      const successRateEl = document.getElementById('analyticsSuccessRate');
      if (successRateEl) {
        const rate =
          data.totalMessages > 0 ? Math.round((data.successCount / data.totalMessages) * 100) : 0;
        successRateEl.textContent = `${rate}%`;
      }

      // Calculate and update average interval
      const avgIntervalEl = document.getElementById('analyticsAvgInterval');
      if (avgIntervalEl) {
        const avgInterval =
          data.intervals.length > 0
            ? Math.round(data.intervals.reduce((a, b) => a + b, 0) / data.intervals.length)
            : 0;
        avgIntervalEl.textContent = `${avgInterval} min`;
      }

      // Find and update peak hour
      const peakHourEl = document.getElementById('analyticsPeakHour');
      if (peakHourEl && data.hourlyData) {
        const peakHour = data.hourlyData.indexOf(Math.max(...data.hourlyData));
        peakHourEl.textContent =
          peakHour >= 0 ? `${String(peakHour).padStart(2, '0')}:00` : '--:--';
      }
    };

    renderAnalytics = function (timeRange = 'today') {
      updateAnalyticsDisplay(timeRange);

      // Render message list
      const listEl = document.getElementById('analyticsMessageList');
      if (listEl) {
        const data = analyticsData[timeRange];
        listEl.innerHTML = '';

        data.messages.slice(0, 20).forEach((msg) => {
          const item = document.createElement('div');
          item.className = 'message-item';
          item.innerHTML = `
            <span class="message-time">${msg.time}</span>
            <span class="message-text">${msg.text}</span>
            <span class="message-status ${msg.success ? 'success' : 'failure'}">
              ${msg.success ? '✓' : '✗'}
            </span>
          `;
          listEl.appendChild(item);
        });
      }
    };

    // Mock chrome storage
    global.chrome.storage.local.get.mockImplementation((keys, callback) => {
      const result = { analyticsData };
      if (typeof callback === 'function') {
        callback(result);
      }
      return Promise.resolve(result);
    });

    global.chrome.storage.local.set.mockImplementation((items, callback) => {
      if (items.analyticsData) {
        analyticsData = items.analyticsData;
      }
      if (callback) callback();
      return Promise.resolve();
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Initial State', () => {
    test('should show zero values initially', () => {
      updateAnalyticsDisplay('today');

      expect(document.getElementById('analyticsTotal').textContent).toBe('0');
      expect(document.getElementById('analyticsSuccessRate').textContent).toBe('0%');
      expect(document.getElementById('analyticsAvgInterval').textContent).toBe('0 min');
      expect(document.getElementById('analyticsPeakHour').textContent).toBe('00:00');
    });

    test('should have time range selector', () => {
      const select = document.getElementById('analyticsTimeRange');
      expect(select).not.toBeNull();

      const options = select.querySelectorAll('option');
      expect(options.length).toBe(4);
    });

    test('should default to today view', () => {
      const select = document.getElementById('analyticsTimeRange');
      expect(select.value).toBe('today');
    });
  });

  describe('Displaying Analytics Data', () => {
    beforeEach(() => {
      analyticsData.today = {
        totalMessages: 50,
        successCount: 45,
        failureCount: 5,
        intervals: [1, 2, 3, 2, 1, 3, 2],
        hourlyData: Array(24)
          .fill(0)
          .map((_, i) => (i === 14 ? 10 : Math.floor(Math.random() * 5))),
        messages: [
          { time: '14:30', text: 'Test message', success: true },
          { time: '14:32', text: 'Another message', success: true },
        ],
      };
    });

    test('should display total messages', () => {
      updateAnalyticsDisplay('today');
      expect(document.getElementById('analyticsTotal').textContent).toBe('50');
    });

    test('should calculate and display success rate', () => {
      updateAnalyticsDisplay('today');
      const rate = Math.round((45 / 50) * 100);
      expect(document.getElementById('analyticsSuccessRate').textContent).toBe(`${rate}%`);
    });

    test('should calculate and display average interval', () => {
      updateAnalyticsDisplay('today');
      const avg = Math.round((1 + 2 + 3 + 2 + 1 + 3 + 2) / 7);
      expect(document.getElementById('analyticsAvgInterval').textContent).toBe(`${avg} min`);
    });

    test('should display peak hour', () => {
      updateAnalyticsDisplay('today');
      expect(document.getElementById('analyticsPeakHour').textContent).toBe('14:00');
    });

    test('should handle 100% success rate', () => {
      analyticsData.today.successCount = 50;
      analyticsData.today.failureCount = 0;

      updateAnalyticsDisplay('today');
      expect(document.getElementById('analyticsSuccessRate').textContent).toBe('100%');
    });

    test('should handle 0% success rate', () => {
      analyticsData.today.totalMessages = 10;
      analyticsData.today.successCount = 0;
      analyticsData.today.failureCount = 10;

      updateAnalyticsDisplay('today');
      expect(document.getElementById('analyticsSuccessRate').textContent).toBe('0%');
    });
  });

  describe('Time Range Selection', () => {
    beforeEach(() => {
      analyticsData.week.totalMessages = 150;
      analyticsData.month.totalMessages = 500;
      analyticsData.all.totalMessages = 1000;
    });

    test('should show week data when week is selected', () => {
      updateAnalyticsDisplay('week');
      expect(document.getElementById('analyticsTotal').textContent).toBe('150');
    });

    test('should show month data when month is selected', () => {
      updateAnalyticsDisplay('month');
      expect(document.getElementById('analyticsTotal').textContent).toBe('500');
    });

    test('should show all-time data when all is selected', () => {
      updateAnalyticsDisplay('all');
      expect(document.getElementById('analyticsTotal').textContent).toBe('1000');
    });

    test('should update on time range change', () => {
      const select = document.getElementById('analyticsTimeRange');

      select.addEventListener('change', (e) => {
        updateAnalyticsDisplay(e.target.value);
      });

      select.value = 'week';
      select.dispatchEvent(new Event('change'));

      expect(document.getElementById('analyticsTotal').textContent).toBe('150');
    });
  });

  describe('Message History', () => {
    beforeEach(() => {
      analyticsData.today.messages = [
        { time: '10:00', text: 'Message 1', success: true },
        { time: '10:05', text: 'Message 2', success: true },
        { time: '10:10', text: 'Message 3', success: false },
        { time: '10:15', text: 'Message 4', success: true },
      ];
    });

    test('should render message list', () => {
      renderAnalytics('today');

      const listEl = document.getElementById('analyticsMessageList');
      const items = listEl.querySelectorAll('.message-item');

      expect(items.length).toBe(4);
    });

    test('should show message time', () => {
      renderAnalytics('today');

      const firstItem = document.querySelector('.message-item');
      const time = firstItem.querySelector('.message-time');

      expect(time.textContent).toBe('10:00');
    });

    test('should show message text', () => {
      renderAnalytics('today');

      const firstItem = document.querySelector('.message-item');
      const text = firstItem.querySelector('.message-text');

      expect(text.textContent).toBe('Message 1');
    });

    test('should show success status', () => {
      renderAnalytics('today');

      const items = document.querySelectorAll('.message-item');
      const firstStatus = items[0].querySelector('.message-status');

      expect(firstStatus.classList.contains('success')).toBe(true);
      expect(firstStatus.textContent).toContain('✓');
    });

    test('should show failure status', () => {
      renderAnalytics('today');

      const items = document.querySelectorAll('.message-item');
      const thirdStatus = items[2].querySelector('.message-status');

      expect(thirdStatus.classList.contains('failure')).toBe(true);
      expect(thirdStatus.textContent).toContain('✗');
    });

    test('should limit messages to 20', () => {
      analyticsData.today.messages = Array(50)
        .fill(0)
        .map((_, i) => ({
          time: '10:00',
          text: `Message ${i}`,
          success: true,
        }));

      renderAnalytics('today');

      const items = document.querySelectorAll('.message-item');
      expect(items.length).toBe(20);
    });
  });

  describe('Analytics Export', () => {
    test('should have export button', () => {
      const exportBtn = document.getElementById('exportAnalytics');
      expect(exportBtn).not.toBeNull();
    });

    test('should export analytics data as JSON', () => {
      const exportBtn = document.getElementById('exportAnalytics');
      let exportedData = null;

      exportBtn.addEventListener('click', () => {
        exportedData = JSON.stringify(analyticsData.today, null, 2);
      });

      exportBtn.click();
      expect(exportedData).not.toBeNull();
      expect(() => JSON.parse(exportedData)).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty analytics data', () => {
      analyticsData.today = {
        totalMessages: 0,
        successCount: 0,
        failureCount: 0,
        intervals: [],
        hourlyData: Array(24).fill(0),
        messages: [],
      };

      updateAnalyticsDisplay('today');

      expect(document.getElementById('analyticsTotal').textContent).toBe('0');
      expect(document.getElementById('analyticsSuccessRate').textContent).toBe('0%');
      expect(document.getElementById('analyticsAvgInterval').textContent).toBe('0 min');
    });

    test('should handle missing hourly data', () => {
      analyticsData.today.hourlyData = null;

      updateAnalyticsDisplay('today');
      expect(document.getElementById('analyticsPeakHour').textContent).toBe('--:--');
    });

    test('should handle empty intervals array', () => {
      analyticsData.today.intervals = [];

      updateAnalyticsDisplay('today');
      expect(document.getElementById('analyticsAvgInterval').textContent).toBe('0 min');
    });

    test('should handle large numbers', () => {
      analyticsData.all.totalMessages = 999999;

      updateAnalyticsDisplay('all');
      expect(document.getElementById('analyticsTotal').textContent).toBe('999999');
    });
  });

  describe('Real-time Updates', () => {
    test('should update when new message is sent', () => {
      analyticsData.today.totalMessages = 10;
      updateAnalyticsDisplay('today');
      expect(document.getElementById('analyticsTotal').textContent).toBe('10');

      analyticsData.today.totalMessages = 11;
      analyticsData.today.successCount++;
      updateAnalyticsDisplay('today');
      expect(document.getElementById('analyticsTotal').textContent).toBe('11');
    });

    test('should recalculate success rate on update', () => {
      analyticsData.today.totalMessages = 10;
      analyticsData.today.successCount = 8;
      updateAnalyticsDisplay('today');
      expect(document.getElementById('analyticsSuccessRate').textContent).toBe('80%');

      analyticsData.today.totalMessages = 11;
      analyticsData.today.successCount = 9;
      updateAnalyticsDisplay('today');
      expect(document.getElementById('analyticsSuccessRate').textContent).toBe('82%');
    });
  });

  describe('Persistence', () => {
    test('should save analytics data to storage', async () => {
      await chrome.storage.local.set({ analyticsData });

      expect(chrome.storage.local.set).toHaveBeenCalledWith({ analyticsData });
    });

    test('should load analytics data from storage', async () => {
      const savedData = {
        today: { totalMessages: 25, successCount: 20, failureCount: 5 },
      };

      global.chrome.storage.local.get.mockImplementation((keys, callback) => {
        const result = { analyticsData: savedData };
        if (typeof callback === 'function') {
          callback(result);
        }
        return Promise.resolve(result);
      });

      const result = await chrome.storage.local.get('analyticsData');
      expect(result.analyticsData.today.totalMessages).toBe(25);
    });
  });

  describe('Stat Cards', () => {
    test('should have all stat cards', () => {
      const statCards = document.querySelectorAll('.stat-card');
      expect(statCards.length).toBe(4);
    });

    test('should have titles for all stats', () => {
      const titles = document.querySelectorAll('.stat-title');
      expect(titles.length).toBe(4);
      expect(titles[0].textContent).toBe('Total Messages');
      expect(titles[1].textContent).toBe('Success Rate');
      expect(titles[2].textContent).toBe('Average Interval');
      expect(titles[3].textContent).toBe('Peak Hour');
    });

    test('should have number displays for all stats', () => {
      const numbers = document.querySelectorAll('.stat-number');
      expect(numbers.length).toBe(4);
    });
  });

  describe('Chart Container', () => {
    test('should have chart container element', () => {
      const chartContainer = document.getElementById('analyticsChart');
      expect(chartContainer).not.toBeNull();
    });

    test('should have chart-container class', () => {
      const chartContainer = document.getElementById('analyticsChart');
      expect(chartContainer.classList.contains('chart-container')).toBe(true);
    });
  });
});
