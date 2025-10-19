/**
 * Licensing and subscription management for AutoChat Pro
 */

// License tiers
export const LICENSE_TIERS = {
  FREE: 'free',
  PRO: 'pro',
  TEAM: 'team',
  ENTERPRISE: 'enterprise',
};

// Feature flags for each tier
export const FEATURES = {
  // Free features
  BASIC_AUTOMATION: 'basic_automation',
  TYPING_SIMULATION: 'typing_simulation',
  TEMPLATE_VARIABLES: 'template_variables',
  DARK_MODE: 'dark_mode',
  BASIC_ANALYTICS: 'basic_analytics',
  
  // Pro features
  ADVANCED_SCHEDULING: 'advanced_scheduling',
  CLOUD_SYNC: 'cloud_sync',
  TEMPLATES_LIBRARY: 'templates_library',
  ENHANCED_ANALYTICS: 'enhanced_analytics',
  WEBHOOKS: 'webhooks',
  CUSTOM_THEMES: 'custom_themes',
  API_ACCESS: 'api_access',
  
  // Team features
  TEAM_COLLABORATION: 'team_collaboration',
  TEAM_ANALYTICS: 'team_analytics',
  ADMIN_CONTROLS: 'admin_controls',
  
  // Enterprise features
  SSO: 'sso',
  ON_PREMISE: 'on_premise',
  CUSTOM_INTEGRATION: 'custom_integration',
  SLA: 'sla',
};

// Feature availability by tier
const TIER_FEATURES = {
  [LICENSE_TIERS.FREE]: [
    FEATURES.BASIC_AUTOMATION,
    FEATURES.TYPING_SIMULATION,
    FEATURES.TEMPLATE_VARIABLES,
    FEATURES.DARK_MODE,
    FEATURES.BASIC_ANALYTICS,
  ],
  [LICENSE_TIERS.PRO]: [
    ...Object.values(FEATURES).filter(f => 
      !f.includes('team') && !f.includes('sso') && !f.includes('on_premise')
    ),
  ],
  [LICENSE_TIERS.TEAM]: [
    ...Object.values(FEATURES).filter(f => 
      !f.includes('sso') && !f.includes('on_premise')
    ),
  ],
  [LICENSE_TIERS.ENTERPRISE]: Object.values(FEATURES),
};

/**
 * License validation and management
 */
export class LicenseManager {
  constructor() {
    this.currentLicense = null;
    this.licenseCache = null;
    this.lastCheck = null;
  }

  /**
   * Initialize license from storage
   */
  async init() {
    const stored = await this.getLicenseFromStorage();
    if (stored) {
      this.currentLicense = stored;
    } else {
      this.currentLicense = this.getFreeLicense();
    }
    return this.currentLicense;
  }

  /**
   * Get free tier license
   */
  getFreeLicense() {
    return {
      tier: LICENSE_TIERS.FREE,
      features: TIER_FEATURES[LICENSE_TIERS.FREE],
      limits: {
        profiles: 1,
        cloudStorage: 0,
        apiCalls: 0,
      },
      validUntil: null,
    };
  }

  /**
   * Validate license key with server
   * @param {string} licenseKey - License key to validate
   * @returns {Promise<Object>} - License data
   */
  async validateLicense(licenseKey) {
    try {
      // TODO: Replace with actual API endpoint
      const response = await fetch('https://api.autochat.dev/v1/licenses/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ licenseKey }),
      });

      if (!response.ok) {
        throw new Error('License validation failed');
      }

      const licenseData = await response.json();
      
      // Store license
      await this.storeLicense(licenseData);
      this.currentLicense = licenseData;
      
      return licenseData;
    } catch (error) {
      console.error('[License] Validation error:', error);
      
      // Fallback to cached license if network fails
      if (this.currentLicense && this.currentLicense.tier !== LICENSE_TIERS.FREE) {
        console.warn('[License] Using cached license due to network error');
        return this.currentLicense;
      }
      
      throw error;
    }
  }

  /**
   * Check if a feature is available in current license
   * @param {string} feature - Feature to check
   * @returns {boolean} - True if available
   */
  hasFeature(feature) {
    if (!this.currentLicense) {
      return TIER_FEATURES[LICENSE_TIERS.FREE].includes(feature);
    }
    
    return this.currentLicense.features.includes(feature);
  }

  /**
   * Get current license tier
   * @returns {string} - Current tier
   */
  getTier() {
    return this.currentLicense?.tier || LICENSE_TIERS.FREE;
  }

  /**
   * Check if license is valid
   * @returns {boolean} - True if valid
   */
  isValid() {
    if (!this.currentLicense) return false;
    if (this.currentLicense.tier === LICENSE_TIERS.FREE) return true;
    
    const validUntil = new Date(this.currentLicense.validUntil);
    return validUntil > new Date();
  }

  /**
   * Check if license needs renewal
   * @returns {boolean} - True if expiring within 7 days
   */
  needsRenewal() {
    if (!this.currentLicense || this.currentLicense.tier === LICENSE_TIERS.FREE) {
      return false;
    }
    
    const validUntil = new Date(this.currentLicense.validUntil);
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    return validUntil < sevenDaysFromNow;
  }

  /**
   * Get days until expiration
   * @returns {number} - Days remaining (null if free/no expiration)
   */
  getDaysUntilExpiration() {
    if (!this.currentLicense || this.currentLicense.tier === LICENSE_TIERS.FREE) {
      return null;
    }
    
    const validUntil = new Date(this.currentLicense.validUntil);
    const now = new Date();
    const diff = validUntil - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Activate license key
   * @param {string} licenseKey - License key
   * @returns {Promise<Object>} - License data
   */
  async activateLicense(licenseKey) {
    const licenseData = await this.validateLicense(licenseKey);
    
    // Send analytics event
    this.trackLicenseActivation(licenseData.tier);
    
    return licenseData;
  }

  /**
   * Deactivate current license
   */
  async deactivateLicense() {
    this.currentLicense = this.getFreeLicense();
    await chrome.storage.local.remove('license');
    this.trackLicenseDeactivation();
  }

  /**
   * Store license in chrome.storage
   * @param {Object} licenseData - License data
   */
  async storeLicense(licenseData) {
    await chrome.storage.local.set({
      license: licenseData,
      licenseUpdated: Date.now(),
    });
  }

  /**
   * Get license from chrome.storage
   * @returns {Promise<Object|null>} - License data or null
   */
  async getLicenseFromStorage() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['license'], (data) => {
        resolve(data.license || null);
      });
    });
  }

  /**
   * Refresh license from server
   * @returns {Promise<Object>} - Updated license data
   */
  async refreshLicense() {
    if (!this.currentLicense || this.currentLicense.tier === LICENSE_TIERS.FREE) {
      return this.currentLicense;
    }
    
    // Check if we checked recently (within last hour)
    const now = Date.now();
    if (this.lastCheck && (now - this.lastCheck) < 3600000) {
      return this.currentLicense;
    }
    
    try {
      const licenseKey = this.currentLicense.licenseKey;
      await this.validateLicense(licenseKey);
      this.lastCheck = now;
      return this.currentLicense;
    } catch (error) {
      console.error('[License] Refresh failed:', error);
      return this.currentLicense;
    }
  }

  /**
   * Get upgrade URL for current user
   * @returns {string} - Upgrade URL
   */
  getUpgradeUrl() {
    const baseUrl = 'https://autochat.dev/upgrade';
    const currentTier = this.getTier();
    return `${baseUrl}?from=${currentTier}`;
  }

  /**
   * Track license activation (analytics)
   * @param {string} tier - License tier
   */
  trackLicenseActivation(tier) {
    // TODO: Implement analytics tracking
    console.log('[License] Activated:', tier);
  }

  /**
   * Track license deactivation (analytics)
   */
  trackLicenseDeactivation() {
    // TODO: Implement analytics tracking
    console.log('[License] Deactivated');
  }

  /**
   * Get feature limits for current tier
   * @returns {Object} - Limits object
   */
  getLimits() {
    return this.currentLicense?.limits || {
      profiles: 1,
      cloudStorage: 0,
      apiCalls: 0,
    };
  }

  /**
   * Check if limit is reached
   * @param {string} limitType - Type of limit (profiles, cloudStorage, apiCalls)
   * @param {number} current - Current usage
   * @returns {boolean} - True if limit reached
   */
  isLimitReached(limitType, current) {
    const limits = this.getLimits();
    const limit = limits[limitType];
    
    if (limit === 0) return true; // 0 means feature not available
    if (limit === -1) return false; // -1 means unlimited
    
    return current >= limit;
  }
}

// Export singleton instance
export const licenseManager = new LicenseManager();

/**
 * Helper function to check if feature is available
 * @param {string} feature - Feature to check
 * @returns {boolean} - True if available
 */
export function hasFeature(feature) {
  return licenseManager.hasFeature(feature);
}

/**
 * Helper function to get current tier
 * @returns {string} - Current tier
 */
export function getCurrentTier() {
  return licenseManager.getTier();
}

/**
 * Helper function to check if user is pro
 * @returns {boolean} - True if pro or higher
 */
export function isPro() {
  const tier = getCurrentTier();
  return tier !== LICENSE_TIERS.FREE;
}

/**
 * Show upgrade prompt
 * @param {string} feature - Feature that triggered prompt
 * @param {string} message - Custom message
 */
export function showUpgradePrompt(feature, message = null) {
  const defaultMessage = `This feature requires AutoChat Pro. Upgrade now to unlock ${feature}!`;
  const promptMessage = message || defaultMessage;
  
  if (confirm(promptMessage + '\n\nClick OK to view upgrade options.')) {
    window.open(licenseManager.getUpgradeUrl(), '_blank');
  }
}
