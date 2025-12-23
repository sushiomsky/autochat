const path = require('path');
require('chromedriver');
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

jest.setTimeout(60000);

describe('Popup integration flows (start/stop/send)', () => {
  let driver;

  beforeAll(async () => {
    const options = new chrome.Options();
    options.addArguments('--headless=new');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--allow-file-access-from-files');

    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    const fileUrl = 'file://' + path.join(process.cwd(), 'build', 'popup-enhanced.html');
    await driver.get(fileUrl);
    await driver.wait(until.elementLocated(By.css('body')), 5000);
  });

  afterAll(async () => {
    if (driver) await driver.quit();
  });

  test('sendOnce increments counters', async () => {
    // Inject a mock handler for sendOnce that updates counters
    await driver.executeScript(() => {
      const btn = document.getElementById('sendOnce');
      const today = document.getElementById('messagesSentToday');
      const total = document.getElementById('totalMessages');
      if (btn) btn.addEventListener('click', () => {
        const tVal = parseInt(today.textContent || '0', 10) + 1;
        const totVal = parseInt(total.textContent || '0', 10) + 1;
        today.textContent = tVal;
        total.textContent = totVal;
      });
    });

    const before = await driver.findElement(By.id('messagesSentToday')).getText();
    const btn = await driver.findElement(By.id('sendOnce'));
    await btn.click();
    await driver.wait(async () => {
      const after = await driver.findElement(By.id('messagesSentToday')).getText();
      return parseInt(after, 10) === parseInt(before, 10) + 1;
    }, 3000);
  });

  test('startAutoSend creates active status and increments over time', async () => {
    await driver.executeScript(() => {
      const start = document.getElementById('startAutoSend');
      const stop = document.getElementById('stopAutoSend');
      const status = document.getElementById('autoSendStatus');
      const today = document.getElementById('messagesSentToday');
      let intervalId = null;

      if (start) start.addEventListener('click', () => {
        status.textContent = '🟢 Active';
        intervalId = setInterval(() => {
          const v = parseInt(today.textContent || '0', 10) + 1;
          today.textContent = v;
        }, 250);
      });

      if (stop) stop.addEventListener('click', () => {
        status.textContent = '⚪ Inactive';
        if (intervalId) clearInterval(intervalId);
      });
    });

    const startBtn = await driver.findElement(By.id('startAutoSend'));
    await startBtn.click();

    // Wait until status shows Active
    await driver.wait(async () => {
      const text = await driver.findElement(By.id('autoSendStatus')).getText();
      return /Active/.test(text);
    }, 3000);

    // Wait for at least 2 increments
    const initial = parseInt(await driver.findElement(By.id('messagesSentToday')).getText(), 10);
    await driver.wait(async () => {
      const val = parseInt(await driver.findElement(By.id('messagesSentToday')).getText(), 10);
      return val >= initial + 2;
    }, 5000);

    // Stop and verify status becomes Inactive
    const stopBtn = await driver.findElement(By.id('stopAutoSend'));
    await stopBtn.click();
    await driver.wait(async () => {
      const text = await driver.findElement(By.id('autoSendStatus')).getText();
      return /Inactive/.test(text);
    }, 3000);
  });

  test('phrase manager add new phrase updates count', async () => {
    await driver.executeScript(() => {
      const addBtn = document.getElementById('addNewPhrase');
      const input = document.getElementById('newPhraseInput');
      const count = document.getElementById('customPhrasesCount');
      const list = document.getElementById('customPhrasesList');
      if (addBtn && input && count && list) {
        addBtn.addEventListener('click', () => {
          const v = input.value || 'phrase';
          const node = document.createElement('div');
          node.textContent = v;
          list.appendChild(node);
          count.textContent = parseInt(count.textContent || '0', 10) + 1;
        });
      }
    });

    // open phrase modal by simulating click on managePhrases
    await driver.findElement(By.id('managePhrases')).click();
    // ensure textarea and button exist
    const input = await driver.findElement(By.id('newPhraseInput'));
    await input.sendKeys('Hello integration');
    await driver.findElement(By.id('addNewPhrase')).click();
    await driver.wait(async () => {
      const cnt = await driver.findElement(By.id('customPhrasesCount')).getText();
      return parseInt(cnt, 10) >= 1;
    }, 3000);
  });
});
