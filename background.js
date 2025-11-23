/* background.js — Service Worker for AutoChat
   Manages badge status and global state
*/

let isAutoSendActive = false;
let messagesSentToday = 0;
let totalMessagesSent = 0;
let lastResetDate = new Date().toDateString();
let isRunning = false;

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
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'stop') {
        isRunning = false;
        messageCount = 0;
        
        // Clear badge and set to OFF state
        chrome.action.setBadgeText({ text: '' });
        chrome.action.setBadgeBackgroundColor({ color: '#666666' });
        
        sendResponse({ success: true });
    }
    
    if (request.action === 'updateBadge') {
        updateBadge(request.active);
        sendResponse({ ok: true });
    }
    
    if (request.action === 'incrementMessageCount') {
        incrementMessageCount();
        sendResponse({ ok: true });
    }
    
    if (request.action === 'getStats') {
        sendResponse({
          messagesSentToday,
          totalMessagesSent,
          isAutoSendActive
        });
    }
    
    // Set up alarm when starting
    if (request.action === 'start' && request.settings) {
        isRunning = true;
        
        // Create alarm for auto-send if enabled
        if (request.settings.autoSend && request.settings.autoSendInterval) {
            chrome.alarms.create('autoSendSchedule', {
                periodInMinutes: request.settings.autoSendInterval / 60000
            });
        }
        
        sendResponse({ success: true });
    }
    
    return true;
});

// Handle extension installation or update
chrome.runtime.onInstalled.addListener(() => {
  console.log('[AutoChat] Extension installed/updated');
  updateBadge(false);
});

// Handle scheduled sends via alarms API (works in background)
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'autoSendSchedule' && isRunning) {
        // Trigger send in active tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { 
                    action: 'triggerScheduledSend' 
                });
            }
        });
    }
});
