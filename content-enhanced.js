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
let minInterval = 1; // minutes
let maxInterval = 2; // minutes
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
let sendConfirmTimeoutMs = 3000; // default 3s
let messageContainerSelector = null;

// Mention detection state
let mentionDetectionEnabled = false;
let mentionKeywords = []; // keywords/username to watch for
let mentionReplyMessages = []; // messages to use for replies
let mentionObserver = null;
const lastProcessedMessages = new Set(); // Track processed messages to avoid duplicates

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

// Add human-like imperfections to messages (10% chance)
function addHumanImperfections(text) {
  // Only apply to 10% of messages to stay natural
  if (Math.random() > 0.1) return text;
  
  const imperfections = [
    // Common typos (swap adjacent letters)
    () => {
      if (text.length < 5) return text;
      const words = text.split(' ');
      const wordIdx = Math.floor(Math.random() * words.length);
      const word = words[wordIdx];
      if (word.length < 3) return text;
      const charIdx = Math.floor(Math.random() * (word.length - 1));
      const chars = word.split('');
      [chars[charIdx], chars[charIdx + 1]] = [chars[charIdx + 1], chars[charIdx]];
      words[wordIdx] = chars.join('');
      return words.join(' ');
    },
    // Missing punctuation at end
    () => text.endsWith('.') || text.endsWith('!') || text.endsWith('?') ? text.slice(0, -1) : text,
    // Double space
    () => text.replace(/ /g, (match) => Math.random() > 0.95 ? '  ' : match),
    // Lowercase start (casual)
    () => text.charAt(0).toLowerCase() + text.slice(1),
    // Extra letter
    () => {
      const words = text.split(' ');
      const wordIdx = Math.floor(Math.random() * words.length);
      const word = words[wordIdx];
      if (word.length < 2) return text;
      const charIdx = Math.floor(Math.random() * word.length);
      words[wordIdx] = word.slice(0, charIdx) + word.charAt(charIdx) + word.slice(charIdx);
      return words.join(' ');
    }
  ];
  
  // Randomly pick one imperfection
  const imperfection = imperfections[Math.floor(Math.random() * imperfections.length)];
  return imperfection();
}

// Simple sleep helper
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Confirm that the message was actually sent by checking that the
// input no longer contains the expected text. Returns true if cleared.
async function confirmMessageSent(inputEl, expectedText, timeoutMs = 3000) {
  const check = () => {
    try {
      if (!inputEl) return true; // if input gone, assume sent
      if (inputEl.tagName === 'INPUT' || inputEl.tagName === 'TEXTAREA') {
        return String(inputEl.value || '').trim() !== String(expectedText || '').trim();
      }
      if (inputEl.contentEditable === 'true' || inputEl.getAttribute('contenteditable') === 'true') {
        return String(inputEl.textContent || '').trim() !== String(expectedText || '').trim();
      }
      return true;
    } catch (e) {
      return true;
    }
  };

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (check()) return true;
    // small delay between checks
    // some apps clear input asynchronously after server ack
    // so poll for up to timeoutMs
    // eslint-disable-next-line no-await-in-loop
    await sleep(200);
  }

  // If input still contains the text, try a MutationObserver to watch for the message appearing in DOM
  if (!check()) {
    return new Promise((resolve) => {
      const obsTimeout = setTimeout(() => {
        if (observer) observer.disconnect();
        // final fallback: check within message container if available
        if (messageContainerSelector) {
          const container = document.querySelector(messageContainerSelector);
          if (container && findMessageInDOMWithin(container, expectedText)) {
            resolve(true);
            return;
          }
        }
        resolve(check() || findMessageInDOM(expectedText));
      }, 1000);

      const observer = new MutationObserver((mutations) => {
        if (check()) {
          clearTimeout(obsTimeout);
          observer.disconnect();
          resolve(true);
          return;
        }

        // If a message container is marked, we will observe mutations on it (see observeTarget below)
        for (const m of mutations) {
          for (const node of Array.from(m.addedNodes || [])) {
            if (node.nodeType !== 1) continue;
            const txt = (node.textContent || '').trim();
            if (!txt) continue;
            if (txt.includes(String(expectedText).trim()) || String(expectedText).trim().includes(txt)) {
              clearTimeout(obsTimeout);
              observer.disconnect();
              resolve(true);
              return;
            }
          }
        }
      });

      const observeTarget = messageContainerSelector ? document.querySelector(messageContainerSelector) || document.body : document.body;
      observer.observe(observeTarget, { childList: true, subtree: true });
    });
  }

  return true;
}

// Try to detect the message in the DOM (heuristic). Returns true if found.
function findMessageInDOM(expectedText) {
  if (!expectedText) return false;
  const norm = String(expectedText).trim();
  // Check common chat container selectors first for efficiency
  const selectors = [
    '.message', '.msg', '.message-text', '.bubble', '.chat-message', '.text', '.reply', '.chat__message'
  ];

  for (const sel of selectors) {
    const els = document.querySelectorAll(sel);
    for (const el of els) {
      if (!el) continue;
      const txt = (el.textContent || '').trim();
      if (!txt) continue;
      if (txt.includes(norm) || norm.includes(txt)) return true;
    }
  }

  // Fallback: scan generic text-bearing elements (limited for performance)
  const candidates = document.querySelectorAll('div, p, span, li');
  let checked = 0;
  for (const el of candidates) {
    if (checked++ > 200) break; // limit scan
    const txt = (el.textContent || '').trim();
    if (!txt) continue;
    if (txt.includes(norm) || norm.includes(txt)) return true;
  }

  return false;
}

// Find message in specific container (more efficient)
function findMessageInDOMWithin(container, expectedText) {
  if (!container || !expectedText) return false;
  const norm = String(expectedText).trim();
  const candidates = container.querySelectorAll('div, p, span, li');
  for (const el of candidates) {
    const txt = (el.textContent || '').trim();
    if (!txt) continue;
    if (txt.includes(norm) || norm.includes(txt)) return true;
  }
  return false;
}

// Note: typo-insertion feature removed to reduce unused helper warnings.

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

// ===== MENTION DETECTION =====

// Check if a message contains any of the mention keywords
function containsMention(text) {
  if (!text || mentionKeywords.length === 0) return false;
  
  const lowerText = text.toLowerCase();
  return mentionKeywords.some(keyword => {
    const lowerKeyword = keyword.toLowerCase();
    // Check for @mention or plain keyword
    return lowerText.includes(`@${lowerKeyword}`) || lowerText.includes(lowerKeyword);
  });
}

// Generate unique identifier for a message to avoid processing duplicates
function getMessageId(element) {
  const text = (element.textContent || '').trim();
  const timestamp = element.getAttribute('data-timestamp') || element.querySelector('[data-timestamp]')?.getAttribute('data-timestamp') || '';
  return `${text}-${timestamp}`.substring(0, 100);
}

// Handle detected mention - send auto-reply
async function handleMentionDetected(messageElement) {
  if (!mentionReplyMessages || mentionReplyMessages.length === 0) {
    console.log('[AutoChat] Mention detected but no reply messages configured');
    return;
  }

  // Check if already processed
  const msgId = getMessageId(messageElement);
  if (lastProcessedMessages.has(msgId)) {
    return;
  }

  // Mark as processed
  lastProcessedMessages.add(msgId);
  
  // Limit the set size to prevent memory issues
  if (lastProcessedMessages.size > 100) {
    const oldestEntries = Array.from(lastProcessedMessages).slice(0, 50);
    oldestEntries.forEach(entry => lastProcessedMessages.delete(entry));
  }

  console.log('[AutoChat] Mention detected! Preparing reply...');

  // Wait a moment to seem more natural
  const replyDelay = Math.random() * 2000 + 1000; // 1-3 seconds
  await sleep(replyDelay);

  // Pick a random reply message
  const replyMessage = mentionReplyMessages[Math.floor(Math.random() * mentionReplyMessages.length)];
  
  // Process template variables
  let processedMessage = processTemplateVariables(replyMessage);
  
  // Add human-like imperfections
  processedMessage = addHumanImperfections(processedMessage);

  // Send the reply
  console.log('[AutoChat] Sending auto-reply to mention:', processedMessage);
  await sendMessage(processedMessage);
}

// Start monitoring messages for mentions
function startMentionDetection() {
  if (!mentionDetectionEnabled || !messageContainerSelector) {
    console.log('[AutoChat] Cannot start mention detection: disabled or no container');
    return;
  }

  stopMentionDetection(); // Clear any existing observer

  const container = document.querySelector(messageContainerSelector);
  if (!container) {
    console.warn('[AutoChat] Message container not found, will retry...');
    // Retry after a delay
    setTimeout(startMentionDetection, 2000);
    return;
  }

  console.log('[AutoChat] Starting mention detection...');

  // Process existing messages
  const existingMessages = container.querySelectorAll('[class*="message"], [class*="msg"], [class*="chat"]');
  existingMessages.forEach(msg => {
    const text = (msg.textContent || '').trim();
    if (text) {
      lastProcessedMessages.add(getMessageId(msg));
    }
  });

  // Observe for new messages
  mentionObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1) continue; // Element nodes only

        // Check if this node or its children contain messages
        const messagesToCheck = [];
        
        // Check the node itself
        if (node.textContent && node.textContent.trim()) {
          messagesToCheck.push(node);
        }

        // Check children (common in chat apps)
        const childMessages = node.querySelectorAll?.('[class*="message"], [class*="msg"], [class*="chat"]');
        if (childMessages) {
          messagesToCheck.push(...Array.from(childMessages));
        }

        // Process each potential message
        messagesToCheck.forEach(msgElement => {
          const text = (msgElement.textContent || '').trim();
          if (!text) return;

          const msgId = getMessageId(msgElement);
          if (lastProcessedMessages.has(msgId)) return;

          if (containsMention(text)) {
            console.log('[AutoChat] New mention detected in:', text.substring(0, 50));
            handleMentionDetected(msgElement);
          } else {
            // Mark as seen even if not a mention
            lastProcessedMessages.add(msgId);
          }
        });
      }
    }
  });

  mentionObserver.observe(container, {
    childList: true,
    subtree: true
  });

  console.log('[AutoChat] Mention detection active');
}

// Stop monitoring messages
function stopMentionDetection() {
  if (mentionObserver) {
    mentionObserver.disconnect();
    mentionObserver = null;
    console.log('[AutoChat] Mention detection stopped');
  }
}

// Load send confirmation timeout from storage (seconds -> ms)
chrome.storage.local.get(['sendConfirmTimeout'], (data) => {
  if (data && data.sendConfirmTimeout) {
    const val = parseInt(data.sendConfirmTimeout, 10);
    if (!isNaN(val) && val > 0) sendConfirmTimeoutMs = val * 1000;
  }
  if (data && data.messageContainerSelector) {
    messageContainerSelector = data.messageContainerSelector;
    console.log('[AutoChat] Loaded messageContainerSelector:', messageContainerSelector);
  }
});

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

function startMarkingMessageContainerMode() {
  markingSendButtonMode = false; // not marking button now
  console.log('[AutoChat] Click on a message container element to mark it');

  const indicator = document.createElement('div');
  indicator.id = 'autochat-marking-indicator-msg-container';
  indicator.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: #ff9800;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    z-index: 1000000;
    font-family: Arial, sans-serif;
    font-weight: bold;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;
  indicator.textContent = '📌 Click on a message container (chat list)';
  document.body.appendChild(indicator);

  const hoverHandler = (e) => {
    if (!indicator) return;
    const target = e.target;
    // Highlight potential container-like nodes
    if (target && target.nodeType === 1) {
      createButtonHighlight(target);
    } else {
      removeHighlight();
    }
  };

  const clickHandler = (e) => {
    const target = e.target;
    if (!target || target.nodeType !== 1) return;
    e.preventDefault();
    e.stopPropagation();

    messageContainerSelector = getElementSelector(target);
    console.log('[AutoChat] Message container marked:', messageContainerSelector);
    chrome.storage.local.set({ messageContainerSelector });

    document.removeEventListener('mouseover', hoverHandler, true);
    document.removeEventListener('click', clickHandler, true);
    removeHighlight();

    const ind = document.getElementById('autochat-marking-indicator-msg-container');
    if (ind) {
      ind.textContent = '✅ Message container marked!';
      ind.style.background = '#28a745';
      setTimeout(() => ind.remove(), 1500);
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
      // Dispatch a realistic sequence of keyboard events (keydown, keypress, keyup)
      // Many web apps listen for keydown/keypress/keyup; dispatch multiple to increase compatibility.
      const evtOpts = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true };
      const down = new KeyboardEvent('keydown', evtOpts);
      const press = new KeyboardEvent('keypress', evtOpts);
      const up = new KeyboardEvent('keyup', evtOpts);

      inputEl.dispatchEvent(down);
      inputEl.dispatchEvent(press);
      inputEl.dispatchEvent(up);

      // Also try to submit a surrounding form if present (some sites use form submit)
      const form = inputEl.closest('form');
      if (form) {
        // Prefer a visible submit button
        const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
        if (submitBtn) {
          try { submitBtn.click(); }
          catch (e) { /* ignore */ }
        } else {
          try { form.requestSubmit ? form.requestSubmit() : form.submit(); } catch (e) { /* ignore */ }
        }
      }

      sent = true;
    } else if (sendMethod === 'click') {
      // If specific send button was marked, click it
      let btn = null;
      if (sendButtonSelector) {
        btn = document.querySelector(sendButtonSelector);
      }

      // Broader heuristics: search nearby, then search document for common patterns
      const tryFindButtonNear = () => {
        const parent = inputEl.closest('form') || inputEl.parentElement;
        if (!parent) return null;
        const candidates = parent.querySelectorAll('button, [role="button"], input[type="submit"], input[type="button"]');
        for (const b of candidates) {
          const btnText = (b.textContent || '').toLowerCase();
          const label = (b.getAttribute('aria-label') || '').toLowerCase();
          const dataTest = (b.getAttribute('data-testid') || '').toLowerCase();
          if (btnText.includes('send') || btnText.includes('submit') || label.includes('send') || dataTest.includes('send')) {
            return b;
          }
        }
        return null;
      };

      if (!btn) btn = tryFindButtonNear();

      if (!btn) {
        // Global search fallback: look for buttons with common send labels
        const allButtons = document.querySelectorAll('button, [role="button"], input[type="submit"], input[type="button"]');
        for (const b of allButtons) {
          const txt = (b.textContent || '').toLowerCase();
          const label = (b.getAttribute('aria-label') || '').toLowerCase();
          const dataTest = (b.getAttribute('data-testid') || '').toLowerCase();
          if (txt.includes('send') || txt.includes('senden') || txt.includes('submit') || label.includes('send') || dataTest.includes('send')) {
            btn = b; break;
          }
        }
      }

      // As last resort, check for svg/icon buttons near the input (some UIs use icon-only buttons)
      if (!btn) {
        const parent = inputEl.closest('form') || inputEl.parentElement;
        if (parent) {
          const svgs = parent.querySelectorAll('svg');
          for (const s of svgs) {
            const candidate = s.closest('button, [role="button"]');
            if (candidate) { btn = candidate; break; }
          }
        }
      }

      if (btn) {
        try { btn.click(); } catch (e) { /* some sites block synthetic clicks; ignore */ }
        sent = true;
      } else {
        console.warn('[AutoChat] Send button not found for click method');
      }
    }

    if (!sent && sendMethod === 'click') {
      // Fallback: try full Enter sequence if click method failed
      const evtOpts = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true };
      inputEl.dispatchEvent(new KeyboardEvent('keydown', evtOpts));
      inputEl.dispatchEvent(new KeyboardEvent('keypress', evtOpts));
      inputEl.dispatchEvent(new KeyboardEvent('keyup', evtOpts));
      sent = true;
    }

    if (sent) {
      // Wait and confirm the message was actually sent (input cleared)
      const confirmed = await confirmMessageSent(inputEl, text, sendConfirmTimeoutMs);
      if (confirmed) {
        messagesSentToday++;
        totalMessagesSent++;
        chrome.runtime.sendMessage({ 
          action: 'incrementMessageCount',
          message: text.substring(0, 100) // Send first 100 chars for webhook
        });
        console.log('[AutoChat] Message confirmed sent:', text);
        return true;
      }

      console.warn('[AutoChat] Message not confirmed (input still contains text)');
      if (retries > 0) {
        console.log('[AutoChat] Retrying send...', retries, 'attempts left');
        await sleep(1000);
        return sendMessage(text, retries - 1);
      }

      console.error('[AutoChat] Failed to confirm send after retries:', text);
      return false;
    }

    return false;
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

// minInterval / maxInterval are stored in minutes in the UI.
// Convert to milliseconds here (minutes -> ms).
function getRandomInterval() {
  const min = minInterval * 60 * 1000;
  const max = maxInterval * 60 * 1000;
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
    chrome.runtime.sendMessage({ 
      action: 'dailyLimitReached',
      limit: dailyLimit
    });
    return;
  }

  let message = getNextMessage();
  if (!message) {
    console.warn('[AutoChat] No messages in list');
    return;
  }

  // Add human-like imperfections to pass Turing test
  message = addHumanImperfections(message);

  await sendMessage(message);

  const nextInterval = getRandomInterval();
  console.log(`[AutoChat] Next message in ${(nextInterval/60000).toFixed(2)}m`);

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
  minInterval = config.minInterval || 1;
  maxInterval = config.maxInterval || 2;
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

  console.log(`[AutoChat] Starting auto-send (${sendMode} mode, ${minInterval}-${maxInterval}m interval)`);

  // Update badge
  chrome.runtime.sendMessage({ action: 'updateBadge', active: true });

  // Start scheduling
  autoSendInterval = true;
  scheduleNextMessage();

  return true;
}

  // Allow startAutoSend to also receive updated sendConfirmTimeout in config
  // (already handled above by reading config when set), but if someone calls
  // startAutoSend with a config containing sendConfirmTimeout, apply it here
  // Note: this code path is executed when content script receives startAutoSend message.

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
  'lastResetDate',
  'mentionDetectionEnabled',
  'mentionKeywords',
  'mentionReplyMessages'
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

  // Load mention detection settings
  mentionDetectionEnabled = data.mentionDetectionEnabled || false;
  mentionKeywords = data.mentionKeywords || [];
  mentionReplyMessages = data.mentionReplyMessages || [];

  // Auto-start mention detection if enabled and container is set
  if (mentionDetectionEnabled && messageContainerSelector) {
    setTimeout(() => startMentionDetection(), 1000);
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

  if (msg.action === 'startMarkingMessageContainerMode') {
    startMarkingMessageContainerMode();
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

  if (msg.action === 'startMentionDetection') {
    mentionDetectionEnabled = true;
    mentionKeywords = msg.keywords || [];
    mentionReplyMessages = msg.replyMessages || [];
    startMentionDetection();
    sendResponse({ ok: true });
  }

  if (msg.action === 'stopMentionDetection') {
    mentionDetectionEnabled = false;
    stopMentionDetection();
    sendResponse({ ok: true });
  }

  if (msg.action === 'getMentionStatus') {
    sendResponse({
      enabled: mentionDetectionEnabled,
      keywords: mentionKeywords,
      replyMessages: mentionReplyMessages
    });
  }

  return true;
});

// Export helpers for unit tests (Node/jest environment)
try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { confirmMessageSent, findMessageInDOM, sleep };
  }
} catch (e) {
  // ignore
}
