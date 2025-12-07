# AutoChat Webhook Examples & Templates

Quick-start templates for popular integrations. Copy and paste these configurations into your webhook manager.

## Table of Contents

1. [Slack](#slack)
2. [Discord](#discord)
3. [Microsoft Teams](#microsoft-teams)
4. [Telegram](#telegram)
5. [Google Sheets (via Zapier)](#google-sheets)
6. [Email Notifications](#email-notifications)
7. [Custom Dashboard](#custom-dashboard)
8. [Analytics Tracking](#analytics-tracking)

---

## Slack

### Basic Slack Notifications

**Prerequisites**: Create an Incoming Webhook at https://api.slack.com/messaging/webhooks

```
Name: Slack - Message Alerts
URL: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
Method: POST
Events: ✓ message_sent, ✓ error, ✓ daily_limit_reached
Headers: (leave empty)
```

**What you'll receive**: Raw JSON payload in Slack channel.

### Slack with Custom Formatting (via Slack App)

For better formatting, create a Slack App with custom message handling.

**Slack App Bot Endpoint**:
```
Name: Slack App Bot
URL: https://your-server.com/slack/webhook
Method: POST
Events: ✓ All events
Headers:
{
  "Authorization": "Bearer xoxb-your-bot-token"
}
```

**Server-side transformation** (Node.js):
```javascript
app.post('/slack/webhook', async (req, res) => {
  const { event, data } = req.body;
  
  let message = {
    channel: '#autochat-logs',
    username: 'AutoChat Bot',
    icon_emoji: ':robot_face:',
    attachments: []
  };

  switch(event) {
    case 'message_sent':
      message.attachments.push({
        color: '#36a64f',
        title: '✅ Message Sent',
        text: `Message: "${data.message}"`,
        fields: [
          { title: 'Today', value: data.messagesSentToday, short: true },
          { title: 'Total', value: data.totalMessagesSent, short: true }
        ]
      });
      break;
    
    case 'daily_limit_reached':
      message.attachments.push({
        color: '#ff9800',
        title: '⚠️ Daily Limit Reached',
        text: `Limit of ${data.limit} messages reached`,
        fields: [
          { title: 'Messages Today', value: data.messagesSentToday, short: true }
        ]
      });
      break;
    
    case 'error':
      message.attachments.push({
        color: '#f44336',
        title: '❌ Error Occurred',
        text: data.error
      });
      break;
  }

  await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer xoxb-your-bot-token',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(message)
  });

  res.json({ success: true });
});
```

---

## Discord

### Basic Discord Webhook

**Prerequisites**: Create webhook in channel settings

```
Name: Discord Notifications
URL: https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_TOKEN
Method: POST
Events: ✓ campaign_started, ✓ campaign_stopped, ✓ daily_limit_reached
Headers:
{
  "Content-Type": "application/json"
}
```

### Discord with Rich Embeds (via Middleware)

Discord requires specific payload format. Use a middleware service:

**Middleware Endpoint**:
```
Name: Discord (Formatted)
URL: https://your-server.com/discord/webhook
Method: POST
Events: ✓ All events
Headers: (leave empty)
```

**Server-side transformation** (Node.js):
```javascript
app.post('/discord/webhook', async (req, res) => {
  const { event, data, timestamp } = req.body;
  
  let embed = {
    timestamp: timestamp,
    footer: { text: 'AutoChat' }
  };

  switch(event) {
    case 'message_sent':
      embed.title = '💬 Message Sent';
      embed.description = `"${data.message}"`;
      embed.color = 0x00ff00;
      embed.fields = [
        { name: 'Today', value: `${data.messagesSentToday}`, inline: true },
        { name: 'Total', value: `${data.totalMessagesSent}`, inline: true }
      ];
      break;
    
    case 'campaign_started':
      embed.title = '🚀 Campaign Started';
      embed.color = 0x3498db;
      break;
    
    case 'campaign_stopped':
      embed.title = '🛑 Campaign Stopped';
      embed.color = 0x95a5a6;
      embed.fields = [
        { name: 'Messages Today', value: `${data.stats.messagesSentToday}` }
      ];
      break;
    
    case 'daily_limit_reached':
      embed.title = '⚠️ Daily Limit Reached';
      embed.description = `Limit: ${data.limit}`;
      embed.color = 0xff9800;
      break;
    
    case 'error':
      embed.title = '❌ Error';
      embed.description = data.error;
      embed.color = 0xff0000;
      break;
  }

  await fetch('https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_TOKEN', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'AutoChat Bot',
      avatar_url: 'https://example.com/autochat-icon.png',
      embeds: [embed]
    })
  });

  res.json({ success: true });
});
```

---

## Microsoft Teams

### Teams Incoming Webhook

**Prerequisites**: Add "Incoming Webhook" connector to Teams channel

```
Name: Microsoft Teams
URL: https://outlook.office.com/webhook/YOUR-WEBHOOK-URL
Method: POST
Events: ✓ message_sent, ✓ campaign_started, ✓ daily_limit_reached
Headers:
{
  "Content-Type": "application/json"
}
```

**Middleware for Teams Cards** (Node.js):
```javascript
app.post('/teams/webhook', async (req, res) => {
  const { event, data } = req.body;
  
  let card = {
    '@type': 'MessageCard',
    '@context': 'http://schema.org/extensions',
    themeColor: '0076D7',
    summary: `AutoChat: ${event}`,
    sections: [{
      activityTitle: 'AutoChat Notification',
      activitySubtitle: new Date().toLocaleString()
    }]
  };

  switch(event) {
    case 'message_sent':
      card.sections.push({
        facts: [
          { name: 'Event', value: 'Message Sent' },
          { name: 'Message', value: data.message },
          { name: 'Today', value: data.messagesSentToday },
          { name: 'Total', value: data.totalMessagesSent }
        ]
      });
      break;
  }

  await fetch(TEAMS_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(card)
  });

  res.json({ success: true });
});
```

---

## Telegram

### Telegram Bot Messages

**Prerequisites**: Create a bot with @BotFather, get bot token and chat ID

```
Name: Telegram Bot
URL: https://your-server.com/telegram/webhook
Method: POST
Events: ✓ All events
Headers: (leave empty)
```

**Server-side forwarding** (Node.js):
```javascript
const TELEGRAM_BOT_TOKEN = 'YOUR_BOT_TOKEN';
const TELEGRAM_CHAT_ID = 'YOUR_CHAT_ID';

app.post('/telegram/webhook', async (req, res) => {
  const { event, data, timestamp } = req.body;
  
  let text = `🤖 *AutoChat Event*\n\n`;
  text += `📅 ${new Date(timestamp).toLocaleString()}\n`;
  text += `🏷️ Event: \`${event}\`\n\n`;

  switch(event) {
    case 'message_sent':
      text += `💬 Message: "${data.message}"\n`;
      text += `📊 Today: ${data.messagesSentToday} | Total: ${data.totalMessagesSent}`;
      break;
    
    case 'daily_limit_reached':
      text += `⚠️ Daily limit of ${data.limit} messages reached!`;
      break;
    
    case 'error':
      text += `❌ Error: ${data.error}`;
      break;
  }

  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: text,
      parse_mode: 'Markdown'
    })
  });

  res.json({ success: true });
});
```

---

## Google Sheets

### Via Zapier

**Prerequisites**: Create Zapier webhook trigger

```
Name: Google Sheets Logger
URL: https://hooks.zapier.com/hooks/catch/YOUR_WEBHOOK_ID/
Method: POST
Events: ✓ message_sent
Headers: (leave empty)
```

**Zapier Configuration**:
1. Trigger: Webhooks by Zapier - Catch Hook
2. Action: Google Sheets - Create Spreadsheet Row
3. Map fields:
   - Column A: `{{timestamp}}`
   - Column B: `{{data__message}}`
   - Column C: `{{data__messagesSentToday}}`
   - Column D: `{{data__totalMessagesSent}}`

### Direct Google Sheets API

**Prerequisites**: Create Google Sheets API credentials

```
Name: Google Sheets Direct
URL: https://your-server.com/sheets/webhook
Method: POST
Events: ✓ message_sent
Headers: (leave empty)
```

**Server-side integration** (Node.js):
```javascript
const { google } = require('googleapis');

app.post('/sheets/webhook', async (req, res) => {
  const { event, data, timestamp } = req.body;
  
  if (event !== 'message_sent') {
    return res.json({ success: true });
  }

  const sheets = google.sheets({
    version: 'v4',
    auth: YOUR_AUTH_CLIENT
  });

  await sheets.spreadsheets.values.append({
    spreadsheetId: 'YOUR_SPREADSHEET_ID',
    range: 'Sheet1!A:D',
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [[
        new Date(timestamp).toLocaleString(),
        data.message,
        data.messagesSentToday,
        data.totalMessagesSent
      ]]
    }
  });

  res.json({ success: true });
});
```

---

## Email Notifications

### Via SendGrid

```
Name: Email Alerts (SendGrid)
URL: https://your-server.com/email/webhook
Method: POST
Events: ✓ daily_limit_reached, ✓ error
Headers: (leave empty)
```

**Server-side email** (Node.js):
```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

app.post('/email/webhook', async (req, res) => {
  const { event, data } = req.body;
  
  let subject, html;

  switch(event) {
    case 'daily_limit_reached':
      subject = '⚠️ AutoChat: Daily Limit Reached';
      html = `
        <h2>Daily Limit Reached</h2>
        <p>Your AutoChat daily limit of <strong>${data.limit}</strong> messages has been reached.</p>
        <p>Messages sent today: ${data.messagesSentToday}</p>
      `;
      break;
    
    case 'error':
      subject = '❌ AutoChat: Error Alert';
      html = `
        <h2>Error Occurred</h2>
        <p><strong>Error:</strong> ${data.error}</p>
        <p><strong>Time:</strong> ${data.timestamp}</p>
      `;
      break;
    
    default:
      return res.json({ success: true });
  }

  await sgMail.send({
    to: 'your-email@example.com',
    from: 'autochat@example.com',
    subject: subject,
    html: html
  });

  res.json({ success: true });
});
```

---

## Custom Dashboard

### Real-time Dashboard Updates

```
Name: Dashboard API
URL: https://dashboard.example.com/api/autochat/events
Method: POST
Events: ✓ All events
Headers:
{
  "Authorization": "Bearer YOUR_DASHBOARD_API_KEY",
  "X-Client-ID": "autochat-extension"
}
```

**Dashboard API Handler** (Node.js + WebSocket):
```javascript
const io = require('socket.io')(server);

app.post('/api/autochat/events', (req, res) => {
  const { event, data, timestamp } = req.body;
  
  // Store in database
  database.events.insert({
    event,
    data,
    timestamp: new Date(timestamp)
  });

  // Broadcast to connected dashboard clients
  io.emit('autochat-event', {
    event,
    data,
    timestamp
  });

  res.json({ success: true });
});

// Dashboard client (React):
useEffect(() => {
  const socket = io('https://dashboard.example.com');
  
  socket.on('autochat-event', (payload) => {
    // Update dashboard in real-time
    setEvents(prev => [payload, ...prev]);
    
    if (payload.event === 'message_sent') {
      setMessageCount(prev => prev + 1);
    }
  });

  return () => socket.disconnect();
}, []);
```

---

## Analytics Tracking

### Google Analytics 4 (via Measurement Protocol)

```
Name: Google Analytics
URL: https://www.google-analytics.com/mp/collect?measurement_id=G-XXXXXXXXXX&api_secret=YOUR_API_SECRET
Method: POST
Events: ✓ message_sent, ✓ campaign_started, ✓ daily_limit_reached
Headers:
{
  "Content-Type": "application/json"
}
```

**Payload transformation middleware**:
```javascript
app.post('/ga4/webhook', async (req, res) => {
  const { event, data } = req.body;
  
  const ga4Event = {
    client_id: 'autochat-user',
    events: [{
      name: event,
      params: {
        ...data,
        engagement_time_msec: '100'
      }
    }]
  };

  await fetch(
    `https://www.google-analytics.com/mp/collect?measurement_id=${GA4_ID}&api_secret=${GA4_SECRET}`,
    {
      method: 'POST',
      body: JSON.stringify(ga4Event)
    }
  );

  res.json({ success: true });
});
```

### Mixpanel Tracking

```
Name: Mixpanel Analytics
URL: https://your-server.com/mixpanel/webhook
Method: POST
Events: ✓ All events
Headers: (leave empty)
```

**Mixpanel integration** (Node.js):
```javascript
const Mixpanel = require('mixpanel');
const mixpanel = Mixpanel.init('YOUR_MIXPANEL_TOKEN');

app.post('/mixpanel/webhook', (req, res) => {
  const { event, data, timestamp } = req.body;
  
  mixpanel.track(event, {
    distinct_id: 'autochat-user',
    ...data,
    time: new Date(timestamp).getTime()
  });

  res.json({ success: true });
});
```

---

## Testing Webhook

Use this service to test your webhook configuration:

```
Name: Test Webhook
URL: https://webhook.site/YOUR-UNIQUE-URL
Method: POST
Events: ✓ All events
Headers: (leave empty)
```

Visit https://webhook.site to get a unique URL and view incoming requests.

---

## Generic Middleware Template

Use this template as starting point for custom integrations:

```javascript
const express = require('express');
const app = express();
app.use(express.json());

app.post('/webhook/autochat', async (req, res) => {
  try {
    const { event, timestamp, data, source, version } = req.body;
    
    console.log(`Received ${event} from ${source} v${version}`);
    
    // Your custom logic here
    switch(event) {
      case 'message_sent':
        await handleMessageSent(data);
        break;
      case 'campaign_started':
        await handleCampaignStarted(data);
        break;
      case 'daily_limit_reached':
        await handleDailyLimit(data);
        break;
      // ... handle other events
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Webhook server running on port 3000');
});
```

---

## Need Help?

- Can't find your service? Check the [Webhook Guide](WEBHOOK_GUIDE.md)
- Report issues: https://github.com/sushiomsky/autochat/issues
- Contribute examples: Submit a PR!

---

**Last Updated**: December 2025
