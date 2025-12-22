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
     * Analyze text sentiment (Scored)
     * @param {string} text 
     * @returns {Promise<{sentiment: string, score: number}>}
     */
    async analyzeSentiment(text) {
        const lower = text.toLowerCase();
        let score = 0;

        const positiveKeywords = ['win', 'won', 'luck', 'great', 'good', 'nice', 'awesome', 'amazing', 'love', 'happy', 'multiplier', 'x100', 'payout'];
        const negativeKeywords = ['lose', 'lost', 'bad', 'sad', 'scam', 'unlucky', 'rip', 'f', 'worst', 'horrible', 'banned'];

        positiveKeywords.forEach(k => { if (lower.includes(k)) score++; });
        negativeKeywords.forEach(k => { if (lower.includes(k)) score--; });

        let sentiment = 'neutral';
        if (score > 0) sentiment = 'positive';
        else if (score < 0) sentiment = 'negative';

        return { sentiment, score };
    }

    /**
     * Generate a contextual reply based on sentiment
     * @param {string} originalText 
     * @param {string} sentiment 
     * @returns {Promise<string>}
     */
    async generateReply(originalText, sentiment) {
        // Simulation delay
        await new Promise(resolve => setTimeout(resolve, 600));

        const replies = {
            positive: [
                "Absolutely! Feeling lucky! 🍀",
                "Thanks! Hope you're winning too! 💰",
                "Appreciate it! Let's go! 🚀",
                "It's been a great session so far! ✨",
                "Nice one, right? 😄"
            ],
            negative: [
                "Yeah, it's been tough today... 😔",
                "Sorry to hear/see that. Better luck next time! 🙏",
                "Ouch, that's rough. 📉",
                "Don't worry, a big one is coming! 🍀",
                "We've all been there. Stay positive! 💪"
            ],
            neutral: [
                "Hello! How's it going? 👋",
                "Interesting... 🤔",
                "I see you! 👀",
                "Good luck on your next round! 🎯",
                "Just hanging out in the chat! 😊"
            ]
        };

        const pool = replies[sentiment] || replies.neutral;
        return pool[Math.floor(Math.random() * pool.length)];
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
