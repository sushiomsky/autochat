/**
 * SocketService
 * Handles real-time communication for team pulses.
 * Currently simulates WebSocket messages for "Pro" feature demonstration.
 */
class SocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.handlers = new Set();
        this.simulationTimer = null;

        // Mock team members
        this.teamMembers = [
            { id: 'u1', name: 'Alex (Pro)', status: 'active' },
            { id: 'u2', name: 'Sarah (Elite)', status: 'away' },
            { id: 'u3', name: 'Mike (Team)', status: 'active' }
        ];
    }

    async init() {
        console.log('[SocketService] Initializing...');
        // In a real pro app, we would check for a 'team_token' or similar
        return Promise.resolve();
    }

    connect() {
        if (this.isConnected) return;

        console.log('[SocketService] Connecting to Team Pulse server (Simulated)...');
        this.isConnected = true;

        // Start simulation loop
        this._startSimulation();
    }

    disconnect() {
        this.isConnected = false;
        if (this.simulationTimer) {
            clearInterval(this.simulationTimer);
            this.simulationTimer = null;
        }
    }

    onMessage(handler) {
        this.handlers.add(handler);
        return () => this.handlers.delete(handler);
    }

    /**
     * Simulation: Every 10-30 seconds, push a "Team Pulse"
     */
    _startSimulation() {
        const pulse = () => {
            if (!this.isConnected) return;

            const member = this.teamMembers[Math.floor(Math.random() * this.teamMembers.length)];
            const actions = [
                'just sent 5 messages',
                'pushed a new profile "CryptoFarming"',
                'hit 50% of daily goal',
                'is now active'
            ];
            const action = actions[Math.floor(Math.random() * actions.length)];

            const message = {
                type: 'team_pulse',
                timestamp: Date.now(),
                payload: {
                    user: member.name,
                    text: action
                }
            };

            console.log('[SocketService] Simulated Pulse:', message);
            this.handlers.forEach(h => h(message));

            // Schedule next pulse
            this.simulationTimer = setTimeout(pulse, 5000 + Math.random() * 15000);
        };

        pulse();
    }

    getStatus() {
        return {
            isConnected: this.isConnected,
            memberCount: this.teamMembers.length
        };
    }
}

// Export singleton
const socketService = new SocketService();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = socketService;
} else {
    const globalScope = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : this);
    globalScope.SocketService = socketService;
}
