const profileService = require('../src/profile-service.js');

describe('ProfileService', () => {
    let storage = {};

    beforeEach(() => {
        storage = {};

        // Ensure structure exists
        if (!global.chrome) global.chrome = {};
        if (!global.chrome.storage) global.chrome.storage = {};
        if (!global.chrome.storage.local) global.chrome.storage.local = {};

        // Mock specific storage methods
        global.chrome.storage.local.get = jest.fn((keys, callback) => {
            const result = {};
            if (Array.isArray(keys)) {
                keys.forEach(k => result[k] = storage[k]);
            }
            if (callback) callback(result);
            return Promise.resolve(result);
        });

        global.chrome.storage.local.set = jest.fn((data, callback) => {
            Object.assign(storage, data);
            if (callback) callback();
            return Promise.resolve();
        });

        // Reset service instance cache
        profileService.profiles = null;
    });

    test('should initialize with default profile', async () => {
        await profileService.init();
        const profiles = await profileService.getAll();
        expect(profiles['default']).toBeDefined();
        expect(profiles['default'].name).toBe('Default Account');
    });

    test('should create new profile', async () => {
        const profile = await profileService.create('Test Casino', ['test.com']);
        expect(profile.name).toBe('Test Casino');
        expect(profile.domains).toContain('test.com');

        const all = await profileService.getAll();
        expect(all[profile.id]).toBeDefined();
    });

    test('should detect profile by URL', async () => {
        await profileService.create('Casino A', ['casino-a.com']);
        await profileService.create('Casino B', ['casino-b.com']);

        // Mock loading from storage
        await profileService.getAll();

        const matchA = await profileService.getProfileByUrl('https://www.casino-a.com/game');
        expect(matchA).toBeDefined();
        expect(matchA.name).toBe('Casino A');

        const matchB = await profileService.getProfileByUrl('https://casino-b.com');
        expect(matchB).toBeDefined();
        expect(matchB.name).toBe('Casino B');

        const noMatch = await profileService.getProfileByUrl('https://google.com');
        expect(noMatch).toBeNull();
    });

    test('should delete profile and switch to default if active', async () => {
        const p1 = await profileService.create('To Delete');
        await profileService.setActive(p1.id);

        expect(await profileService.getActiveId()).toBe(p1.id);

        await profileService.delete(p1.id);

        expect(storage['profiles_v5'][p1.id]).toBeUndefined();
        expect(await profileService.getActiveId()).toBe('default');
    });

    test('should not delete default profile', async () => {
        await expect(profileService.delete('default')).rejects.toThrow();
    });

    test('should export profile correctly', async () => {
        const p = await profileService.create('Export Me', ['export.com']);
        p.settings = { someSetting: true };
        await profileService._saveToStorage(); // ensure synced

        const exported = await profileService.exportProfile(p.id);
        expect(exported.name).toBe('Export Me');
        expect(exported.domains).toContain('export.com');
        expect(exported.settings.someSetting).toBe(true);
        expect(exported.version).toBe('5.0');
    });

    test('should import profile correctly', async () => {
        const json = JSON.stringify({
            name: 'Imported Profile',
            domains: ['imported.com'],
            settings: { imported: true }
        });

        const imported = await profileService.importProfile(json);
        expect(imported.name).toBe('Imported Profile');
        expect(imported.domains).toContain('imported.com');
        expect(imported.settings.imported).toBe(true);

        const all = await profileService.getAll();
        expect(all[imported.id]).toBeDefined();
    });

    test('should handle duplicate names on import', async () => {
        await profileService.create('Duplicate', []);

        const json = JSON.stringify({
            name: 'Duplicate',
            settings: {}
        });

        const imported = await profileService.importProfile(json);
        expect(imported.name).toBe('Duplicate (Imported)');
    });

    test('should reject invalid import json', async () => {
        await expect(profileService.importProfile('{invalid-json')).rejects.toThrow();
        await expect(profileService.importProfile('{}')).rejects.toThrow(); // missing name/settings
    });
});
