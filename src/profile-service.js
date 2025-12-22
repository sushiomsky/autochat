/**
 * ProfileService
 * Handles storage and management of user profiles (accounts).
 * Supports domain mapping for auto-detection.
 */
class ProfileService {
    constructor() {
        this.STORAGE_KEY = 'profiles_v5';
        this.CURRENT_PROFILE_KEY = 'current_profile_id';

        // Cache
        this.profiles = null;
        this.currentProfileId = 'default';

        // Default profile structure
        this.defaultProfile = {
            id: 'default',
            name: 'Default Account',
            domains: [],
            settings: {}, // Stores validation/automation settings
            created: Date.now(),
            lastActive: Date.now()
        };
    }

    async init() {
        await this._loadFromStorage();
    }

    /**
     * Get all profiles
     */
    async getAll() {
        if (!this.profiles) await this._loadFromStorage();
        return this.profiles;
    }

    /**
     * Get active profile ID
     */
    async getActiveId() {
        const result = await chrome.storage.local.get([this.CURRENT_PROFILE_KEY]);
        return result[this.CURRENT_PROFILE_KEY] || 'default';
    }

    /**
     * Create a new profile
     */
    async create(name, domains = []) {
        if (!this.profiles) await this._loadFromStorage();

        const newId = 'profile_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        const newProfile = {
            id: newId,
            name: name || 'New Profile',
            domains: Array.isArray(domains) ? domains : [],
            settings: {},
            created: Date.now(),
            lastActive: Date.now()
        };

        this.profiles[newId] = newProfile;
        await this._saveToStorage();
        return newProfile;
    }

    /**
     * Update a profile
     */
    async update(id, updates) {
        if (!this.profiles) await this._loadFromStorage();
        if (!this.profiles[id]) throw new Error('Profile not found');

        // Merge updates
        this.profiles[id] = { ...this.profiles[id], ...updates, lastActive: Date.now() };

        await this._saveToStorage();
        return this.profiles[id];
    }

    /**
     * Delete a profile
     */
    async delete(id) {
        if (id === 'default') throw new Error('Cannot delete default profile');
        if (!this.profiles) await this._loadFromStorage();

        delete this.profiles[id];

        // If deleted currently active profile, switch to default
        const currentId = await this.getActiveId();
        if (currentId === id) {
            await this.setActive('default');
        }

        await this._saveToStorage();
    }

    /**
     * Set active profile
     */
    async setActive(id) {
        if (!this.profiles) await this._loadFromStorage();
        if (!this.profiles[id]) throw new Error('Profile not found');

        await chrome.storage.local.set({ [this.CURRENT_PROFILE_KEY]: id });
        this.currentProfileId = id;

        // Update legacy storage for backward compatibility if needed
        // chrome.storage.local.set({ currentAccount: id });
    }

    /**
     * Check if a URL matches any profile's domain
     */
    async getProfileByUrl(url) {
        if (!url) return null;
        if (!this.profiles) await this._loadFromStorage();

        try {
            const hostname = new URL(url).hostname;

            for (const profile of Object.values(this.profiles)) {
                if (profile.domains && profile.domains.some(d => hostname.includes(d))) {
                    return profile;
                }
            }
        } catch (e) {
            console.error('[ProfileService] Invalid URL:', url);
        }

        return null;
    }

    /**
     * Export a profile
     */
    async exportProfile(id) {
        if (!this.profiles) await this._loadFromStorage();
        if (!this.profiles[id]) throw new Error('Profile not found');

        const profile = this.profiles[id];
        return {
            name: profile.name,
            domains: profile.domains,
            settings: profile.settings,
            created: profile.created,
            version: '5.0',
            exportDate: new Date().toISOString()
        };
    }

    /**
     * Import a profile
     */
    async importProfile(jsonString) {
        if (!this.profiles) await this._loadFromStorage();

        let data;
        try {
            data = JSON.parse(jsonString);
        } catch (e) {
            throw new Error('Invalid JSON format');
        }

        if (!data.name || !data.settings) {
            throw new Error('Invalid profile data: Missing required fields');
        }

        // Create new ID to avoid conflicts
        const newId = 'profile_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

        // Handle name conflict by appending (Imported)
        let name = data.name;
        const exists = Object.values(this.profiles).some(p => p.name === name);
        if (exists) {
            name = `${name} (Imported)`;
        }

        const newProfile = {
            id: newId,
            name: name,
            domains: Array.isArray(data.domains) ? data.domains : [],
            settings: data.settings,
            created: data.created || Date.now(),
            lastActive: Date.now()
        };

        this.profiles[newId] = newProfile;
        await this._saveToStorage();
        return newProfile;
    }

    // --- Private Methods ---

    async _loadFromStorage() {
        const data = await chrome.storage.local.get([this.STORAGE_KEY]);

        if (data[this.STORAGE_KEY]) {
            this.profiles = data[this.STORAGE_KEY];
        } else {
            // Attempt to migrate from legacy 'accounts'
            const legacy = await chrome.storage.local.get(['accounts']);
            if (legacy.accounts) {
                console.log('[ProfileService] Migrating legacy accounts...');
                this.profiles = legacy.accounts;
                // Add missing fields to legacy profiles
                Object.values(this.profiles).forEach(p => {
                    if (!p.domains) p.domains = [];
                    if (!p.id) p.id = 'default'; // Legacy format might differ, but usually keyed by ID
                });
                await this._saveToStorage();
            } else {
                // Initialize clean
                this.profiles = { 'default': this.defaultProfile };
                await this._saveToStorage();
            }
        }
    }

    async _saveToStorage() {
        await chrome.storage.local.set({ [this.STORAGE_KEY]: this.profiles });
    }
}

// Export singleton
const profileService = new ProfileService();

// Support both module environment (tests) and browser environment (extension)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = profileService;
} else {
    const globalScope = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : this);
    globalScope.ProfileService = profileService;
}
