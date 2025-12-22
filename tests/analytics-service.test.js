const analyticsService = require('../src/analytics-service.js');

describe('AnalyticsService', () => {
    let storage = {};

    beforeEach(() => {
        // Reset storage
        storage = {};

        // Override standard mock with our implementation
        chrome.storage.local.get.mockImplementation((keys, callback) => {
            const result = {};
            keys.forEach(k => result[k] = storage[k]);
            if (callback) callback(result);
            return Promise.resolve(result);
        });

        chrome.storage.local.set.mockImplementation((data, callback) => {
            Object.assign(storage, data);
            if (callback) callback();
            return Promise.resolve();
        });
    });

    test('should record event and update aggregates', async () => {
        // Mock Date.now to a fixed time
        const now = new Date('2025-01-01T12:00:00Z').getTime();
        jest.spyOn(Date, 'now').mockImplementation(() => now);

        await analyticsService.recordEvent('message_sent', { test: 1 });

        // Check logs
        expect(storage['analytics_logs']).toHaveLength(1);
        expect(storage['analytics_logs'][0].type).toBe('message_sent');

        // Check aggregates
        const hourlyKeys = Object.keys(storage['analytics_hourly']);
        expect(hourlyKeys).toHaveLength(1);
        expect(storage['analytics_hourly'][hourlyKeys[0]].sent).toBe(1);

        expect(storage['analytics_daily']['2025-01-01'].sent).toBe(1);

        // Check hourly distribution
        const dist = storage['analytics_daily']['2025-01-01'].hourlyDistribution;
        expect(dist.reduce((a, b) => a + b, 0)).toBe(1);
    });

    test('getStats returns correct structure', async () => {
        // Populate some data
        storage['analytics_daily'] = {
            '2025-01-01': { sent: 10, failed: 2, timestamp: Date.now() }
        };

        const stats = await analyticsService.getStats('7d');
        expect(stats.summary.totalSent).toBe(10);
        expect(stats.summary.totalFailed).toBe(2);
        expect(stats.summary.successRate).toBe(83); // 10/12 * 100
    });
});
