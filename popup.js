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
