/* popup.js — AutoChat UI controller
   Handles UI actions and communicates with the content script.
*/

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// helper to ensure the content script is loaded
async function ensureContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    });
    console.log('[Popup] content.js injected into tab', tabId);
  } catch (err) {
    console.warn('[Popup] Could not inject content script:', err);
  }
}

// safely send message to content script
async function sendMessageToContent(msg) {
  const tab = await getActiveTab();
  if (!tab?.id) return alert('No active tab found!');
  try {
    return await chrome.tabs.sendMessage(tab.id, msg);
  } catch (err) {
    // Fallback: content script may not be loaded → inject and retry
    console.log('[Popup] Reinjecting content script and retrying…');
    await ensureContentScript(tab.id);
    await new Promise(r => setTimeout(r, 500));
    try {
      return await chrome.tabs.sendMessage(tab.id, msg);
    } catch (err2) {
      console.error('[Popup] Failed to connect even after reinject', err2);
      alert('Failed to reach content script. Please reload the page.');
      return null;
    }
  }
}

// ===== UI ELEMENTS =====
const inputStatus = document.getElementById('inputStatus');
const messageListTextarea = document.getElementById('messageList');
const sendModeSelect = document.getElementById('sendMode');
const minIntervalInput = document.getElementById('minInterval');
const maxIntervalInput = document.getElementById('maxInterval');
const phrasesStatus = document.getElementById('phrasesStatus');
const phraseModal = document.getElementById('phraseModal');
const customPhrasesList = document.getElementById('customPhrasesList');
const defaultPhrasesList = document.getElementById('defaultPhrasesList');
const customPhrasesCount = document.getElementById('customPhrasesCount');
const defaultPhrasesCount = document.getElementById('defaultPhrasesCount');
const newPhraseInput = document.getElementById('newPhraseInput');

// Store default phrases from farming_phrases.txt
let defaultPhrases = [];
let customPhrases = [];

// Update status display
async function updateInputStatus() {
  const tab = await getActiveTab();
  if (!tab?.id) return;
  
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'getChatInputSelector' });
    if (response && response.selector) {
      inputStatus.textContent = '✅ Input field marked';
      inputStatus.className = 'status success';
    } else {
      inputStatus.textContent = 'No input field marked';
      inputStatus.className = 'status';
    }
  } catch (e) {
    inputStatus.textContent = 'No input field marked';
    inputStatus.className = 'status';
  }
}

// Parse messages from textarea
function getMessages() {
  const text = messageListTextarea.value.trim();
  if (!text) return [];
  return text.split('\n').map(m => m.trim()).filter(m => m.length > 0);
}

// Load default phrases from farming_phrases.txt
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

// Load custom phrases from storage
async function loadCustomPhrases() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['customPhrases'], (data) => {
      customPhrases = data.customPhrases || [];
      resolve(customPhrases);
    });
  });
}

// Save custom phrases to storage
function saveCustomPhrases() {
  chrome.storage.local.set({ customPhrases });
}

// Add a new custom phrase
function addCustomPhrase(phrase) {
  const trimmed = phrase.trim();
  if (!trimmed) return false;
  if (customPhrases.includes(trimmed)) return false; // Avoid duplicates
  customPhrases.push(trimmed);
  saveCustomPhrases();
  return true;
}

// Delete a custom phrase
function deleteCustomPhrase(index) {
  if (index >= 0 && index < customPhrases.length) {
    customPhrases.splice(index, 1);
    saveCustomPhrases();
    return true;
  }
  return false;
}

// Render phrase list in modal
function renderPhrasesList() {
  // Render custom phrases
  customPhrasesCount.textContent = customPhrases.length;
  customPhrasesList.innerHTML = '';
  
  if (customPhrases.length === 0) {
    customPhrasesList.innerHTML = '<div class="help" style="text-align: center; padding: 20px;">No custom phrases yet. Add one above!</div>';
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
      customPhrasesList.appendChild(item);
    });
  }
  
  // Render default phrases
  defaultPhrasesCount.textContent = defaultPhrases.length;
  defaultPhrasesList.innerHTML = '';
  
  if (defaultPhrases.length === 0) {
    defaultPhrasesList.innerHTML = '<div class="help" style="text-align: center; padding: 20px;">No default phrases loaded</div>';
  } else {
    defaultPhrases.slice(0, 50).forEach((phrase) => {
      const item = document.createElement('div');
      item.className = 'phrase-item';
      item.innerHTML = `
        <div class="phrase-text" title="${phrase.replace(/"/g, '&quot;')}">${phrase}</div>
      `;
      defaultPhrasesList.appendChild(item);
    });
    
    if (defaultPhrases.length > 50) {
      const more = document.createElement('div');
      more.className = 'help';
      more.style.textAlign = 'center';
      more.style.padding = '8px';
      more.textContent = `... and ${defaultPhrases.length - 50} more`;
      defaultPhrasesList.appendChild(more);
    }
  }
  
  // Add event listeners for delete buttons
  customPhrasesList.querySelectorAll('.btn-small.delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      if (confirm('Delete this phrase?')) {
        deleteCustomPhrase(index);
        renderPhrasesList();
      }
    });
  });
}

// Show status message
function showPhrasesStatus(message, isSuccess = true) {
  phrasesStatus.textContent = message;
  phrasesStatus.className = isSuccess ? 'status success' : 'status';
  phrasesStatus.style.display = 'block';
  setTimeout(() => {
    phrasesStatus.style.display = 'none';
  }, 3000);
}

// ===== EVENT HANDLERS =====

// Mark input field
document.getElementById('markInput')?.addEventListener('click', async () => {
  await sendMessageToContent({ action: 'startMarkingMode' });
  window.close(); // Close popup so user can click on the page
});

// Send message once
document.getElementById('sendOnce')?.addEventListener('click', async () => {
  const messages = getMessages();
  if (messages.length === 0) {
    alert('Please enter at least one message');
    return;
  }
  
  // Pick a random message
  const randomMsg = messages[Math.floor(Math.random() * messages.length)];
  
  const response = await sendMessageToContent({ 
    action: 'sendMessage', 
    text: randomMsg
  });
  
  if (response && response.ok) {
    alert('Message sent: ' + randomMsg);
  } else {
    alert('Failed to send. Make sure you\'ve marked an input field first.');
  }
});

// Start auto-send
document.getElementById('startAutoSend')?.addEventListener('click', async () => {
  const messages = getMessages();
  if (messages.length === 0) {
    alert('Please enter at least one message');
    return;
  }
  
  const mode = sendModeSelect.value;
  const minInterval = parseInt(minIntervalInput.value) || 60;
  const maxInterval = parseInt(maxIntervalInput.value) || 120;
  
  if (minInterval > maxInterval) {
    alert('Min interval must be less than or equal to max interval');
    return;
  }
  
  const response = await sendMessageToContent({ 
    action: 'startAutoSend', 
    messages,
    mode,
    minInterval,
    maxInterval
  });
  
  if (response && response.ok) {
    alert(`Auto-send started!\nMode: ${mode}\nInterval: ${minInterval}-${maxInterval} seconds\nMessages: ${messages.length}`);
  } else {
    alert('Failed to start. Make sure you\'ve marked an input field first.');
  }
});

// Stop auto-send
document.getElementById('stopAutoSend')?.addEventListener('click', async () => {
  await sendMessageToContent({ action: 'stopAutoSend' });
  alert('Auto-send stopped.');
});

// ===== LOAD/SAVE SETTINGS =====

// Check input field status on popup open
updateInputStatus();

// Auto-load phrases if message list is empty
chrome.storage.local.get(['messageList'], async (data) => {
  if (!data.messageList || data.messageList.trim() === '') {
    // Auto-load default phrases
    await loadDefaultPhrasesFromFile();
    await loadCustomPhrases();
    const allPhrases = [...customPhrases, ...defaultPhrases];
    if (allPhrases.length > 0) {
      messageListTextarea.value = allPhrases.join('\n');
      chrome.storage.local.set({ messageList: messageListTextarea.value });
    }
  }
});

// Load saved settings
chrome.storage.local.get(['messageList', 'sendMode', 'minInterval', 'maxInterval'], (data) => {
  if (data.messageList) messageListTextarea.value = data.messageList;
  if (data.sendMode) sendModeSelect.value = data.sendMode;
  if (data.minInterval) minIntervalInput.value = data.minInterval;
  if (data.maxInterval) maxIntervalInput.value = data.maxInterval;
});

// Save settings when changed
messageListTextarea.addEventListener('input', (e) => {
  chrome.storage.local.set({ messageList: e.target.value });
});

sendModeSelect.addEventListener('change', (e) => {
  chrome.storage.local.set({ sendMode: e.target.value });
});

minIntervalInput.addEventListener('change', (e) => {
  chrome.storage.local.set({ minInterval: e.target.value });
});

maxIntervalInput.addEventListener('change', (e) => {
  chrome.storage.local.set({ maxInterval: e.target.value });
});

// Load default phrases button
document.getElementById('loadDefaultPhrases')?.addEventListener('click', async () => {
  await loadDefaultPhrasesFromFile();
  await loadCustomPhrases();
  
  // Combine all phrases
  const allPhrases = [...customPhrases, ...defaultPhrases];
  
  if (allPhrases.length === 0) {
    alert('No phrases available to load.');
    return;
  }
  
  // Set to textarea
  messageListTextarea.value = allPhrases.join('\n');
  chrome.storage.local.set({ messageList: messageListTextarea.value });
  
  showPhrasesStatus(`✅ Loaded ${allPhrases.length} phrases (${customPhrases.length} custom + ${defaultPhrases.length} default)`);
});

// Manage phrases button
document.getElementById('managePhrases')?.addEventListener('click', async () => {
  await loadDefaultPhrasesFromFile();
  await loadCustomPhrases();
  renderPhrasesList();
  phraseModal.classList.add('show');
});

// Close modal
document.getElementById('closeModal')?.addEventListener('click', () => {
  phraseModal.classList.remove('show');
});

// Close modal on background click
phraseModal?.addEventListener('click', (e) => {
  if (e.target === phraseModal) {
    phraseModal.classList.remove('show');
  }
});

// Add new phrase
document.getElementById('addNewPhrase')?.addEventListener('click', () => {
  const phrase = newPhraseInput.value.trim();
  if (!phrase) {
    alert('Please enter a phrase');
    return;
  }
  
  if (addCustomPhrase(phrase)) {
    newPhraseInput.value = '';
    renderPhrasesList();
    showPhrasesStatus('✅ Phrase added!');
  } else {
    alert('This phrase already exists or is empty');
  }
});

// Initialize: Load default phrases on startup
(async function init() {
  await loadDefaultPhrasesFromFile();
  await loadCustomPhrases();
})();
