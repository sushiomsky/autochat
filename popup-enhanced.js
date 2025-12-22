/* popup-enhanced.js — Enhanced AutoChat UI
  Advanced controls with analytics, settings, and smart features
*/
/* global t, localizePopup */
import { getMainChartConfig, getHourlyChartConfig } from './src/chart-config.js';

// ===== UTILITY FUNCTIONS =====

function sanitizeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
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
  sendConfirmTimeout: document.getElementById('sendConfirmTimeout'),

  // Mention Detection
  mentionDetectionEnabled: document.getElementById('mentionDetectionEnabled'),
  aiAutoRepliesEnabled: document.getElementById('aiAutoRepliesEnabled'),
  mentionKeywords: document.getElementById('mentionKeywords'),
  mentionReplyMessages: document.getElementById('mentionReplyMessages'),

  // Chat Logging
  chatLoggingEnabled: document.getElementById('chatLoggingEnabled'),
  viewChatLogs: document.getElementById('viewChatLogs'),
  openChatLogs: document.getElementById('openChatLogs'),

  // Manual Detection
  manualDetectionEnabled: document.getElementById('manualDetectionEnabled'),
  manualDetectionStatus: document.getElementById('manualDetectionStatus'),

  // Notifications
  notificationsEnabled: document.getElementById('notificationsEnabled'),
  notificationSound: document.getElementById('notificationSound'),

  // Account Management
  accountSelect: document.getElementById('accountSelect'),
  manageAccounts: document.getElementById('manageAccounts'),
  newAccountName: document.getElementById('newAccountName'),
  newAccountDomains: document.getElementById('newAccountDomains'),
  createAccount: document.getElementById('createAccount'),
  accountList: document.getElementById('accountList'),

  // Analytics
  messagesSentToday: document.getElementById('messagesSentToday'),
  totalMessages: document.getElementById('totalMessages'),
  autoSendStatus: document.getElementById('autoSendStatus'),

  // Modals
  settingsModal: document.getElementById('settingsModal'),
  phraseModal: document.getElementById('phraseModal'),
  analyticsModal: document.getElementById('analyticsModal'),
  accountModal: document.getElementById('accountModal'),
  webhookModal: document.getElementById('webhookModal'),
  donationModal: document.getElementById('donationModal'),
  performanceModal: document.getElementById('performanceModal'),

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
const defaultProfile = {
  id: 'default',
  name: 'Default Account',
  settings: {}
};
let currentAccount = 'default';
let accounts = { 'default': defaultProfile };

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

// ===== ENHANCED STATS ANIMATIONS =====

function updateStatWithAnimation(elementId, value) {
  const element = document.getElementById(elementId);
  if (element && element.textContent !== value.toString()) {
    element.textContent = value;
    element.classList.add('updated');
    setTimeout(() => element.classList.remove('updated'), 500);
  }
}

async function updateStats() {
  loadSchedules();
  try {
    const stats = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getStats' }, resolve);
    });

    if (stats) {
      // Use animated stat updates
      updateStatWithAnimation('messagesSentToday', stats.messagesSentToday || 0);
      updateStatWithAnimation('totalMessages', stats.totalMessagesSent || 0);

      // Update analytics modal stats
      updateStatWithAnimation('analyticsToday', stats.messagesSentToday || 0);
      updateStatWithAnimation('analyticsTotal', stats.totalMessagesSent || 0);

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
    // Get current locale from storage or use browser default
    const storageData = await new Promise(resolve => {
      chrome.storage.local.get(['locale'], resolve);
    });
    const locale = storageData.locale || chrome.i18n.getUILanguage().split('-')[0] || 'en';

    // Try to load language-specific phrases, fallback to English
    let phraseFile = `farming_phrases_${locale}.txt`;
    let response;

    try {
      response = await fetch(chrome.runtime.getURL(phraseFile));
      if (!response.ok) throw new Error('File not found');
    } catch (err) {
      console.log(`[AutoChat] ${phraseFile} not found, falling back to English`);
      phraseFile = 'farming_phrases_en.txt';
      response = await fetch(chrome.runtime.getURL(phraseFile));
    }

    const text = await response.text();
    defaultPhrases = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    console.log(`[AutoChat] Loaded ${defaultPhrases.length} default phrases from ${phraseFile}`);
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

  // Check both custom and default phrases for duplicates
  const allPhrases = [...customPhrases, ...defaultPhrases];
  if (allPhrases.some(p => p.toLowerCase() === trimmed.toLowerCase())) {
    return false;
  }

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

// ===== WEBHOOK MANAGEMENT =====

let webhookManager = null;

// Load webhook module
async function initializeWebhookManager() {
  if (!webhookManager) {
    // Simple inline webhook manager
    webhookManager = {
      webhooks: [],
      enabled: true,
      async load() {
        const data = await new Promise(resolve => {
          chrome.storage.local.get(['webhooks', 'webhooksEnabled'], resolve);
        });
        this.webhooks = data.webhooks || [];
        this.enabled = data.webhooksEnabled !== false;
      },
      async save() {
        await new Promise(resolve => {
          chrome.storage.local.set({
            webhooks: this.webhooks,
            webhooksEnabled: this.enabled
          }, resolve);
        });
      },
      generateId() {
        return `webhook_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      },
      add(webhook) {
        const newWebhook = {
          id: this.generateId(),
          name: webhook.name || 'Unnamed Webhook',
          url: webhook.url,
          events: webhook.events || [],
          method: webhook.method || 'POST',
          headers: webhook.headers || {},
          enabled: true,
          createdAt: new Date().toISOString(),
          triggerCount: 0,
          failureCount: 0,
          lastTriggered: null
        };
        this.webhooks.push(newWebhook);
        return newWebhook;
      },
      update(id, updates) {
        const webhook = this.webhooks.find(w => w.id === id);
        if (webhook) {
          Object.assign(webhook, updates);
        }
        return webhook;
      },
      delete(id) {
        const index = this.webhooks.findIndex(w => w.id === id);
        if (index !== -1) {
          this.webhooks.splice(index, 1);
        }
      },
      getAll() {
        return this.webhooks;
      },
      getStats() {
        return {
          total: this.webhooks.length,
          enabled: this.webhooks.filter(w => w.enabled).length,
          totalTriggers: this.webhooks.reduce((sum, w) => sum + w.triggerCount, 0),
          totalFailures: this.webhooks.reduce((sum, w) => sum + w.failureCount, 0)
        };
      },
      async test(id) {
        const webhook = this.webhooks.find(w => w.id === id);
        if (!webhook) {
          throw new Error('Webhook not found');
        }

        try {
          const response = await fetch(webhook.url, {
            method: webhook.method,
            headers: {
              'Content-Type': 'application/json',
              ...webhook.headers
            },
            body: JSON.stringify({
              event: 'test',
              timestamp: new Date().toISOString(),
              data: { test: true, message: 'Test webhook from AutoChat' },
              source: 'AutoChat',
              version: chrome.runtime.getManifest().version
            })
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          showNotification(`✅ Webhook "${webhook.name}" tested successfully!`, true);
          return true;
        } catch (error) {
          showNotification(`❌ Webhook test failed: ${error.message}`, false);
          return false;
        }
      }
    };
    await webhookManager.load();
  }
  return webhookManager;
}

// Render webhook list
async function renderWebhookList() {
  await initializeWebhookManager();
  const webhookList = document.getElementById('webhookList');
  const webhookCount = document.getElementById('webhookCount');

  if (!webhookList) return;

  const webhooks = webhookManager.getAll();
  webhookCount.textContent = webhooks.length;

  if (webhooks.length === 0) {
    webhookList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔗</div>
        <div class="empty-state-text">No webhooks configured yet. Add your first webhook to get started!</div>
      </div>
    `;
    return;
  }

  webhookList.innerHTML = webhooks.map(webhook => `
    <div class="webhook-item ${webhook.enabled ? '' : 'disabled'}">
      <div class="webhook-header">
        <span class="webhook-name">${sanitizeHTML(webhook.name)}</span>
        <div class="webhook-actions">
          <button class="btn-toggle ${webhook.enabled ? 'enabled' : ''}" data-id="${webhook.id}">
            ${webhook.enabled ? '✅' : '❌'}
          </button>
          <button class="btn-test" data-id="${webhook.id}">🧪 Test</button>
          <button class="btn-delete" data-id="${webhook.id}">🗑️</button>
        </div>
      </div>
      <div class="webhook-details">
        <div class="webhook-detail-row">
          <span class="webhook-detail-label">URL:</span>
          <span class="webhook-detail-value">${sanitizeHTML(webhook.url)}</span>
        </div>
        <div class="webhook-detail-row">
          <span class="webhook-detail-label">Method:</span>
          <span class="webhook-detail-value">${webhook.method}</span>
        </div>
        <div class="webhook-detail-row">
          <span class="webhook-detail-label">Events:</span>
          <div class="webhook-events">
            ${webhook.events.map(e => `<span class="webhook-event-tag">${e.replace('_', ' ')}</span>`).join('')}
          </div>
        </div>
      </div>
      <div class="webhook-item-stats">
        <div class="webhook-stat">
          <span class="webhook-stat-label">Triggers</span>
          <span class="webhook-stat-value success">${webhook.triggerCount || 0}</span>
        </div>
        <div class="webhook-stat">
          <span class="webhook-stat-label">Failures</span>
          <span class="webhook-stat-value error">${webhook.failureCount || 0}</span>
        </div>
        <div class="webhook-stat">
          <span class="webhook-stat-label">Last Triggered</span>
          <span class="webhook-stat-value">${webhook.lastTriggered ? new Date(webhook.lastTriggered).toLocaleDateString() : 'Never'}</span>
        </div>
      </div>
    </div>
  `).join('');

  // Attach event listeners
  webhookList.querySelectorAll('.btn-toggle').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const webhook = webhookManager.getAll().find(w => w.id === id);
      if (webhook) {
        webhookManager.update(id, { enabled: !webhook.enabled });
        await webhookManager.save();
        await renderWebhookList();
        await updateWebhookStats();
      }
    });
  });

  webhookList.querySelectorAll('.btn-test').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      await webhookManager.test(id);
    });
  });

  webhookList.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const webhook = webhookManager.getAll().find(w => w.id === id);
      if (webhook && confirm(`Are you sure you want to delete webhook "${webhook.name}"?`)) {
        webhookManager.delete(id);
        await webhookManager.save();
        await renderWebhookList();
        await updateWebhookStats();
        showNotification(`Webhook "${webhook.name}" deleted`, true);
      }
    });
  });
}

// Update webhook statistics
async function updateWebhookStats() {
  await initializeWebhookManager();
  const stats = webhookManager.getStats();

  const totalEl = document.getElementById('webhookStatsTotal');
  const enabledEl = document.getElementById('webhookStatsEnabled');
  const triggersEl = document.getElementById('webhookStatsTriggers');
  const failuresEl = document.getElementById('webhookStatsFailures');

  if (totalEl) totalEl.textContent = stats.total;
  if (enabledEl) enabledEl.textContent = stats.enabled;
  if (triggersEl) triggersEl.textContent = stats.totalTriggers;
  if (failuresEl) failuresEl.textContent = stats.totalFailures;
}

// Webhook form handler
document.getElementById('webhookForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('webhookName').value.trim();
  const url = document.getElementById('webhookUrl').value.trim();
  const method = document.getElementById('webhookMethod').value;
  const headersText = document.getElementById('webhookHeaders').value.trim();

  // Get selected events
  const events = Array.from(document.querySelectorAll('#webhookEvents input[type="checkbox"]:checked'))
    .map(cb => cb.value);

  // Validation
  if (!name) {
    showNotification('❌ Webhook name is required', false);
    return;
  }

  if (!url || !url.startsWith('http')) {
    showNotification('❌ Valid URL is required (must start with http:// or https://)', false);
    return;
  }

  if (events.length === 0) {
    showNotification('❌ Please select at least one event', false);
    return;
  }

  let headers = {};
  if (headersText) {
    try {
      headers = JSON.parse(headersText);
    } catch (error) {
      showNotification('❌ Invalid JSON in custom headers', false);
      return;
    }
  }

  await initializeWebhookManager();

  try {
    webhookManager.add({
      name,
      url,
      method,
      events,
      headers
    });

    await webhookManager.save();
    await renderWebhookList();
    await updateWebhookStats();

    // Reset form
    document.getElementById('webhookForm').reset();
    showNotification(`✅ Webhook "${name}" added successfully!`, true);
  } catch (error) {
    showNotification(`❌ Failed to add webhook: ${error.message}`, false);
  }
});

// Cancel webhook form
document.getElementById('cancelWebhookForm')?.addEventListener('click', () => {
  document.getElementById('webhookForm').reset();
});

// Manage webhooks button
document.getElementById('manageWebhooks')?.addEventListener('click', async () => {
  await renderWebhookList();
  await updateWebhookStats();
  elements.webhookModal.classList.add('show');
});

// Webhooks enabled checkbox
document.getElementById('webhooksEnabled')?.addEventListener('change', async (e) => {
  await initializeWebhookManager();
  webhookManager.enabled = e.target.checked;
  await webhookManager.save();
  showNotification(`Webhooks ${e.target.checked ? 'enabled' : 'disabled'}`, true);
});

// Analytics modal
document.getElementById('openAnalytics')?.addEventListener('click', async () => {
  await updateStats();
  elements.analyticsModal.classList.add('show');
  initializeAnalyticsCharts();
});

document.getElementById('analyticsTimeRange')?.addEventListener('change', () => {
  initializeAnalyticsCharts();
});

// Donation modal
document.getElementById('openDonation')?.addEventListener('click', () => {
  elements.donationModal.classList.add('show');
});

// Copy crypto address functionality
document.querySelectorAll('.btn-copy').forEach(btn => {
  btn.addEventListener('click', async (e) => {
    const addressId = e.target.getAttribute('data-address');
    const addressElement = document.getElementById(addressId);
    if (!addressElement) return;

    const address = addressElement.textContent;

    try {
      await navigator.clipboard.writeText(address);

      // Show feedback
      const originalText = e.target.textContent;
      e.target.textContent = '✓';
      e.target.style.background = '#2ecc71';

      setTimeout(() => {
        e.target.textContent = originalText;
        e.target.style.background = '';
      }, 2000);

      showNotification('Address copied to clipboard!', true);
    } catch (err) {
      console.error('Failed to copy:', err);
      showNotification('Failed to copy address', false);
    }
  });
});

// ===== PERFORMANCE MONITOR =====

let performanceMonitor = null;

// Initialize performance monitor
async function initPerformanceMonitor() {
  if (!performanceMonitor) {
    performanceMonitor = {
      metrics: {
        messagesSent: [],
        typingSpeed: [],
        errors: [],
        memoryUsage: []
      },
      startTime: Date.now(),

      recordMessageSend(duration, success) {
        this.metrics.messagesSent.push({ timestamp: Date.now(), duration, success });
        if (this.metrics.messagesSent.length > 100) this.metrics.messagesSent.shift();
      },

      recordTypingSpeed(wpm) {
        this.metrics.typingSpeed.push({ timestamp: Date.now(), wpm });
        if (this.metrics.typingSpeed.length > 50) this.metrics.typingSpeed.shift();
      },

      recordError(type, message) {
        this.metrics.errors.push({ timestamp: Date.now(), type, message });
        if (this.metrics.errors.length > 50) this.metrics.errors.shift();
      },

      getStats() {
        const now = Date.now();
        const uptime = now - this.startTime;

        const successfulSends = this.metrics.messagesSent.filter(m => m.success);
        const failedSends = this.metrics.messagesSent.filter(m => !m.success);
        const avgSendDuration = successfulSends.length > 0
          ? successfulSends.reduce((sum, m) => sum + m.duration, 0) / successfulSends.length
          : 0;

        const avgTypingSpeed = this.metrics.typingSpeed.length > 0
          ? this.metrics.typingSpeed.reduce((sum, t) => sum + t.wpm, 0) / this.metrics.typingSpeed.length
          : 0;

        const recentErrors = this.metrics.errors.filter(e => now - e.timestamp < 3600000);

        return {
          uptime,
          messages: {
            total: this.metrics.messagesSent.length,
            successful: successfulSends.length,
            failed: failedSends.length,
            successRate: this.metrics.messagesSent.length > 0
              ? ((successfulSends.length / this.metrics.messagesSent.length) * 100).toFixed(1)
              : 0,
            avgDuration: avgSendDuration.toFixed(0)
          },
          typing: {
            avgSpeed: avgTypingSpeed.toFixed(1),
            samples: this.metrics.typingSpeed.length
          },
          errors: {
            total: this.metrics.errors.length,
            recentCount: recentErrors.length
          },
          memory: performance.memory ? {
            usedMB: (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2),
            usagePercent: ((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100).toFixed(1)
          } : null
        };
      },

      getRecommendations() {
        const stats = this.getStats();
        const recommendations = [];

        if (stats.messages.successRate < 90 && stats.messages.total > 10) {
          recommendations.push({ type: 'warning', text: '⚠️ Message success rate is below 90%. Check input field configuration.' });
        }

        if (parseFloat(stats.typing.avgSpeed) < 30 && stats.typing.samples > 5) {
          recommendations.push({ type: 'info', text: '💡 Typing speed is slow. Consider increasing typing simulation speed.' });
        } else if (parseFloat(stats.typing.avgSpeed) > 100 && stats.typing.samples > 5) {
          recommendations.push({ type: 'warning', text: '⚠️ Typing speed is very fast. May appear robotic.' });
        }

        if (stats.errors.recentCount > 10) {
          recommendations.push({ type: 'warning', text: '⚠️ High error rate detected. Review recent errors.' });
        }

        if (stats.memory && parseFloat(stats.memory.usagePercent) > 80) {
          recommendations.push({ type: 'warning', text: '⚠️ High memory usage. Consider restarting extension.' });
        }

        if (recommendations.length === 0) {
          recommendations.push({ type: 'success', text: '✅ Performance is optimal! No issues detected.' });
        }

        return recommendations;
      }
    };

    // Load saved metrics
    const data = await new Promise(resolve => {
      chrome.storage.local.get(['performanceMetrics'], resolve);
    });
    if (data.performanceMetrics) {
      performanceMonitor.metrics = data.performanceMetrics.metrics || performanceMonitor.metrics;
      performanceMonitor.startTime = data.performanceMetrics.startTime || performanceMonitor.startTime;
    }
  }
  return performanceMonitor;
}

// Update performance display
async function updatePerformanceDisplay() {
  await initPerformanceMonitor();
  const stats = performanceMonitor.getStats();

  // Update message stats
  document.getElementById('perfTotalMessages').textContent = stats.messages.total;
  document.getElementById('perfSuccessRate').textContent = stats.messages.successRate + '%';
  document.getElementById('perfAvgDuration').textContent = stats.messages.avgDuration + 'ms';
  document.getElementById('perfFailed').textContent = stats.messages.failed;

  // Update typing stats
  document.getElementById('perfTypingSpeed').textContent = stats.typing.avgSpeed + ' WPM';
  document.getElementById('perfTypingSamples').textContent = stats.typing.samples;

  // Update system stats
  if (stats.memory) {
    document.getElementById('perfMemoryUsed').textContent = stats.memory.usedMB + ' MB';
    document.getElementById('perfMemoryPercent').textContent = stats.memory.usagePercent + '%';
  } else {
    document.getElementById('perfMemoryUsed').textContent = 'N/A';
    document.getElementById('perfMemoryPercent').textContent = 'N/A';
  }

  const uptimeSeconds = Math.floor(stats.uptime / 1000);
  const uptimeStr = uptimeSeconds < 60
    ? uptimeSeconds + 's'
    : Math.floor(uptimeSeconds / 60) + 'm ' + (uptimeSeconds % 60) + 's';
  document.getElementById('perfUptime').textContent = uptimeStr;
  document.getElementById('perfErrors').textContent = stats.errors.total;

  // Update recommendations
  const recommendations = performanceMonitor.getRecommendations();
  const recContainer = document.getElementById('perfRecommendations');
  recContainer.innerHTML = recommendations.map(rec =>
    `<div class="perf-recommendation ${rec.type}">${rec.text}</div>`
  ).join('');
}

// Performance modal
document.getElementById('openPerformance')?.addEventListener('click', async () => {
  await updatePerformanceDisplay();
  elements.performanceModal.classList.add('show');
});

// Refresh performance
document.getElementById('refreshPerformance')?.addEventListener('click', async () => {
  await updatePerformanceDisplay();
  showNotification('Performance data refreshed', true);
});

// Export performance
document.getElementById('exportPerformance')?.addEventListener('click', async () => {
  await initPerformanceMonitor();
  const stats = performanceMonitor.getStats();
  const data = {
    exportTime: new Date().toISOString(),
    stats,
    recommendations: performanceMonitor.getRecommendations()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `autochat-performance-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);

  showNotification('Performance data exported', true);
});

// Clear performance
document.getElementById('clearPerformance')?.addEventListener('click', async () => {
  if (confirm('Clear all performance metrics? This cannot be undone.')) {
    await initPerformanceMonitor();
    performanceMonitor.metrics = {
      messagesSent: [],
      typingSpeed: [],
      errors: [],
      memoryUsage: []
    };
    performanceMonitor.startTime = Date.now();

    await chrome.storage.local.remove(['performanceMetrics']);
    await updatePerformanceDisplay();
    showNotification('Performance metrics cleared', true);
  }
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

// AI Generation Handler
document.getElementById('generateAiPhrasesBtn')?.addEventListener('click', () => {
  const btn = document.getElementById('generateAiPhrasesBtn');
  const originalText = btn.textContent;
  btn.textContent = '⏳ Generating...';
  btn.disabled = true;

  // Use current phrases as context (not implemented yet, but good practice)
  const prompt = "Generate casual crypto gambling chat phrases.";

  chrome.runtime.sendMessage({ action: 'generateAiPhrases', prompt, count: 3 }, (response) => {
    btn.textContent = originalText;
    btn.disabled = false;

    if (response && response.success && Array.isArray(response.phrases)) {
      let addedCount = 0;
      response.phrases.forEach(phrase => {
        if (addCustomPhrase(phrase)) {
          addedCount++;
        }
      });

      if (addedCount > 0) {
        renderPhrasesList();
        showNotification(`✨ Added ${addedCount} AI phrases!`, true);
      } else {
        showNotification('⚠️ Generated phrases were duplicates.', false);
      }
    } else {
      showNotification(`❌ AI Generation failed: ${response?.error || 'Unknown error'}`, false);
    }
  });
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

// --- Scheduler UI Handlers ---
document.getElementById('openScheduler')?.addEventListener('click', () => {
  openModal('schedulerModal');
  loadSchedules();
});

document.getElementById('openTeam')?.addEventListener('click', () => {
  openModal('teamModal');
});

document.getElementById('createScheduleBtn')?.addEventListener('click', () => {
  const name = document.getElementById('schedName').value.trim();
  const startTime = document.getElementById('schedStart').value;
  const endTime = document.getElementById('schedEnd').value;
  const min = parseInt(document.getElementById('schedMin').value);
  const max = parseInt(document.getElementById('schedMax').value);

  if (!name) {
    showNotification('Please enter a campaign name', false);
    return;
  }

  const data = {
    name,
    profileId: currentAccount,
    startTime,
    endTime,
    interval: { min, max },
    active: true
  };

  chrome.runtime.sendMessage({ action: 'createSchedule', data }, (response) => {
    if (response && response.success) {
      showNotification(`✅ Campaign created: ${name}`, true);
      document.getElementById('schedName').value = '';
      loadSchedules();
    } else {
      showNotification(`❌ Failed: ${response?.error}`, false);
    }
  });
});

async function loadSchedules() {
  chrome.runtime.sendMessage({ action: 'getSchedules' }, (response) => {
    if (response && response.success) {
      renderSchedulesList(response.data);

      // Update main UI count
      const activeCount = response.data.filter(s => {
        if (!s.active) return false;
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        return currentTime >= s.startTime && currentTime <= s.endTime;
      }).length;

      const countEl = document.getElementById('activeCampaignsCount');
      if (countEl) countEl.textContent = activeCount;
    }
  });
}

function renderSchedulesList(schedules) {
  const container = document.getElementById('schedulesList');
  if (!container) return;

  if (schedules.length === 0) {
    container.innerHTML = '<div class="help">No active campaigns scheduled.</div>';
    return;
  }

  container.innerHTML = schedules.map(s => `
    <div class="schedule-item">
      <div class="schedule-info">
        <div class="schedule-name">
          <span class="status-indicator ${s.active ? 'status-active' : 'status-inactive'}"></span>
          ${s.name}
        </div>
        <div class="schedule-details">
          🕒 ${s.startTime} - ${s.endTime} | ⏱️ Every ${Math.floor(s.interval.min)}s-${Math.floor(s.interval.max)}s
        </div>
      </div>
      <div class="schedule-actions">
         <button class="btn-icon-small delete-sched" data-id="${s.id}" title="Delete">🗑️</button>
      </div>
    </div>
  `).join('');

  // Add event listeners to delete buttons
  container.querySelectorAll('.delete-sched').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.closest('button').getAttribute('data-id');
      chrome.runtime.sendMessage({ action: 'deleteSchedule', id }, () => {
        loadSchedules();
      });
    });
  });
}

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

// ===== ACCOUNT MANAGEMENT =====

async function loadAccounts() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'getProfiles' }, (response) => {
      if (response && response.profiles) {
        accounts = response.profiles;
        currentAccount = response.activeId || 'default';
      }
      resolve();
    });
  });
}

// saveAccounts is deprecated as we save via messages now
function saveAccounts() { }

function updateAccountSelect() {
  elements.accountSelect.innerHTML = '';

  Object.keys(accounts).forEach(accountId => {
    const account = accounts[accountId];
    const option = document.createElement('option');
    option.value = accountId;
    option.textContent = account.name;
    if (accountId === currentAccount) {
      option.selected = true;
    }
    elements.accountSelect.appendChild(option);
  });
}

function updateAccountList() {
  elements.accountList.innerHTML = '';

  Object.keys(accounts).forEach(accountId => {
    const account = accounts[accountId];
    const isActive = accountId === currentAccount;

    const item = document.createElement('div');
    item.className = 'account-item' + (isActive ? ' active' : '');

    const nameSpan = document.createElement('span');
    nameSpan.className = 'account-item-name';
    nameSpan.textContent = account.name;

    if (isActive) {
      const badge = document.createElement('span');
      badge.className = 'account-item-badge';
      badge.textContent = 'ACTIVE';
      nameSpan.appendChild(badge);
    }

    const actions = document.createElement('div');
    actions.className = 'account-item-actions';

    if (!isActive) {
      const switchBtn = document.createElement('button');
      switchBtn.textContent = '🔄 Switch';
      switchBtn.onclick = () => switchAccount(accountId);
      actions.appendChild(switchBtn);
    }

    const exportBtn = document.createElement('button');
    exportBtn.textContent = '📥 Export';
    exportBtn.onclick = () => exportAccount(accountId);
    actions.appendChild(exportBtn);

    if (accountId !== 'default') {
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-danger-small';
      deleteBtn.textContent = '🗑️';
      deleteBtn.onclick = () => deleteAccount(accountId);
      actions.appendChild(deleteBtn);
    }

    item.appendChild(nameSpan);
    item.appendChild(actions);
    elements.accountList.appendChild(item);
  });
}

async function switchAccount(accountId) {
  if (!accounts[accountId]) {
    showNotification('❌ Account not found', false);
    return;
  }

  // Save current account settings before switching
  const currentSettings = getCurrentSettings();
  await new Promise(resolve => {
    chrome.runtime.sendMessage({
      action: 'updateProfile',
      id: currentAccount,
      updates: { settings: currentSettings }
    }, resolve);
  });

  // Switch to new account via service
  await new Promise(resolve => {
    chrome.runtime.sendMessage({
      action: 'setActiveProfile',
      id: accountId
    }, resolve);
  });

  // Re-fetch everything to ensure sync
  await loadAccounts();

  // Apply new settings to UI
  if (accounts[accountId].settings && Object.keys(accounts[accountId].settings).length > 0) {
    chrome.storage.local.set(accounts[accountId].settings, () => {
      loadSettings();
      updateAccountSelect();
      updateAccountList();
      showNotification(`✅ Switched to: ${accounts[accountId].name}`, true);
    });
  } else {
    // If no settings, might need default reset or keep existing?
    // For now, reload settings will pick up what's in local storage, which technically are the *old* settings unless we clear them.
    // Better to clear or set defaults if empty.
    showNotification(`✅ Switched to: ${accounts[accountId].name}`, true);
    // TODO: Ideally clear storage settings here or merge generic defaults
    updateAccountSelect();
    updateAccountList();
  }
}

function getCurrentSettings() {
  const mentionKeywords = elements.mentionKeywords.value
    .split('\n')
    .map(k => k.trim())
    .filter(k => k.length > 0);

  const mentionReplyMessages = elements.mentionReplyMessages.value
    .split('\n')
    .map(m => m.trim())
    .filter(m => m.length > 0);

  return {
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
    activeHoursEnd: elements.activeHoursEnd.value,
    sendConfirmTimeout: elements.sendConfirmTimeout ? elements.sendConfirmTimeout.value : 3,
    mentionDetectionEnabled: elements.mentionDetectionEnabled.checked,
    aiAutoRepliesEnabled: elements.aiAutoRepliesEnabled.checked,
    mentionKeywords: mentionKeywords,
    mentionReplyMessages: mentionReplyMessages,
    chatLoggingEnabled: elements.chatLoggingEnabled?.checked || false,
    manualDetectionEnabled: elements.manualDetectionEnabled?.checked || false,
    notificationsEnabled: elements.notificationsEnabled.checked,
    notificationSound: elements.notificationSound.checked
  };
}

function exportAccount(accountId) {
  // If active, ensure settings are saved first (though we are moving to saving on change, 
  // currently settings are in memory until save).
  if (accountId === currentAccount) {
    // Just in case, try to update the profile with current form values before export
    const currentSettings = getCurrentSettings();
    // Not awaiting this since export logic is async below... actually we need to await.
    // Refactoring this function to be async
    exportAccountAsync(accountId).catch(console.error);
    return;
  }
  exportAccountAsync(accountId).catch(console.error);
}

async function exportAccountAsync(accountId) {
  if (accountId === currentAccount) {
    const currentSettings = getCurrentSettings();
    await new Promise(resolve => {
      chrome.runtime.sendMessage({
        action: 'updateProfile',
        id: accountId,
        updates: { settings: currentSettings }
      }, resolve);
    });
  }

  chrome.runtime.sendMessage({ action: 'exportProfile', id: accountId }, (response) => {
    if (response && response.success) {
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      // Sanitize filename
      const safeName = response.data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      link.download = `autochat-${safeName}.json`;
      link.click();
      URL.revokeObjectURL(url);
      showNotification(`📥 Exported: ${response.data.name}`, true);
    } else {
      showNotification(`❌ Export failed: ${response?.error}`, false);
    }
  });
}

async function deleteAccount(accountId) {
  if (accountId === 'default') {
    showNotification('❌ Cannot delete default account', false);
    return;
  }

  // Check if active account via service/local state?
  // Current logic: if active in local state, block.
  // ProfileService handles active switching if deleted, but let's keep basic check.
  if (accountId === currentAccount) {
    // Actually ProfileService handles this gracefully now, but blocking in UI is fine.
    // showNotification('❌ Cannot delete active account', false);
    // return;
  }

  const account = accounts[accountId];
  if (confirm(`Delete account "${account.name}"? This cannot be undone.`)) {
    chrome.runtime.sendMessage({ action: 'deleteProfile', id: accountId }, async (response) => {
      if (response && response.success) {
        await loadAccounts();
        updateAccountSelect();
        updateAccountList();
        showNotification(`🗑️ Deleted: ${account.name}`, true);
        // If we deleted the current one, loadAccounts should have updated currentAccount to default
        if (accountId === currentAccount) {
          loadSettings(); // Reload settings for default
        }
      } else {
        showNotification(`❌ Delete failed: ${response?.error}`, false);
      }
    });
  }
}

elements.createAccount?.addEventListener('click', () => {
  const name = elements.newAccountName.value.trim();
  const domainsStr = elements.newAccountDomains.value.trim();

  if (!name) {
    showNotification('❌ Please enter an account name', false);
    return;
  }

  if (name.length > 50) {
    showNotification('❌ Name too long (max 50 characters)', false);
    return;
  }

  const domains = domainsStr ? domainsStr.split(',').map(d => d.trim()).filter(d => d.length > 0) : [];

  chrome.runtime.sendMessage({ action: 'createProfile', name, domains }, async (response) => {
    if (response && response.success) {
      await loadAccounts();
      elements.newAccountName.value = '';
      elements.newAccountDomains.value = '';
      updateAccountSelect();
      updateAccountList();
      showNotification(`✅ Created: ${response.profile.name}`, true);
    } else {
      showNotification(`❌ Creation failed: ${response?.error}`, false);
    }
  });
});



const importBtn = document.getElementById('importProfileBtn');
const importInput = document.getElementById('importFileInput');

if (importBtn && importInput) {
  importBtn.addEventListener('click', () => {
    importInput.click();
  });

  importInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonString = event.target.result;
        chrome.runtime.sendMessage({ action: 'importProfile', jsonString }, async (response) => {
          if (response && response.success) {
            await loadAccounts();
            updateAccountSelect();
            updateAccountList();
            showNotification(`✅ Imported: ${response.profile.name}`, true);
            // Clear input
            importInput.value = '';
          } else {
            showNotification(`❌ Import failed: ${response?.error}`, false);
          }
        });
      } catch (err) {
        showNotification('❌ Failed to read file', false);
      }
    };
    reader.readAsText(file);
  });
}

elements.accountSelect?.addEventListener('change', (e) => {
  const selectedAccount = e.target.value;
  if (selectedAccount !== currentAccount) {
    switchAccount(selectedAccount);
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
    'activeHoursEnd',
    'sendConfirmTimeout',
    'mentionDetectionEnabled',
    'aiAutoRepliesEnabled',
    'mentionKeywords',
    'mentionReplyMessages',
    'chatLoggingEnabled',
    'manualDetectionEnabled',
    'notificationsEnabled',
    'notificationSound'
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

    // Mention detection settings
    elements.mentionDetectionEnabled.checked = data.mentionDetectionEnabled || false;
    elements.aiAutoRepliesEnabled.checked = data.aiAutoRepliesEnabled || false;
    if (data.mentionKeywords && Array.isArray(data.mentionKeywords)) {
      elements.mentionKeywords.value = data.mentionKeywords.join('\n');
    }
    if (data.mentionReplyMessages && Array.isArray(data.mentionReplyMessages)) {
      elements.mentionReplyMessages.value = data.mentionReplyMessages.join('\n');
    }

    // Chat logging settings
    if (elements.chatLoggingEnabled) {
      elements.chatLoggingEnabled.checked = data.chatLoggingEnabled || false;
    }

    // Manual detection settings
    if (elements.manualDetectionEnabled) {
      elements.manualDetectionEnabled.checked = data.manualDetectionEnabled || false;
    }

    // Notification settings
    elements.notificationsEnabled.checked = data.notificationsEnabled !== false;
    elements.notificationSound.checked = data.notificationSound !== false;

    // Show/hide active hours inputs
    const hoursInputs = document.getElementById('activeHoursInputs');
    if (hoursInputs) {
      hoursInputs.style.display = elements.activeHours.checked ? 'flex' : 'none';
    }
  });
}

function saveSettings() {
  const settings = getCurrentSettings();

  // Save to current account
  accounts[currentAccount].settings = settings;
  saveAccounts();

  // Also save to storage for immediate use
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
elements.sendConfirmTimeout?.addEventListener('change', saveSettings);

// Notification settings
elements.notificationsEnabled?.addEventListener('change', saveSettings);
elements.notificationSound?.addEventListener('change', saveSettings);

// Mention detection settings
elements.mentionDetectionEnabled?.addEventListener('change', async () => {
  saveSettings();

  // Notify content script to start/stop mention detection
  const keywords = elements.mentionKeywords.value
    .split('\n')
    .map(k => k.trim())
    .filter(k => k.length > 0);

  const replyMessages = elements.mentionReplyMessages.value
    .split('\n')
    .map(m => m.trim())
    .filter(m => m.length > 0);

  if (elements.mentionDetectionEnabled.checked) {
    if (keywords.length === 0) {
      showNotification('⚠️ Please add at least one keyword to watch for mentions', false);
      elements.mentionDetectionEnabled.checked = false;
      saveSettings();
      return;
    }
    if (replyMessages.length === 0) {
      showNotification('⚠️ Please add at least one reply message', false);
      elements.mentionDetectionEnabled.checked = false;
      saveSettings();
      return;
    }

    const response = await sendMessageToContent({
      action: 'startMentionDetection',
      keywords: keywords,
      replyMessages: replyMessages,
      aiEnabled: elements.aiAutoRepliesEnabled.checked
    });

    if (response && response.ok) {
      showNotification('✅ Mention detection enabled', true);
    } else {
      showNotification('⚠️ Please mark a message container first', false);
      elements.mentionDetectionEnabled.checked = false;
      saveSettings();
    }
  } else {
    await sendMessageToContent({ action: 'stopMentionDetection' });
    showNotification('🛑 Mention detection disabled', true);
  }
});

elements.aiAutoRepliesEnabled?.addEventListener('change', () => {
  saveSettings();
  if (elements.mentionDetectionEnabled.checked) {
    // Trigger update in content script
    elements.mentionDetectionEnabled.dispatchEvent(new Event('change'));
  }
});

elements.mentionKeywords?.addEventListener('input', saveSettings);
elements.mentionReplyMessages?.addEventListener('input', saveSettings);

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

// ===== COMMAND PALETTE =====

const commandPalette = document.getElementById('commandPalette');
const commandSearch = document.getElementById('commandSearch');
const commandResults = document.getElementById('commandResults');

const commands = [
  { name: 'Start Auto-Send', icon: '▶️', desc: 'Begin sending messages', shortcut: 'Ctrl+S', action: () => document.getElementById('startAutoSend')?.click() },
  { name: 'Stop Auto-Send', icon: '⏹️', desc: 'Stop sending messages', shortcut: 'Ctrl+X', action: () => document.getElementById('stopAutoSend')?.click() },
  { name: 'Pause/Resume', icon: '⏸️', desc: 'Pause or resume', shortcut: 'Ctrl+P', action: () => document.getElementById('pauseAutoSend')?.click() },
  { name: 'Send Once', icon: '📤', desc: 'Send one message now', shortcut: '', action: () => document.getElementById('sendOnce')?.click() },
  { name: 'Mark Input Field', icon: '🎯', desc: 'Mark chat input', shortcut: '', action: () => document.getElementById('markInput')?.click() },
  { name: 'Preview Messages', icon: '👁️', desc: 'Preview messages', shortcut: '', action: () => document.getElementById('previewMessage')?.click() },
  { name: 'Open Settings', icon: '⚙️', desc: 'Advanced settings', shortcut: '', action: () => document.getElementById('openSettings')?.click() },
  { name: 'Open Analytics', icon: '📊', desc: 'View statistics', shortcut: '', action: () => document.getElementById('openAnalytics')?.click() },
  { name: 'Manage Phrases', icon: '✏️', desc: 'Edit phrases', shortcut: '', action: () => document.getElementById('managePhrases')?.click() },
  { name: 'Load Phrases', icon: '📚', desc: 'Load default phrases', shortcut: '', action: () => document.getElementById('loadDefaultPhrases')?.click() },
  { name: 'Categories', icon: '📁', desc: 'Browse categories', shortcut: '', action: () => document.getElementById('openCategories')?.click() },
  { name: 'Emoji Picker', icon: '😊', desc: 'Insert emoji', shortcut: '', action: () => document.getElementById('openEmoji')?.click() },
  { name: 'Export Settings', icon: '💾', desc: 'Backup settings', shortcut: '', action: () => document.getElementById('exportSettings')?.click() },
  { name: 'Toggle Theme', icon: '🌙', desc: 'Dark/Light mode', shortcut: '', action: () => document.getElementById('themeToggle')?.click() }
];

let selectedCommandIndex = 0;

function renderCommands(filter = '') {
  const filtered = commands.filter(cmd =>
    cmd.name.toLowerCase().includes(filter.toLowerCase()) ||
    cmd.desc.toLowerCase().includes(filter.toLowerCase())
  );

  commandResults.innerHTML = '';

  if (filtered.length === 0) {
    commandResults.innerHTML = '<div class="help" style="padding: 20px; text-align: center;">No commands found</div>';
    return;
  }

  filtered.forEach((cmd, index) => {
    const item = document.createElement('div');
    item.className = 'command-item' + (index === 0 ? ' selected' : '');
    item.innerHTML = `
      <div class="command-icon">${cmd.icon}</div>
      <div class="command-info">
        <div class="command-name">${cmd.name}</div>
        <div class="command-desc">${cmd.desc}</div>
      </div>
      ${cmd.shortcut ? `<div class="command-shortcut">${cmd.shortcut}</div>` : ''}
    `;
    item.addEventListener('click', () => {
      cmd.action();
      closeCommandPalette();
    });
    commandResults.appendChild(item);
  });

  selectedCommandIndex = 0;
}

function openCommandPalette() {
  commandPalette.style.display = 'flex';
  commandSearch.value = '';
  commandSearch.focus();
  renderCommands();
}

function closeCommandPalette() {
  commandPalette.style.display = 'none';
}

commandSearch?.addEventListener('input', (e) => {
  renderCommands(e.target.value);
});

commandSearch?.addEventListener('keydown', (e) => {
  const items = commandResults.querySelectorAll('.command-item');

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    selectedCommandIndex = Math.min(selectedCommandIndex + 1, items.length - 1);
    items.forEach((item, i) => item.classList.toggle('selected', i === selectedCommandIndex));
    items[selectedCommandIndex]?.scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    selectedCommandIndex = Math.max(selectedCommandIndex - 1, 0);
    items.forEach((item, i) => item.classList.toggle('selected', i === selectedCommandIndex));
    items[selectedCommandIndex]?.scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'Enter') {
    e.preventDefault();
    items[selectedCommandIndex]?.click();
  } else if (e.key === 'Escape') {
    closeCommandPalette();
  }
});

commandPalette?.addEventListener('click', (e) => {
  if (e.target === commandPalette) {
    closeCommandPalette();
  }
});

// ===== EMOJI PICKER =====

const emojiPicker = document.getElementById('emojiPicker');
const emojiSearch = document.getElementById('emojiSearch');
const emojiTabs = document.getElementById('emojiTabs');
const emojiContent = document.getElementById('emojiContent');

const emojiCategories = {
  'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'],
  'Gestures': ['👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤟', '🤘', '👌', '🤏', '👈', '👉', '👆', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '👐', '🤲', '🤝', '🙏'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️'],
  'Animals': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋'],
  'Food': ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🍞', '🥖'],
  'Sports': ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷'],
  'Objects': ['⌚', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '💾', '💿', '📀', '🎥', '📷', '📹', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡'],
  'Symbols': ['💯', '🔥', '✨', '🌟', '⭐', '💫', '💥', '💢', '💦', '💨', '🕳️', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤', '✅', '✔️', '☑️', '❌', '❎', '➕', '➖', '✖️', '➗', '♾️', '‼️', '⁉️', '❓']
};

let currentEmojiCategory = 'Smileys';

function renderEmojiTabs() {
  emojiTabs.innerHTML = '';
  Object.keys(emojiCategories).forEach(category => {
    const tab = document.createElement('button');
    tab.className = 'emoji-tab' + (category === currentEmojiCategory ? ' active' : '');
    tab.textContent = emojiCategories[category][0];
    tab.title = category;
    tab.addEventListener('click', () => {
      currentEmojiCategory = category;
      renderEmojiTabs();
      renderEmojis();
    });
    emojiTabs.appendChild(tab);
  });
}

function renderEmojis(filter = '') {
  emojiContent.innerHTML = '';

  let emojis = emojiCategories[currentEmojiCategory] || [];

  if (filter) {
    emojis = Object.values(emojiCategories).flat();
  }

  emojis.forEach(emoji => {
    const item = document.createElement('button');
    item.className = 'emoji-item';
    item.textContent = emoji;
    item.addEventListener('click', () => {
      // Insert emoji into message list at cursor position
      const textarea = elements.messageList;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      textarea.value = text.substring(0, start) + emoji + text.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
      textarea.focus();
      saveSettings();
      showNotification('Emoji inserted!', true);
    });
    emojiContent.appendChild(item);
  });
}

function openEmojiPicker() {
  emojiPicker.style.display = 'block';
  emojiSearch.value = '';
  renderEmojiTabs();
  renderEmojis();
}

function closeEmojiPicker() {
  emojiPicker.style.display = 'none';
}

emojiSearch?.addEventListener('input', (e) => {
  renderEmojis(e.target.value);
});

document.getElementById('openEmoji')?.addEventListener('click', openEmojiPicker);

// Close emoji picker when clicking outside
document.addEventListener('click', (e) => {
  if (emojiPicker && emojiPicker.style.display === 'block') {
    if (!emojiPicker.contains(e.target) && e.target.id !== 'openEmoji') {
      closeEmojiPicker();
    }
  }
});

// ===== MESSAGE PREVIEW =====

const previewModal = document.getElementById('previewModal');
const previewContent = document.getElementById('previewContent');

function renderPreview() {
  const messages = elements.messageList.value.split('\n').filter(m => m.trim());
  previewContent.innerHTML = '';

  if (messages.length === 0) {
    previewContent.innerHTML = '<div class="preview-empty">No messages to preview. Add some messages first!</div>';
    return;
  }

  // Show first 10 messages with variables processed
  messages.slice(0, 10).forEach(message => {
    const item = document.createElement('div');
    item.className = 'preview-item';

    // Process template variables for preview
    const processed = message
      .replace(/{time}/g, '<span class="preview-variable">12:34 PM</span>')
      .replace(/{date}/g, '<span class="preview-variable">Nov 22, 2025</span>')
      .replace(/{random_emoji}/g, '<span class="preview-variable">😊</span>')
      .replace(/{random_number}/g, '<span class="preview-variable">42</span>')
      .replace(/{timestamp}/g, '<span class="preview-variable">1732298400</span>');

    item.innerHTML = processed;
    previewContent.appendChild(item);
  });

  if (messages.length > 10) {
    const more = document.createElement('div');
    more.className = 'help';
    more.style.textAlign = 'center';
    more.style.padding = '12px';
    more.textContent = `+ ${messages.length - 10} more messages...`;
    previewContent.appendChild(more);
  }
}

document.getElementById('previewMessage')?.addEventListener('click', () => {
  renderPreview();
  previewModal.classList.add('show');
});

// ===== CATEGORIES DISPLAY =====

const categoriesModal = document.getElementById('categoriesModal');
const categoriesContent = document.getElementById('categoriesContent');

const categoryDisplayItems = [
  { name: 'Greetings', icon: '👋', count: 0 },
  { name: 'Questions', icon: '❓', count: 0 },
  { name: 'Funny', icon: '😂', count: 0 },
  { name: 'Friendly', icon: '🤝', count: 0 },
  { name: 'Professional', icon: '💼', count: 0 },
  { name: 'Casual', icon: '😎', count: 0 },
  { name: 'Emojis', icon: '🎨', count: 0 },
  { name: 'Time', icon: '⏰', count: 0 },
  { name: 'Random', icon: '🎲', count: 0 },
  { name: 'Custom', icon: '✨', count: customPhrases.length }
];

function renderCategoriesDisplay() {
  categoriesContent.innerHTML = '';

  categoryDisplayItems.forEach(category => {
    const card = document.createElement('div');
    card.className = 'category-card';
    card.innerHTML = `
      <span class="category-icon">${category.icon}</span>
      <div class="category-name">${category.name}</div>
      <div class="category-count">${category.count} phrases</div>
    `;
    card.addEventListener('click', () => {
      showNotification(`Category: ${category.name}`, true);
      // In future: filter phrases by category
    });
    categoriesContent.appendChild(card);
  });
}

document.getElementById('openCategories')?.addEventListener('click', () => {
  categoryDisplayItems[categoryDisplayItems.length - 1].count = customPhrases.length;
  renderCategoriesDisplay();
  categoriesModal.classList.add('show');
});

// ===== ONBOARDING =====

const onboardingModal = document.getElementById('onboardingModal');
let currentOnboardingStep = 1;
const totalOnboardingSteps = 5;

function showOnboardingStep(step) {
  document.querySelectorAll('.onboarding-step').forEach(el => el.classList.remove('active'));
  document.querySelector(`.onboarding-step[data-step="${step}"]`)?.classList.add('active');
  document.getElementById('onboardingStep').textContent = `${step} / ${totalOnboardingSteps}`;

  const prevBtn = document.getElementById('onboardingPrev');
  const nextBtn = document.getElementById('onboardingNext');

  if (prevBtn) prevBtn.disabled = step === 1;
  if (nextBtn) nextBtn.textContent = step === totalOnboardingSteps ? 'Finish' : 'Next →';
}

document.getElementById('onboardingPrev')?.addEventListener('click', () => {
  if (currentOnboardingStep > 1) {
    currentOnboardingStep--;
    showOnboardingStep(currentOnboardingStep);
  }
});

document.getElementById('onboardingNext')?.addEventListener('click', () => {
  if (currentOnboardingStep < totalOnboardingSteps) {
    currentOnboardingStep++;
    showOnboardingStep(currentOnboardingStep);
  } else {
    // Finish onboarding
    const dontShow = document.getElementById('dontShowAgain')?.checked;
    if (dontShow) {
      chrome.storage.local.set({ onboardingCompleted: true });
    }
    onboardingModal.classList.remove('show');
  }
});

// Show onboarding on first launch
chrome.storage.local.get(['onboardingCompleted'], (data) => {
  if (!data.onboardingCompleted) {
    setTimeout(() => {
      currentOnboardingStep = 1;
      showOnboardingStep(1);
      onboardingModal.classList.add('show');
    }, 1000);
  }
});

// ===== KEYBOARD SHORTCUTS =====

document.addEventListener('keydown', (e) => {
  // Ctrl+K for command palette
  if (e.ctrlKey && e.key === 'k') {
    e.preventDefault();
    openCommandPalette();
  }

  // Escape to close modals/overlays
  if (e.key === 'Escape') {
    closeCommandPalette();
    closeEmojiPicker();
    document.querySelectorAll('.modal.show').forEach(modal => modal.classList.remove('show'));
  }

  // Ctrl+S to start
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault();
    document.getElementById('startAutoSend')?.click();
  }

  // Ctrl+X to stop
  if (e.ctrlKey && e.key === 'x') {
    e.preventDefault();
    document.getElementById('stopAutoSend')?.click();
  }

  // Ctrl+P to pause
  if (e.ctrlKey && e.key === 'p') {
    e.preventDefault();
    document.getElementById('pauseAutoSend')?.click();
  }
});

// ===== THEME PERSISTENCE & ANIMATION =====

const themeToggle = document.getElementById('themeToggle');

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  chrome.storage.local.set({ theme });
}

themeToggle?.addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
  showNotification(`${newTheme === 'dark' ? 'Dark' : 'Light'} mode enabled`, true);
});

// Load saved theme
chrome.storage.local.get(['theme'], (data) => {
  if (data.theme) {
    setTheme(data.theme);
  }
});

// ===== NOTIFICATION CENTER =====

const notificationCenterModal = document.getElementById('notificationCenterModal');
const notificationList = document.getElementById('notificationList');
const notificationBadge = document.getElementById('notificationBadge');
const unreadBadge = document.getElementById('unreadBadge');
let notificationHistory = [];
let unreadCount = 0;

async function loadNotificationHistory() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['notificationHistory', 'unreadCount'], (data) => {
      notificationHistory = data.notificationHistory || [];
      unreadCount = data.unreadCount || 0;
      updateNotificationBadge();
      resolve();
    });
  });
}

function updateNotificationBadge() {
  if (notificationBadge) {
    if (unreadCount > 0) {
      notificationBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
      notificationBadge.style.display = 'block';
    } else {
      notificationBadge.style.display = 'none';
    }
  }
  if (unreadBadge) {
    unreadBadge.textContent = `${unreadCount} unread`;
  }
}

function renderNotificationList() {
  if (!notificationList) return;

  if (notificationHistory.length === 0) {
    notificationList.innerHTML = '<div class="help" style="text-align: center; padding: 20px;">No notifications yet</div>';
    return;
  }

  notificationList.innerHTML = '';
  notificationHistory.forEach(notification => {
    const item = document.createElement('div');
    item.className = 'notification-item' + (notification.read ? '' : ' unread');

    const icon = getNotificationIcon(notification.type);
    const timeAgo = getTimeAgo(notification.timestamp);

    item.innerHTML = `
      <div class="notification-icon">${icon}</div>
      <div class="notification-content">
        <div class="notification-title">${notification.title}</div>
        <div class="notification-body">${notification.body || ''}</div>
        <div class="notification-time">${timeAgo}</div>
      </div>
      <div class="notification-item-actions">
        ${!notification.read ? `<button class="btn-small" data-mark-read="${notification.id}">✓</button>` : ''}
        <button class="btn-small delete" data-delete-notification="${notification.id}">✕</button>
      </div>
    `;
    notificationList.appendChild(item);
  });

  // Add event listeners for mark read buttons
  notificationList.querySelectorAll('[data-mark-read]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.markRead;
      markNotificationAsRead(id);
    });
  });

  // Add event listeners for delete buttons
  notificationList.querySelectorAll('[data-delete-notification]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.deleteNotification;
      deleteNotification(id);
    });
  });
}

function getNotificationIcon(type) {
  switch (type) {
    case 'success': return '✅';
    case 'error': return '❌';
    case 'warning': return '⚠️';
    case 'achievement': return '🏆';
    case 'message-sent': return '📤';
    default: return '🔔';
  }
}

function getTimeAgo(timestamp) {
  const now = new Date();
  const then = new Date(timestamp);
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function markNotificationAsRead(id) {
  const notification = notificationHistory.find(n => n.id === id);
  if (notification && !notification.read) {
    notification.read = true;
    unreadCount = Math.max(0, unreadCount - 1);
    saveNotificationHistory();
    updateNotificationBadge();
    renderNotificationList();
  }
}

function markAllNotificationsAsRead() {
  notificationHistory.forEach(n => n.read = true);
  unreadCount = 0;
  saveNotificationHistory();
  updateNotificationBadge();
  renderNotificationList();
  showNotification('All notifications marked as read', true);
}

function deleteNotification(id) {
  const index = notificationHistory.findIndex(n => n.id === id);
  if (index !== -1) {
    if (!notificationHistory[index].read) {
      unreadCount = Math.max(0, unreadCount - 1);
    }
    notificationHistory.splice(index, 1);
    saveNotificationHistory();
    updateNotificationBadge();
    renderNotificationList();
  }
}

function clearAllNotifications() {
  if (confirm('Clear all notifications?')) {
    notificationHistory = [];
    unreadCount = 0;
    saveNotificationHistory();
    updateNotificationBadge();
    renderNotificationList();
    showNotification('Notifications cleared', true);
  }
}

function saveNotificationHistory() {
  chrome.storage.local.set({
    notificationHistory,
    unreadCount
  });
}

// Notification center event handlers
document.getElementById('openNotificationCenter')?.addEventListener('click', async () => {
  await loadNotificationHistory();
  renderNotificationList();
  notificationCenterModal.classList.add('show');
});

document.getElementById('markAllRead')?.addEventListener('click', markAllNotificationsAsRead);
document.getElementById('clearNotifications')?.addEventListener('click', clearAllNotifications);

// ===== CATEGORY MANAGER =====

const categoryManagerModal = document.getElementById('categoryManagerModal');
const categoryList = document.getElementById('categoryList');
const categoryStats = document.getElementById('categoryStats');
let categories = [];

const defaultCategories = [
  { id: 'greetings', name: 'Greetings', icon: '👋', color: '#667eea' },
  { id: 'questions', name: 'Questions', icon: '❓', color: '#f093fb' },
  { id: 'responses', name: 'Responses', icon: '💬', color: '#4facfe' },
  { id: 'closings', name: 'Closings', icon: '👋', color: '#43e97b' },
  { id: 'casual', name: 'Casual', icon: '😊', color: '#fa709a' },
  { id: 'formal', name: 'Formal', icon: '🎩', color: '#667eea' },
  { id: 'funny', name: 'Funny', icon: '😄', color: '#feca57' },
  { id: 'supportive', name: 'Supportive', icon: '💪', color: '#48dbfb' },
  { id: 'business', name: 'Business', icon: '💼', color: '#341f97' },
  { id: 'personal', name: 'Personal', icon: '❤️', color: '#ee5a6f' }
];

async function loadCategories() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['categories'], (data) => {
      categories = data.categories || defaultCategories;
      resolve();
    });
  });
}

function saveCategories() {
  chrome.storage.local.set({ categories });
}

function renderCategoryList() {
  if (!categoryList) return;

  categoryList.innerHTML = '';
  categories.forEach((category, index) => {
    const item = document.createElement('div');
    item.className = 'category-manager-item';
    item.innerHTML = `
      <div class="category-color-dot" style="background: ${category.color}"></div>
      <div class="category-icon-display">${category.icon}</div>
      <div class="category-info">
        <div class="category-manager-name">${category.name}</div>
        <div class="category-phrase-count">ID: ${category.id}</div>
      </div>
      <div class="category-manager-actions">
        <button class="btn-small" data-edit-category="${index}" title="Edit">✏️</button>
        <button class="btn-small delete" data-delete-category="${index}" title="Delete">🗑️</button>
      </div>
    `;
    categoryList.appendChild(item);
  });

  // Add event listeners
  categoryList.querySelectorAll('[data-edit-category]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.editCategory);
      editCategory(index);
    });
  });

  categoryList.querySelectorAll('[data-delete-category]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.deleteCategory);
      deleteCategory(index);
    });
  });
}

function renderCategoryStats() {
  if (!categoryStats) return;

  categoryStats.innerHTML = `
    <div class="category-stat-card">
      <div class="category-stat-value">${categories.length}</div>
      <div class="category-stat-label">Total Categories</div>
    </div>
    <div class="category-stat-card">
      <div class="category-stat-value">${customPhrases.length}</div>
      <div class="category-stat-label">Custom Phrases</div>
    </div>
    <div class="category-stat-card">
      <div class="category-stat-value">${defaultPhrases.length}</div>
      <div class="category-stat-label">Default Phrases</div>
    </div>
    <div class="category-stat-card">
      <div class="category-stat-value">${customPhrases.length + defaultPhrases.length}</div>
      <div class="category-stat-label">Total Phrases</div>
    </div>
  `;
}

function createCategory() {
  const name = document.getElementById('newCategoryName')?.value.trim();
  const icon = document.getElementById('newCategoryIcon')?.value.trim() || '📁';
  const color = document.getElementById('newCategoryColor')?.value || '#667eea';

  if (!name) {
    showNotification('Please enter a category name', false);
    return;
  }

  const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  if (categories.some(c => c.id === id)) {
    showNotification('Category already exists', false);
    return;
  }

  categories.push({ id, name, icon, color });
  saveCategories();
  renderCategoryList();
  renderCategoryStats();

  // Clear inputs
  document.getElementById('newCategoryName').value = '';
  document.getElementById('newCategoryIcon').value = '';
  document.getElementById('newCategoryColor').value = '#667eea';

  showNotification(`Category "${name}" created!`, true);
}

function editCategory(index) {
  const category = categories[index];
  if (!category) return;

  const newName = prompt('Enter new category name:', category.name);
  if (newName && newName.trim()) {
    categories[index].name = newName.trim();
    saveCategories();
    renderCategoryList();
    showNotification('Category updated!', true);
  }
}

function deleteCategory(index) {
  const category = categories[index];
  if (!category) return;

  if (confirm(`Delete category "${category.name}"?`)) {
    categories.splice(index, 1);
    saveCategories();
    renderCategoryList();
    renderCategoryStats();
    showNotification('Category deleted!', true);
  }
}

// Category manager event handlers
document.getElementById('openCategoryManager')?.addEventListener('click', async () => {
  await loadCategories();
  renderCategoryList();
  renderCategoryStats();
  categoryManagerModal.classList.add('show');
});

document.getElementById('createCategory')?.addEventListener('click', createCategory);

// ===== HELP MODAL =====

const helpModal = document.getElementById('helpModal');
document.getElementById('openHelp')?.addEventListener('click', () => {
  helpModal.classList.add('show');
});

// ===== INITIALIZATION =====

(async function init() {
  await loadAccounts();
  loadSchedules();
  updateAccountSelect();
  await updateInputStatus();
  await updateStats();
  loadSettings();
  await loadDefaultPhrasesFromFile();
  await loadCustomPhrases();
  // Chat logging event handlers
  elements.chatLoggingEnabled?.addEventListener('change', async () => {
    const enabled = elements.chatLoggingEnabled.checked;
    await chrome.storage.local.set({ chatLoggingEnabled: enabled });

    const action = enabled ? 'startChatLogging' : 'stopChatLogging';
    const response = await sendMessageToContent({ action });

    if (response?.ok) {
      showNotification(enabled ? 'Chat logging enabled' : 'Chat logging disabled', true);
    } else {
      showNotification('Make sure to mark a message container first', false);
      elements.chatLoggingEnabled.checked = false;
    }
  });

  elements.viewChatLogs?.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('chat-log-viewer.html') });
  });

  elements.openChatLogs?.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('chat-log-viewer.html') });
  });

  // Manual detection event handlers
  elements.manualDetectionEnabled?.addEventListener('change', async () => {
    const enabled = elements.manualDetectionEnabled.checked;
    await chrome.storage.local.set({ manualDetectionEnabled: enabled });

    const action = enabled ? 'startManualDetection' : 'stopManualDetection';
    const response = await sendMessageToContent({ action });

    if (response?.ok) {
      showNotification(enabled ? 'Manual detection enabled' : 'Manual detection disabled', true);

      if (elements.manualDetectionStatus) {
        elements.manualDetectionStatus.textContent = enabled ?
          '✅ Timer will reset when you manually send messages' : '';
        elements.manualDetectionStatus.style.display = enabled ? 'block' : 'none';
      }
    } else {
      showNotification('Make sure to mark an input field first', false);
      elements.manualDetectionEnabled.checked = false;
    }
  });

  await loadNotificationHistory();
  await loadCategories();

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

// Profile overlay close handler
const profileClose = document.getElementById('profile-close');
if (profileClose) {
  profileClose.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const overlay = document.getElementById('profile-overlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
  });
}

// ===== ANALYTICS CHARTS =====

let mainChartInstance = null;
let hourlyChartInstance = null;

async function initializeAnalyticsCharts() {
  const range = document.getElementById('analyticsTimeRange')?.value || '7d';

  let stats;
  try {
    stats = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getAnalyticsData', range }, resolve);
    });
  } catch (e) {
    console.error('[Popup] Failed to fetch analytics data:', e);
    return;
  }

  if (!stats || stats.error) {
    console.warn('[Popup] Analytics unavailable:', stats?.error);
    return;
  }

  // Render Main Chart
  const ctxMain = document.getElementById('mainChart')?.getContext('2d');
  if (ctxMain) {
    if (mainChartInstance) mainChartInstance.destroy();

    const config = getMainChartConfig(ctxMain, {
      labels: stats.timeSeries.map(d => d.label),
      sent: stats.timeSeries.map(d => d.sent),
      failed: stats.timeSeries.map(d => d.failed)
    });
    // Ensure Chart is available
    if (typeof Chart !== 'undefined') {
      mainChartInstance = new Chart(ctxMain, config);
    }
  }

  // Render Hourly Chart
  const ctxHourly = document.getElementById('hourlyChart')?.getContext('2d');
  if (ctxHourly && stats.hourlyHeatmap) {
    if (hourlyChartInstance) hourlyChartInstance.destroy();

    const config = getHourlyChartConfig(ctxHourly, stats.hourlyHeatmap);
    if (typeof Chart !== 'undefined') {
      hourlyChartInstance = new Chart(ctxHourly, config);
    }
  }
}

