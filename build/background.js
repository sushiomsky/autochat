/* background.js — Service Worker for AutoChat
   Manages badge status and global state
*/

let isAutoSendActive = false;
let messagesSentToday = 0;
let totalMessagesSent = 0;
let lastResetDate = new Date().toDateString();

// Initialize stats from storage
chrome.storage.local.get(['totalMessagesSent', 'messagesSentToday', 'lastResetDate'], (data) => {
  totalMessagesSent = data.totalMessagesSent || 0;
  messagesSentToday = data.messagesSentToday || 0;
  lastResetDate = data.lastResetDate || new Date().toDateString();
  
  // Reset daily counter if it's a new day
  const today = new Date().toDateString();
  if (lastResetDate !== today) {
    messagesSentToday = 0;
    lastResetDate = today;
    chrome.storage.local.set({ messagesSentToday: 0, lastResetDate: today });
  }
});

// Update badge
function updateBadge(active) {
  isAutoSendActive = active;
  if (active) {
    chrome.action.setBadgeText({ text: 'ON' });
    chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// Increment message counters
function incrementMessageCount() {
  messagesSentToday++;
  totalMessagesSent++;
  chrome.storage.local.set({
    messagesSentToday,
    totalMessagesSent,
    lastResetDate
  });
}

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'updateBadge') {
    updateBadge(msg.active);
    sendResponse({ ok: true });
  }
  
  if (msg.action === 'incrementMessageCount') {
    incrementMessageCount();
    sendResponse({ ok: true });
  }
  
  if (msg.action === 'getStats') {
    sendResponse({
      messagesSentToday,
      totalMessagesSent,
      isAutoSendActive
    });
  }
  
  return true;
});

// Handle extension installation or update
chrome.runtime.onInstalled.addListener(() => {
  console.log('[AutoChat] Extension installed/updated');
  updateBadge(false);
});
