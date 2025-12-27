/**
 * MultiProfileManager
 * Handles automatic site detection, profile loading, and multi-tab coordination
 */
class MultiProfileManager {
    constructor() {
        this.activeProfiles = new Map(); // tabId -> profileId
        this.profileService = null;
        this.tabListeners = [];
    }

    async init() {
        console.log('[MultiProfileManager] Initializing...');

        // Initialize profile service
        if (typeof ProfileService !== 'undefined') {
            this.profileService = ProfileService;
            await this.profileService.init();
        }

        // Set up tab listeners
        this.setupTabListeners();
    }

    setupTabListeners() {
        // Listen for tab updates
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' && tab.url) {
                this.detectAndLoadProfile(tabId, tab.url);
            }
        });

        // Listen for tab activation
        chrome.tabs.onActivated.addListener(({ tabId }) => {
            this.onTabActivated(tabId);
        });

        // Listen for tab removal
        chrome.tabs.onRemoved.addListener((tabId) => {
            this.onTabClosed(tabId);
        });
    }

    async detectAndLoadProfile(tabId, url) {
        try {
            const profile = await this.profileService.getProfileByUrl(url);

            if (profile) {
                console.log(`[MultiProfileManager] Auto-detected profile: ${profile.name} for ${url}`);
                await this.loadProfileForTab(tabId, profile.id);
                this.activeProfiles.set(tabId, profile.id);

                // Update badge
                this.updateBadge();
            } else {
                console.log(`[MultiProfileManager] No profile found for ${url}`);
                // Optionally suggest creating a new profile
                if (this.shouldSuggestProfile(url)) {
                    this.suggestProfileCreation(tabId, url);
                }
            }
        } catch (error) {
            console.error('[MultiProfileManager] Error detecting profile:', error);
        }
    }

    async loadProfileForTab(tabId, profileId) {
        try {
            const profiles = await this.profileService.getAll();
            const profileData = profiles[profileId];

            if (!profileData) {
                console.warn(`[MultiProfileManager] Profile ${profileId} not found`);
                return;
            }

            // Inject content script with profile settings
            await chrome.tabs.sendMessage(tabId, {
                action: 'loadProfile',
                profile: profileData
            });

            console.log(`[MultiProfileManager] Loaded profile ${profileData.name} for tab ${tabId}`);
        } catch (error) {
            console.error('[MultiProfileManager] Error loading profile:', error);
        }
    }

    shouldSuggestProfile(url) {
        // Only suggest for certain domains (e.g., casino sites)
        try {
            const hostname = new URL(url).hostname;
            // Add logic to filter which sites to suggest profiles for
            return hostname.includes('casino') || hostname.includes('stake') || hostname.includes('dice');
        } catch {
            return false;
        }
    }

    async suggestProfileCreation(tabId, url) {
        try {
            const hostname = new URL(url).hostname;

            // Create notification
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icon128.png',
                title: 'New Site Detected',
                message: `Create a profile for ${hostname}?`,
                buttons: [
                    { title: 'Create Profile' },
                    { title: 'Ignore' }
                ],
                requireInteraction: true
            }, (notificationId) => {
                // Store tab and URL for later use
                chrome.storage.local.set({
                    [`pending_profile_${notificationId}`]: { tabId, url, hostname }
                });
            });
        } catch (error) {
            console.error('[MultiProfileManager] Error suggesting profile:', error);
        }
    }

    onTabActivated(tabId) {
        const profileId = this.activeProfiles.get(tabId);
        if (profileId) {
            console.log(`[MultiProfileManager] Tab ${tabId} activated with profile ${profileId}`);
            // Optionally update UI or perform other actions
        }
    }

    onTabClosed(tabId) {
        if (this.activeProfiles.has(tabId)) {
            console.log(`[MultiProfileManager] Tab ${tabId} closed, removing profile association`);
            this.activeProfiles.delete(tabId);
            this.updateBadge();
        }
    }

    getActiveProfiles() {
        return Array.from(this.activeProfiles.entries()).map(([tabId, profileId]) => ({
            tabId,
            profileId
        }));
    }

    getActiveProfileCount() {
        return this.activeProfiles.size;
    }

    updateBadge() {
        const count = this.getActiveProfileCount();
        if (count > 0) {
            chrome.action.setBadgeText({ text: count.toString() });
            chrome.action.setBadgeBackgroundColor({ color: '#667eea' });
        } else {
            chrome.action.setBadgeText({ text: '' });
        }
    }

    async switchProfile(tabId, profileId) {
        await this.loadProfileForTab(tabId, profileId);
        this.activeProfiles.set(tabId, profileId);
        this.updateBadge();
    }

    getStatus() {
        return {
            activeProfiles: this.getActiveProfileCount(),
            profiles: this.getActiveProfiles()
        };
    }
}

// Export singleton
const multiProfileManager = new MultiProfileManager();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = multiProfileManager;
} else {
    const globalScope = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : this);
    globalScope.MultiProfileManager = multiProfileManager;
}
