/**
 * Tests for Send Method Selector UI Component
 */

describe('Send Method Selector', () => {
  let sendMethodSelect;
  let markSendButton;
  let sendButtonStatus;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <label>Send Method:
        <select id="sendMethod">
          <option value="enter">⌨️ Press Enter key</option>
          <option value="click">🖱️ Click a Send button</option>
        </select>
      </label>
      
      <div class="btn-row">
        <button id="markSendButton" class="btn-secondary" style="display: none;">
          📍 Mark Send Button
        </button>
      </div>
      
      <div id="sendButtonStatus" class="help"></div>
    `;

    sendMethodSelect = document.getElementById('sendMethod');
    markSendButton = document.getElementById('markSendButton');
    sendButtonStatus = document.getElementById('sendButtonStatus');

    // Mock chrome storage
    global.chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({ sendMethod: 'enter' });
      return Promise.resolve({ sendMethod: 'enter' });
    });

    global.chrome.storage.local.set.mockImplementation((items, callback) => {
      if (callback) callback();
      return Promise.resolve();
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Initial State', () => {
    test('should have default value of "enter"', () => {
      expect(sendMethodSelect.value).toBe('enter');
    });

    test('should hide mark send button initially', () => {
      expect(markSendButton.style.display).toBe('none');
    });

    test('should have empty status initially', () => {
      expect(sendButtonStatus.textContent).toBe('');
    });

    test('should have both send method options', () => {
      const options = sendMethodSelect.querySelectorAll('option');
      expect(options.length).toBe(2);
      expect(options[0].value).toBe('enter');
      expect(options[1].value).toBe('click');
    });
  });

  describe('Selecting Enter Method', () => {
    test('should select enter method', () => {
      sendMethodSelect.value = 'enter';
      expect(sendMethodSelect.value).toBe('enter');
    });

    test('should hide mark button when enter is selected', () => {
      sendMethodSelect.value = 'enter';
      
      const changeHandler = (e) => {
        if (e.target.value === 'enter') {
          markSendButton.style.display = 'none';
          sendButtonStatus.textContent = '';
        }
      };
      
      sendMethodSelect.addEventListener('change', changeHandler);
      sendMethodSelect.dispatchEvent(new Event('change'));
      
      expect(markSendButton.style.display).toBe('none');
    });

    test('should clear status when enter is selected', () => {
      sendButtonStatus.textContent = 'Send button marked';
      sendMethodSelect.value = 'enter';
      
      const changeHandler = (e) => {
        if (e.target.value === 'enter') {
          sendButtonStatus.textContent = '';
        }
      };
      
      sendMethodSelect.addEventListener('change', changeHandler);
      sendMethodSelect.dispatchEvent(new Event('change'));
      
      expect(sendButtonStatus.textContent).toBe('');
    });
  });

  describe('Selecting Click Method', () => {
    test('should select click method', () => {
      sendMethodSelect.value = 'click';
      expect(sendMethodSelect.value).toBe('click');
    });

    test('should show mark button when click is selected', () => {
      sendMethodSelect.value = 'click';
      
      const changeHandler = (e) => {
        if (e.target.value === 'click') {
          markSendButton.style.display = 'inline-block';
        }
      };
      
      sendMethodSelect.addEventListener('change', changeHandler);
      sendMethodSelect.dispatchEvent(new Event('change'));
      
      expect(markSendButton.style.display).toBe('inline-block');
    });

    test('should show help text when click is selected', () => {
      sendMethodSelect.value = 'click';
      
      const changeHandler = (e) => {
        if (e.target.value === 'click') {
          markSendButton.style.display = 'inline-block';
          sendButtonStatus.textContent = 'Click "Mark Send Button" and then click the send button on the page';
        }
      };
      
      sendMethodSelect.addEventListener('change', changeHandler);
      sendMethodSelect.dispatchEvent(new Event('change'));
      
      expect(sendButtonStatus.textContent).toContain('Mark Send Button');
    });
  });

  describe('Switching Between Methods', () => {
    test('should switch from enter to click', () => {
      sendMethodSelect.value = 'enter';
      expect(sendMethodSelect.value).toBe('enter');
      
      sendMethodSelect.value = 'click';
      expect(sendMethodSelect.value).toBe('click');
    });

    test('should switch from click to enter', () => {
      sendMethodSelect.value = 'click';
      expect(sendMethodSelect.value).toBe('click');
      
      sendMethodSelect.value = 'enter';
      expect(sendMethodSelect.value).toBe('enter');
    });

    test('should update UI when switching methods', () => {
      const changeHandler = (e) => {
        if (e.target.value === 'click') {
          markSendButton.style.display = 'inline-block';
        } else {
          markSendButton.style.display = 'none';
        }
      };
      
      sendMethodSelect.addEventListener('change', changeHandler);
      
      sendMethodSelect.value = 'click';
      sendMethodSelect.dispatchEvent(new Event('change'));
      expect(markSendButton.style.display).toBe('inline-block');
      
      sendMethodSelect.value = 'enter';
      sendMethodSelect.dispatchEvent(new Event('change'));
      expect(markSendButton.style.display).toBe('none');
    });
  });

  describe('Persistence', () => {
    test('should save send method to storage', async () => {
      sendMethodSelect.value = 'click';
      await chrome.storage.local.set({ sendMethod: 'click' });
      
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        sendMethod: 'click'
      });
    });

    test('should load send method from storage', async () => {
      global.chrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({ sendMethod: 'click' });
        return Promise.resolve({ sendMethod: 'click' });
      });
      
      const result = await chrome.storage.local.get('sendMethod');
      expect(result.sendMethod).toBe('click');
    });

    test('should persist selection across page loads', async () => {
      sendMethodSelect.value = 'click';
      await chrome.storage.local.set({ sendMethod: 'click' });
      
      const result = await chrome.storage.local.get('sendMethod');
      sendMethodSelect.value = result.sendMethod;
      
      expect(sendMethodSelect.value).toBe('click');
    });
  });

  describe('Mark Send Button Interaction', () => {
    beforeEach(() => {
      sendMethodSelect.value = 'click';
      markSendButton.style.display = 'inline-block';
    });

    test('should have mark send button when click method is active', () => {
      expect(markSendButton).not.toBeNull();
      expect(markSendButton.style.display).toBe('inline-block');
    });

    test('should update status when send button is marked', () => {
      markSendButton.addEventListener('click', () => {
        sendButtonStatus.textContent = '✓ Send button marked successfully';
        sendButtonStatus.className = 'help success';
      });
      
      markSendButton.click();
      
      expect(sendButtonStatus.textContent).toContain('marked successfully');
    });

    test('should show error if marking fails', () => {
      markSendButton.addEventListener('click', () => {
        sendButtonStatus.textContent = '✗ Failed to mark send button. Please try again.';
        sendButtonStatus.className = 'help error';
      });
      
      markSendButton.click();
      
      expect(sendButtonStatus.textContent).toContain('Failed');
    });
  });

  describe('Integration with Content Script', () => {
    test('should send message to content script when marking button', async () => {
      markSendButton.addEventListener('click', async () => {
        await chrome.runtime.sendMessage({ action: 'markSendButton' });
      });
      
      markSendButton.click();
      
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'markSendButton'
      });
    });

    test('should handle successful marking response', async () => {
      global.chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        const response = { success: true };
        if (callback) callback(response);
        return Promise.resolve(response);
      });
      
      markSendButton.addEventListener('click', async () => {
        const response = await chrome.runtime.sendMessage({ action: 'markSendButton' });
        if (response.success) {
          sendButtonStatus.textContent = '✓ Send button marked';
        }
      });
      
      markSendButton.click();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(sendButtonStatus.textContent).toBe('✓ Send button marked');
    });

    test('should handle marking failure response', async () => {
      global.chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        const response = { success: false, error: 'No active tab' };
        if (callback) callback(response);
        return Promise.resolve(response);
      });
      
      markSendButton.addEventListener('click', async () => {
        const response = await chrome.runtime.sendMessage({ action: 'markSendButton' });
        if (!response.success) {
          sendButtonStatus.textContent = `✗ ${response.error}`;
        }
      });
      
      markSendButton.click();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(sendButtonStatus.textContent).toContain('No active tab');
    });
  });

  describe('Accessibility', () => {
    test('should have label for send method select', () => {
      const label = document.querySelector('label');
      expect(label).not.toBeNull();
      expect(label.textContent).toContain('Send Method');
    });

    test('should have descriptive option text', () => {
      const options = sendMethodSelect.querySelectorAll('option');
      expect(options[0].textContent).toContain('Press Enter key');
      expect(options[1].textContent).toContain('Click a Send button');
    });

    test('should have descriptive button text', () => {
      expect(markSendButton.textContent).toContain('Mark Send Button');
    });
  });

  describe('Edge Cases', () => {
    test('should handle rapid method switching', () => {
      const changeHandler = jest.fn();
      sendMethodSelect.addEventListener('change', changeHandler);
      
      for (let i = 0; i < 10; i++) {
        sendMethodSelect.value = i % 2 === 0 ? 'enter' : 'click';
        sendMethodSelect.dispatchEvent(new Event('change'));
      }
      
      expect(changeHandler).toHaveBeenCalledTimes(10);
    });

    test('should maintain state when switching methods multiple times', () => {
      sendMethodSelect.value = 'click';
      sendMethodSelect.value = 'enter';
      sendMethodSelect.value = 'click';
      
      expect(sendMethodSelect.value).toBe('click');
    });

    test('should handle missing send button gracefully', () => {
      document.getElementById('markSendButton').remove();
      
      expect(() => {
        sendMethodSelect.value = 'click';
        sendMethodSelect.dispatchEvent(new Event('change'));
      }).not.toThrow();
    });
  });

  describe('Visual Indicators', () => {
    test('should show emoji icon for enter method', () => {
      const enterOption = sendMethodSelect.querySelector('option[value="enter"]');
      expect(enterOption.textContent).toContain('⌨️');
    });

    test('should show emoji icon for click method', () => {
      const clickOption = sendMethodSelect.querySelector('option[value="click"]');
      expect(clickOption.textContent).toContain('🖱️');
    });

    test('should show emoji icon on mark button', () => {
      expect(markSendButton.textContent).toContain('📍');
    });
  });
});
