/* popup-enhanced.js — Enhanced AutoChat UI
   Advanced controls with analytics, settings, and smart features
*/

// ===== UTILITY FUNCTIONS =====

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
  markMessageContainer: document.getElementById('markMessageContainer'),
  messageContainerStatus: document.getElementById('messageContainerStatus'),
  messageList: document.getElementById('messageList'),
  sendMode: document.getElementById('sendMode'),
  minInterval: document.getElementById('minInterval'),
  maxInterval: document.getElementById('maxInterval'),

  // Send method
  sendMethod: document.getElementById('sendMethod'),
  markSendButton: document.getElementById('markSendButton'),
  sendButtonStatus: document.getElementById('sendButtonStatus'),

  // Advanced Settings
  dailyLimit: document.getElementById('dailyLimit'),
  typingSimulation: document.getElementById('typingSimulation'),
  variableDelays: document.getElementById('variableDelays'),
  antiRepetition: document.getElementById('antiRepetition'),
  templateVariables: document.getElementById('templateVariables'),
  activeHours: document.getElementById('activeHours'),
  activeHoursStart: document.getElementById('activeHoursStart'),
  activeHoursEnd: document.getElementById('activeHoursEnd'),

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
let currentTab = 'basic'; // basic, advanced, analytics

// ===== NOTIFICATIONS =====

function showNotification(message, isSuccess = true) {
  const notification = elements.notification;
  notification.textContent = message;
  notification.className = 'notification ' + (isSuccess ? 'success' : 'error') + ' show';

  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}

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

  // Update message container status
  chrome.storage.local.get(['messageContainerSelector'], (data) => {
    if (elements.messageContainerStatus) {
      if (data && data.messageContainerSelector) {
        elements.messageContainerStatus.textContent = '✅ Message container marked';
        elements.messageContainerStatus.className = 'status success';
      } else {
        elements.messageContainerStatus.textContent = 'No message container marked';
        elements.messageContainerStatus.className = 'status';
      }
    }
  });

  // Update send method UI
  chrome.storage.local.get(['sendMethod', 'sendButtonSelector'], (data) => {
    const method = data.sendMethod || 'enter';
    if (elements.sendMethod) elements.sendMethod.value = method;
    if (elements.markSendButton) {
      elements.markSendButton.style.display = method === 'click' ? 'inline-block' : 'none';
    }
    if (elements.sendButtonStatus) {
      if (method === 'click') {
        elements.sendButtonStatus.textContent = data.sendButtonSelector ? '✅ Send button marked' : 'If you choose "Click a Send button", please mark the button.';
      } else {
        elements.sendButtonStatus.textContent = '';
      }
    }
  });
}

async function updateStats() {
  try {
    const stats = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getStats' }, resolve);
    });

    if (stats) {
      elements.messagesSentToday.textContent = stats.messagesSentToday || 0;
      elements.totalMessages.textContent = stats.totalMessagesSent || 0;
      
      // Use localized status if available
      const statusText = stats.isAutoSendActive ? 
        (typeof t === 'function' ? t('statusActive') : 'Active') : 
        (typeof t === 'function' ? t('statusInactive') : 'Inactive');
      const statusIcon = stats.isAutoSendActive ? '🟢' : '⚪';
      elements.autoSendStatus.textContent = `${statusIcon} ${statusText}`;
      elements.autoSendStatus.className = 'status ' + (stats.isAutoSendActive ? 'success' : '');
      
      // Update analytics modal if visible
      const analyticsStatus = document.getElementById('analyticsStatus');
      if (analyticsStatus) {
        analyticsStatus.textContent = statusText;
      }
    }
  } catch (e) {
    console.error('[Popup] Failed to get stats:', e);
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
        <div class="phrase-text" title="${phrase.replace(/"/g, '&quot;')}">${phrase}</div>
        <div class="phrase-actions">
          <button class="btn-small delete" data-index="${index}">✖</button>
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
        <div class="phrase-text" title="${phrase.replace(/"/g, '&quot;')}">${phrase}</div>
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

// Mark input field
document.getElementById('markInput')?.addEventListener('click', async () => {
  await sendMessageToContent({ action: 'startMarkingMode' });
  window.close();
});

// Mark message container
elements.markMessageContainer?.addEventListener('click', async () => {
  await sendMessageToContent({ action: 'startMarkingMessageContainerMode' });
  window.close();
});

// Send method change
elements.sendMethod?.addEventListener('change', (e) => {
  const method = e.target.value;
  chrome.storage.local.set({ sendMethod: method }, () => {
    if (elements.markSendButton) {
      elements.markSendButton.style.display = method === 'click' ? 'inline-block' : 'none';
    }
    if (elements.sendButtonStatus) {
      elements.sendButtonStatus.textContent = method === 'click' ? 'If you choose "Click a Send button", please mark the button.' : '';
    }
  });
});

// Mark send button
elements.markSendButton?.addEventListener('click', async () => {
  await sendMessageToContent({ action: 'startMarkingSendButtonMode' });
  window.close();
});

// Send message once
document.getElementById('sendOnce')?.addEventListener('click', async () => {
  const messages = getMessages();
  if (messages.length === 0) {
    showNotification('Please enter at least one message', false);
    return;
  }

  const { sendMethod, sendButtonSelector } = await new Promise(resolve => {
    chrome.storage.local.get(['sendMethod', 'sendButtonSelector'], resolve);
  });
  if ((sendMethod || 'enter') === 'click' && !sendButtonSelector) {
    showNotification('Please mark a Send button or switch method to Enter.', false);
    return;
  }

  const randomMsg = messages[Math.floor(Math.random() * messages.length)];
  const response = await sendMessageToContent({
    action: 'sendMessage',
    text: randomMsg
  });

  if (response && response.ok) {
    showNotification('Message sent: ' + randomMsg.substring(0, 30) + '...', true);
    updateStats();
  } else {
    showNotification('Failed to send. Mark an input field first.', false);
  }
});

// Start auto-send
document.getElementById('startAutoSend')?.addEventListener('click', async () => {
  const messages = getMessages();
  if (messages.length === 0) {
    showNotification('Please enter at least one message', false);
    return;
  }

  const mode = elements.sendMode.value;
  const minInterval = parseInt(elements.minInterval.value) || 1;
  const maxInterval = parseInt(elements.maxInterval.value) || 2;

  if (minInterval > maxInterval) {
    showNotification('Min interval must be ≤ max interval', false);
    return;
  }

  // Validate send method if needed
  const { sendMethod, sendButtonSelector } = await new Promise(resolve => {
    chrome.storage.local.get(['sendMethod', 'sendButtonSelector'], resolve);
  });
  if ((sendMethod || 'enter') === 'click' && !sendButtonSelector) {
    showNotification('Please mark a Send button or switch method to Enter.', false);
    return;
  }

  // Build config object
  const config = {
    mode,
    minInterval,
    maxInterval,
    dailyLimit: parseInt(elements.dailyLimit.value) || 0,
    enableTypingSimulation: elements.typingSimulation.checked,
    enableVariableDelays: elements.variableDelays.checked,
    enableAntiRepetition: elements.antiRepetition.checked,
    templateVariablesEnabled: elements.templateVariables.checked,
    activeHoursEnabled: elements.activeHours.checked,
    activeHoursStart: parseInt(elements.activeHoursStart.value) || 9,
    activeHoursEnd: parseInt(elements.activeHoursEnd.value) || 22,
    sendMethod: (sendMethod || 'enter')
  };

  const response = await sendMessageToContent({
    action: 'startAutoSend',
    messages,
    config
  });

  if (response && response.ok) {
    showNotification(`Auto-send started! Mode: ${mode}, ${minInterval}-${maxInterval}m`, true);
    updateStats();
  } else {
    showNotification('Failed to start. Mark an input field first.', false);
  }
});

// Stop auto-send
document.getElementById('stopAutoSend')?.addEventListener('click', async () => {
  await sendMessageToContent({ action: 'stopAutoSend' });
  showNotification('Auto-send stopped', true);
  updateStats();
});

// Load default phrases
document.getElementById('loadDefaultPhrases')?.addEventListener('click', async () => {
  await loadDefaultPhrasesFromFile();
  await loadCustomPhrases();

  const allPhrases = [...customPhrases, ...defaultPhrases];
  if (allPhrases.length === 0) {
    showNotification('No phrases available to load', false);
    return;
  }

  elements.messageList.value = allPhrases.join('\n');
  chrome.storage.local.set({ messageList: elements.messageList.value });
  showNotification(`Loaded ${allPhrases.length} phrases (${customPhrases.length} custom + ${defaultPhrases.length} default)`, true);
});

// Manage phrases
document.getElementById('managePhrases')?.addEventListener('click', async () => {
  await loadDefaultPhrasesFromFile();
  await loadCustomPhrases();
  renderPhrasesList();
  elements.phraseModal.classList.add('show');
});

// Settings modal
document.getElementById('openSettings')?.addEventListener('click', () => {
  elements.settingsModal.classList.add('show');
});

// Analytics modal
document.getElementById('openAnalytics')?.addEventListener('click', async () => {
  await updateStats();
  elements.analyticsModal.classList.add('show');
});

// Close modals
document.querySelectorAll('.close-modal').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.target.closest('.modal').classList.remove('show');
  });
});

// Close modal on background click
document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('show');
    }
  });
});

// Add new phrase
document.getElementById('addNewPhrase')?.addEventListener('click', () => {
  const phrase = elements.newPhraseInput.value.trim();
  if (!phrase) {
    showNotification('Please enter a phrase', false);
    return;
  }

  if (addCustomPhrase(phrase)) {
    elements.newPhraseInput.value = '';
    renderPhrasesList();
    showNotification('Phrase added!', true);
  } else {
    showNotification('This phrase already exists or is empty', false);
  }
});

// Active hours toggle
elements.activeHours?.addEventListener('change', (e) => {
  const hoursInputs = document.getElementById('activeHoursInputs');
  if (hoursInputs) {
    hoursInputs.style.display = e.target.checked ? 'flex' : 'none';
  }
});

// Export settings
document.getElementById('exportSettings')?.addEventListener('click', () => {
  chrome.storage.local.get(null, (data) => {
    const settings = {
      version: '4.0',
      settings: data,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `autochat-settings-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showNotification('Settings exported!', true);
  });
});

// Import settings
document.getElementById('importSettings')?.addEventListener('click', () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';

  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.settings) {
          chrome.storage.local.set(data.settings, () => {
            showNotification('Settings imported! Reload the page.', true);
            setTimeout(() => location.reload(), 1500);
          });
        }
      } catch (err) {
        showNotification('Failed to import settings', false);
      }
    };
    reader.readAsText(file);
  };

  input.click();
});

// Reset stats
document.getElementById('resetStats')?.addEventListener('click', () => {
  if (confirm('Reset all statistics? This cannot be undone.')) {
    chrome.storage.local.set({
      messagesSentToday: 0,
      totalMessagesSent: 0,
      lastResetDate: new Date().toDateString()
    }, () => {
      showNotification('Statistics reset', true);
      updateStats();
    });
  }
});

// ===== LOAD/SAVE SETTINGS =====

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
    ,'sendConfirmTimeout'
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
    if (data.sendConfirmTimeout) elements.sendConfirmTimeout.value = data.sendConfirmTimeout;

    // Show/hide active hours inputs
    const hoursInputs = document.getElementById('activeHoursInputs');
    if (hoursInputs) {
      hoursInputs.style.display = elements.activeHours.checked ? 'flex' : 'none';
    }
  });
}

function saveSettings() {
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
    ,sendConfirmTimeout: elements.sendConfirmTimeout ? elements.sendConfirmTimeout.value : 3
  };

  chrome.storage.local.set(settings);
}

// Auto-save on input
elements.messageList.addEventListener('input', saveSettings);
elements.sendMode.addEventListener('change', saveSettings);
elements.minInterval.addEventListener('change', saveSettings);
elements.maxInterval.addEventListener('change', saveSettings);
elements.dailyLimit?.addEventListener('change', saveSettings);
elements.typingSimulation?.addEventListener('change', saveSettings);
elements.variableDelays?.addEventListener('change', saveSettings);
elements.antiRepetition?.addEventListener('change', saveSettings);
elements.templateVariables?.addEventListener('change', saveSettings);
elements.activeHours?.addEventListener('change', saveSettings);
elements.activeHoursStart?.addEventListener('change', saveSettings);
elements.activeHoursEnd?.addEventListener('change', saveSettings);

// ===== LOCALIZATION =====

// Language selector
const languageSelect = document.getElementById('languageSelect');
if (languageSelect) {
  // Load saved language
  chrome.storage.local.get(['locale'], (data) => {
    const savedLocale = data.locale || chrome.i18n.getUILanguage().split('-')[0];
    if (languageSelect.querySelector(`option[value="${savedLocale}"]`)) {
      languageSelect.value = savedLocale;
    }
  });

  // Handle language change
  languageSelect.addEventListener('change', (e) => {
    const newLocale = e.target.value;
    chrome.storage.local.set({ locale: newLocale }, () => {
      showNotification('Language changed! Please reload the extension.', true);
      // Reload after 1.5 seconds
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    });
  });
}

// Initialize localization on load
if (typeof localizePopup === 'function') {
  localizePopup();
}

// ===== INITIALIZATION =====

(async function init() {
  await updateInputStatus();
  await updateStats();
  loadSettings();
  await loadDefaultPhrasesFromFile();
  await loadCustomPhrases();

  // Auto-load phrases if empty
  chrome.storage.local.get(['messageList'], async (data) => {
    if (!data.messageList || data.messageList.trim() === '') {
      const allPhrases = [...customPhrases, ...defaultPhrases];
      if (allPhrases.length > 0) {
        elements.messageList.value = allPhrases.join('\n');
        chrome.storage.local.set({ messageList: elements.messageList.value });
      }
    }
  });

  // Update stats every 5 seconds
  setInterval(updateStats, 5000);
})();
