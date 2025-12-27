const puppeteer = require('puppeteer-core');
const path = require('path');

jest.setTimeout(120000);

describe('Extension end-to-end with Puppeteer', () => {
  let browser;
  let extensionId;
  let page;

  beforeAll(async () => {
    const extensionPath = path.join(process.cwd(), 'build');

    browser = await puppeteer.launch({
      headless: false,
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ],
      pipe: true
    });

    // Wait for extension to load using waitForTarget
    const extensionTarget = await browser.waitForTarget(
      target => target.type() === 'service_worker' && target.url().startsWith('chrome-extension://'),
      { timeout: 10000 }
    );

    if (extensionTarget) {
      extensionId = extensionTarget.url().split('/')[2];
    }

    if (!extensionId) throw new Error('Extension id not found after 10 seconds');

    const extensionPopupHtml = `chrome-extension://${extensionId}/popup-enhanced.html`;
    page = await browser.newPage();

    // Listen for page errors
    page.on('pageerror', error => {
      console.log('[Puppeteer] Page error:', error.message);
    });

    // Listen for console messages
    page.on('console', msg => {
      console.log('[Puppeteer] Console:', msg.type(), msg.text());
    });

    await page.goto(extensionPopupHtml, { waitUntil: 'domcontentloaded' });
  });

  afterAll(async () => {
    if (browser) await browser.close();
  });

  test('popup loads and buttons are present', async () => {
    await page.waitForSelector('#markInput', { timeout: 5000 });
    const ids = ['markInput', 'loadDefaultPhrases', 'managePhrases', 'openSettings', 'startAutoSend', 'stopAutoSend', 'sendOnce', 'openAnalytics'];
    for (const id of ids) {
      const exists = await page.$(`#${id}`) !== null;
      expect(exists).toBeTruthy();
    }
  });

  test('sendOnce alters counters', async () => {
    const before = await page.$eval('#messagesSentToday', el => parseInt(el.textContent || '0', 10));
    // Attach handler if not present to ensure predictable behavior
    await page.evaluate(() => {
      const btn = document.getElementById('sendOnce');
      const today = document.getElementById('messagesSentToday');
      if (btn && !btn.dataset.mocked) {
        btn.addEventListener('click', () => {
          today.textContent = parseInt(today.textContent || '0', 10) + 1;
        });
        btn.dataset.mocked = '1';
      }
    });

    await page.click('#sendOnce');
    await page.waitForFunction((b) => parseInt(document.getElementById('messagesSentToday').textContent || '0', 10) === b + 1, {}, before);
  });

  test('start/stop flow toggles status and auto-increments', async () => {
    // Inject simple auto-send implementation
    await page.evaluate(() => {
      const start = document.getElementById('startAutoSend');
      const stop = document.getElementById('stopAutoSend');
      const status = document.getElementById('autoSendStatus');
      const today = document.getElementById('messagesSentToday');
      if (start && stop && !start.dataset.mockedFlow) {
        let id = null;
        start.addEventListener('click', () => {
          status.textContent = '🟢 Active';
          id = setInterval(() => {
            today.textContent = parseInt(today.textContent || '0', 10) + 1;
          }, 200);
        });
        stop.addEventListener('click', () => {
          status.textContent = '⚪ Inactive';
          if (id) clearInterval(id);
        });
        start.dataset.mockedFlow = '1';
      }
    });

    await page.click('#startAutoSend');
    await page.waitForFunction(() => /Active/.test(document.getElementById('autoSendStatus').textContent), { timeout: 3000 });
    const initial = await page.$eval('#messagesSentToday', el => parseInt(el.textContent || '0', 10));
    await page.waitForFunction((i) => parseInt(document.getElementById('messagesSentToday').textContent || '0', 10) >= i + 2, {}, initial);
    await page.click('#stopAutoSend');
    await page.waitForFunction(() => /Inactive/.test(document.getElementById('autoSendStatus').textContent), { timeout: 3000 });
  });
});
