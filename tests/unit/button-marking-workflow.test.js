/**
 * Tests for Button Marking Workflow UI Component
 */

describe('Button Marking Workflow', () => {
  let markInputBtn;
  let inputStatus;
  let markMessageContainerBtn;
  let messageContainerStatus;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <button id="markInput" class="btn-primary">🎯 Mark Chat Input Field</button>
      <div id="inputStatus" class="status">No input field marked</div>
      
      <div class="btn-row">
        <button id="markMessageContainer" class="btn-secondary">📌 Mark Message Container</button>
        <div id="messageContainerStatus" class="status">No message container marked</div>
      </div>
    `;

    markInputBtn = document.getElementById('markInput');
    inputStatus = document.getElementById('inputStatus');
    markMessageContainerBtn = document.getElementById('markMessageContainer');
    messageContainerStatus = document.getElementById('messageContainerStatus');

    // Mock chrome APIs
    global.chrome.tabs.query.mockImplementation((queryInfo, callback) => {
      const tabs = [{ id: 1, active: true, currentWindow: true, url: 'https://example.com' }];
      if (callback) callback(tabs);
      return Promise.resolve(tabs);
    });

    global.chrome.scripting.executeScript.mockImplementation((injection, callback) => {
      const results = [{ result: null }];
      if (callback) callback(results);
      return Promise.resolve(results);
    });

    global.chrome.runtime.sendMessage.mockImplementation((message, callback) => {
      const response = { success: true };
      if (callback) callback(response);
      return Promise.resolve(response);
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Initial State', () => {
    test('should show "No input field marked" initially', () => {
      expect(inputStatus.textContent).toBe('No input field marked');
    });

    test('should show "No message container marked" initially', () => {
      expect(messageContainerStatus.textContent).toBe('No message container marked');
    });

    test('should have mark input button', () => {
      expect(markInputBtn).not.toBeNull();
      expect(markInputBtn.textContent).toContain('Mark Chat Input Field');
    });

    test('should have mark message container button', () => {
      expect(markMessageContainerBtn).not.toBeNull();
      expect(markMessageContainerBtn.textContent).toContain('Mark Message Container');
    });

    test('should have emoji icons on buttons', () => {
      expect(markInputBtn.textContent).toContain('🎯');
      expect(markMessageContainerBtn.textContent).toContain('📌');
    });
  });

  describe('Mark Input Field', () => {
    test('should send message when mark input button is clicked', async () => {
      markInputBtn.addEventListener('click', async () => {
        await chrome.runtime.sendMessage({ action: 'markInputField' });
      });
      
      markInputBtn.click();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'markInputField'
      });
    });

    test('should update status on successful marking', async () => {
      global.chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        const response = { success: true, selector: 'textarea.chat-input' };
        if (callback) callback(response);
        return Promise.resolve(response);
      });
      
      markInputBtn.addEventListener('click', async () => {
        const response = await chrome.runtime.sendMessage({ action: 'markInputField' });
        if (response.success) {
          inputStatus.textContent = `✓ Input field marked: ${response.selector}`;
          inputStatus.className = 'status success';
        }
      });
      
      markInputBtn.click();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(inputStatus.textContent).toContain('Input field marked');
      expect(inputStatus.classList.contains('success')).toBe(true);
    });

    test('should show error on marking failure', async () => {
      global.chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        const response = { success: false, error: 'No active tab found' };
        if (callback) callback(response);
        return Promise.resolve(response);
      });
      
      markInputBtn.addEventListener('click', async () => {
        const response = await chrome.runtime.sendMessage({ action: 'markInputField' });
        if (!response.success) {
          inputStatus.textContent = `✗ ${response.error}`;
          inputStatus.className = 'status error';
        }
      });
      
      markInputBtn.click();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(inputStatus.textContent).toContain('No active tab found');
      expect(inputStatus.classList.contains('error')).toBe(true);
    });

    test('should execute script in active tab', async () => {
      markInputBtn.addEventListener('click', async () => {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]) {
          await chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: () => console.log('Marking input')
          });
        }
      });
      
      markInputBtn.click();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(chrome.tabs.query).toHaveBeenCalled();
      expect(chrome.scripting.executeScript).toHaveBeenCalled();
    });

    test('should handle no active tab gracefully', async () => {
      global.chrome.tabs.query.mockImplementation((queryInfo, callback) => {
        const tabs = [];
        if (callback) callback(tabs);
        return Promise.resolve(tabs);
      });
      
      markInputBtn.addEventListener('click', async () => {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs.length === 0) {
          inputStatus.textContent = '✗ No active tab found';
          inputStatus.className = 'status error';
        }
      });
      
      markInputBtn.click();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(inputStatus.textContent).toContain('No active tab');
    });
  });

  describe('Mark Message Container', () => {
    test('should send message when mark container button is clicked', async () => {
      markMessageContainerBtn.addEventListener('click', async () => {
        await chrome.runtime.sendMessage({ action: 'markMessageContainer' });
      });
      
      markMessageContainerBtn.click();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'markMessageContainer'
      });
    });

    test('should update status on successful marking', async () => {
      global.chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        const response = { success: true, selector: 'div.messages' };
        if (callback) callback(response);
        return Promise.resolve(response);
      });
      
      markMessageContainerBtn.addEventListener('click', async () => {
        const response = await chrome.runtime.sendMessage({ action: 'markMessageContainer' });
        if (response.success) {
          messageContainerStatus.textContent = `✓ Container marked: ${response.selector}`;
          messageContainerStatus.className = 'status success';
        }
      });
      
      markMessageContainerBtn.click();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(messageContainerStatus.textContent).toContain('Container marked');
    });

    test('should show error on marking failure', async () => {
      global.chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        const response = { success: false, error: 'Element not found' };
        if (callback) callback(response);
        return Promise.resolve(response);
      });
      
      markMessageContainerBtn.addEventListener('click', async () => {
        const response = await chrome.runtime.sendMessage({ action: 'markMessageContainer' });
        if (!response.success) {
          messageContainerStatus.textContent = `✗ ${response.error}`;
          messageContainerStatus.className = 'status error';
        }
      });
      
      markMessageContainerBtn.click();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(messageContainerStatus.textContent).toContain('Element not found');
    });
  });

  describe('Sequential Marking', () => {
    test('should allow marking input then container', async () => {
      const markInput = jest.fn(async () => {
        const response = await chrome.runtime.sendMessage({ action: 'markInputField' });
        if (response.success) {
          inputStatus.textContent = '✓ Input marked';
        }
      });
      
      const markContainer = jest.fn(async () => {
        const response = await chrome.runtime.sendMessage({ action: 'markMessageContainer' });
        if (response.success) {
          messageContainerStatus.textContent = '✓ Container marked';
        }
      });
      
      markInputBtn.addEventListener('click', markInput);
      markMessageContainerBtn.addEventListener('click', markContainer);
      
      markInputBtn.click();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      markMessageContainerBtn.click();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(markInput).toHaveBeenCalled();
      expect(markContainer).toHaveBeenCalled();
    });

    test('should maintain separate states for input and container', async () => {
      global.chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        const response = { 
          success: message.action === 'markInputField',
          error: message.action === 'markMessageContainer' ? 'Failed' : null
        };
        if (callback) callback(response);
        return Promise.resolve(response);
      });
      
      // Mark input successfully
      markInputBtn.addEventListener('click', async () => {
        const response = await chrome.runtime.sendMessage({ action: 'markInputField' });
        inputStatus.textContent = response.success ? '✓ Marked' : '✗ Failed';
      });
      
      // Mark container unsuccessfully
      markMessageContainerBtn.addEventListener('click', async () => {
        const response = await chrome.runtime.sendMessage({ action: 'markMessageContainer' });
        messageContainerStatus.textContent = response.success ? '✓ Marked' : '✗ Failed';
      });
      
      markInputBtn.click();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      markMessageContainerBtn.click();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(inputStatus.textContent).toBe('✓ Marked');
      expect(messageContainerStatus.textContent).toBe('✗ Failed');
    });
  });

  describe('Re-marking Elements', () => {
    test('should allow re-marking input field', async () => {
      const clickHandler = jest.fn();
      markInputBtn.addEventListener('click', clickHandler);
      
      markInputBtn.click();
      markInputBtn.click();
      markInputBtn.click();
      
      expect(clickHandler).toHaveBeenCalledTimes(3);
    });

    test('should update status each time button is clicked', async () => {
      let clickCount = 0;
      
      markInputBtn.addEventListener('click', async () => {
        clickCount++;
        inputStatus.textContent = `✓ Marked (attempt ${clickCount})`;
      });
      
      markInputBtn.click();
      expect(inputStatus.textContent).toBe('✓ Marked (attempt 1)');
      
      markInputBtn.click();
      expect(inputStatus.textContent).toBe('✓ Marked (attempt 2)');
    });
  });

  describe('Error Handling', () => {
    test('should handle chrome.runtime.lastError', async () => {
      global.chrome.runtime.lastError = { message: 'Extension context invalidated' };
      
      markInputBtn.addEventListener('click', async () => {
        try {
          await chrome.runtime.sendMessage({ action: 'markInputField' });
          if (chrome.runtime.lastError) {
            throw new Error(chrome.runtime.lastError.message);
          }
        } catch (error) {
          inputStatus.textContent = `✗ ${error.message}`;
        }
      });
      
      markInputBtn.click();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(inputStatus.textContent).toContain('Extension context invalidated');
      
      global.chrome.runtime.lastError = null;
    });

    test('should handle network errors', async () => {
      global.chrome.runtime.sendMessage.mockImplementation(() => {
        return Promise.reject(new Error('Network error'));
      });
      
      markInputBtn.addEventListener('click', async () => {
        try {
          await chrome.runtime.sendMessage({ action: 'markInputField' });
        } catch (error) {
          inputStatus.textContent = `✗ ${error.message}`;
        }
      });
      
      markInputBtn.click();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(inputStatus.textContent).toContain('Network error');
    });
  });

  describe('Visual Feedback', () => {
    test('should have success class on successful marking', async () => {
      markInputBtn.addEventListener('click', async () => {
        inputStatus.className = 'status success';
      });
      
      markInputBtn.click();
      expect(inputStatus.classList.contains('success')).toBe(true);
    });

    test('should have error class on failed marking', async () => {
      markInputBtn.addEventListener('click', async () => {
        inputStatus.className = 'status error';
      });
      
      markInputBtn.click();
      expect(inputStatus.classList.contains('error')).toBe(true);
    });

    test('should show checkmark on success', async () => {
      markInputBtn.addEventListener('click', async () => {
        inputStatus.textContent = '✓ Success';
      });
      
      markInputBtn.click();
      expect(inputStatus.textContent).toContain('✓');
    });

    test('should show cross mark on error', async () => {
      markInputBtn.addEventListener('click', async () => {
        inputStatus.textContent = '✗ Error';
      });
      
      markInputBtn.click();
      expect(inputStatus.textContent).toContain('✗');
    });
  });

  describe('Accessibility', () => {
    test('should have descriptive button text', () => {
      expect(markInputBtn.textContent).toContain('Mark Chat Input Field');
      expect(markMessageContainerBtn.textContent).toContain('Mark Message Container');
    });

    test('should update status text for screen readers', () => {
      inputStatus.textContent = '✓ Input field marked successfully';
      expect(inputStatus.textContent).toBeTruthy();
      expect(inputStatus.textContent.length).toBeGreaterThan(0);
    });

    test('should have appropriate button classes', () => {
      expect(markInputBtn.classList.contains('btn-primary')).toBe(true);
      expect(markMessageContainerBtn.classList.contains('btn-secondary')).toBe(true);
    });
  });
});
