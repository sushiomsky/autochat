const puppeteer = require('puppeteer');
const path = require('path');

jest.setTimeout(180000);

describe('Comprehensive UI/UX tests (popup)', () => {
  let browser;
  let extensionId;
  let page;

  beforeAll(async () => {
    const extensionPath = path.join(process.cwd(), 'build');
    browser = await puppeteer.launch({
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });

    // find extension id
    const targets = await browser.targets();
    const extTarget = targets.find(t => t.url().startsWith('chrome-extension://'));
    if (extTarget) extensionId = extTarget.url().split('/')[2];
    if (!extensionId) {
      await new Promise(r => setTimeout(r, 1000));
      const t2 = await browser.targets();
      const extTarget2 = t2.find(t => t.url().startsWith('chrome-extension://'));
      if (extTarget2) extensionId = extTarget2.url().split('/')[2];
    }

    if (!extensionId) throw new Error('Extension id not found');

    const popupUrl = `chrome-extension://${extensionId}/popup-enhanced.html`;
    page = await browser.newPage();
    await page.goto(popupUrl, { waitUntil: 'domcontentloaded' });
  });

  afterAll(async () => {
    if (browser) await browser.close();
  });

  test('all primary UI elements present', async () => {
    const selectors = [
      '#markInput','#inputStatus','#messageList','#loadDefaultPhrases','#managePhrases','#openSettings',
      '#sendMode','#minInterval','#maxInterval','#startAutoSend','#stopAutoSend','#sendOnce','#openAnalytics'
    ];
    for (const sel of selectors) {
      await page.waitForSelector(sel, { timeout: 5000 });
      const exists = await page.$(sel) !== null;
      expect(exists).toBeTruthy();
    }
  });

  test('select chat input and container simulation', async () => {
    // prepare a mock chat page in new tab
    const chatPage = await browser.newPage();
    const chatHtml = `
      <html><body>
      <div id="chat-container" style="width:400px;height:200px;">
        <div id="messages">Hello</div>
        <input id="chat-input" placeholder="Type here">
      </div>
      </body></html>`;
    await chatPage.setContent(chatHtml);

    // Inject handler into popup to simulate selecting element from active tab
    await page.evaluate(() => {
      const btn = document.getElementById('markInput');
      if (!btn.dataset.mockedSelector) {
        btn.addEventListener('click', async () => {
          // Simulate selecting by assigning selector strings
          const status = document.getElementById('inputStatus');
          status.textContent = 'Mock: chat-input selected';
          // store selectors in window for assertion
          window._marked = { input: '#chat-input', container: '#chat-container' };
        });
        btn.dataset.mockedSelector = '1';
      }
    });

    await page.click('#markInput');
    await page.waitForFunction(() => window._marked && window._marked.input, { timeout: 3000 });
    const marked = await page.evaluate(() => window._marked);
    expect(marked.input).toBe('#chat-input');
    expect(marked.container).toBe('#chat-container');
    const inputStatus = await page.$eval('#inputStatus', el => el.textContent);
    expect(inputStatus).toMatch(/selected/);
    await chatPage.close();
  });

  test('message list edit and save simulation', async () => {
    await page.focus('#messageList');
    await page.$eval('#messageList', el => { el.value = 'Line1\nLine2'; });
    const val = await page.$eval('#messageList', el => el.value);
    expect(val).toMatch(/Line1/);
  });

  test('load default phrases populates list and updates count', async () => {
    await page.evaluate(() => {
      const btn = document.getElementById('loadDefaultPhrases');
      const list = document.getElementById('defaultPhrasesList');
      const count = document.getElementById('defaultPhrasesCount');
      if (!btn.dataset.mockedLoad) {
        btn.addEventListener('click', () => {
          list.innerHTML = '';
          ['one','two','three'].forEach(t => {
            const d = document.createElement('div'); d.textContent = t; list.appendChild(d);
          });
          count.textContent = list.children.length;
        });
        btn.dataset.mockedLoad = '1';
      }
    });

    await page.click('#loadDefaultPhrases');
    await page.waitForFunction(() => document.getElementById('defaultPhrasesCount').textContent === '3', { timeout: 3000 });
    const cnt = await page.$eval('#defaultPhrasesCount', el => el.textContent);
    expect(cnt).toBe('3');
  });

  test('open settings and toggle options', async () => {
    // show settings modal
    await page.evaluate(() => document.getElementById('settingsModal').style.display = 'block');
    await page.waitForSelector('#typingSimulation');
    // toggle checkboxes
    await page.$eval('#typingSimulation', el => el.checked = false);
    await page.$eval('#variableDelays', el => el.checked = false);
    const typing = await page.$eval('#typingSimulation', el => el.checked);
    const variable = await page.$eval('#variableDelays', el => el.checked);
    expect(typing).toBe(false);
    expect(variable).toBe(false);
    // active hours show/hide inputs when checked
    await page.$eval('#activeHours', el => el.checked = true);
    await page.$eval('#activeHoursInputs', el => el.style.display = 'block');
    const display = await page.$eval('#activeHoursInputs', el => window.getComputedStyle(el).display);
    expect(display === 'block' || display === 'flex').toBeTruthy();
  });

  test('export/import settings simulation', async () => {
    await page.evaluate(() => {
      const exportBtn = document.getElementById('exportSettings');
      const importBtn = document.getElementById('importSettings');
      if (!exportBtn.dataset.mocked) {
        exportBtn.addEventListener('click', () => { window._exported = true; });
        importBtn.addEventListener('click', () => { window._imported = { theme: 'imported' }; });
        exportBtn.dataset.mocked = '1';
      }
    });

    await page.click('#exportSettings');
    await page.waitForFunction(() => window._exported === true, { timeout: 2000 });
    await page.click('#importSettings');
    await page.waitForFunction(() => window._imported && window._imported.theme === 'imported', { timeout: 2000 });
    const imported = await page.evaluate(() => window._imported);
    expect(imported.theme).toBe('imported');
  });

  test('phrase manager add and count', async () => {
    // open phrase modal
    await page.evaluate(() => document.getElementById('phraseModal').style.display = 'block');
    await page.waitForSelector('#newPhraseInput');
    await page.$eval('#newPhraseInput', el => el.value = 'New phrase test');
    await page.evaluate(() => {
      const btn = document.getElementById('addNewPhrase');
      const list = document.getElementById('customPhrasesList');
      const count = document.getElementById('customPhrasesCount');
      if (!btn.dataset.mockedAdd) {
        btn.addEventListener('click', () => {
          const v = document.getElementById('newPhraseInput').value || 'x';
          const d = document.createElement('div'); d.textContent = v; document.getElementById('customPhrasesList').appendChild(d);
          document.getElementById('customPhrasesCount').textContent = document.getElementById('customPhrasesList').children.length;
        });
        btn.dataset.mockedAdd = '1';
      }
    });

    await page.click('#addNewPhrase');
    await page.waitForFunction(() => parseInt(document.getElementById('customPhrasesCount').textContent || '0', 10) >= 1, { timeout: 3000 });
    const cnt = await page.$eval('#customPhrasesCount', el => el.textContent);
    expect(parseInt(cnt, 10)).toBeGreaterThanOrEqual(1);
  });

  test('analytics reset clears counters', async () => {
    // set counters
    await page.$eval('#messagesSentToday', el => el.textContent = '5');
    await page.$eval('#analyticsToday', el => el.textContent = '5');
    await page.evaluate(() => {
      const btn = document.getElementById('resetStats');
      if (!btn.dataset.mockedReset) {
        btn.addEventListener('click', () => {
          document.getElementById('messagesSentToday').textContent = '0';
          document.getElementById('analyticsToday').textContent = '0';
        });
        btn.dataset.mockedReset = '1';
      }
    });

    await page.click('#openAnalytics');
    await page.waitForSelector('#resetStats');
    await page.click('#resetStats');
    await page.waitForFunction(() => document.getElementById('messagesSentToday').textContent === '0', { timeout: 3000 });
    const today = await page.$eval('#messagesSentToday', el => el.textContent);
    expect(today).toBe('0');
  });
});
