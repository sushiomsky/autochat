/**
 * ProfileService
 * Handles storage and management of user profiles (accounts).
 * Supports domain mapping for auto-detection.
 */
const ProfileServiceClass = class {
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
            role: 'admin', // Default is admin
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
            role: 'admin', // Creator is admin
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

        // Permission check
        const currentRole = this.profiles[id].role || 'viewer';
        if (typeof RoleService !== 'undefined' && !RoleService.can(currentRole, 'profile.update')) {
            throw new Error('Unauthorized: Missing permission to update profile');
        }

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
        if (!this.profiles[id]) throw new Error('Profile not found');

        // Permission check
        const currentRole = this.profiles[id].role || 'viewer';
        if (typeof RoleService !== 'undefined' && !RoleService.can(currentRole, 'profile.delete')) {
            throw new Error('Unauthorized: Missing permission to delete profile');
        }

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
     * Export profiles for Cloud Sync (returns Array)
     * Includes cookies for linked domains
     */
    async exportProfilesForSync() {
        if (!this.profiles) await this._loadFromStorage();
        const profilesList = Object.values(this.profiles);

        // Enhance with cookies
        const enhancedProfiles = await Promise.all(profilesList.map(async (p) => {
            const copy = { ...p };
            if (p.domains && Array.isArray(p.domains) && p.domains.length > 0) {
                copy.cookies = [];
                for (const domain of p.domains) {
                    try {
                        const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
                        if (!cleanDomain) continue;

                        const cookies = await chrome.cookies.getAll({ domain: cleanDomain });
                        if (cookies && cookies.length > 0) {
                            copy.cookies = [...copy.cookies, ...cookies];
                        }
                    } catch (e) {
                        console.warn('[ProfileService] Failed to export cookies for', domain, e);
                    }
                }
            }
            return copy;
        }));

        return enhancedProfiles;
    }

    /**
     * Import profiles from Cloud Sync (accepts Array)
     * Replaces local cache with provided profiles and restores cookies
     */
    async importProfilesFromSync(profilesArray) {
        if (!Array.isArray(profilesArray)) {
            throw new Error('Invalid input: details must be an array');
        }

        // 1. Restore Cookies
        for (const p of profilesArray) {
            if (p.cookies && Array.isArray(p.cookies)) {
                for (const c of p.cookies) {
                    try {
                        const protocol = c.secure ? 'https' : 'http';
                        const domainClean = c.domain.replace(/^\./, '');
                        const url = `${protocol}://${domainClean}${c.path}`;

                        const details = {
                            url: url,
                            name: c.name,
                            value: c.value,
                            domain: c.domain,
                            path: c.path,
                            secure: c.secure,
                            httpOnly: c.httpOnly,
                            expirationDate: c.expirationDate,
                        };

                        Object.keys(details).forEach(key => details[key] === undefined && delete details[key]);

                        await chrome.cookies.set(details);
                    } catch (e) {
                        console.warn('[ProfileService] Failed to restore cookie', c.name, e);
                    }
                }
            }
        }

        // 2. Convert Array -> Object Map
        const newProfiles = {};
        profilesArray.forEach(p => {
            if (p && p.id) {
                newProfiles[p.id] = p;
            }
        });

        this.profiles = newProfiles;
        await this._saveToStorage();

        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.sendMessage({ type: 'profiles_updated' }).catch(() => { });
        }

        return true;
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
            role: data.role || 'viewer', // Imported role or default viewer
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

                this.profiles = legacy.accounts;
                // Add missing fields to legacy profiles
                Object.values(this.profiles).forEach(p => {
                    if (!p.domains) p.domains = [];
                    if (!p.role) p.role = 'admin'; // Migrated are admins
                    if (!p.id) p.id = 'default';
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
};

// Export singleton - wrapped in IIFE to avoid name collision with class
(function () {
    const profileService = new ProfileServiceClass();

    // Always export to global scope first for service workers
    const globalScope = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : this);
    globalScope.ProfileService = profileService;

    // Support module environment (tests) as secondary
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = profileService;
    }
})();
