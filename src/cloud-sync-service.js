/**
 * CloudSyncService
 * Handles background synchronization of profiles and settings between local storage and a simulated cloud.
 */
const CloudSyncServiceClass = class {
    constructor() {
        this.status = 'idle'; // 'idle', 'syncing', 'error'
        this.lastSyncTime = null;
        this.syncInterval = 5 * 60 * 1000; // 5 minutes default
        this.isEnabled = false;

        // Mock cloud data for simulation fallback
        this.mockCloud = {
            profiles: [],
            updatedAt: Date.now()
        };

        this.googleDriveEnabled = false;
        this.CLIENT_FILE_NAME = 'autochat_sync.json';
        this.pendingConflict = null; // { local, cloud }
    }

    async init() {
        const settings = await chrome.storage.local.get(['cloudSyncSettings', 'cloudSyncEnabled', 'googleDriveEnabled']);
        this.isEnabled = !!settings.cloudSyncEnabled;
        this.googleDriveEnabled = !!settings.googleDriveEnabled;
        this.lastSyncTime = settings.cloudSyncSettings?.lastSyncTime || null;

        if (this.isEnabled) {
            this.startSyncTimer();
        }

        // Listen for messages from Popup
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'triggerCloudSync') {
                this.performSync().then(result => sendResponse(result));
                return true; // async response
            }
            if (request.action === 'setCloudSyncEnabled') {
                this.setEnabled(request.enabled).then(() => sendResponse({ success: true }));
                return true;
            }
            if (request.action === 'resolveCloudSyncConflict') {
                this.resolveConflict(request.choice).then(res => sendResponse({ success: !!res }));
                return true;
            }
        });
    }

    /**
     * Connect to Google Drive (Interactive)
     */
    async connectGoogleDrive() {
        try {
            if (typeof GoogleDriveService === 'undefined') {
                throw new Error('GoogleDriveService not loaded');
            }

            // Interactive login
            await GoogleDriveService.getAccessToken(true);
            this.googleDriveEnabled = true;
            await chrome.storage.local.set({ googleDriveEnabled: true });

            // Trigger immediate sync
            await this.performSync();
            return { success: true };
        } catch (error) {
            console.error('[CloudSync] Google Drive connection failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Unlink Google Drive
     */
    async disconnectGoogleDrive() {
        if (typeof GoogleDriveService !== 'undefined') {
            await GoogleDriveService.removeCachedToken();
        }
        this.googleDriveEnabled = false;
        await chrome.storage.local.set({ googleDriveEnabled: false });
        return { success: true };
    }

    /**
     * Set sync state
     * @param {boolean} enabled 
     */
    async setEnabled(enabled) {
        this.isEnabled = enabled;
        await chrome.storage.local.set({ cloudSyncEnabled: enabled });

        if (enabled) {
            this.startSyncTimer();
            await this.performSync();
        } else {
            this.stopSyncTimer();
        }
    }

    startSyncTimer() {
        this.stopSyncTimer();
        chrome.alarms.create('cloudSyncAlarm', { periodInMinutes: 5 });
    }

    stopSyncTimer() {
        chrome.alarms.clear('cloudSyncAlarm');
    }

    /**
     * Perform full sync cycle
     */
    async performSync() {
        if (!this.isEnabled || this.status === 'syncing') return;


        this.status = 'syncing';

        try {
            // 1. Pull changes from "Cloud"
            const cloudData = await this._fetchFromCloud();

            // 2. Get Local Data via ProfileService (Array format)
            if (typeof ProfileService === 'undefined') {
                throw new Error('ProfileService not available');
            }
            const localProfiles = await ProfileService.exportProfilesForSync();

            // 3. Resolve Conflicts & Merge
            const { merged, changed, conflict } = this._merge(localProfiles, cloudData.profiles);

            if (conflict) {
                console.warn('[CloudSync] Conflict detected!');
                this.pendingConflict = { local: localProfiles, cloud: cloudData.profiles };
                this.status = 'idle'; // Wait for resolution
                this._broadcastConflict();
                return { success: true, conflict: true };
            }

            if (changed) {

                // Update local via ProfileService
                await ProfileService.importProfilesFromSync(merged);
            }

            // 4. Push local changes back to cloud
            await this._pushToCloud(merged);

            this.lastSyncTime = Date.now();
            await chrome.storage.local.set({
                cloudSyncSettings: { lastSyncTime: this.lastSyncTime }
            });

            this.status = 'idle';

            return true;
        } catch (error) {
            console.error('[CloudSync] Sync failed:', error);
            this.status = 'error';
            return false;
        }
    }

    /**
     * Simulate fetching from a remote server
     */
    async _fetchFromCloud() {
        if (this.googleDriveEnabled && typeof GoogleDriveService !== 'undefined') {
            try {
                const file = await GoogleDriveService.findFile(this.CLIENT_FILE_NAME);
                if (file) {
                    return await GoogleDriveService.getFileContent(file.id);
                }
            } catch (error) {
                console.error('[CloudSync] Drive fetch failed, using mock:', error);
            }
        }

        // Simulation delay fallback
        await new Promise(resolve => setTimeout(resolve, 800));
        return this.mockCloud;
    }

    /**
     * Push to "Cloud" (Drive or Mock)
     */
    async _pushToCloud(profiles) {
        if (this.googleDriveEnabled && typeof GoogleDriveService !== 'undefined') {
            try {
                const content = {
                    profiles,
                    updatedAt: Date.now(),
                    clientVersion: '5.0.0'
                };
                await GoogleDriveService.saveFile(this.CLIENT_FILE_NAME, content);
                return;
            } catch (error) {
                console.error('[CloudSync] Drive push failed, using mock:', error);
            }
        }

        await new Promise(resolve => setTimeout(resolve, 500));
        this.mockCloud.profiles = JSON.parse(JSON.stringify(profiles));
        this.mockCloud.updatedAt = Date.now();
    }

    /**
     * Stricter Last-Write-Wins (LWW) merge logic
     */
    _merge(local, cloud) {
        let changed = false;
        let conflict = false;
        const merged = [];

        const localMap = new Map(local.map(p => [p.id, p]));
        const cloudMap = new Map(cloud.map(p => [p.id, p]));
        const allIds = new Set([...localMap.keys(), ...cloudMap.keys()]);

        // Detected significant divergence (e.g., both modified same profile differently)
        let divergenceCount = 0;

        for (const id of allIds) {
            const loc = localMap.get(id);
            const cld = cloudMap.get(id);

            if (!loc) {
                // New profile from cloud
                merged.push(cld);
                changed = true;
            } else if (!cld) {
                // Local profile not in cloud (keep local)
                merged.push(loc);
                changed = true; // Technically local is "pushed" to cloud later
            } else {
                const locTime = loc.lastActive || loc.created || 0;
                const cldTime = cld.lastActive || cld.created || 0;

                if (locTime === cldTime) {
                    // Exactly same, no change
                    merged.push(loc);
                } else if (cldTime > locTime) {
                    // Cloud is newer
                    merged.push(cld);
                    changed = true;
                } else {
                    // Local is newer
                    merged.push(loc);
                    changed = true;
                }

                // If both were updated recently (within 1 min of each other but different content)
                if (Math.abs(locTime - cldTime) < 60000 && JSON.stringify(loc) !== JSON.stringify(cld)) {
                    divergenceCount++;
                }
            }
        }

        // If more than 3 profiles have near-simultaneous different updates, trigger conflict
        if (divergenceCount > 3) {
            conflict = true;
        }

        return { merged, changed, conflict };
    }

    /**
     * Manual Resolution
     */
    async resolveConflict(choice) { // 'local' or 'cloud'
        if (!this.pendingConflict) return;

        const data = choice === 'local' ? this.pendingConflict.local : this.pendingConflict.cloud;

        // 1. Update local via ProfileService
        if (typeof ProfileService !== 'undefined') {
            await ProfileService.importProfilesFromSync(data);
        }

        // 2. Push to cloud
        await this._pushToCloud(data);

        // 3. Cleanup
        this.pendingConflict = null;
        this.lastSyncTime = Date.now();
        await chrome.storage.local.set({
            cloudSyncSettings: { lastSyncTime: this.lastSyncTime }
        });

        return true;
    }

    _broadcastConflict() {
        chrome.runtime.sendMessage({ type: 'sync_conflict', payload: {} });
    }

    getStatus() {
        return {
            status: this.status,
            lastSyncTime: this.lastSyncTime,
            isEnabled: this.isEnabled,
            googleDriveEnabled: this.googleDriveEnabled
        };
    }
};

// Export singleton - wrapped in IIFE
(function () {
    const cloudSyncService = new CloudSyncServiceClass();

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = cloudSyncService;
    } else {
        const globalScope = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : this);
        globalScope.CloudSyncService = cloudSyncService;
    }
})();
