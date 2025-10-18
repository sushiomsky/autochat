/* content.js — AutoChat
   Auto-send messages to chat inputs with randomization
*/

// Chat automation state
let chatInputSelector = null;
let autoSendInterval = null;
let markingMode = false;
let highlightOverlay = null;
let messageList = [];
let currentMessageIndex = 0;
let sendMode = 'random'; // 'random' or 'sequential'
let minInterval = 60;
let maxInterval = 120;

// helper to build a unique selector for any element
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

// ===== CHAT AUTOMATION FUNCTIONS =====

// Visual highlight for marking mode
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

function removeHighlight() {
  if (highlightOverlay) {
    highlightOverlay.remove();
    highlightOverlay = null;
  }
}

// Start marking mode - user clicks to select chat input
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

// Send a message to the marked input
function sendMessage(text) {
  if (!chatInputSelector) {
    console.warn('[AutoChat] No input field marked');
    return false;
  }
  
  try {
    const inputEl = document.querySelector(chatInputSelector);
    if (!inputEl) {
      console.warn('[AutoChat] Input field not found:', chatInputSelector);
      return false;
    }
    
    inputEl.focus();
    
    // Set text based on element type
    if (inputEl.tagName === 'INPUT' || inputEl.tagName === 'TEXTAREA') {
      inputEl.value = text;
      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      inputEl.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (inputEl.contentEditable === 'true') {
      inputEl.textContent = text;
      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // Try to send the message
    setTimeout(() => {
      // Try Enter key
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true
      });
      inputEl.dispatchEvent(enterEvent);
      
      // Try finding send button
      const parent = inputEl.closest('form') || inputEl.parentElement;
      if (parent) {
        const buttons = parent.querySelectorAll('button, [role="button"], input[type="submit"]');
        for (const btn of buttons) {
          const text = (btn.textContent || '').toLowerCase();
          const label = (btn.getAttribute('aria-label') || '').toLowerCase();
          if (text.includes('send') || label.includes('send') || text.includes('submit')) {
            btn.click();
            break;
          }
        }
      }
    }, 100);
    
    console.log('[AutoChat] Message sent:', text);
    return true;
  } catch (e) {
    console.error('[AutoChat] Error:', e);
    return false;
  }
}

// Get next message from list
function getNextMessage() {
  if (!messageList || messageList.length === 0) return '';
  
  if (sendMode === 'random') {
    const randomIndex = Math.floor(Math.random() * messageList.length);
    return messageList[randomIndex];
  } else {
    // Sequential mode
    const msg = messageList[currentMessageIndex];
    currentMessageIndex = (currentMessageIndex + 1) % messageList.length;
    return msg;
  }
}

// Get random interval between min and max
function getRandomInterval() {
  const min = minInterval * 1000;
  const max = maxInterval * 1000;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Schedule next message send
function scheduleNextMessage() {
  if (!autoSendInterval) return; // stopped
  
  const message = getNextMessage();
  if (!message) {
    console.warn('[AutoChat] No messages in list');
    return;
  }
  
  sendMessage(message);
  
  const nextInterval = getRandomInterval();
  console.log(`[AutoChat] Next message in ${(nextInterval/1000).toFixed(1)}s`);
  
  autoSendInterval = setTimeout(() => {
    scheduleNextMessage();
  }, nextInterval);
}

// Start auto-sending at intervals
function startAutoSend(messages, mode, minSec, maxSec) {
  stopAutoSend();
  
  if (!chatInputSelector) {
    console.warn('[AutoChat] No input field marked');
    return false;
  }
  
  if (!messages || messages.length === 0) {
    console.warn('[AutoChat] No messages provided');
    return false;
  }
  
  messageList = messages;
  sendMode = mode || 'random';
  minInterval = minSec || 60;
  maxInterval = maxSec || 120;
  currentMessageIndex = 0;
  
  console.log(`[AutoChat] Starting auto-send (${sendMode} mode, ${minInterval}-${maxInterval}s interval)`);
  
  // Send first message immediately and schedule rest
  autoSendInterval = true; // flag to indicate active
  scheduleNextMessage();
  
  return true;
}

function stopAutoSend() {
  if (autoSendInterval) {
    if (typeof autoSendInterval === 'number') {
      clearTimeout(autoSendInterval);
    }
    autoSendInterval = null;
    console.log('[AutoChat] Stopped auto-send');
  }
}

// Load saved selector on startup
chrome.storage.local.get('chatInputSelector', (data) => {
  if (data.chatInputSelector) {
    chatInputSelector = data.chatInputSelector;
    console.log('[AutoChat] Loaded selector:', chatInputSelector);
  }
});

// message interface with popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Chat automation actions
  if (msg.action === 'startMarkingMode') {
    startMarkingMode();
    sendResponse({ ok: true });
  }
  if (msg.action === 'getChatInputSelector') {
    sendResponse({ selector: chatInputSelector });
  }
  if (msg.action === 'sendMessage') {
    const success = sendMessage(msg.text || '');
    sendResponse({ ok: success });
  }
  if (msg.action === 'startAutoSend') {
    const success = startAutoSend(
      msg.messages || [],
      msg.mode || 'random',
      msg.minInterval || 60,
      msg.maxInterval || 120
    );
    sendResponse({ ok: success });
  }
  if (msg.action === 'stopAutoSend') {
    stopAutoSend();
    sendResponse({ ok: true });
  }
  
  return true; // keep channel open for async responses
});
