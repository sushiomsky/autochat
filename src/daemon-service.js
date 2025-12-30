/**
 * DaemonService
 * Handles background automation with auto-start, profile queue management,
 * and error recovery
 */
const DaemonServiceClass = class {
    constructor() {
        this.isRunning = false;
        this.config = null;
        this.activeAutomations = new Map(); // profileId -> automation state
        this.healthCheckInterval = null;
        this.STORAGE_KEY = 'daemon_config';
    }

    async init() {


        // Load configuration
        const settings = await chrome.storage.local.get([this.STORAGE_KEY]);
        this.config = settings[this.STORAGE_KEY] || this.getDefaultConfig();

        // Auto-start if enabled
        if (this.config.autoStartOnBrowserLaunch) {

            await this.start();
        }
    }

    getDefaultConfig() {
        return {
            enabled: false,
            autoStartOnBrowserLaunch: false,
            schedules: [
                {
                    start: '09:00',
                    stop: '23:00',
                    daysOfWeek: [1, 2, 3, 4, 5, 6, 7] // All days
                }
            ],
            maxConcurrentProfiles: 10,
            errorRecovery: {
                enabled: true,
                maxRetries: 3,
                retryDelay: 60000 // 1 minute
            },
            resourceManagement: {
                maxMemoryMB: 500,
                cpuThrottling: false
            }
        };
    }

    async start() {
        if (this.isRunning) {

            return;
        }


        this.isRunning = true;

        // Load all enabled profiles
        const profiles = await ProfileService.getAll();
        const enabledProfiles = Object.values(profiles).filter(p =>
            p.settings?.daemonEnabled === true
        );



        // Start automation for each profile (up to max concurrent)
        const profilesToStart = enabledProfiles.slice(0, this.config.maxConcurrentProfiles);
        for (const profile of profilesToStart) {
            await this.startProfileAutomation(profile);
        }

        // Start health monitoring
        this.startHealthMonitoring();

        // Save running state
        await this.saveConfig({ ...this.config, enabled: true });



        // Notify user
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon128.png',
            title: 'Daemon Mode Started',
            message: `Running ${this.activeAutomations.size} profile(s) in background`
        });
    }

    async stop() {
        if (!this.isRunning) {

            return;
        }


        this.isRunning = false;

        // Stop all automations
        const profileIds = Array.from(this.activeAutomations.keys());
        for (const profileId of profileIds) {
            await this.stopProfileAutomation(profileId);
        }

        // Stop health monitoring
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }

        // Save stopped state
        await this.saveConfig({ ...this.config, enabled: false });



        // Notify user
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon128.png',
            title: 'Daemon Mode Stopped',
            message: 'All background automations have been stopped'
        });
    }

    async startProfileAutomation(profile) {
        const automation = {
            profileId: profile.id,
            profileName: profile.name,
            domain: profile.domains && profile.domains[0] ? profile.domains[0] : null,
            status: 'starting',
            startedAt: Date.now(),
            tabId: null,
            errors: 0,
            lastError: null
        };

        try {
            // Ensure tab is open for this profile
            const tab = await this.ensureTabForProfile(profile);
            automation.tabId = tab.id;

            // Wait a moment for page to load
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Inject content script and start automation
            await chrome.tabs.sendMessage(tab.id, {
                action: 'startAutomation',
                profile: profile
            });

            automation.status = 'active';
            this.activeAutomations.set(profile.id, automation);


        } catch (error) {
            automation.status = 'failed';
            automation.lastError = error.message;
            automation.errors++;

            console.error(`[Daemon] Failed to start automation for ${profile.name}:`, error);
            this.handleAutomationError(profile, error);
        }
    }

    async stopProfileAutomation(profileId) {
        const automation = this.activeAutomations.get(profileId);
        if (!automation) {

            return;
        }

        try {
            if (automation.tabId) {
                await chrome.tabs.sendMessage(automation.tabId, {
                    action: 'stopAutomation'
                });
            }

            this.activeAutomations.delete(profileId);

        } catch (error) {
            console.error(`[Daemon] Error stopping automation:`, error);
            // Force remove even if error
            this.activeAutomations.delete(profileId);
        }
    }

    async ensureTabForProfile(profile) {
        // Check if tab already exists for this domain
        if (profile.domains && profile.domains.length > 0) {
            const domain = profile.domains[0];
            const tabs = await chrome.tabs.query({ url: `*://${domain}/*` });

            if (tabs.length > 0) {

                return tabs[0];
            }

            // Create new tab

            return await chrome.tabs.create({
                url: `https://${domain}`,
                active: false
            });
        }

        throw new Error('Profile has no domains configured');
    }

    startHealthMonitoring() {
        this.healthCheckInterval = setInterval(async () => {
            for (const [profileId, automation] of this.activeAutomations.entries()) {
                await this.checkAutomationHealth(profileId, automation);
            }
        }, 60000); // Check every minute
    }

    async checkAutomationHealth(profileId, automation) {
        try {
            // Check if tab still exists
            if (automation.tabId) {
                const tab = await chrome.tabs.get(automation.tabId);
                if (!tab) {
                    throw new Error('Tab closed');
                }

                // Ping content script to ensure it's responsive
                await chrome.tabs.sendMessage(automation.tabId, {
                    action: 'ping'
                });
            }

            // Reset error count on successful check
            automation.errors = 0;
            automation.status = 'active';
        } catch (error) {
            automation.errors++;
            automation.lastError = error.message;
            automation.status = 'error';

            console.error(`[Daemon] Health check failed for ${automation.profileName}:`, error);

            if (automation.errors >= this.config.errorRecovery.maxRetries) {
                console.error(`[Daemon] Max retries reached for ${automation.profileName}, stopping...`);
                await this.stopProfileAutomation(profileId);

                // Notify user
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icon128.png',
                    title: 'Automation Failed',
                    message: `Profile "${automation.profileName}" stopped after ${automation.errors} errors`
                });
            } else if (this.config.errorRecovery.enabled) {

                setTimeout(async () => {
                    const profiles = await ProfileService.getAll();
                    const profile = profiles[profileId];
                    if (profile) {
                        await this.startProfileAutomation(profile);
                    }
                }, this.config.errorRecovery.retryDelay);
            }
        }
    }

    async handleAutomationError(profile, error) {
        console.error(`[Daemon] Automation error for ${profile.name}:`, error);

        // Notify user
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon128.png',
            title: 'Automation Error',
            message: `Profile "${profile.name}": ${error.message}`
        });
    }

    async saveConfig(config) {
        this.config = config;
        await chrome.storage.local.set({ [this.STORAGE_KEY]: config });
    }

    async updateConfig(updates) {
        const newConfig = { ...this.config, ...updates };
        await this.saveConfig(newConfig);
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            activeProfiles: this.activeAutomations.size,
            maxConcurrentProfiles: this.config.maxConcurrentProfiles,
            automations: Array.from(this.activeAutomations.entries()).map(([id, auto]) => ({
                profileId: id,
                profileName: auto.profileName,
                status: auto.status,
                uptime: Date.now() - auto.startedAt,
                errors: auto.errors,
                lastError: auto.lastError
            }))
        };
    }

    async getConfig() {
        return { ...this.config };
    }
};

// Export singleton - wrapped in IIFE
(function () {
    const daemonService = new DaemonServiceClass();

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = daemonService;
    } else {
        const globalScope = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : this);
        globalScope.DaemonService = daemonService;
    }
})();
