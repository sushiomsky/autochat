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
        
        // Clear badge and set to OFF state
        chrome.action.setBadgeText({ text: '' });
        chrome.action.setBadgeBackgroundColor({ color: '#666666' });
        
        sendResponse({ success: true });
    }
    
    if (request.action === 'updateBadge') {
        updateBadge(request.active);
        
        // Trigger webhook based on state
        if (request.active) {
            triggerWebhooks('campaign_started', {
                timestamp: new Date().toISOString()
            });
        } else if (request.wasPaused) {
            triggerWebhooks('campaign_resumed', {
                timestamp: new Date().toISOString()
            });
        } else {
            triggerWebhooks('campaign_stopped', {
                timestamp: new Date().toISOString(),
                stats: {
                    messagesSentToday,
                    totalMessagesSent
                }
            });
        }
        
        sendResponse({ ok: true });
    }
    
    if (request.action === 'incrementMessageCount') {
        incrementMessageCount();
        
        // Trigger message_sent webhook
        triggerWebhooks('message_sent', {
            messagesSentToday,
            totalMessagesSent,
            message: request.message || null
        });
        
        sendResponse({ ok: true });
    }
    
    if (request.action === 'pauseCampaign') {
        triggerWebhooks('campaign_paused', {
            timestamp: new Date().toISOString(),
            stats: {
                messagesSentToday,
                totalMessagesSent
            }
        });
        sendResponse({ ok: true });
    }
    
    if (request.action === 'dailyLimitReached') {
        triggerWebhooks('daily_limit_reached', {
            limit: request.limit,
            messagesSentToday,
            timestamp: new Date().toISOString()
        });
        sendResponse({ ok: true });
    }
    
    if (request.action === 'error') {
        triggerWebhooks('error', {
            error: request.error,
            timestamp: new Date().toISOString()
        });
        sendResponse({ ok: true });
    }
    
    if (request.action === 'milestone') {
        triggerWebhooks('milestone', {
            milestone: request.milestone,
            value: request.value,
            timestamp: new Date().toISOString()
        });
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

// ===== WEBHOOK INTEGRATION =====

async function triggerWebhooks(eventType, data) {
  try {
    const storage = await chrome.storage.local.get(['webhooks', 'webhooksEnabled']);
    const webhooks = storage.webhooks || [];
    const enabled = storage.webhooksEnabled !== false;

    if (!enabled || webhooks.length === 0) {
      return;
    }

    const activeWebhooks = webhooks.filter(
      w => w.enabled && w.events.includes(eventType)
    );

    if (activeWebhooks.length === 0) {
      return;
    }

    console.log(`[Background] Triggering ${activeWebhooks.length} webhook(s) for event: ${eventType}`);

    const manifest = chrome.runtime.getManifest();
    const payload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      data: data,
      source: 'AutoChat',
      version: manifest.version
    };

    // Send webhooks in parallel
    const promises = activeWebhooks.map(async (webhook) => {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const response = await fetch(webhook.url, {
            method: webhook.method || 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...webhook.headers
            },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          // Update webhook stats
          webhook.lastTriggered = new Date().toISOString();
          webhook.triggerCount = (webhook.triggerCount || 0) + 1;
          console.log(`[Background] Webhook "${webhook.name}" triggered successfully`);
          return true;

        } catch (error) {
          console.warn(`[Background] Webhook "${webhook.name}" attempt ${attempt}/3 failed:`, error.message);
          if (attempt === 3) {
            webhook.failureCount = (webhook.failureCount || 0) + 1;
          } else {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
      }
      return false;
    });

    await Promise.allSettled(promises);

    // Save updated webhook stats
    await chrome.storage.local.set({ webhooks: webhooks });

  } catch (error) {
    console.error('[Background] Webhook trigger error:', error);
  }
}

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
