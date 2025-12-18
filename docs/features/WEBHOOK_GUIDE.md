# AutoChat Webhook Integration Guide

## Overview

Webhooks allow AutoChat to send HTTP requests to external services when specific events occur. This enables powerful integrations with tools like Slack, Discord, custom dashboards, analytics platforms, and automation services like Zapier or IFTTT.

## Features

- ✅ 8 Event Types (message_sent, campaign_started, campaign_stopped, etc.)
- ✅ Custom HTTP Methods (POST, GET, PUT, PATCH)
- ✅ Custom Headers Support (Authorization, API Keys, etc.)
- ✅ Automatic Retry Logic (3 attempts with exponential backoff)
- ✅ Statistics Tracking (triggers, failures, last triggered time)
- ✅ Enable/Disable Control (globally or per webhook)
- ✅ Test Functionality (test webhooks before deploying)

## Getting Started

### 1. Accessing Webhook Manager

1. Click the AutoChat extension icon
2. Click **⚙️ Settings**
3. Scroll to **🔗 Webhooks & Integrations**
4. Click **⚙️ Manage Webhooks**

### 2. Creating Your First Webhook

1. Fill in the webhook form:
   - **Name**: Descriptive name (e.g., "Slack Notifications")
   - **URL**: Your webhook endpoint (e.g., `https://hooks.slack.com/...`)
   - **Method**: HTTP method (usually POST)
   - **Events**: Select which events to trigger on
   - **Custom Headers** (optional): JSON format authentication

2. Click **➕ Add Webhook**

### 3. Testing Your Webhook

After creating a webhook, click the **🧪 Test** button to send a test payload and verify it works correctly.

## Event Types

### 1. Message Sent
**Event**: `message_sent`

Triggered when AutoChat successfully sends a message.

**Payload Example**:
```json
{
  "event": "message_sent",
  "timestamp": "2025-12-07T17:30:00.000Z",
  "data": {
    "message": "Hello! How are you?",
    "messagesSentToday": 42,
    "totalMessagesSent": 1337
  },
  "source": "AutoChat",
  "version": "4.5.0"
}
```

**Use Cases**:
- Log each message to a database
- Track message volume in real-time
- Update analytics dashboards
- Trigger follow-up actions

### 2. Campaign Started
**Event**: `campaign_started`

Triggered when auto-send campaign begins.

**Payload Example**:
```json
{
  "event": "campaign_started",
  "timestamp": "2025-12-07T17:30:00.000Z",
  "data": {
    "timestamp": "2025-12-07T17:30:00.000Z"
  },
  "source": "AutoChat",
  "version": "4.5.0"
}
```

**Use Cases**:
- Notify team when campaigns start
- Log campaign start times
- Update status dashboards
- Start related monitoring services

### 3. Campaign Stopped
**Event**: `campaign_stopped`

Triggered when auto-send campaign ends.

**Payload Example**:
```json
{
  "event": "campaign_stopped",
  "timestamp": "2025-12-07T18:00:00.000Z",
  "data": {
    "timestamp": "2025-12-07T18:00:00.000Z",
    "stats": {
      "messagesSentToday": 50,
      "totalMessagesSent": 1387
    }
  },
  "source": "AutoChat",
  "version": "4.5.0"
}
```

**Use Cases**:
- Generate campaign reports
- Calculate campaign metrics
- Archive campaign data
- Notify stakeholders of completion

### 4. Campaign Paused
**Event**: `campaign_paused`

Triggered when auto-send is temporarily paused.

**Payload Example**:
```json
{
  "event": "campaign_paused",
  "timestamp": "2025-12-07T17:45:00.000Z",
  "data": {
    "timestamp": "2025-12-07T17:45:00.000Z",
    "stats": {
      "messagesSentToday": 25,
      "totalMessagesSent": 1362
    }
  },
  "source": "AutoChat",
  "version": "4.5.0"
}
```

**Use Cases**:
- Track pause events
- Alert on unexpected pauses
- Log campaign interruptions

### 5. Campaign Resumed
**Event**: `campaign_resumed`

Triggered when auto-send resumes after being paused.

**Payload Example**:
```json
{
  "event": "campaign_resumed",
  "timestamp": "2025-12-07T17:50:00.000Z",
  "data": {
    "timestamp": "2025-12-07T17:50:00.000Z"
  },
  "source": "AutoChat",
  "version": "4.5.0"
}
```

**Use Cases**:
- Track campaign continuity
- Calculate downtime
- Notify when campaigns resume

### 6. Daily Limit Reached
**Event**: `daily_limit_reached`

Triggered when the configured daily message limit is reached.

**Payload Example**:
```json
{
  "event": "daily_limit_reached",
  "timestamp": "2025-12-07T20:00:00.000Z",
  "data": {
    "limit": 100,
    "messagesSentToday": 100,
    "timestamp": "2025-12-07T20:00:00.000Z"
  },
  "source": "AutoChat",
  "version": "4.5.0"
}
```

**Use Cases**:
- Alert when limits are reached
- Adjust limits dynamically
- Generate daily reports
- Plan next day's campaign

### 7. Error
**Event**: `error`

Triggered when an error occurs during automation.

**Payload Example**:
```json
{
  "event": "error",
  "timestamp": "2025-12-07T17:35:00.000Z",
  "data": {
    "error": "Failed to find send button",
    "timestamp": "2025-12-07T17:35:00.000Z"
  },
  "source": "AutoChat",
  "version": "4.5.0"
}
```

**Use Cases**:
- Monitor for errors
- Alert on-call team
- Log errors for debugging
- Track error patterns

### 8. Milestone
**Event**: `milestone`

Triggered when significant milestones are reached.

**Payload Example**:
```json
{
  "event": "milestone",
  "timestamp": "2025-12-07T19:00:00.000Z",
  "data": {
    "milestone": "1000_messages",
    "value": 1000,
    "timestamp": "2025-12-07T19:00:00.000Z"
  },
  "source": "AutoChat",
  "version": "4.5.0"
}
```

**Use Cases**:
- Celebrate achievements
- Trigger rewards or bonuses
- Generate milestone reports
- Update leaderboards

## Integration Examples

### Slack Integration

Create a Slack Incoming Webhook at: https://api.slack.com/messaging/webhooks

**Configuration**:
- **Name**: Slack Notifications
- **URL**: `https://hooks.slack.com/services/YOUR/WEBHOOK/URL`
- **Method**: POST
- **Events**: message_sent, daily_limit_reached, error
- **Headers**: Leave empty (Slack doesn't require custom headers)

**What you'll receive**:
Slack will show the raw JSON payload. You can use a Slack App with custom formatting for better presentation.

### Discord Integration

Create a Discord Webhook in your server's channel settings.

**Configuration**:
- **Name**: Discord Notifications
- **URL**: `https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN`
- **Method**: POST
- **Events**: campaign_started, campaign_stopped, daily_limit_reached
- **Headers**: 
```json
{
  "Content-Type": "application/json"
}
```

**Transform for Discord** (requires middleware):
Discord expects a different format. You'll need a middleware service to transform the payload:
```json
{
  "content": "Campaign started!",
  "embeds": [{
    "title": "AutoChat Event",
    "description": "Campaign has started",
    "color": 5814783
  }]
}
```

### Zapier Integration

Create a Webhook trigger in Zapier.

**Configuration**:
- **Name**: Zapier Automation
- **URL**: `https://hooks.zapier.com/hooks/catch/YOUR_WEBHOOK_ID/`
- **Method**: POST
- **Events**: Select events you want to automate
- **Headers**: Leave empty

**What you can do**:
- Log to Google Sheets
- Send emails via Gmail
- Create tasks in Trello/Asana
- Post to social media
- Trigger any Zapier integration

### IFTTT Integration

Create a Webhooks applet in IFTTT.

**Configuration**:
- **Name**: IFTTT Trigger
- **URL**: `https://maker.ifttt.com/trigger/YOUR_EVENT/with/key/YOUR_KEY`
- **Method**: POST
- **Events**: Any events you want to trigger
- **Headers**: Leave empty

### Custom API Integration

**Configuration**:
- **Name**: Custom API
- **URL**: `https://api.yourservice.com/autochat/events`
- **Method**: POST
- **Events**: All events
- **Headers**:
```json
{
  "Authorization": "Bearer YOUR_API_TOKEN",
  "X-API-Key": "your-api-key"
}
```

**Server-side handling** (Node.js example):
```javascript
app.post('/autochat/events', (req, res) => {
  const { event, timestamp, data, source, version } = req.body;
  
  console.log(`Received ${event} from ${source} v${version}`);
  console.log('Data:', data);
  
  // Process the event
  switch(event) {
    case 'message_sent':
      // Log message to database
      database.logMessage(data);
      break;
    case 'daily_limit_reached':
      // Send alert
      alerting.sendAlert(`Daily limit reached: ${data.limit}`);
      break;
    // ... handle other events
  }
  
  res.json({ success: true });
});
```

## Advanced Configuration

### Custom Headers

Use custom headers for authentication, API keys, or custom metadata:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "X-API-Key": "your-secret-api-key",
  "X-Client-ID": "autochat-extension",
  "X-Environment": "production"
}
```

### Filtering Events

Instead of sending all events to one webhook, create multiple webhooks for different purposes:

**Webhook 1: Real-time Monitoring**
- Events: message_sent, error
- URL: Real-time dashboard API

**Webhook 2: Daily Reports**
- Events: daily_limit_reached, campaign_stopped
- URL: Reporting service

**Webhook 3: Alerting**
- Events: error, daily_limit_reached
- URL: PagerDuty or Slack

### Security Best Practices

1. **Use HTTPS**: Always use `https://` URLs, never `http://`
2. **Rotate Keys**: Periodically rotate API keys and tokens
3. **Validate Payloads**: Verify webhook signatures on your server
4. **Rate Limiting**: Implement rate limiting on your webhook endpoint
5. **Monitoring**: Monitor webhook failures and investigate anomalies
6. **Minimal Data**: Only send necessary data in webhook payloads

### Debugging Webhooks

1. **Test Button**: Use the 🧪 Test button to verify webhook configuration
2. **Check URL**: Ensure URL is correct and accessible
3. **Verify Headers**: Check authentication headers are properly formatted
4. **Review Logs**: Check browser console for webhook errors
5. **Test Endpoint**: Use tools like https://webhook.site/ to test
6. **Check Firewall**: Ensure your endpoint isn't blocked by firewall

## Webhook Statistics

AutoChat tracks webhook performance:

- **Total Triggers**: Number of times webhook was called
- **Failures**: Number of failed attempts
- **Last Triggered**: Timestamp of last successful trigger
- **Success Rate**: Calculated from triggers and failures

Access statistics in the Webhook Manager modal.

## Rate Limiting

AutoChat implements sensible defaults:

- **Retry Attempts**: 3 attempts with exponential backoff
- **Retry Delay**: 1s, 2s, 3s between attempts
- **Timeout**: 10 seconds per request
- **Max Webhooks**: 10 webhooks per extension

## Troubleshooting

### Webhook Not Triggering

1. Check webhook is enabled (green ✅ badge)
2. Verify global webhooks are enabled (Settings)
3. Confirm event is selected in webhook configuration
4. Check browser console for errors

### Webhook Failing

1. Click 🧪 Test button to verify endpoint
2. Check URL is accessible from your browser
3. Verify authentication headers are correct
4. Check endpoint logs for error details
5. Test with https://webhook.site/ first

### High Failure Rate

1. Check endpoint availability and uptime
2. Verify timeout settings aren't too aggressive
3. Review endpoint logs for errors
4. Consider implementing retry queue on server side
5. Check network connectivity and firewall rules

## API Reference

### Webhook Object Structure

```typescript
interface Webhook {
  id: string;              // Unique identifier
  name: string;            // Display name
  url: string;             // Endpoint URL
  method: string;          // HTTP method (POST, GET, PUT, PATCH)
  events: string[];        // Array of event types
  headers: object;         // Custom headers
  enabled: boolean;        // Enable/disable flag
  createdAt: string;       // ISO timestamp
  lastTriggered: string;   // ISO timestamp or null
  triggerCount: number;    // Number of successful triggers
  failureCount: number;    // Number of failed triggers
}
```

### Payload Structure

All webhook payloads follow this structure:

```typescript
interface WebhookPayload {
  event: string;           // Event type
  timestamp: string;       // ISO timestamp
  data: object;            // Event-specific data
  source: string;          // Always "AutoChat"
  version: string;         // Extension version
}
```

## Future Enhancements

Planned features for future releases:

- 🔜 Webhook Templates (pre-configured for popular services)
- 🔜 Payload Transformation (custom payload formatting)
- 🔜 Webhook Signing (HMAC signatures for security)
- 🔜 Conditional Triggers (trigger based on conditions)
- 🔜 Batch Events (combine multiple events in one request)
- 🔜 Webhook History (view recent webhook calls)
- 🔜 Response Handling (act on webhook responses)

## Support

For issues, questions, or feature requests:

- GitHub Issues: https://github.com/sushiomsky/autochat/issues
- Documentation: https://github.com/sushiomsky/autochat
- Email: support@autochat.example.com

## Contributing

Want to add webhook features? See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

AutoChat is open source under the MIT License. See [LICENSE](LICENSE) for details.

---

**Last Updated**: December 2025  
**Version**: 4.5.0  
**Status**: Stable
