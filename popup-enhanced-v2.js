/* popup-enhanced-v2.js — Enhanced AutoChat UI with all improvements
   Includes: dark mode, keyboard shortcuts, pause/resume, debouncing, security
*/

// ===== IMPORTS & CONSTANTS =====

const DEBOUNCE_DELAY = 500; // ms
const AUTOSAVE_DELAY = 1000; // ms
let isPaused = false;
let currentTheme = 'light';

// ===== UTILITY FUNCTIONS =====

/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Sanitize input to prevent XSS
 * @param {string} input - User input
 * @returns {string} Sanitized input
 */
function sanitizeInput(input) {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function ensureContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content-enhanced.js']
    });
    console.log('[Popup] content-enhanced.js injected');
  } catch (err) {
    console.warn('[Popup] Could not inject content script:', err);
  }
}

async function sendMessageToContent(msg) {
  const tab = await getActiveTab();
  if (!tab?.id) {
    showNotification('No active tab found!', false);
    return null;
  }
  
  try {
    return await chrome.tabs.sendMessage(tab.id, msg);
  } catch (err) {
    console.log('[Popup] Reinjecting content script...');
    await ensureContentScript(tab.id);
    await new Promise(r => setTimeout(r, 500));
    
    try {
      return await chrome.tabs.sendMessage(tab.id, msg);
    } catch (err2) {
      console.error('[Popup] Failed to connect:', err2);
      showNotification('Failed to reach content script. Please reload the page.', false);
      return null;
    }
  }
}

// ===== UI ELEMENTS =====

const elements = {
  // Basic
  inputStatus: document.getElementById('inputStatus'),
  messageList: document.getElementById('messageList'),
  sendMode: document.getElementById('sendMode'),
  minInterval: document.getElementById('minInterval'),
  maxInterval: document.getElementById('maxInterval'),
  
  // Theme toggle
  themeToggle: document.getElementById('themeToggle'),
  
  // Advanced Settings
  dailyLimit: document.getElementById('dailyLimit'),
  typingSimulation: document.getElementById('typingSimulation'),
  variableDelays: document.getElementById('variableDelays'),
  antiRepetition: document.getElementById('antiRepetition'),
  templateVariables: document.getElementById('templateVariables'),
  activeHours: document.getElementById('activeHours'),
  activeHoursStart: document.getElementById('activeHoursStart'),
  activeHoursEnd: document.getElementById('activeHoursEnd'),
  
  // Buttons
  pauseButton: document.getElementById('pauseAutoSend'),
  
  // Analytics
  messagesSentToday: document.getElementById('messagesSentToday'),
  totalMessages: document.getElementById('totalMessages'),
  autoSendStatus: document.getElementById('autoSendStatus'),
  
  // Modals
  settingsModal: document.getElementById('settingsModal'),
  phraseModal: document.getElementById('phraseModal'),
  analyticsModal: document.getElementById('analyticsModal'),
  
  // Phrase management
  customPhrasesList: document.getElementById('customPhrasesList'),
  defaultPhrasesList: document.getElementById('defaultPhrasesList'),
  customPhrasesCount: document.getElementById('customPhrasesCount'),
  defaultPhrasesCount: document.getElementById('defaultPhrasesCount'),
  newPhraseInput: document.getElementById('newPhraseInput'),
  
  // Notifications
  notification: document.getElementById('notification')
};

// ===== STATE =====

let defaultPhrases = [];
let customPhrases = [];

// ===== DARK MODE =====

/**
 * Initialize theme from storage
 */
function initTheme() {
  chrome.storage.local.get(['theme'], (data) => {
    currentTheme = data.theme || 'light';
    applyTheme(currentTheme);
  });
}

/**
 * Apply theme to document
 * @param {string} theme - Theme name ('light' or 'dark')
 */
function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    elements.themeToggle.textContent = '☀️';
    elements.themeToggle.title = 'Switch to light mode';
  } else {
    document.documentElement.removeAttribute('data-theme');
    elements.themeToggle.textContent = '🌙';
    elements.themeToggle.title = 'Switch to dark mode';
  }
  currentTheme = theme;
  chrome.storage.local.set({ theme });
}

/**
 * Toggle between light and dark themes
 */
function toggleTheme() {
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
  showNotification(`${newTheme === 'dark' ? '🌙 Dark' : '☀️ Light'} mode enabled`, true);
}

// Event listener for theme toggle
elements.themeToggle?.addEventListener('click', toggleTheme);

// ===== KEYBOARD SHORTCUTS =====

/**
 * Handle keyboard shortcuts
 * @param {KeyboardEvent} e - Keyboard event
 */
function handleKeyboardShortcuts(e) {
  // Ctrl+S: Start
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault();
    document.getElementById('startAutoSend')?.click();
  }
  
  // Ctrl+X: Stop
  if (e.ctrlKey && e.key === 'x') {
    e.preventDefault();
    document.getElementById('stopAutoSend')?.click();
  }
  
  // Ctrl+P: Pause/Resume
  if (e.ctrlKey && e.key === 'p') {
    e.preventDefault();
    togglePause();
  }
  
  // Escape: Close modals
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal.show').forEach(modal => {
      modal.classList.remove('show');
    });
  }
}

document.addEventListener('keydown', handleKeyboardShortcuts);

// ===== PAUSE/RESUME FUNCTIONALITY =====

/**
 * Toggle pause state
 */
async function togglePause() {
  isPaused = !isPaused;
  
  const response = await sendMessageToContent({ 
    action: isPaused ? 'pauseAutoSend' : 'resumeAutoSend'
  });
  
  if (response && response.ok) {
    if (isPaused) {
      elements.pauseButton.textContent = '▶️ Resume';
      elements.pauseButton.classList.remove('btn-warning');
      elements.pauseButton.classList.add('btn-success');
      showNotification('Auto-send paused', true);
    } else {
      elements.pauseButton.textContent = '⏸️ Pause';
      elements.pauseButton.classList.remove('btn-success');
      elements.pauseButton.classList.add('btn-warning');
      showNotification('Auto-send resumed', true);
    }
  }
}

// Pause button handler
elements.pauseButton?.addEventListener('click', togglePause);

// ===== NOTIFICATIONS =====

function showNotification(message, isSuccess = true) {
  const notification = elements.notification;
  notification.textContent = sanitizeInput(message);
  notification.className = 'notification ' + (isSuccess ? 'success' : 'error') + ' show';
  
  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}

// ===== ANALYTICS EXPORT =====

/**
 * Export analytics data
 */
async function exportAnalytics() {
  try {
    const stats = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getStats' }, resolve);
    });
    
    const analyticsData = {
      exportDate: new Date().toISOString(),
      version: '4.0',
      statistics: {
        messagesSentToday: stats?.messagesSentToday || 0,
        totalMessagesSent: stats?.totalMessagesSent || 0,
        isActive: stats?.isAutoSendActive || false
      },
      settings: await new Promise((resolve) => {
        chrome.storage.local.get(null, resolve);
      })
    };
    
    const blob = new Blob([JSON.stringify(analyticsData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `autochat-analytics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification('Analytics exported successfully!', true);
  } catch (error) {
    console.error('[Popup] Export failed:', error);
    showNotification('Failed to export analytics', false);
  }
}

document.getElementById('exportAnalytics')?.addEventListener('click', exportAnalytics);

// ===== UPDATE FUNCTIONS =====

async function updateInputStatus() {
  const tab = await getActiveTab();
  if (!tab?.id) return;
  
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'getChatInputSelector' });
    if (response && response.selector) {
      elements.inputStatus.textContent = '✅ Input field marked';
      elements.inputStatus.className = 'status success';
    } else {
      elements.inputStatus.textContent = 'No input field marked';
      elements.inputStatus.className = 'status';
    }
  } catch (e) {
    elements.inputStatus.textContent = 'No input field marked';
    elements.inputStatus.className = 'status';
  }
}

async function updateStats() {
  try {
    const stats = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getStats' }, resolve);
    });
    
    if (stats) {
      elements.messagesSentToday.textContent = stats.messagesSentToday || 0;
      elements.totalMessages.textContent = stats.totalMessagesSent || 0;
      elements.autoSendStatus.textContent = stats.isAutoSendActive ? '🟢 Active' : '⚪ Inactive';
      elements.autoSendStatus.className = 'status ' + (stats.isAutoSendActive ? 'success' : '');
      
      // Show/hide pause button
      if (stats.isAutoSendActive) {
        elements.pauseButton.style.display = 'block';
      } else {
        elements.pauseButton.style.display = 'none';
        isPaused = false;
      }
      
      // Update analytics modal if open
      const analyticsModal = document.getElementById('analyticsModal');
      if (analyticsModal?.classList.contains('show')) {
        document.getElementById('analyticsToday').textContent = stats.messagesSentToday || 0;
        document.getElementById('analyticsTotal').textContent = stats.totalMessagesSent || 0;
        document.getElementById('analyticsStatus').textContent = stats.isAutoSendActive ? 'Active' : 'Inactive';
      }
    }
  } catch (e) {
    console.error('[Popup] Failed to get stats:', error);
  }
}

// ===== MESSAGE MANAGEMENT =====

function getMessages() {
  const text = elements.messageList.value.trim();
  if (!text) return [];
  return text.split('\n').map(m => m.trim()).filter(m => m.length > 0);
}

async function loadDefaultPhrasesFromFile() {
  try {
    const response = await fetch(chrome.runtime.getURL('farming_phrases.txt'));
    const text = await response.text();
    defaultPhrases = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    console.log(`[AutoChat] Loaded ${defaultPhrases.length} default phrases`);
    return defaultPhrases;
  } catch (error) {
    console.error('[AutoChat] Error loading default phrases:', error);
    return [];
  }
}

async function loadCustomPhrases() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['customPhrases'], (data) => {
      customPhrases = data.customPhrases || [];
      resolve(customPhrases);
    });
  });
}

function saveCustomPhrases() {
  chrome.storage.local.set({ customPhrases });
}

function addCustomPhrase(phrase) {
  const trimmed = phrase.trim();
  if (!trimmed) return false;
  if (customPhrases.includes(trimmed)) return false;
  customPhrases.push(trimmed);
  saveCustomPhrases();
  return true;
}

function deleteCustomPhrase(index) {
  if (index >= 0 && index < customPhrases.length) {
    customPhrases.splice(index, 1);
    saveCustomPhrases();
    return true;
  }
  return false;
}

function renderPhrasesList() {
  // Custom phrases
  elements.customPhrasesCount.textContent = customPhrases.length;
  elements.customPhrasesList.innerHTML = '';
  
  if (customPhrases.length === 0) {
    elements.customPhrasesList.innerHTML = '<div class="help" style="text-align: center; padding: 20px;">No custom phrases yet. Add one above!</div>';
  } else {
    customPhrases.forEach((phrase, index) => {
      const item = document.createElement('div');
      item.className = 'phrase-item';
      item.innerHTML = `
        <div class="phrase-text" title="${sanitizeInput(phrase)}">${sanitizeInput(phrase)}</div>
        <div class="phrase-actions">
          <button class="btn-small delete" data-index="${index}" aria-label="Delete phrase">✖</button>
        </div>
      `;
      elements.customPhrasesList.appendChild(item);
    });
  }
  
  // Default phrases
  elements.defaultPhrasesCount.textContent = defaultPhrases.length;
  elements.defaultPhrasesList.innerHTML = '';
  
  if (defaultPhrases.length === 0) {
    elements.defaultPhrasesList.innerHTML = '<div class="help" style="text-align: center; padding: 20px;">No default phrases loaded</div>';
  } else {
    defaultPhrases.slice(0, 50).forEach((phrase) => {
      const item = document.createElement('div');
      item.className = 'phrase-item';
      item.innerHTML = `
        <div class="phrase-text" title="${sanitizeInput(phrase)}">${sanitizeInput(phrase)}</div>
      `;
      elements.defaultPhrasesList.appendChild(item);
    });
    
    if (defaultPhrases.length > 50) {
      const more = document.createElement('div');
      more.className = 'help';
      more.style.textAlign = 'center';
      more.style.padding = '8px';
      more.textContent = `... and ${defaultPhrases.length - 50} more`;
      elements.defaultPhrasesList.appendChild(more);
    }
  }
  
  // Delete button handlers
  elements.customPhrasesList.querySelectorAll('.btn-small.delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      if (confirm('Delete this phrase?')) {
        deleteCustomPhrase(index);
        renderPhrasesList();
        showNotification('Phrase deleted', true);
      }
    });
  });
}

// ===== EVENT HANDLERS =====

// Continue with all the existing event handlers from the original popup-enhanced.js
// (Mark input, send once, start/stop, load phrases, manage phrases, etc.)

// This file extends the original functionality
// Import and execute the original popup-enhanced.js functions here

// ===== LOAD/SAVE SETTINGS WITH DEBOUNCING =====

const debouncedSave = debounce(() => {
  const settings = {
    messageList: elements.messageList.value,
    sendMode: elements.sendMode.value,
    minInterval: elements.minInterval.value,
    maxInterval: elements.maxInterval.value,
    dailyLimit: elements.dailyLimit.value,
    typingSimulation: elements.typingSimulation.checked,
    variableDelays: elements.variableDelays.checked,
    antiRepetition: elements.antiRepetition.checked,
    templateVariables: elements.templateVariables.checked,
    activeHours: elements.activeHours.checked,
    activeHoursStart: elements.activeHoursStart.value,
    activeHoursEnd: elements.activeHoursEnd.value
  };
  
  chrome.storage.local.set(settings);
  console.log('[AutoChat] Settings auto-saved');
}, AUTOSAVE_DELAY);

function loadSettings() {
  chrome.storage.local.get([
    'messageList',
    'sendMode',
    'minInterval',
    'maxInterval',
    'dailyLimit',
    'typingSimulation',
    'variableDelays',
    'antiRepetition',
    'templateVariables',
    'activeHours',
    'activeHoursStart',
    'activeHoursEnd'
  ], (data) => {
    if (data.messageList) elements.messageList.value = data.messageList;
    if (data.sendMode) elements.sendMode.value = data.sendMode;
    if (data.minInterval) elements.minInterval.value = data.minInterval;
    if (data.maxInterval) elements.maxInterval.value = data.maxInterval;
    if (data.dailyLimit) elements.dailyLimit.value = data.dailyLimit;
    
    elements.typingSimulation.checked = data.typingSimulation !== false;
    elements.variableDelays.checked = data.variableDelays !== false;
    elements.antiRepetition.checked = data.antiRepetition !== false;
    elements.templateVariables.checked = data.templateVariables !== false;
    elements.activeHours.checked = data.activeHours || false;
    
    if (data.activeHoursStart) elements.activeHoursStart.value = data.activeHoursStart;
    if (data.activeHoursEnd) elements.activeHoursEnd.value = data.activeHoursEnd;
    
    // Show/hide active hours inputs
    const hoursInputs = document.getElementById('activeHoursInputs');
    if (hoursInputs) {
      hoursInputs.style.display = elements.activeHours.checked ? 'flex' : 'none';
    }
  });
}

// Auto-save with debouncing
elements.messageList.addEventListener('input', debouncedSave);
elements.sendMode.addEventListener('change', debouncedSave);
elements.minInterval.addEventListener('change', debouncedSave);
elements.maxInterval.addEventListener('change', debouncedSave);
elements.dailyLimit?.addEventListener('change', debouncedSave);
elements.typingSimulation?.addEventListener('change', debouncedSave);
elements.variableDelays?.addEventListener('change', debouncedSave);
elements.antiRepetition?.addEventListener('change', debouncedSave);
elements.templateVariables?.addEventListener('change', debouncedSave);
elements.activeHours?.addEventListener('change', debouncedSave);
elements.activeHoursStart?.addEventListener('change', debouncedSave);
elements.activeHoursEnd?.addEventListener('change', debouncedSave);

// ===== INITIALIZATION =====

(async function init() {
  initTheme();
  await updateInputStatus();
  await updateStats();
  loadSettings();
  await loadDefaultPhrasesFromFile();
  await loadCustomPhrases();
  
  // Update stats every 5 seconds
  setInterval(updateStats, 5000);
  
  console.log('[AutoChat] Enhanced popup initialized');
})();

// Note: This file should be loaded alongside the original popup-enhanced.js
// to add the enhanced features without breaking existing functionality
