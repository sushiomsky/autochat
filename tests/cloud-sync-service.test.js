const cloudSyncService = require('../src/cloud-sync-service.js');

describe('CloudSyncService', () => {
    beforeEach(() => {
        global.chrome = {
            storage: {
                local: {
                    get: jest.fn(),
                    set: jest.fn()
                }
            },
            alarms: {
                create: jest.fn(),
                clear: jest.fn()
            },
            runtime: {
                lastError: null
            }
        };

        // Reset state
        cloudSyncService.isEnabled = false;
        cloudSyncService.status = 'idle';
        cloudSyncService.lastSyncTime = null;
    });

    test('should merge local and cloud profiles (LWW)', () => {
        const local = [
            { id: '1', name: 'Profile 1', lastActive: 100 },
            { id: '2', name: 'Profile 2', lastActive: 500 }
        ];
        const cloud = [
            { id: '1', name: 'Profile 1 Updated', lastActive: 200 }, // newer
            { id: '3', name: 'Profile 3', lastActive: 100 }
        ];

        const { merged, changed } = cloudSyncService._merge(local, cloud);

        expect(changed).toBe(true);
        expect(merged.length).toBe(3);

        const p1 = merged.find(p => p.id === '1');
        expect(p1.name).toBe('Profile 1 Updated');

        const p2 = merged.find(p => p.id === '2');
        expect(p2.name).toBe('Profile 2');

        const p3 = merged.find(p => p.id === '3');
        expect(p3.name).toBe('Profile 3');
    });

    test('should not report change if cloud matches local', () => {
        const local = [{ id: '1', name: 'P1', lastActive: 100 }];
        const cloud = [{ id: '1', name: 'P1', lastActive: 100 }];

        const { merged, changed } = cloudSyncService._merge(local, cloud);
        expect(changed).toBe(false);
        expect(merged.length).toBe(1);
    });

    test('should enable and trigger sync', async () => {
        global.chrome.storage.local.get.mockImplementation((keys, cb) => cb({ profiles_v5: [] }));
        global.chrome.storage.local.set.mockImplementation((data, cb) => cb && cb());

        const syncSpy = jest.spyOn(cloudSyncService, 'performSync').mockResolvedValue(true);

        await cloudSyncService.setEnabled(true);

        expect(cloudSyncService.isEnabled).toBe(true);
        expect(global.chrome.alarms.create).toHaveBeenCalledWith('cloudSyncAlarm', expect.any(Object));
        expect(syncSpy).toHaveBeenCalled();

        syncSpy.mockRestore();
    });
});
