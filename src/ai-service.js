/**
 * AIService
 * Handles AI-powered features including message generation and sentiment analysis.
 * Supports swappable providers (initially LocalSimulation, scalable to OpenAI/Claude).
 */
const AIServiceClass = class {
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
     * Set last prompt for context and generate phrases
     */
    async generatePhrases(prompt, count = 5) {
        this.lastPrompt = prompt;

        // Ensure settings are loaded
        if (!this.provider) await this.init();

        if (this.provider === 'openai' && this.apiKey) {
            try {
                return await this._callOpenAI(prompt, count);
            } catch (error) {
                console.error('[AIService] OpenAI call failed, falling back to simulation:', error);
                return this._generateMockPhrases(count);
            }
        } else {
            return this._generateMockPhrases(count);
        }
    }

    /**
     * Call OpenAI API
     */
    async _callOpenAI(prompt, count) {
        if (!this.apiKey) throw new Error('No API Key');

        const systemPrompt = `You are a casual user in an online chat room. 
Generate ${count} short, natural, and friendly chat messages based on the context: "${prompt}".
Return ONLY a JSON array of strings, like ["Message 1", "Message 2"]. Do not include markdown formatting.`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: 'Generate messages.' }
                ],
                temperature: 0.8,
                max_tokens: 150
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API Error: ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content.trim();

        try {
            // Attempt to parse JSON array
            return JSON.parse(content);
        } catch (e) {
            // Fallback if not pure JSON: split by lines
            return content.split('\n').filter(line => line.length > 0);
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
        const aggressiveKeywords = ['hate', 'stupid', 'idiot', 'dumb', 'trash', 'garbage', 'shut up', 'delete', 'worst app', 'faker'];
        const sarcasticKeywords = ['yeah right', 'oh sure', 'of course', 'totally', 'real smart', 'nice try', 'classic'];

        positiveKeywords.forEach(k => { if (lower.includes(k)) score++; });
        negativeKeywords.forEach(k => { if (lower.includes(k)) score--; });

        let sentiment = 'neutral';

        // Nuance detection
        const isAggressive = aggressiveKeywords.some(k => lower.includes(k)) || (text === text.toUpperCase() && text.length > 5);
        const isSarcastic = sarcasticKeywords.some(k => lower.includes(k)); // More sensitive detection

        if (isAggressive) sentiment = 'aggressive';
        else if (isSarcastic) sentiment = 'sarcastic';
        else if (score > 0) sentiment = 'positive';
        else if (score < 0) sentiment = 'negative';

        return { sentiment, score, isAggressive, isSarcastic };
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
            ],
            aggressive: [
                "Let's keep it civil, please! 🙏",
                "No need for that. Just here for the community. 😊",
                "Sending some positive vibes your way! ✨",
                "We're all here to have a good time. Good luck! 🍀"
            ],
            sarcastic: [
                "Haha, I see what you did there! 😉",
                "Nice one! Glad you're keeping it interesting. 😂",
                "Always good to have some humor in the chat! ✨",
                "Stay sharp! I like your style. 😎"
            ]
        };

        const pool = replies[sentiment] || replies.neutral;
        return pool[Math.floor(Math.random() * pool.length)];
    }
};

// Export singleton - wrapped in IIFE
(function () {
    const aiService = new AIServiceClass();

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = aiService;
    } else {
        const globalScope = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : this);
        globalScope.AIService = aiService;
    }
})();
