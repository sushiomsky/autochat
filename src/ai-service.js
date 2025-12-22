/**
 * AIService
 * Handles AI-powered features including message generation and sentiment analysis.
 * Supports swappable providers (initially LocalSimulation, scalable to OpenAI/Claude).
 */
class AIService {
    constructor() {
        this.provider = 'simulation'; // 'simulation', 'openai', 'claude'
        this.apiKey = null;

        // Simulation data
        this.mockPhrases = [
            "Winning streak incoming! 🚀",
            "Good luck everyone! 🍀",
            "Let's go big today! 💰",
            "Hoping for a multiplier! x500",
            "Great community here! 👋",
            "Anyone else farming? 🚜",
            "Nice win there! Congrats!",
            "Patiently waiting for the bonus... ⏳"
        ];
    }

    async init() {
        const settings = await chrome.storage.local.get(['aiSettings']);
        if (settings.aiSettings) {
            this.provider = settings.aiSettings.provider || 'simulation';
            this.apiKey = settings.aiSettings.apiKey || null;
        }
    }

    /**
     * Generate chat phrases based on context/prompt
     * @param {string} prompt - User instruction or context
     * @param {number} count - Number of phrases to generate
     * @returns {Promise<string[]>}
     */
    async _generateMockPhrases(count) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        let pool = this.mockPhrases;

        // Simple context simulation
        const lowerPrompt = this.lastPrompt?.toLowerCase() || '';
        if (lowerPrompt.includes('win') || lowerPrompt.includes('multiplier')) {
            pool = [
                "Congrats on the win! 🎉",
                "Massive multiplier! 🚀",
                "Luck is on your side! 🍀",
                "Big hit! 💰",
                "Wow, look at that payout!"
            ];
        } else if (lowerPrompt.includes('community') || lowerPrompt.includes('hi') || lowerPrompt.includes('hello')) {
            pool = [
                "Hello everyone! 👋",
                "Nice to be here!",
                "Great chat today.",
                "How is everyone's day going?",
                "Love this community! ❤️"
            ];
        }

        const results = [];
        for (let i = 0; i < count; i++) {
            const randomPhrase = pool[Math.floor(Math.random() * pool.length)];
            // Add some variation
            const variation = Math.random() > 0.5 ? randomPhrase : randomPhrase.replace('!', '!!');
            results.push(variation);
        }
        return results;
    }

    /**
     * Set last prompt for context
     */
    async generatePhrases(prompt, count = 5) {
        this.lastPrompt = prompt;
        if (this.provider === 'simulation') {
            return this._generateMockPhrases(count);
        } else {
            console.warn('[AIService] External provider not implemented yet, using simulation.');
            return this._generateMockPhrases(count);
        }
    }

    /**
     * Analyze text sentiment (Stub)
     */
    async analyzeSentiment(text) {
        // Simple keyword based stub
        const lower = text.toLowerCase();
        if (lower.includes('win') || lower.includes('won') || lower.includes('luck') || lower.includes('great')) return 'positive';
        if (lower.includes('lose') || lower.includes('sad') || lower.includes('bad')) return 'negative';
        return 'neutral';
    }
}

// Export singleton
const aiService = new AIService();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = aiService;
} else {
    const globalScope = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : this);
    globalScope.AIService = aiService;
}
