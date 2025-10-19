/**
 * Licensing UI controller for AutoChat Pro
 * Handles license activation, upgrade prompts, and feature gating in the UI
 */

import { licenseManager, LICENSE_TIERS, FEATURES, hasFeature, isPro, showUpgradePrompt } from './licensing.js';

/**
 * Initialize licensing UI
 */
export async function initLicensingUI() {
  await licenseManager.init();
  updateLicenseBadge();
  attachEventListeners();
  
  // Check for expiring license
  if (licenseManager.needsRenewal()) {
    showRenewalReminder();
  }
}

/**
 * Update license badge display
 */
export function updateLicenseBadge() {
  const badge = document.getElementById('licenseBadge');
  const licenseText = document.getElementById('licenseText');
  const upgradeBtn = document.getElementById('upgradeBtn');
  
  if (!badge || !licenseText || !upgradeBtn) return;
  
  const tier = licenseManager.getTier();
  
  // Remove all tier classes
  badge.classList.remove('pro', 'team', 'enterprise');
  
  switch (tier) {
    case LICENSE_TIERS.FREE:
      licenseText.textContent = '🆓 Free';
      upgradeBtn.style.display = 'block';
      upgradeBtn.textContent = '⭐ Upgrade to Pro';
      break;
      
    case LICENSE_TIERS.PRO:
      licenseText.textContent = '⭐ Pro';
      badge.classList.add('pro');
      upgradeBtn.style.display = 'none';
      
      // Show days until expiration if needed
      const days = licenseManager.getDaysUntilExpiration();
      if (days !== null && days < 30) {
        licenseText.textContent = `⭐ Pro (${days} days left)`;
      }
      break;
      
    case LICENSE_TIERS.TEAM:
      licenseText.textContent = '👥 Team';
      badge.classList.add('team');
      upgradeBtn.style.display = 'none';
      break;
      
    case LICENSE_TIERS.ENTERPRISE:
      licenseText.textContent = '🏢 Enterprise';
      badge.classList.add('enterprise');
      upgradeBtn.style.display = 'none';
      break;
  }
}

/**
 * Show license activation modal
 */
export function showLicenseModal() {
  const modal = document.getElementById('licenseModal');
  if (!modal) return;
  
  // Update current license info
  updateCurrentLicenseInfo();
  
  modal.classList.add('show');
}

/**
 * Hide license activation modal
 */
export function hideLicenseModal() {
  const modal = document.getElementById('licenseModal');
  if (modal) {
    modal.classList.remove('show');
  }
}

/**
 * Update current license info in modal
 */
function updateCurrentLicenseInfo() {
  const tier = licenseManager.getTier();
  const features = licenseManager.currentLicense?.features || [];
  
  document.getElementById('currentTier').textContent = tier.charAt(0).toUpperCase() + tier.slice(1);
  document.getElementById('currentFeatures').textContent = features.length + ' features';
  
  const expirationInfo = document.getElementById('expirationInfo');
  const expirationDate = document.getElementById('expirationDate');
  const deactivateBtn = document.getElementById('deactivateLicense');
  
  if (tier !== LICENSE_TIERS.FREE && licenseManager.currentLicense?.validUntil) {
    const date = new Date(licenseManager.currentLicense.validUntil);
    expirationDate.textContent = date.toLocaleDateString();
    expirationInfo.style.display = 'block';
    deactivateBtn.style.display = 'block';
  } else {
    expirationInfo.style.display = 'none';
    deactivateBtn.style.display = 'none';
  }
}

/**
 * Activate license key
 */
async function activateLicense() {
  const input = document.getElementById('licenseKeyInput');
  const errorDiv = document.getElementById('licenseError');
  const successDiv = document.getElementById('licenseSuccess');
  const activateBtn = document.getElementById('activateLicense');
  
  const licenseKey = input.value.trim();
  
  if (!licenseKey) {
    errorDiv.textContent = 'Please enter a license key';
    errorDiv.style.display = 'block';
    successDiv.style.display = 'none';
    return;
  }
  
  // Show loading state
  activateBtn.disabled = true;
  activateBtn.innerHTML = '<span class="spinner"></span> Activating...';
  errorDiv.style.display = 'none';
  successDiv.style.display = 'none';
  
  try {
    await licenseManager.activateLicense(licenseKey);
    
    // Success
    successDiv.textContent = `License activated! You now have ${licenseManager.getTier()} access.`;
    successDiv.style.display = 'block';
    input.value = '';
    
    // Update UI
    updateLicenseBadge();
    updateCurrentLicenseInfo();
    
    // Close modal after 2 seconds
    setTimeout(() => {
      hideLicenseModal();
    }, 2000);
    
  } catch (error) {
    errorDiv.textContent = 'Invalid license key. Please check and try again.';
    errorDiv.style.display = 'block';
  } finally {
    activateBtn.disabled = false;
    activateBtn.innerHTML = '✅ Activate';
  }
}

/**
 * Deactivate current license
 */
async function deactivateLicense() {
  if (!confirm('Are you sure you want to deactivate your license? You will lose access to Pro features.')) {
    return;
  }
  
  await licenseManager.deactivateLicense();
  updateLicenseBadge();
  updateCurrentLicenseInfo();
  
  const successDiv = document.getElementById('licenseSuccess');
  successDiv.textContent = 'License deactivated. Reverted to Free tier.';
  successDiv.style.display = 'block';
}

/**
 * Show pro feature upgrade prompt
 * @param {string} featureName - Name of the feature
 * @param {string} description - Description of what it does
 */
export function showProFeaturePrompt(featureName, description) {
  const modal = document.getElementById('proFeatureModal');
  if (!modal) return;
  
  document.getElementById('proFeatureName').textContent = featureName;
  document.getElementById('proFeatureDescription').textContent = description;
  
  modal.classList.add('show');
}

/**
 * Hide pro feature prompt
 */
export function hideProFeaturePrompt() {
  const modal = document.getElementById('proFeatureModal');
  if (modal) {
    modal.classList.remove('show');
  }
}

/**
 * Open upgrade page
 */
function openUpgradePage() {
  window.open(licenseManager.getUpgradeUrl(), '_blank');
}

/**
 * Open buy license page
 */
function openBuyPage() {
  window.open('https://autochat.dev/pricing', '_blank');
}

/**
 * Open learn more page
 */
function openLearnMorePage() {
  window.open('https://autochat.dev/features', '_blank');
}

/**
 * Show renewal reminder
 */
function showRenewalReminder() {
  const days = licenseManager.getDaysUntilExpiration();
  if (days === null) return;
  
  const message = `Your AutoChat ${licenseManager.getTier()} license expires in ${days} days. Renew now to continue enjoying premium features!`;
  
  // Create notification
  const notification = document.getElementById('notification');
  if (notification) {
    notification.textContent = message;
    notification.className = 'notification show';
    
    setTimeout(() => {
      notification.classList.remove('show');
    }, 10000); // Show for 10 seconds
  }
}

/**
 * Check if feature is available and show prompt if not
 * @param {string} feature - Feature constant from FEATURES
 * @param {string} featureName - Display name
 * @param {string} description - Description
 * @returns {boolean} - True if feature is available
 */
export function checkFeatureAccess(feature, featureName, description) {
  if (hasFeature(feature)) {
    return true;
  }
  
  showProFeaturePrompt(featureName, description);
  return false;
}

/**
 * Add pro badge to UI element
 * @param {string} elementId - Element ID to add badge to
 */
export function addProBadge(elementId) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const label = element.closest('label') || element.parentElement;
  if (!label) return;
  
  // Check if badge already exists
  if (label.querySelector('.pro-badge')) return;
  
  const badge = document.createElement('span');
  badge.className = 'pro-badge';
  badge.textContent = 'Pro';
  label.appendChild(badge);
}

/**
 * Lock feature in UI if not available
 * @param {string} elementId - Element ID to lock
 * @param {string} feature - Feature constant
 */
export function lockFeature(elementId, feature) {
  if (hasFeature(feature)) return;
  
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const container = element.closest('label') || element.parentElement;
  if (container) {
    container.classList.add('feature-locked');
  }
  
  element.disabled = true;
  
  // Add click handler to show upgrade prompt
  element.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showProFeaturePrompt(
      'Pro Feature',
      'This feature is only available in AutoChat Pro. Upgrade to unlock all premium features!'
    );
  });
}

/**
 * Attach event listeners
 */
function attachEventListeners() {
  // Upgrade button in badge
  const upgradeBtn = document.getElementById('upgradeBtn');
  if (upgradeBtn) {
    upgradeBtn.addEventListener('click', showLicenseModal);
  }
  
  // License modal buttons
  const activateBtn = document.getElementById('activateLicense');
  if (activateBtn) {
    activateBtn.addEventListener('click', activateLicense);
  }
  
  const buyBtn = document.getElementById('buyLicense');
  if (buyBtn) {
    buyBtn.addEventListener('click', openBuyPage);
  }
  
  const deactivateBtn = document.getElementById('deactivateLicense');
  if (deactivateBtn) {
    deactivateBtn.addEventListener('click', deactivateLicense);
  }
  
  // Pro feature prompt buttons
  const upgradeNowBtn = document.getElementById('upgradeNow');
  if (upgradeNowBtn) {
    upgradeNowBtn.addEventListener('click', () => {
      hideProFeaturePrompt();
      openUpgradePage();
    });
  }
  
  const learnMoreBtn = document.getElementById('learnMore');
  if (learnMoreBtn) {
    learnMoreBtn.addEventListener('click', () => {
      hideProFeaturePrompt();
      openLearnMorePage();
    });
  }
  
  // Close modals
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal');
      if (modal) {
        modal.classList.remove('show');
      }
    });
  });
  
  // License key input formatting
  const licenseKeyInput = document.getElementById('licenseKeyInput');
  if (licenseKeyInput) {
    licenseKeyInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/[^A-Z0-9]/g, '').toUpperCase();
      
      // Format as XXXXX-XXXXX-XXXXX-XXXXX
      if (value.length > 0) {
        value = value.match(/.{1,5}/g).join('-');
      }
      
      e.target.value = value.substring(0, 29); // Max length with dashes
    });
  }
}

/**
 * Gate pro features in the UI
 * Call this after DOM is loaded
 */
export function gateProFeatures() {
  // Example: Lock advanced scheduling if not pro
  if (!hasFeature(FEATURES.ADVANCED_SCHEDULING)) {
    // We'll implement this when we add the scheduling UI
  }
  
  // Example: Lock cloud sync if not pro
  if (!hasFeature(FEATURES.CLOUD_SYNC)) {
    // We'll implement this when we add the cloud sync UI
  }
  
  // Add pro badges to features that require pro
  // This is visual indication, actual locking happens when user tries to use them
}

// Export for use in other modules
export { LICENSE_TIERS, FEATURES, hasFeature, isPro };
