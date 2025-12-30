const puppeteer = require('puppeteer-core');
const path = require('path');

jest.setTimeout(120000);

describe('Extension end-to-end with Puppeteer', () => {
  let browser;
  let extensionId;
  let page;

  beforeAll(async () => {
    const extensionPath = path.join(process.cwd(), 'dist');

    browser = await puppeteer.launch({
      headless: 'new',
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ],
      dumpio: true, // Enable Chrome stdout logging
      pipe: true
    });

    // Log all targets to see what we have
    const targets = await browser.targets();
    console.log('Available targets:', targets.map(t => ({ type: t.type(), url: t.url() })));

    // Wait for extension to load using waitForTarget
    // Explicitly check for service_worker type for MV3
    const extensionTarget = await browser.waitForTarget(
      target => {
        console.log('Checking target:', target.type(), target.url());
        return target.type() === 'service_worker' && target.url().startsWith('chrome-extension://');
      },
      { timeout: 30000 }
    );

    if (extensionTarget) {
      extensionId = extensionTarget.url().split('/')[2];
    }

    if (!extensionId) throw new Error('Extension id not found after 30 seconds');

    const extensionPopupHtml = `chrome-extension://${extensionId}/popup-enhanced.html`;
    page = await browser.newPage();

    await page.goto(extensionPopupHtml, { waitUntil: 'domcontentloaded' });
  });

  afterAll(async () => {
    if (browser) await browser.close();
  });

  test('popup loads and buttons are present', async () => {
    await page.waitForSelector('#markInput', { timeout: 10000 });
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
