/**
 * SocketService
 * Handles real-time communication for team pulses.
 * Currently simulates WebSocket messages for "Pro" feature demonstration.
 */
const SocketServiceClass = class {
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

        this.currentLocks = new Map(); // profileId -> userId
    }

    async init() {
        console.log('[SocketService] Initializing...');
        return Promise.resolve();
    }

    /**
     * Send a lock request
     */
    lockProfile(profileId, userId = 'Me') {
        if (!this.isConnected) {
            console.warn('[SocketService] Cannot lock: Not connected');
            return;
        }

        const message = {
            type: 'lock_profile',
            timestamp: Date.now(),
            payload: { profileId, userId }
        };

        this.currentLocks.set(profileId, userId);
        console.log(`[SocketService] User ${userId} locked profile ${profileId}`);
        this._broadcast(message);
    }

    /**
     * Send an unlock request
     */
    unlockProfile(profileId) {
        if (!this.isConnected) {
            console.warn('[SocketService] Cannot unlock: Not connected');
            return;
        }

        const message = {
            type: 'unlock_profile',
            timestamp: Date.now(),
            payload: { profileId }
        };

        const userId = this.currentLocks.get(profileId);
        this.currentLocks.delete(profileId);
        console.log(`[SocketService] Profile ${profileId} unlocked (previously locked by ${userId})`);
        this._broadcast(message);
    }

    _broadcast(message) {
        console.log('[SocketService] Broadcasting:', message);
        this.handlers.forEach(h => h(message));
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
};

// Export singleton - wrapped in IIFE
(function () {
    const socketService = new SocketServiceClass();

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = socketService;
    } else {
        const globalScope = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : this);
        globalScope.SocketService = socketService;
    }
})();
