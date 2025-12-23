const googleDriveService = require('../src/google-drive-service.js');

describe('GoogleDriveService', () => {
    beforeEach(() => {
        // Mock chrome.identity
        global.chrome = {
            identity: {
                getAuthToken: jest.fn((options, callback) => callback('mock-token')),
                removeCachedAuthToken: jest.fn((options, callback) => callback())
            },
            runtime: {
                lastError: null
            }
        };

        // Mock fetch
        global.fetch = jest.fn();
        global.FormData = class {
            append = jest.fn();
        };
        global.Blob = class { };
    });

    test('getAccessToken should return a token', async () => {
        const token = await googleDriveService.getAccessToken();
        expect(token).toBe('mock-token');
        expect(chrome.identity.getAuthToken).toHaveBeenCalledWith({ interactive: false }, expect.any(Function));
    });

    test('findFile should return file if exists', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ files: [{ id: '123', name: 'test.json' }] })
        });

        const file = await googleDriveService.findFile('test.json');
        expect(file.id).toBe('123');
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining(encodeURIComponent("name = 'test.json'")),
            expect.any(Object)
        );
    });

    test('saveFile should use POST for new files', async () => {
        // First call to findFile returns null
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ files: [] })
        });
        // Second call to save (POST)
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 'new-id' })
        });

        const res = await googleDriveService.saveFile('new.json', { data: 1 });
        expect(res.id).toBe('new-id');
        expect(global.fetch).toHaveBeenLastCalledWith(
            expect.stringContaining('uploadType=multipart'),
            expect.objectContaining({ method: 'POST' })
        );
    });

    test('saveFile should use PATCH for existing files', async () => {
        // First call to findFile returns existing
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ files: [{ id: 'existing-id' }] })
        });
        // Second call for PATCH
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 'existing-id' })
        });

        await googleDriveService.saveFile('existing.json', { data: 1 });
        expect(global.fetch).toHaveBeenLastCalledWith(
            expect.stringContaining('existing-id'),
            expect.objectContaining({ method: 'PATCH' })
        );
    });
});
