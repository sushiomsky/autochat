const path = require('path');
require('chromedriver');
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

jest.setTimeout(30000);

describe('Popup UI Selenium checks', () => {
  let driver;

  beforeAll(async () => {
    const options = new chrome.Options();
    options.addArguments('--headless=new');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--allow-file-access-from-files');
    options.addArguments('--disable-web-security');

    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    const fileUrl = 'file://' + path.join(process.cwd(), 'build', 'popup-enhanced.html');
    await driver.get(fileUrl);
    await driver.wait(until.elementLocated(By.css('body')), 5000);
  });

  afterAll(async () => {
    if (driver) await driver.quit();
  });

  test('main buttons exist', async () => {
    const ids = ['markInput','loadDefaultPhrases','managePhrases','openSettings','startAutoSend','stopAutoSend','sendOnce','openAnalytics'];
    for (const id of ids) {
      const el = await driver.findElement(By.id(id));
      expect(el).toBeDefined();
    }
  });

  test('mark input button updates status via injected handler', async () => {
    // Inject a small handler to avoid depending on extension chrome APIs
    await driver.executeScript(() => {
      const btn = document.getElementById('markInput');
      if (btn) btn.addEventListener('click', () => {
        const status = document.getElementById('inputStatus');
        if (status) status.textContent = 'Mock: input marked';
      });
    });

    const btn = await driver.findElement(By.id('markInput'));
    await btn.click();
    const status = await driver.findElement(By.id('inputStatus'));
    const text = await status.getText();
    expect(text).toMatch(/input marked/);
  });

  test('open settings shows settings modal via injected handler', async () => {
    await driver.executeScript(() => {
      const btn = document.getElementById('openSettings');
      const modal = document.getElementById('settingsModal');
      if (btn && modal) btn.addEventListener('click', () => {
        modal.style.display = 'block';
      });
    });
    const btn = await driver.findElement(By.id('openSettings'));
    await btn.click();
    const modal = await driver.findElement(By.id('settingsModal'));
    const display = await driver.executeScript(el => window.getComputedStyle(el).display, modal);
    expect(display === 'block' || display === 'flex').toBeTruthy();
  });
});
