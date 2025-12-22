const socketService = require('../src/socket-service.js');

describe('SocketService', () => {
    beforeEach(() => {
        socketService.disconnect();
        socketService.handlers.clear();
    });

    test('should connect and start simulation', (done) => {
        expect(socketService.isConnected).toBe(false);

        socketService.onMessage((msg) => {
            expect(msg.type).toBe('team_pulse');
            expect(msg.payload.user).toBeDefined();
            expect(socketService.isConnected).toBe(true);
            socketService.disconnect();
            done();
        });

        socketService.connect();
    });

    test('should allow multiple handlers', () => {
        const h1 = jest.fn();
        const h2 = jest.fn();

        socketService.onMessage(h1);
        socketService.onMessage(h2);

        // Manually trigger a message for testing since we don't want to wait for simulation
        const testMsg = { type: 'test' };
        socketService.handlers.forEach(h => h(testMsg));

        expect(h1).toHaveBeenCalledWith(testMsg);
        expect(h2).toHaveBeenCalledWith(testMsg);
    });

    test('should disconnect and stop simulation', () => {
        socketService.connect();
        expect(socketService.isConnected).toBe(true);
        expect(socketService.simulationTimer).toBeDefined();

        socketService.disconnect();
        expect(socketService.isConnected).toBe(false);
        expect(socketService.simulationTimer).toBeNull();
    });
});
