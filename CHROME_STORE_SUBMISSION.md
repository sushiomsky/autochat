# Chrome Web Store Submission Guide

## 📋 Complete Step-by-Step Instructions

### Prerequisites

1. **Google Account** - Gmail or Google Workspace account
2. **Developer Registration Fee** - $5 USD (one-time, lifetime)
3. **Payment Method** - Credit/debit card for registration
4. **Extension Package** - Built and ready (we'll create this below)

---

## Part 1: Register as Chrome Web Store Developer

### Step 1: Register Your Developer Account

1. Go to: **https://chrome.google.com/webstore/devconsole**
2. Sign in with your Google account
3. Click **"Pay registration fee"** or **"Register"**
4. Pay the **$5 USD** one-time fee
5. Accept the Chrome Web Store Developer Agreement
6. Wait for email confirmation (usually instant)

---

## Part 2: Prepare Your Extension Package

### Step 2: Build the Extension

We've already created a build script. Run it:

```bash
./build-for-store.sh
```

This creates a `build/` directory with all necessary files.

### Step 3: Create ZIP File

**Option A: Using command line (if zip is installed):**

```bash
cd build && zip -r ../autochat-v4.0.zip . && cd ..
```

**Option B: Using file manager (Linux):**

```bash
# Open file manager
nautilus build/
# Then: Select all files → Right-click → Compress → Create .zip
```

**Option C: Using Python:**

```bash
python3 -c "import shutil; shutil.make_archive('autochat-v4.0', 'zip', 'build')"
```

### Files Included in Package:

- ✅ manifest.json
- ✅ background.js
- ✅ content-enhanced.js
- ✅ popup-enhanced.html
- ✅ popup-enhanced.js
- ✅ styles.css
- ✅ farming_phrases.txt
- ✅ icon16.png, icon32.png, icon48.png
- ✅ Legacy files (content.js, popup.js, popup.html)

**Files EXCLUDED (not needed):**

- ❌ .git directory
- ❌ .gitignore
- ❌ README.md, CHANGELOG.md (documentation)
- ❌ Zone.Identifier files
- ❌ Build scripts

---

## Part 3: Upload to Chrome Web Store

### Step 4: Create New Item

1. Go to: **https://chrome.google.com/webstore/devconsole**
2. Click **"New Item"** button (top right)
3. Click **"Choose file"** or drag and drop your ZIP
4. Upload `autochat-v4.0.zip`
5. Click **"Upload"**

### Step 5: Fill Out Store Listing

#### **Product Details Tab:**

**Item Name:**

```
AutoChat Enhanced - Auto Message Sender
```

**Summary (132 characters max):**

```
Advanced auto-message sender with typing simulation, anti-detection, analytics, and smart scheduling for any chat website.
```

**Description (detailed):**

```
AutoChat Enhanced - Professional automated message sender for Chrome

Send automated messages to any chat website with advanced anti-detection features and intelligent scheduling.

✨ KEY FEATURES:

🎯 Easy Setup
• Click-to-mark any text input field on any website
• Works on Discord, WhatsApp Web, Telegram, Slack, and more
• Universal compatibility with all chat platforms

⌨️ Realistic Typing Simulation
• Character-by-character typing animation
• Variable speed (40-80 WPM) mimics human typing
• Prevents instant-text spam detection

🎭 Anti-Detection Features
• Variable delays (0.5-2s thinking time)
• Anti-repetition algorithm
• Human-like behavior patterns
• Retry logic for reliability

📅 Smart Scheduling
• Active hours - only send during specified times
• Daily message limits with auto-stop
• Timezone-aware scheduling

📝 Dynamic Content
• Template variables: {time}, {date}, {random_emoji}, {random_number}
• 1000+ pre-loaded phrases
• Custom phrase management

📊 Analytics Dashboard
• Messages sent today counter
• Total messages tracker
• Real-time activity status
• Statistics export

⚙️ Advanced Controls
• Random or Sequential send modes
• Customizable time intervals
• Import/Export settings
• Modern gradient UI design

🛡️ Safety Features
• Daily limits prevent spam detection
• Active hours match normal usage
• Anti-repetition avoids patterns
• Variable delays appear natural

⚠️ RESPONSIBLE USE
This tool is intended for:
• Testing chat applications
• Automated reminders in controlled environments
• Personal use with permission
• Development and QA purposes

Please use responsibly and comply with platform terms of service.

🚀 Version 4.0 Enhanced Edition includes major upgrades with professional-grade automation features.

For support and documentation, visit our GitHub repository.
```

**Category:**

```
Productivity
```

**Language:**

```
English (United States)
```

#### **Graphics Assets:**

You need to prepare the following images:

**Required:**

1. **Small tile icon** - 128x128px (your icon48.png upscaled)
2. **Store icon** - 128x128px
3. **Marquee promo tile** - 1400x560px (promotional banner)
4. **Screenshots** - 1280x800px or 640x400px (at least 1, max 5)

**Creating Assets:**

Let me help you create a list of what you need:

```bash
# You'll need to create these manually or use design tools:

1. icon-128.png (128x128)
   - Upscale your icon48.png to 128x128

2. screenshot-1.png (1280x800)
   - Screenshot of the main popup interface

3. screenshot-2.png (1280x800)
   - Screenshot of settings modal

4. screenshot-3.png (1280x800)
   - Screenshot of analytics dashboard

5. promo-1400x560.png (1400x560)
   - Promotional banner with app name and key features
```

**Quick Screenshot Tips:**

- Use Chrome DevTools (F12) → Toggle Device Toolbar
- Set custom size: 1280x800
- Take screenshots of your extension in action
- Show the popup, settings, and analytics

#### **Additional Fields:**

**Official URL (optional):**

```
https://github.com/sushiomsky/autochat
```

**Support URL (optional):**

```
https://github.com/sushiomsky/autochat/issues
```

### Step 6: Privacy Settings

**Single Purpose:**

```
AutoChat automates sending messages to chat applications with customizable timing and content.
```

**Permission Justification:**

1. **scripting** - Required to inject automation scripts into web pages
2. **activeTab** - Required to interact with the current active tab
3. **storage** - Required to save user settings and message lists
4. **host_permissions (<all_urls>)** - Required to work on any chat website

**Data Usage:**

```
This extension does NOT collect, transmit, or store any user data externally.
All data (settings, messages, statistics) is stored locally in the browser using Chrome's storage API.
No analytics, tracking, or external servers are used.
```

**Privacy Policy URL (required if using permissions):**

You'll need to create a simple privacy policy. Here's a template:

```
PRIVACY POLICY - AutoChat Enhanced

Last Updated: October 18, 2025

1. DATA COLLECTION
AutoChat Enhanced does NOT collect, transmit, or store any personal data externally.

2. LOCAL STORAGE
All data (settings, messages, statistics) is stored locally in your browser using Chrome's storage API.

3. PERMISSIONS
- scripting: To inject automation into web pages
- activeTab: To interact with the active tab
- storage: To save your settings locally
- host_permissions: To work on any website

4. NO TRACKING
We do not use analytics, tracking, or external servers.

5. THIRD PARTIES
We do not share data with third parties.

6. CONTACT
For questions: https://github.com/sushiomsky/autochat/issues
```

Host this at: `https://github.com/sushiomsky/autochat/blob/main/PRIVACY_POLICY.md`

### Step 7: Distribution Settings

**Visibility:**

- ☑️ Public (recommended)
- ☐ Unlisted (only visible via direct link)

**Pricing:**

- ☑️ Free
- ☐ Paid

**Regions:**

- Select "All regions" or specific countries

### Step 8: Submit for Review

1. Review all information
2. Click **"Submit for review"**
3. Wait for Chrome Web Store review (typically 1-3 business days)

---

## Part 4: After Submission

### What Happens Next?

1. **Automated Checks** - Immediate basic validation
2. **Manual Review** - Google reviews for policy compliance (1-3 days)
3. **Publication** - If approved, goes live automatically
4. **Rejection** - If rejected, you'll get feedback and can resubmit

### Review Timeline

- **Automated checks**: Instant
- **Manual review**: 1-3 business days (sometimes longer)
- **First submission**: May take longer
- **Updates**: Usually faster

### Common Rejection Reasons

1. **Misleading description** - Be honest about functionality
2. **Privacy policy missing** - Required for permissions
3. **Malicious code** - Ensure clean code
4. **Unclear purpose** - Single purpose must be clear
5. **Icon issues** - Must be clear and non-deceptive

---

## Part 5: Managing Your Extension

### After Approval

**Your extension will be available at:**

```
https://chrome.google.com/webstore/detail/[EXTENSION_ID]
```

### Publishing Updates

1. Make changes to your code
2. Update version in `manifest.json`
3. Create new ZIP package
4. Go to Developer Dashboard
5. Click on your extension
6. Click **"Upload updated package"**
7. Submit for review

### Analytics

View in Developer Dashboard:

- Installations
- Daily active users
- Weekly active users
- Uninstalls
- Reviews and ratings

---

## Checklist for Submission

- [ ] Registered as Chrome Web Store developer ($5 paid)
- [ ] Built extension package (run build script)
- [ ] Created ZIP file
- [ ] Prepared 128x128 icon
- [ ] Created screenshots (at least 1)
- [ ] Created promo tile 1400x560 (optional but recommended)
- [ ] Written detailed description
- [ ] Created privacy policy
- [ ] Filled out permission justifications
- [ ] Selected category and language
- [ ] Reviewed all information
- [ ] Submitted for review

---

## Tips for Faster Approval

1. **Be Transparent** - Clearly explain what your extension does
2. **Justify Permissions** - Explain why each permission is needed
3. **Privacy Policy** - Host it on GitHub, keep it clear and simple
4. **Good Screenshots** - Show actual functionality
5. **Detailed Description** - Explain features thoroughly
6. **Test Locally** - Make sure it works before submitting
7. **Follow Guidelines** - Read Chrome Web Store policies

---

## Useful Links

- **Developer Dashboard**: https://chrome.google.com/webstore/devconsole
- **Developer Program Policies**: https://developer.chrome.com/docs/webstore/program-policies/
- **Publishing Guide**: https://developer.chrome.com/docs/webstore/publish/
- **Best Practices**: https://developer.chrome.com/docs/webstore/best_practices/
- **Support**: https://support.google.com/chrome_webstore/

---

## Need Help?

If you encounter issues during submission:

1. Check the Developer Dashboard for error messages
2. Review rejection reasons carefully
3. Update and resubmit
4. Contact Chrome Web Store support if needed

---

## Estimated Timeline

| Step                       | Time                  |
| -------------------------- | --------------------- |
| Register developer account | 5 minutes             |
| Build package              | 2 minutes             |
| Fill out listing           | 30-60 minutes         |
| Create graphics            | 1-2 hours             |
| Review & submit            | 5 minutes             |
| **Total active time**      | **2-3 hours**         |
| Google review              | **1-3 business days** |

---

Good luck with your submission! 🚀
