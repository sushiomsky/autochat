/* content-enhanced.js — AutoChat Enhanced
   Advanced auto-send with typing simulation, anti-detection, and smart features
*/

// ===== STATE MANAGEMENT =====
let chatInputSelector = null;
let sendButtonSelector = null;
let sendMethod = 'enter'; // 'enter' or 'click'
let autoSendInterval = null;
let markingMode = false;
let markingSendButtonMode = false;
let highlightOverlay = null;
let messageList = [];
let currentMessageIndex = 0;
let sendMode = 'random';
let minInterval = 60;
let maxInterval = 120;
let recentMessages = []; // Anti-repetition tracking
let messagesSentToday = 0;
let totalMessagesSent = 0;
let dailyLimit = 0; // 0 = no limit
let enableTypingSimulation = true;
let enableVariableDelays = true;
let enableAntiRepetition = true;
let activeHoursEnabled = false;
let activeHoursStart = 9;
let activeHoursEnd = 22;
let templateVariablesEnabled = true;

// ===== HELPER FUNCTIONS =====

// Build unique CSS selector for element
function getElementSelector(el) {
  if (!el) return null;
  if (el.id) return `#${el.id}`;
  const parts = [];
  while (el && el.nodeType === 1 && parts.length < 5) {
    let part = el.nodeName.toLowerCase();
    if (el.className) {
      const cls = el.className.trim().split(/\s+/)[0];
      if (cls) part += `.${cls}`;
    }
    const siblings = Array.from(el.parentNode?.children || []);
    const index = siblings.indexOf(el) + 1;
    part += `:nth-child(${index})`;
    parts.unshift(part);
    el = el.parentNode;
  }
  return parts.join(' > ');
}

// Template variable replacement
function processTemplateVariables(text) {
  if (!templateVariablesEnabled) return text;

  const emojis = ['😊', '😎', '👍', '🎉', '✨', '🔥', '💪', '🌟', '😄', '🎯'];
  const now = new Date();

  return text
    .replace(/\{time\}/g, now.toLocaleTimeString())
    .replace(/\{date\}/g, now.toLocaleDateString())
    .replace(/\{random_emoji\}/g, emojis[Math.floor(Math.random() * emojis.length)])
    .replace(/\{random_number\}/g, Math.floor(Math.random() * 100).toString())
    .replace(/\{timestamp\}/g, Date.now().toString());
}

// Add realistic typos occasionally (5% chance)
function addTypo(text) {
  if (Math.random() > 0.05) return text; // 95% no typo

  const words = text.split(' ');
  if (words.length < 2) return text;

  const wordIndex = Math.floor(Math.random() * words.length);
  const word = words[wordIndex];
  if (word.length < 3) return text;

  // Simple typo: swap two adjacent characters
  const charIndex = Math.floor(Math.random() * (word.length - 1));
  const chars = word.split('');
  [chars[charIndex], chars[charIndex + 1]] = [chars[charIndex + 1], chars[charIndex]];
  words[wordIndex] = chars.join('');

  return words.join(' ');
}

// Check if within active hours
function isWithinActiveHours() {
  if (!activeHoursEnabled) return true;

  const hour = new Date().getHours();
  if (activeHoursStart <= activeHoursEnd) {
    return hour >= activeHoursStart && hour < activeHoursEnd;
  } else {
    // Wraps around midnight
    return hour >= activeHoursStart || hour < activeHoursEnd;
  }
}

// Check daily limit
function checkDailyLimit() {
  if (dailyLimit === 0) return true; // No limit
  return messagesSentToday < dailyLimit;
}

// ===== VISUAL HIGHLIGHTING =====

function createHighlight(el) {
  removeHighlight();
  if (!el) return;
  const rect = el.getBoundingClientRect();
  highlightOverlay = document.createElement('div');
  highlightOverlay.style.cssText = `
    position: fixed;
    left: ${rect.left}px;
    top: ${rect.top}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
    border: 3px solid #00ff00;
    background: rgba(0, 255, 0, 0.1);
    pointer-events: none;
    z-index: 999999;
    box-sizing: border-box;
  `;
  document.body.appendChild(highlightOverlay);
}

function createButtonHighlight(el) {
  removeHighlight();
  if (!el) return;
  const rect = el.getBoundingClientRect();
  highlightOverlay = document.createElement('div');
  highlightOverlay.style.cssText = `
    position: fixed;
    left: ${rect.left}px;
    top: ${rect.top}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
    border: 3px solid #007bff;
    background: rgba(0, 123, 255, 0.1);
    pointer-events: none;
    z-index: 999999;
    box-sizing: border-box;
  `;
  document.body.appendChild(highlightOverlay);
}

function removeHighlight() {
  if (highlightOverlay) {
    highlightOverlay.remove();
    highlightOverlay = null;
  }
}

// ===== MARKING MODE =====

function startMarkingMode() {
  markingMode = true;
  console.log('[AutoChat] Click on the input field to mark it');

  const indicator = document.createElement('div');
  indicator.id = 'autochat-marking-indicator';
  indicator.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: #00ff00;
    color: black;
    padding: 12px 24px;
    border-radius: 8px;
    z-index: 1000000;
    font-family: Arial, sans-serif;
    font-weight: bold;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;
  indicator.textContent = '🎯 Click on the chat input field';
  document.body.appendChild(indicator);

  const hoverHandler = (e) => {
    if (!markingMode) return;
    const target = e.target;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true' || target.getAttribute('contenteditable') === 'true') {
      createHighlight(target);
    } else {
      removeHighlight();
    }
  };

  const clickHandler = (e) => {
    if (!markingMode) return;
    const target = e.target;

    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true' || target.getAttribute('contenteditable') === 'true') {
      e.preventDefault();
      e.stopPropagation();

      chatInputSelector = getElementSelector(target);
      console.log('[AutoChat] Input field marked:', chatInputSelector);

      chrome.storage.local.set({ chatInputSelector });

      markingMode = false;
      document.removeEventListener('mouseover', hoverHandler, true);
      document.removeEventListener('click', clickHandler, true);
      removeHighlight();

      const indicator = document.getElementById('autochat-marking-indicator');
      if (indicator) {
        indicator.textContent = '✅ Input field marked!';
        indicator.style.background = '#00cc00';
        setTimeout(() => indicator.remove(), 2000);
      }
    }
  };

  document.addEventListener('mouseover', hoverHandler, true);
  document.addEventListener('click', clickHandler, true);
}

function startMarkingSendButtonMode() {
  markingSendButtonMode = true;
  console.log('[AutoChat] Click on the Send button to mark it');

  const indicator = document.createElement('div');
  indicator.id = 'autochat-marking-indicator-send-btn';
  indicator.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: #007bff;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    z-index: 1000000;
    font-family: Arial, sans-serif;
    font-weight: bold;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;
  indicator.textContent = '📍 Click on the Send button';
  document.body.appendChild(indicator);

  const hoverHandler = (e) => {
    if (!markingSendButtonMode) return;
    const target = e.target;
    if (isClickableButton(target)) {
      createButtonHighlight(target);
    } else {
      removeHighlight();
    }
  };

  const clickHandler = (e) => {
    if (!markingSendButtonMode) return;
    const target = e.target;
    if (isClickableButton(target)) {
      e.preventDefault();
      e.stopPropagation();

      sendButtonSelector = getElementSelector(target);
      console.log('[AutoChat] Send button marked:', sendButtonSelector);
      chrome.storage.local.set({ sendButtonSelector });

      markingSendButtonMode = false;
      document.removeEventListener('mouseover', hoverHandler, true);
      document.removeEventListener('click', clickHandler, true);
      removeHighlight();

      const indicator = document.getElementById('autochat-marking-indicator-send-btn');
      if (indicator) {
        indicator.textContent = '✅ Send button marked!';
        indicator.style.background = '#28a745';
        setTimeout(() => indicator.remove(), 2000);
      }
    }
  };

  document.addEventListener('mouseover', hoverHandler, true);
  document.addEventListener('click', clickHandler, true);
}

function isClickableButton(el) {
  if (!el) return false;
  if (el.matches('button, [role="button"], input[type="submit"], input[type="button"], .btn, .send')) return true;
  // Some UIs use SVG icons inside a button; climb up a bit
  const btn = el.closest('button, [role="button"], input[type="submit"], input[type="button"]');
  return !!btn;
}

// ===== TYPING SIMULATION =====

async function simulateTyping(inputEl, text, wpm = 60) {
  return new Promise((resolve) => {
    // Convert WPM to characters per minute, then to delay per character
    const cpm = wpm * 5; // Average 5 chars per word
    const delayPerChar = 60000 / cpm; // milliseconds per character

    let i = 0;
    const typeInterval = setInterval(() => {
      if (i < text.length) {
        const currentText = text.substring(0, i + 1);

        if (inputEl.tagName === 'INPUT' || inputEl.tagName === 'TEXTAREA') {
          inputEl.value = currentText;
          inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        } else if (inputEl.contentEditable === 'true') {
          inputEl.textContent = currentText;
          inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        }

        i++;
      } else {
        clearInterval(typeInterval);
        resolve();
      }
    }, delayPerChar + (Math.random() * 50 - 25)); // Add randomness ±25ms
  });
}

// ===== MESSAGE SENDING =====

async function sendMessage(text, retries = 3) {
  if (!chatInputSelector) {
    console.warn('[AutoChat] No input field marked');
    return false;
  }

  try {
    const inputEl = document.querySelector(chatInputSelector);
    if (!inputEl) {
      console.warn('[AutoChat] Input field not found:', chatInputSelector);
      if (retries > 0) {
        console.log('[AutoChat] Retrying...', retries, 'attempts left');
        await new Promise(r => setTimeout(r, 1000));
        return sendMessage(text, retries - 1);
      }
      return false;
    }

    inputEl.focus();

    // Variable delay before typing (simulate thinking time)
    if (enableVariableDelays) {
      await new Promise(r => setTimeout(r, 500 + Math.random() * 1500));
    }

    // Process template variables
    text = processTemplateVariables(text);

    // Typing simulation
    if (enableTypingSimulation) {
      const wpm = 40 + Math.random() * 40; // 40-80 WPM (realistic range)
      await simulateTyping(inputEl, text, wpm);
    } else {
      // Instant text setting
      if (inputEl.tagName === 'INPUT' || inputEl.tagName === 'TEXTAREA') {
        inputEl.value = text;
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        inputEl.dispatchEvent(new Event('change', { bubbles: true }));
      } else if (inputEl.contentEditable === 'true') {
        inputEl.textContent = text;
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }

    // Small delay before sending
    await new Promise(r => setTimeout(r, 200 + Math.random() * 300));

    // Try to send the message according to selected method
    let sent = false;

    if (sendMethod === 'enter') {
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true
      });
      inputEl.dispatchEvent(enterEvent);
      sent = true;
    } else if (sendMethod === 'click') {
      // If specific send button was marked, click it
      let btn = null;
      if (sendButtonSelector) {
        btn = document.querySelector(sendButtonSelector);
      }
      if (!btn) {
        // Heuristic: look around the input for send-like buttons
        const parent = inputEl.closest('form') || inputEl.parentElement;
        if (parent) {
          const buttons = parent.querySelectorAll('button, [role="button"], input[type="submit"], input[type="button"]');
          for (const b of buttons) {
            const btnText = (b.textContent || '').toLowerCase();
            const label = (b.getAttribute('aria-label') || '').toLowerCase();
            if (btnText.includes('send') || btnText.includes('submit') || label.includes('send')) {
              btn = b; break;
            }
          }
        }
      }
      if (btn) {
        btn.click();
        sent = true;
      } else {
        console.warn('[AutoChat] Send button not found for click method');
      }
    }

    if (!sent && sendMethod === 'click') {
      // Fallback: try Enter if click method failed
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true
      });
      inputEl.dispatchEvent(enterEvent);
      sent = true;
    }

    if (sent) {
      messagesSentToday++;
      totalMessagesSent++;
      chrome.runtime.sendMessage({ action: 'incrementMessageCount' });
      console.log('[AutoChat] Message sent:', text);
    }

    return sent;
  } catch (e) {
    console.error('[AutoChat] Error:', e);
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 1000));
      return sendMessage(text, retries - 1);
    }
    return false;
  }
}

// ===== MESSAGE SELECTION =====

function getNextMessage() {
  if (!messageList || messageList.length === 0) return '';

  if (sendMode === 'random') {
    let msg;
    let attempts = 0;

    // Anti-repetition logic
    if (enableAntiRepetition && messageList.length > 3) {
      do {
        msg = messageList[Math.floor(Math.random() * messageList.length)];
        attempts++;
      } while (recentMessages.includes(msg) && attempts < 10);
    } else {
      msg = messageList[Math.floor(Math.random() * messageList.length)];
    }

    // Update recent messages
    if (enableAntiRepetition) {
      recentMessages.push(msg);
      if (recentMessages.length > Math.min(5, Math.floor(messageList.length / 2))) {
        recentMessages.shift();
      }
    }

    return msg;
  } else {
    // Sequential mode
    const msg = messageList[currentMessageIndex];
    currentMessageIndex = (currentMessageIndex + 1) % messageList.length;
    return msg;
  }
}

// ===== SCHEDULING =====

function getRandomInterval() {
  const min = minInterval * 1000;
  const max = maxInterval * 1000;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function scheduleNextMessage() {
  if (!autoSendInterval) return; // stopped

  // Check active hours
  if (!isWithinActiveHours()) {
    console.log('[AutoChat] Outside active hours, pausing...');
    autoSendInterval = setTimeout(() => scheduleNextMessage(), 60000); // Check again in 1 minute
    return;
  }

  // Check daily limit
  if (!checkDailyLimit()) {
    console.log('[AutoChat] Daily limit reached, stopping...');
    stopAutoSend();
    chrome.runtime.sendMessage({ action: 'updateBadge', active: false });
    return;
  }

  const message = getNextMessage();
  if (!message) {
    console.warn('[AutoChat] No messages in list');
    return;
  }

  await sendMessage(message);

  const nextInterval = getRandomInterval();
  console.log(`[AutoChat] Next message in ${(nextInterval/1000).toFixed(1)}s`);

  autoSendInterval = setTimeout(() => {
    scheduleNextMessage();
  }, nextInterval);
}

// ===== AUTO-SEND CONTROL =====

function startAutoSend(messages, config = {}) {
  stopAutoSend();

  if (config && config.sendMethod) {
    sendMethod = config.sendMethod;
    chrome.storage.local.set({ sendMethod });
  }

  if (!chatInputSelector) {
    console.warn('[AutoChat] No input field marked');
    return false;
  }

  if (!messages || messages.length === 0) {
    console.warn('[AutoChat] No messages provided');
    return false;
  }

  // Apply configuration
  messageList = messages;
  sendMode = config.mode || 'random';
  minInterval = config.minInterval || 60;
  maxInterval = config.maxInterval || 120;
  dailyLimit = config.dailyLimit || 0;
  enableTypingSimulation = config.enableTypingSimulation !== false;
  enableVariableDelays = config.enableVariableDelays !== false;
  enableAntiRepetition = config.enableAntiRepetition !== false;
  activeHoursEnabled = config.activeHoursEnabled || false;
  activeHoursStart = config.activeHoursStart || 9;
  activeHoursEnd = config.activeHoursEnd || 22;
  templateVariablesEnabled = config.templateVariablesEnabled !== false;

  currentMessageIndex = 0;
  recentMessages = [];

  console.log(`[AutoChat] Starting auto-send (${sendMode} mode, ${minInterval}-${maxInterval}s interval)`);

  // Update badge
  chrome.runtime.sendMessage({ action: 'updateBadge', active: true });

  // Start scheduling
  autoSendInterval = true;
  scheduleNextMessage();

  return true;
}

function stopAutoSend() {
  if (autoSendInterval) {
    if (typeof autoSendInterval === 'number') {
      clearTimeout(autoSendInterval);
    }
    autoSendInterval = null;
    chrome.runtime.sendMessage({ action: 'updateBadge', active: false });
    console.log('[AutoChat] Stopped auto-send');
  }
}

// ===== INITIALIZATION =====

// Load saved settings
chrome.storage.local.get([
  'chatInputSelector',
  'sendMethod',
  'sendButtonSelector',
  'messagesSentToday',
  'totalMessagesSent',
  'lastResetDate'
], (data) => {
  if (data.chatInputSelector) {
    chatInputSelector = data.chatInputSelector;
    console.log('[AutoChat] Loaded selector:', chatInputSelector);
  }
  sendMethod = data.sendMethod || 'enter';
  sendButtonSelector = data.sendButtonSelector || null;

  messagesSentToday = data.messagesSentToday || 0;
  totalMessagesSent = data.totalMessagesSent || 0;

  // Reset daily counter if new day
  const today = new Date().toDateString();
  if (data.lastResetDate !== today) {
    messagesSentToday = 0;
    chrome.storage.local.set({
      messagesSentToday: 0,
      lastResetDate: today
    });
  }
});

// ===== MESSAGE HANDLERS =====

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'startMarkingMode') {
    startMarkingMode();
    sendResponse({ ok: true });
  }

  if (msg.action === 'startMarkingSendButtonMode') {
    startMarkingSendButtonMode();
    sendResponse({ ok: true });
  }

  if (msg.action === 'getChatInputSelector') {
    sendResponse({ selector: chatInputSelector });
  }

  if (msg.action === 'sendMessage') {
    sendMessage(msg.text || '').then(success => {
      sendResponse({ ok: success });
    });
    return true; // Async response
  }

  if (msg.action === 'startAutoSend') {
    const success = startAutoSend(msg.messages || [], msg.config || {});
    sendResponse({ ok: success });
  }

  if (msg.action === 'stopAutoSend') {
    stopAutoSend();
    sendResponse({ ok: true });
  }

  if (msg.action === 'getStats') {
    sendResponse({
      messagesSentToday,
      totalMessagesSent,
      isActive: !!autoSendInterval
    });
  }

  return true;
});
