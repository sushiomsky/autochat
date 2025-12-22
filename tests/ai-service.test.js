const aiService = require('../src/ai-service.js');

describe('AIService', () => {
    let storage = {};

    beforeEach(() => {
        storage = {};

        if (!global.chrome) global.chrome = {};
        if (!global.chrome.storage) global.chrome.storage = {};
        if (!global.chrome.storage.local) global.chrome.storage.local = {};

        global.chrome.storage.local.get = jest.fn((keys, callback) => {
            const result = { aiSettings: { provider: 'simulation' } };
            if (callback) callback(result);
            return Promise.resolve(result);
        });

        // Reset
        aiService.apiKey = null;
        aiService.provider = 'simulation';
    });

    test('should initialize with simulation provider by default', async () => {
        await aiService.init();
        expect(aiService.provider).toBe('simulation');
    });

    test('should generate phrases in simulation mode', async () => {
        const phrases = await aiService.generatePhrases('test prompt', 3);
        expect(Array.isArray(phrases)).toBe(true);
        expect(phrases.length).toBe(3);
        expect(typeof phrases[0]).toBe('string');
    });

    test('should analyze sentiment', async () => {
        const positive = await aiService.analyzeSentiment("I won huge!");
        expect(positive.sentiment).toBe('positive');
        expect(positive.score).toBeGreaterThan(0);

        const negative = await aiService.analyzeSentiment("I lost everything sad");
        expect(negative.sentiment).toBe('negative');
        expect(negative.score).toBeLessThan(0);
    });

    test('should generate contextual replies', async () => {
        const reply = await aiService.generateReply("Great win!", "positive");
        expect(reply).toBeDefined();
        expect(typeof reply).toBe('string');
    });
});
