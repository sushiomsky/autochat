/**
 * GoogleDriveService
 * Handles OAuth2 authentication and interactions with the Google Drive REST API.
 */
const GoogleDriveServiceClass = class {
    constructor() {
        this.BASE_URL = 'https://www.googleapis.com/drive/v3/files';
        this.UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';
    }

    /**
     * Get OAuth2 Access Token
     * @param {boolean} interactive - Whether to prompt the user if not logged in
     */
    async getAccessToken(interactive = false) {
        return new Promise((resolve, reject) => {
            chrome.identity.getAuthToken({ interactive }, (token) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(token);
                }
            });
        });
    }

    /**
     * Find a file by name in the appDataFolder
     * @param {string} fileName 
     */
    async findFile(fileName) {
        const token = await this.getAccessToken();
        const query = encodeURIComponent(`name = '${fileName}' and 'appDataFolder' in parents and trashed = false`);
        const response = await fetch(`${this.BASE_URL}?q=${query}&spaces=appDataFolder`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        return data.files && data.files.length > 0 ? data.files[0] : null;
    }

    /**
     * Upload or update a file in Drive appDataFolder
     * @param {string} fileName 
     * @param {Object} content 
     */
    async saveFile(fileName, content) {
        const token = await this.getAccessToken();
        const existingFile = await this.findFile(fileName);

        const metadata = {
            name: fileName,
            mimeType: 'application/json'
        };

        if (!existingFile) {
            metadata.parents = ['appDataFolder'];
        }

        const body = new FormData();
        body.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        body.append('file', new Blob([JSON.stringify(content)], { type: 'application/json' }));

        let url = this.UPLOAD_URL;
        let method = 'POST';

        if (existingFile) {
            url = `${this.UPLOAD_URL}/${existingFile.id}?uploadType=multipart`;
            method = 'PATCH';
        } else {
            url = `${this.UPLOAD_URL}?uploadType=multipart`;
        }

        const response = await fetch(url, {
            method: method,
            headers: { 'Authorization': `Bearer ${token}` },
            body: body
        });

        if (!response.ok) {
            throw new Error(`Failed to save file to Drive: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Fetch file content from Drive
     * @param {string} fileId 
     */
    async getFileContent(fileId) {
        const token = await this.getAccessToken();
        const response = await fetch(`${this.BASE_URL}/${fileId}?alt=media`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch file from Drive: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Remove the current token from cache (logout)
     */
    async removeCachedToken() {
        const token = await this.getAccessToken(false).catch(() => null);
        if (token) {
            await new Promise(resolve => chrome.identity.removeCachedAuthToken({ token }, resolve));
        }
    }
};

// Export singleton - wrapped in IIFE
(function () {
    const googleDriveService = new GoogleDriveServiceClass();

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = googleDriveService;
    } else {
        const globalScope = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : this);
        globalScope.GoogleDriveService = googleDriveService;
    }
})();
