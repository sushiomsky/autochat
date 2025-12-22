/**
 * CloudSyncService
 * Handles background synchronization of profiles and settings between local storage and a simulated cloud.
 */
class CloudSyncService {
    constructor() {
        this.status = 'idle'; // 'idle', 'syncing', 'error'
        this.lastSyncTime = null;
        this.syncInterval = 5 * 60 * 1000; // 5 minutes default
        this.isEnabled = false;

        // Mock cloud data for simulation
        this.mockCloud = {
            profiles: [],
            updatedAt: Date.now()
        };
    }

    async init() {
        const settings = await chrome.storage.local.get(['cloudSyncSettings', 'cloudSyncEnabled']);
        this.isEnabled = !!settings.cloudSyncEnabled;
        this.lastSyncTime = settings.cloudSyncSettings?.lastSyncTime || null;

        if (this.isEnabled) {
            this.startSyncTimer();
        }
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

        console.log('[CloudSync] Starting sync cycle...');
        this.status = 'syncing';

        try {
            // 1. Pull changes from "Cloud"
            const cloudData = await this._fetchFromCloud();

            // 2. Get Local Data
            const localProfilesResult = await chrome.storage.local.get(['profiles_v5']);
            let localProfiles = localProfilesResult.profiles_v5 || [];

            // 3. Resolve Conflicts & Merge
            const { merged, changed } = this._merge(localProfiles, cloudData.profiles);

            if (changed) {
                console.log('[CloudSync] Local data updated from cloud.');
                await chrome.storage.local.set({ profiles_v5: merged });
            }

            // 4. Push local changes back to cloud
            await this._pushToCloud(merged);

            this.lastSyncTime = Date.now();
            await chrome.storage.local.set({
                cloudSyncSettings: { lastSyncTime: this.lastSyncTime }
            });

            this.status = 'idle';
            console.log('[CloudSync] Sync complete.');
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
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1200));

        // In a real app, this would be an API call
        return this.mockCloud;
    }

    /**
     * Simulate pushing to a remote server
     */
    async _pushToCloud(profiles) {
        await new Promise(resolve => setTimeout(resolve, 800));
        this.mockCloud.profiles = JSON.parse(JSON.stringify(profiles));
        this.mockCloud.updatedAt = Date.now();
    }

    /**
     * Basic "Last Write Wins" merge logic based on timestamps
     */
    _merge(local, cloud) {
        let changed = false;
        const localMap = new Map(local.map(p => [p.id, p]));
        const cloudMap = new Map(cloud.map(p => [p.id, p]));

        const merged = [];
        const allIds = new Set([...localMap.keys(), ...cloudMap.keys()]);

        for (const id of allIds) {
            const loc = localMap.get(id);
            const cld = cloudMap.get(id);

            if (!loc) {
                // New on cloud
                merged.push(cld);
                changed = true;
            } else if (!cld) {
                // Only on local
                merged.push(loc);
            } else {
                // Present in both, check lastActive timestamp
                const locTime = loc.lastActive || loc.created || 0;
                const cldTime = cld.lastActive || cld.created || 0;

                if (cldTime > locTime) {
                    merged.push(cld);
                    changed = true;
                } else {
                    merged.push(loc);
                }
            }
        }

        return { merged, changed };
    }

    getStatus() {
        return {
            status: this.status,
            lastSyncTime: this.lastSyncTime,
            isEnabled: this.isEnabled
        };
    }
}

// Export singleton
const cloudSyncService = new CloudSyncService();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = cloudSyncService;
} else {
    const globalScope = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : this);
    globalScope.CloudSyncService = cloudSyncService;
}
