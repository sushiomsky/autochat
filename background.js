/* background.js — Service Worker for AutoChat
   Manages badge status and global state
*/

try {
  importScripts('src/analytics-service.js');
  importScripts('src/profile-service.js');
  importScripts('src/ai-service.js');
  importScripts('src/scheduler-service.js');
  importScripts('src/cloud-sync-service.js');
  importScripts('src/socket-service.js');
} catch (e) {
  console.error('[Background] Failed to load services:', e);
}

let isAutoSendActive = false;
let messagesSentToday = 0;
let totalMessagesSent = 0;
let lastResetDate = new Date().toDateString();
let isRunning = false;

// Initialize Services
async function initServices() {
  if (typeof ProfileService !== 'undefined') {
    await ProfileService.init();
    console.log('[Background] ProfileService initialized');
  }
  if (typeof AIService !== 'undefined') {
    await AIService.init();
    console.log('[Background] AIService initialized');
  }
  if (typeof SchedulerService !== 'undefined') {
    await SchedulerService.init();
    console.log('[Background] SchedulerService initialized');
  }
  if (typeof CloudSyncService !== 'undefined') {
    await CloudSyncService.init();
    console.log('[Background] CloudSyncService initialized');
  }
  if (typeof SocketService !== 'undefined') {
    await SocketService.init();
    console.log('[Background] SocketService initialized');

    // Handle incoming pulses
    SocketService.onMessage((msg) => {
      if (msg.type === 'team_pulse') {
        console.log(`[Background] Team Pulse: ${msg.payload.user} ${msg.payload.text}`);
        // Broadcast to popup/content
        chrome.runtime.sendMessage(msg).catch(() => {
          // Ignore error if popup/tab is not listening
        });
      }
    });
  }
}
initServices();

// Background tab management
// chrome.tabs.onRemoved cleanup
chrome.tabs.onRemoved.addListener((tabId) => {
  // If we ever store tab-specific data in a Map, clean it here
  console.log(`[Background] Tab ${tabId} closed, cleaning up.`);
});

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

  // Advanced Analytics Tracking
  if (typeof AnalyticsService !== 'undefined') {
    AnalyticsService.recordEvent('message_sent', {
      timestamp: Date.now()
    }).catch(err => console.warn('[Background] Analytics error:', err));
  }
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

    // Advanced Analytics Tracking
    if (typeof AnalyticsService !== 'undefined') {
      AnalyticsService.recordEvent('message_failed', {
        error: request.error
      }).catch(err => console.warn('[Background] Analytics error:', err));
    }

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

  if (request.action === 'getAnalyticsData') {
    if (typeof AnalyticsService !== 'undefined') {
      AnalyticsService.getStats(request.range || '7d')
        .then(stats => sendResponse(stats))
        .catch(err => {
          console.error('[Background] Analytics error:', err);
          sendResponse({ error: err.message });
        });
      return true; // Keep channel open for async response
    } else {
      sendResponse({ error: 'AnalyticsService not loaded' });
    }
  }

  if (request.action === 'getProfiles') {
    if (typeof ProfileService !== 'undefined') {
      ProfileService.getAll().then(profiles => {
        ProfileService.getActiveId().then(activeId => {
          sendResponse({ profiles, activeId });
        });
      });
      return true;
    }
  }

  if (request.action === 'createProfile') {
    if (typeof ProfileService !== 'undefined') {
      ProfileService.create(request.name, request.domains || [])
        .then(profile => sendResponse({ success: true, profile }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;
    }
  }

  if (request.action === 'setActiveProfile') {
    if (typeof ProfileService !== 'undefined') {
      ProfileService.setActive(request.id)
        .then(() => sendResponse({ success: true }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;
    }
  }

  if (request.action === 'deleteProfile') {
    if (typeof ProfileService !== 'undefined') {
      ProfileService.delete(request.id)
        .then(() => sendResponse({ success: true }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;
    }
  }

  if (request.action === 'updateProfile') {
    if (typeof ProfileService !== 'undefined') {
      ProfileService.update(request.id, request.updates)
        .then(profile => sendResponse({ success: true, profile }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;
    }
  }

  if (request.action === 'exportProfile') {
    if (typeof ProfileService !== 'undefined') {
      ProfileService.exportProfile(request.id)
        .then(data => sendResponse({ success: true, data }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;
    }
  }

  if (request.action === 'importProfile') {
    if (typeof ProfileService !== 'undefined') {
      ProfileService.importProfile(request.jsonString)
        .then(profile => sendResponse({ success: true, profile }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;
    }
  }

  if (request.action === 'generateAiPhrases') {
    if (typeof AIService !== 'undefined') {
      AIService.generatePhrases(request.prompt, request.count || 5)
        .then(phrases => sendResponse({ success: true, phrases }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;
    }
  }

  if (request.action === 'getAiReply') {
    if (typeof AIService !== 'undefined') {
      AIService.analyzeSentiment(request.text).then(({ sentiment }) => {
        AIService.generateReply(request.text, sentiment)
          .then(reply => sendResponse({ success: true, reply, sentiment }))
          .catch(err => sendResponse({ success: false, error: err.message }));
      });
      return true;
    }
  }

  // --- Cloud Sync Handlers ---
  if (request.action === 'getCloudSyncStatus') {
    if (typeof CloudSyncService !== 'undefined') {
      sendResponse({ success: true, ...CloudSyncService.getStatus() });
      return true;
    }
  }

  if (request.action === 'setCloudSyncEnabled') {
    if (typeof CloudSyncService !== 'undefined') {
      CloudSyncService.setEnabled(request.enabled)
        .then(() => sendResponse({ success: true }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;
    }
  }

  if (request.action === 'performCloudSync') {
    if (typeof CloudSyncService !== 'undefined') {
      CloudSyncService.performSync()
        .then((ok) => sendResponse({ success: ok }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;
    }
  }

  // --- Socket / Team Handlers ---
  if (request.action === 'connectTeamPulse') {
    if (typeof SocketService !== 'undefined') {
      SocketService.connect();
      sendResponse({ success: true, ...SocketService.getStatus() });
      return true;
    }
  }

  if (request.action === 'getTeamPulseStatus') {
    if (typeof SocketService !== 'undefined') {
      sendResponse({ success: true, ...SocketService.getStatus() });
      return true;
    }
  }

  if (request.action === 'getTeamStats') {
    if (typeof AnalyticsService !== 'undefined') {
      AnalyticsService.getTeamStats().then(data => sendResponse({ success: true, data }));
      return true;
    }
  }

  // --- Scheduler Handlers ---
  if (request.action === 'getSchedules') {
    if (typeof SchedulerService !== 'undefined') {
      SchedulerService.getAll().then(data => sendResponse({ success: true, data }));
      return true;
    }
  }

  if (request.action === 'createSchedule') {
    if (typeof SchedulerService !== 'undefined') {
      SchedulerService.create(request.data)
        .then(schedule => sendResponse({ success: true, schedule }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;
    }
  }

  if (request.action === 'updateSchedule') {
    if (typeof SchedulerService !== 'undefined') {
      SchedulerService.update(request.id, request.updates)
        .then(schedule => sendResponse({ success: true, schedule }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;
    }
  }

  if (request.action === 'deleteSchedule') {
    if (typeof SchedulerService !== 'undefined') {
      SchedulerService.delete(request.id)
        .then(() => sendResponse({ success: true }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;
    }
  }

  // Handle manual message detection
  if (request.action === 'manualMessageDetected') {
    console.log('[Background] Manual message detected:', request.message);

    // Trigger webhook for manual send
    triggerWebhooks('manual_message_sent', {
      message: request.message,
      timestamp: request.timestamp || new Date().toISOString()
    });

    sendResponse({ ok: true });
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
// Monitor tab changes for auto-profile switching
// --- Alarm Listener ---
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cloudSyncAlarm') {
    if (typeof CloudSyncService !== 'undefined') {
      CloudSyncService.performSync();
    }
    return;
  }

  if (alarm.name.startsWith('schedule_')) {
    const scheduleId = alarm.name.replace('schedule_', '');
    console.log(`[Background] Alarm triggered for schedule: ${scheduleId}`);

    if (typeof SchedulerService !== 'undefined') {
      // In a real scenario, we'd check if we are in active hours, 
      // find the tab for the active profile, and send a message.
      // For now, we just log and trigger a generic send if possible.
      handleScheduledEvent(scheduleId);
    }
  }
});

async function handleScheduledEvent(scheduleId) {
  const schedules = await SchedulerService.getAll();
  const schedule = schedules.find(s => s.id === scheduleId);

  if (schedule && schedule.active) {
    // Check if within time window
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    if (currentTime >= schedule.startTime && currentTime <= schedule.endTime) {
      console.log(`[Background] Executing schedule ${schedule.name} for profile ${schedule.profileId}`);

      // 1. Get profile data
      const profiles = await ProfileService.getAll();
      const profile = profiles[schedule.profileId];
      if (!profile) {
        console.warn(`[Background] Profile ${schedule.profileId} not found for schedule ${scheduleId}`);
        return;
      }

      // 2. Find target tab
      const tabs = await chrome.tabs.query({});
      const targetTab = tabs.find(tab => {
        if (!tab.url) return false;
        try {
          const host = new URL(tab.url).hostname;
          return profile.domains && profile.domains.some(d => host.includes(d));
        } catch (e) { return false; }
      });

      if (targetTab) {
        console.log(`[Background] Target tab found: ${targetTab.id} (${targetTab.url})`);

        // 3. Select message
        // Profiles store settings in the .settings property now in v5
        const phrases = (profile.settings && profile.settings.messageList)
          ? profile.settings.messageList.split('\n').filter(p => p.trim())
          : ["Hello from AutoChat! 👋"]; // Fallback

        const message = phrases[Math.floor(Math.random() * phrases.length)];

        // 4. Send to tab
        chrome.tabs.sendMessage(targetTab.id, {
          action: 'sendAutomatedMessage',
          message,
          typingSimulation: profile.settings?.typingSimulation !== false
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error(`[Background] Failed to send message to tab ${targetTab.id}:`, chrome.runtime.lastError);
          } else {
            console.log(`[Background] Scheduled message sent successfully to tab ${targetTab.id}`);
            triggerWebhooks('campaign_started', {
              scheduleId,
              name: schedule.name,
              profile: profile.name,
              message
            });
          }
        });
      } else {
        console.log(`[Background] No suitable tab open for profile: ${profile.name}`);
      }
    } else {
      console.log(`[Background] Schedule ${schedule.name} outside of time window (${currentTime})`);
    }
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    if (typeof ProfileService !== 'undefined') {
      ProfileService.getProfileByUrl(tab.url).then(profile => {
        if (profile) {
          console.log(`[Background] Detected profile "${profile.name}" for ${tab.url}`);
          // Auto-switch (optional: could be user preference)
          ProfileService.setActive(profile.id).catch(console.error);
        }
      });
    }
  }
});
