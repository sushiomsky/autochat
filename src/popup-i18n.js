/**
 * popup-i18n.js - Popup internationalization integration
 * Handles localization of the popup interface
 */

// Helper function to get localized message
function t(key, substitutions = []) {
  return chrome.i18n.getMessage(key, substitutions) || key;
}

// Check if current locale is RTL
function isRTL() {
  const locale = chrome.i18n.getUILanguage();
  const rtlLocales = ['ar', 'he', 'fa', 'ur'];
  return rtlLocales.some(rtl => locale.startsWith(rtl));
}

// Localize the entire popup UI
function localizePopup() {
  // Set document direction
  if (isRTL()) {
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', chrome.i18n.getUILanguage());
    document.body.classList.add('rtl');
  } else {
    document.documentElement.setAttribute('dir', 'ltr');
    document.documentElement.setAttribute('lang', chrome.i18n.getUILanguage());
    document.body.classList.remove('rtl');
  }

  // Main title
  document.querySelector('h2 span').textContent = `💬 ${t('appTitle')}`;
  
  // Theme toggle
  document.getElementById('themeToggle').title = t('themeToggle');
  document.getElementById('themeToggle').setAttribute('aria-label', t('themeToggle'));
  
  // Stats bar
  document.querySelectorAll('.stat-label')[0].textContent = t('statsToday');
  document.querySelectorAll('.stat-label')[1].textContent = t('statsTotal');
  document.querySelectorAll('.stat-label')[2].textContent = t('statsStatus');
  
  // Main buttons
  document.getElementById('markInput').innerHTML = `🎯 ${t('markInputBtn')}`;
  document.getElementById('inputStatus').textContent = t('inputStatusNone');
  
  // Send method
  const sendMethodLabel = document.querySelector('label[for="sendMethod"]') || 
                         document.evaluate("//label[select[@id='sendMethod']]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  if (sendMethodLabel) {
    const labelText = sendMethodLabel.childNodes[0];
    if (labelText) labelText.textContent = t('sendMethod') + ' ';
  }
  
  document.querySelector('#sendMethod option[value="enter"]').textContent = `⌨️ ${t('sendMethodEnter')}`;
  document.querySelector('#sendMethod option[value="click"]').textContent = `🖱️ ${t('sendMethodClick')}`;
  document.getElementById('markSendButton').innerHTML = `📍 ${t('markSendButton')}`;
  
  // Messages
  const messagesLabel = document.evaluate("//label[textarea[@id='messageList']]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  if (messagesLabel) {
    messagesLabel.childNodes[0].textContent = t('messagesLabel') + ' ';
  }
  document.getElementById('messageList').placeholder = t('messagesPlaceholder');
  const messagesHelp = document.querySelector('#messageList + .help');
  if (messagesHelp) messagesHelp.textContent = t('messagesHelp');
  
  // Button row
  document.getElementById('loadDefaultPhrases').innerHTML = `📚 ${t('loadPhrasesBtn')}`;
  document.getElementById('managePhrases').innerHTML = `✏️ ${t('manageBtn')}`;
  document.getElementById('openSettings').innerHTML = `⚙️ ${t('settingsBtn')}`;
  document.getElementById('openHelp').innerHTML = `❓ ${t('helpBtn')}`;
  
  // Send mode
  const sendModeLabel = document.evaluate("//label[select[@id='sendMode']]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  if (sendModeLabel) {
    sendModeLabel.childNodes[0].textContent = t('sendMode') + ' ';
  }
  document.querySelector('#sendMode option[value="random"]').textContent = `🔀 ${t('sendModeRandom')}`;
  document.querySelector('#sendMode option[value="sequential"]').textContent = `➡️ ${t('sendModeSequential')}`;
  
  // Time interval
  const timeIntervalLabel = document.querySelector('label:has(+ .input-row)');
  if (timeIntervalLabel && timeIntervalLabel.textContent.includes('Time Interval')) {
    timeIntervalLabel.textContent = t('timeInterval');
  }
  
  const minLabel = document.evaluate("//label[input[@id='minInterval']]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  if (minLabel) minLabel.childNodes[0].textContent = t('minInterval') + ' ';
  
  const maxLabel = document.evaluate("//label[input[@id='maxInterval']]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  if (maxLabel) maxLabel.childNodes[0].textContent = t('maxInterval') + ' ';
  
  const intervalHelp = document.querySelector('.input-row + .help');
  if (intervalHelp) intervalHelp.textContent = t('intervalHelp');
  
  // Control buttons
  document.getElementById('startAutoSend').innerHTML = `▶️ ${t('startAutoSend')}`;
  document.getElementById('pauseAutoSend').innerHTML = `⏸️ ${t('pauseAutoSend')}`;
  document.getElementById('stopAutoSend').innerHTML = `⏹️ ${t('stopAutoSend')}`;
  document.getElementById('sendOnce').innerHTML = `📤 ${t('sendOnce')}`;
  document.getElementById('previewMessage').innerHTML = `👁️ ${t('preview')}`;
  document.getElementById('openEmoji').innerHTML = `😊 ${t('emoji')}`;
  document.getElementById('openCategories').innerHTML = `📁 ${t('categories')}`;
  document.getElementById('openAnalytics').innerHTML = `📊 ${t('analytics')}`;
  document.getElementById('exportAnalytics').innerHTML = `💾 ${t('export')}`;
  
  // Keyboard shortcuts
  const shortcutsInfo = document.querySelector('.shortcuts-info');
  if (shortcutsInfo) {
    shortcutsInfo.innerHTML = `
      <strong>${t('keyboardShortcuts')}</strong>
      <span class="shortcut-key">Ctrl+K</span> ${t('shortcutCommands')}
      <span class="shortcut-key">Ctrl+S</span> ${t('shortcutStart')}
      <span class="shortcut-key">Ctrl+X</span> ${t('shortcutStop')}
      <span class="shortcut-key">Ctrl+P</span> ${t('shortcutPause')}
    `;
  }
  
  // Version
  document.querySelector('.version').textContent = t('version');
  
  // Settings modal
  document.querySelector('#settingsModal h3').innerHTML = `⚙️ ${t('advancedSettings')}`;
  localizeSettingsModal();
  
  // Phrase modal
  document.querySelector('#phraseModal h3').innerHTML = `📝 ${t('managePhrases')}`;
  localizePhraseModal();
  
  // Analytics modal
  document.querySelector('#analyticsModal h3').innerHTML = `📊 ${t('analyticsTitle')}`;
  localizeAnalyticsModal();
  
  // Other modals
  document.querySelector('#previewModal h3').innerHTML = `👁️ ${t('previewTitle')}`;
  document.querySelector('#categoriesModal h3').innerHTML = `📁 ${t('categoriesTitle')}`;
  
  // Command palette
  document.getElementById('commandSearch').placeholder = t('commandPalettePlaceholder');
  
  // Emoji picker
  document.getElementById('emojiSearch').placeholder = t('emojiSearchPlaceholder');
  
  // Close buttons
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.textContent = t('closeBtn');
  });
}

function localizeSettingsModal() {
  const modal = document.getElementById('settingsModal');
  
  // Typing simulation
  const typingLabel = modal.querySelector('label:has(#typingSimulation)');
  if (typingLabel) {
    const checkbox = typingLabel.querySelector('#typingSimulation');
    typingLabel.innerHTML = '';
    typingLabel.appendChild(checkbox);
    typingLabel.appendChild(document.createTextNode(` 🎹 ${t('typingSimulation')}`));
  }
  const typingHelp = modal.querySelector('#typingSimulation').closest('label').nextElementSibling;
  if (typingHelp && typingHelp.classList.contains('help')) {
    typingHelp.textContent = t('typingSimulationHelp');
  }
  
  // Variable delays
  const delaysLabel = modal.querySelector('label:has(#variableDelays)');
  if (delaysLabel) {
    const checkbox = delaysLabel.querySelector('#variableDelays');
    delaysLabel.innerHTML = '';
    delaysLabel.appendChild(checkbox);
    delaysLabel.appendChild(document.createTextNode(` ⏱️ ${t('variableDelays')}`));
  }
  const delaysHelp = modal.querySelector('#variableDelays').closest('label').nextElementSibling;
  if (delaysHelp && delaysHelp.classList.contains('help')) {
    delaysHelp.textContent = t('variableDelaysHelp');
  }
  
  // Anti-repetition
  const antiRepLabel = modal.querySelector('label:has(#antiRepetition)');
  if (antiRepLabel) {
    const checkbox = antiRepLabel.querySelector('#antiRepetition');
    antiRepLabel.innerHTML = '';
    antiRepLabel.appendChild(checkbox);
    antiRepLabel.appendChild(document.createTextNode(` 🔄 ${t('antiRepetition')}`));
  }
  const antiRepHelp = modal.querySelector('#antiRepetition').closest('label').nextElementSibling;
  if (antiRepHelp && antiRepHelp.classList.contains('help')) {
    antiRepHelp.textContent = t('antiRepetitionHelp');
  }
  
  // Template variables
  const templateLabel = modal.querySelector('label:has(#templateVariables)');
  if (templateLabel) {
    const checkbox = templateLabel.querySelector('#templateVariables');
    templateLabel.innerHTML = '';
    templateLabel.appendChild(checkbox);
    templateLabel.appendChild(document.createTextNode(` 📝 ${t('templateVariables')}`));
  }
  const templateHelp = modal.querySelector('#templateVariables').closest('label').nextElementSibling;
  if (templateHelp && templateHelp.classList.contains('help')) {
    templateHelp.textContent = t('templateVariablesHelp');
  }
  
  // Notifications
  const notifLabel = modal.querySelector('label:has(#notificationsEnabled)');
  if (notifLabel) {
    const checkbox = notifLabel.querySelector('#notificationsEnabled');
    notifLabel.innerHTML = '';
    notifLabel.appendChild(checkbox);
    notifLabel.appendChild(document.createTextNode(` 🔔 ${t('notificationsEnabled')}`));
  }
  const notifHelp = modal.querySelector('#notificationsEnabled').closest('label').nextElementSibling;
  if (notifHelp && notifHelp.classList.contains('help')) {
    notifHelp.textContent = t('notificationsHelp');
  }
  
  // Notification sound
  const soundLabel = modal.querySelector('label:has(#notificationSound)');
  if (soundLabel) {
    const checkbox = soundLabel.querySelector('#notificationSound');
    soundLabel.innerHTML = '';
    soundLabel.appendChild(checkbox);
    soundLabel.appendChild(document.createTextNode(` 🔊 ${t('notificationSound')}`));
  }
  const soundHelp = modal.querySelector('#notificationSound').closest('label').nextElementSibling;
  if (soundHelp && soundHelp.classList.contains('help')) {
    soundHelp.textContent = t('notificationSoundHelp');
  }
  
  // Analytics
  const analyticsLabel = modal.querySelector('label:has(#analyticsEnabled)');
  if (analyticsLabel) {
    const checkbox = analyticsLabel.querySelector('#analyticsEnabled');
    analyticsLabel.innerHTML = '';
    analyticsLabel.appendChild(checkbox);
    analyticsLabel.appendChild(document.createTextNode(` 📊 ${t('analyticsEnabled')}`));
  }
  const analyticsHelp = modal.querySelector('#analyticsEnabled').closest('label').nextElementSibling;
  if (analyticsHelp && analyticsHelp.classList.contains('help')) {
    analyticsHelp.textContent = t('analyticsHelp');
  }
  
  // Daily limit
  const dailyLimitLabel = modal.querySelector('label:has(#dailyLimit)');
  if (dailyLimitLabel) {
    dailyLimitLabel.childNodes[0].textContent = t('dailyLimit') + ' ';
  }
  const dailyLimitHelp = modal.querySelector('#dailyLimit').closest('label').nextElementSibling;
  if (dailyLimitHelp && dailyLimitHelp.classList.contains('help')) {
    dailyLimitHelp.textContent = t('dailyLimitHelp');
  }
  
  // Active hours
  const activeHoursLabel = modal.querySelector('label:has(#activeHours)');
  if (activeHoursLabel) {
    const checkbox = activeHoursLabel.querySelector('#activeHours');
    activeHoursLabel.innerHTML = '';
    activeHoursLabel.appendChild(checkbox);
    activeHoursLabel.appendChild(document.createTextNode(` 🕐 ${t('activeHours')}`));
  }
  
  const startLabel = modal.querySelector('label:has(#activeHoursStart)');
  if (startLabel) startLabel.childNodes[0].textContent = t('activeHoursStart') + ' ';
  
  const endLabel = modal.querySelector('label:has(#activeHoursEnd)');
  if (endLabel) endLabel.childNodes[0].textContent = t('activeHoursEnd') + ' ';
  
  const activeHoursHelp = modal.querySelector('#activeHoursEnd').closest('label').parentElement.nextElementSibling;
  if (activeHoursHelp && activeHoursHelp.classList.contains('help')) {
    activeHoursHelp.textContent = t('activeHoursHelp');
  }
  
  // Export/Import
  modal.querySelector('#exportSettings').innerHTML = `📥 ${t('exportSettings')}`;
  modal.querySelector('#importSettings').innerHTML = `📤 ${t('importSettings')}`;
}

function localizePhraseModal() {
  const modal = document.getElementById('phraseModal');
  
  // Add new phrase
  const addLabel = modal.querySelector('label:has(#newPhraseInput)');
  if (addLabel) addLabel.childNodes[0].textContent = t('addNewPhrase') + ' ';
  modal.querySelector('#newPhraseInput').placeholder = t('addNewPlaceholder');
  modal.querySelector('#addNewPhrase').innerHTML = `➕ ${t('addPhraseBtn')}`;
  
  // Custom phrases
  modal.querySelector('strong:first-of-type').textContent = t('customPhrases') + ' ';
  
  // Default phrases
  const defaultStrong = Array.from(modal.querySelectorAll('strong')).find(el => el.textContent.includes('Default'));
  if (defaultStrong) defaultStrong.textContent = t('defaultPhrases') + ' ';
  
  const defaultHelp = modal.querySelector('#defaultPhrasesCount').parentElement.nextElementSibling;
  if (defaultHelp && defaultHelp.classList.contains('help')) {
    defaultHelp.textContent = t('defaultPhrasesHelp');
  }
}

function localizeAnalyticsModal() {
  const modal = document.getElementById('analyticsModal');
  
  // Analytics cards
  const labels = modal.querySelectorAll('.analytics-label');
  if (labels[0]) labels[0].textContent = t('analyticsMessagesToday');
  if (labels[1]) labels[1].textContent = t('analyticsTotalMessages');
  if (labels[2]) labels[2].textContent = t('analyticsStatus');
  
  // Help text
  const helps = modal.querySelectorAll('.help');
  if (helps[0]) helps[0].textContent = t('analyticsDescription');
  
  // Reset button
  modal.querySelector('#resetStats').innerHTML = `🗑️ ${t('resetStats')}`;
}

// Update status text dynamically
function updateStatusText(isActive) {
  const status = document.getElementById('autoSendStatus');
  if (status) {
    status.textContent = isActive ? `🟢 ${t('statusActive')}` : `⚪ ${t('statusInactive')}`;
  }
}

// Export functions for use in popup-enhanced.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { localizePopup, t, isRTL, updateStatusText };
}
