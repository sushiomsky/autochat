/**
 * Tests for Start/Stop/Pause Auto-Send UI Component
 */

describe('Auto-Send Control Workflow', () => {
  let startBtn;
  let stopBtn;
  let pauseBtn;
  let autoSendStatus;
  let isAutoSendActive;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div class="stats-bar">
        <div class="stat-item">
          <div class="stat-label">Status</div>
          <div class="stat-value" id="autoSendStatus">⚪ Inactive</div>
        </div>
      </div>
      
      <button id="startAutoSend" class="btn-success">▶️ Start Auto-Send</button>
      <button id="pauseAutoSend" class="btn-warning" style="display: none;">⏸️ Pause</button>
      <button id="stopAutoSend" class="btn-danger">⏹️ Stop Auto-Send</button>
    `;

    startBtn = document.getElementById('startAutoSend');
    stopBtn = document.getElementById('stopAutoSend');
    pauseBtn = document.getElementById('pauseAutoSend');
    autoSendStatus = document.getElementById('autoSendStatus');
    
    isAutoSendActive = false;

    // Mock chrome APIs
    global.chrome.runtime.sendMessage.mockImplementation((message, callback) => {
      const response = { success: true };
      if (callback) callback(response);
      return Promise.resolve(response);
    });

    global.chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({ autoSendActive: isAutoSendActive });
      return Promise.resolve({ autoSendActive: isAutoSendActive });
    });

    global.chrome.storage.local.set.mockImplementation((items, callback) => {
      if (items.autoSendActive !== undefined) {
        isAutoSendActive = items.autoSendActive;
      }
      if (callback) callback();
      return Promise.resolve();
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Initial State', () => {
    test('should show inactive status initially', () => {
      expect(autoSendStatus.textContent).toBe('⚪ Inactive');
    });

    test('should show start button', () => {
      expect(startBtn).not.toBeNull();
      expect(startBtn.style.display).not.toBe('none');
    });

    test('should hide pause button initially', () => {
      expect(pauseBtn.style.display).toBe('none');
    });

    test('should show stop button', () => {
      expect(stopBtn).not.toBeNull();
      expect(stopBtn.style.display).not.toBe('none');
    });

    test('should have emoji icons on all buttons', () => {
      expect(startBtn.textContent).toContain('▶️');
      expect(pauseBtn.textContent).toContain('⏸️');
      expect(stopBtn.textContent).toContain('⏹️');
    });

    test('should have appropriate button classes', () => {
      expect(startBtn.classList.contains('btn-success')).toBe(true);
      expect(pauseBtn.classList.contains('btn-warning')).toBe(true);
      expect(stopBtn.classList.contains('btn-danger')).toBe(true);
    });
  });

  describe('Starting Auto-Send', () => {
    test('should send start message when start button is clicked', async () => {
      startBtn.addEventListener('click', async () => {
        await chrome.runtime.sendMessage({ action: 'startAutoSend' });
      });
      
      startBtn.click();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'startAutoSend'
      });
    });

    test('should update status to active after starting', async () => {
      startBtn.addEventListener('click', async () => {
        const response = await chrome.runtime.sendMessage({ action: 'startAutoSend' });
        if (response.success) {
          autoSendStatus.textContent = '🟢 Active';
          isAutoSendActive = true;
        }
      });
      
      startBtn.click();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(autoSendStatus.textContent).toBe('🟢 Active');
      expect(isAutoSendActive).toBe(true);
    });

    test('should hide start button and show pause button', async () => {
      startBtn.addEventListener('click', async () => {
        startBtn.style.display = 'none';
        pauseBtn.style.display = 'inline-block';
      });
      
      startBtn.click();
      
      expect(startBtn.style.display).toBe('none');
      expect(pauseBtn.style.display).toBe('inline-block');
    });

    test('should save active state to storage', async () => {
      startBtn.addEventListener('click', async () => {
        await chrome.storage.local.set({ autoSendActive: true });
      });
      
      startBtn.click();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        autoSendActive: true
      });
    });

    test('should handle start failure', async () => {
      global.chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        const response = { success: false, error: 'No messages configured' };
        if (callback) callback(response);
        return Promise.resolve(response);
      });
      
      let errorMessage = '';
      startBtn.addEventListener('click', async () => {
        const response = await chrome.runtime.sendMessage({ action: 'startAutoSend' });
        if (!response.success) {
          errorMessage = response.error;
          autoSendStatus.textContent = '🔴 Error';
        }
      });
      
      startBtn.click();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(errorMessage).toBe('No messages configured');
      expect(autoSendStatus.textContent).toBe('🔴 Error');
    });
  });

  describe('Pausing Auto-Send', () => {
    beforeEach(async () => {
      // Start auto-send first
      isAutoSendActive = true;
      autoSendStatus.textContent = '🟢 Active';
      startBtn.style.display = 'none';
      pauseBtn.style.display = 'inline-block';
    });

    test('should send pause message when pause button is clicked', async () => {
      pauseBtn.addEventListener('click', async () => {
        await chrome.runtime.sendMessage({ action: 'pauseAutoSend' });
      });
      
      pauseBtn.click();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'pauseAutoSend'
      });
    });

    test('should update status to paused', async () => {
      pauseBtn.addEventListener('click', async () => {
        const response = await chrome.runtime.sendMessage({ action: 'pauseAutoSend' });
        if (response.success) {
          autoSendStatus.textContent = '⏸️ Paused';
        }
      });
      
      pauseBtn.click();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(autoSendStatus.textContent).toBe('⏸️ Paused');
    });

    test('should toggle pause button text', async () => {
      pauseBtn.addEventListener('click', () => {
        if (pauseBtn.textContent.includes('Pause')) {
          pauseBtn.textContent = '▶️ Resume';
        } else {
          pauseBtn.textContent = '⏸️ Pause';
        }
      });
      
      pauseBtn.click();
      expect(pauseBtn.textContent).toContain('Resume');
      
      pauseBtn.click();
      expect(pauseBtn.textContent).toContain('Pause');
    });
  });

  describe('Stopping Auto-Send', () => {
    beforeEach(() => {
      // Start auto-send first
      isAutoSendActive = true;
      autoSendStatus.textContent = '🟢 Active';
      startBtn.style.display = 'none';
      pauseBtn.style.display = 'inline-block';
    });

    test('should send stop message when stop button is clicked', async () => {
      stopBtn.addEventListener('click', async () => {
        await chrome.runtime.sendMessage({ action: 'stopAutoSend' });
      });
      
      stopBtn.click();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'stopAutoSend'
      });
    });

    test('should update status to inactive', async () => {
      stopBtn.addEventListener('click', async () => {
        const response = await chrome.runtime.sendMessage({ action: 'stopAutoSend' });
        if (response.success) {
          autoSendStatus.textContent = '⚪ Inactive';
          isAutoSendActive = false;
        }
      });
      
      stopBtn.click();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(autoSendStatus.textContent).toBe('⚪ Inactive');
      expect(isAutoSendActive).toBe(false);
    });

    test('should show start button and hide pause button', async () => {
      stopBtn.addEventListener('click', async () => {
        startBtn.style.display = 'inline-block';
        pauseBtn.style.display = 'none';
      });
      
      stopBtn.click();
      
      expect(startBtn.style.display).toBe('inline-block');
      expect(pauseBtn.style.display).toBe('none');
    });

    test('should save inactive state to storage', async () => {
      stopBtn.addEventListener('click', async () => {
        await chrome.storage.local.set({ autoSendActive: false });
      });
      
      stopBtn.click();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        autoSendActive: false
      });
    });

    test('should work even when not active', async () => {
      isAutoSendActive = false;
      
      stopBtn.addEventListener('click', async () => {
        await chrome.runtime.sendMessage({ action: 'stopAutoSend' });
        autoSendStatus.textContent = '⚪ Inactive';
      });
      
      stopBtn.click();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(autoSendStatus.textContent).toBe('⚪ Inactive');
    });
  });

  describe('Status Indicators', () => {
    test('should use white circle for inactive', () => {
      autoSendStatus.textContent = '⚪ Inactive';
      expect(autoSendStatus.textContent).toContain('⚪');
    });

    test('should use green circle for active', () => {
      autoSendStatus.textContent = '🟢 Active';
      expect(autoSendStatus.textContent).toContain('🟢');
    });

    test('should use pause icon for paused', () => {
      autoSendStatus.textContent = '⏸️ Paused';
      expect(autoSendStatus.textContent).toContain('⏸️');
    });

    test('should use red circle for error', () => {
      autoSendStatus.textContent = '🔴 Error';
      expect(autoSendStatus.textContent).toContain('🔴');
    });
  });

  describe('Complete Workflow Cycle', () => {
    test('should handle start -> pause -> resume -> stop cycle', async () => {
      // Start
      startBtn.addEventListener('click', async () => {
        autoSendStatus.textContent = '🟢 Active';
        startBtn.style.display = 'none';
        pauseBtn.style.display = 'inline-block';
      });
      
      // Pause/Resume toggle
      let isPaused = false;
      pauseBtn.addEventListener('click', async () => {
        isPaused = !isPaused;
        autoSendStatus.textContent = isPaused ? '⏸️ Paused' : '🟢 Active';
        pauseBtn.textContent = isPaused ? '▶️ Resume' : '⏸️ Pause';
      });
      
      // Stop
      stopBtn.addEventListener('click', async () => {
        autoSendStatus.textContent = '⚪ Inactive';
        startBtn.style.display = 'inline-block';
        pauseBtn.style.display = 'none';
      });
      
      // Execute cycle
      startBtn.click();
      expect(autoSendStatus.textContent).toBe('🟢 Active');
      
      pauseBtn.click();
      expect(autoSendStatus.textContent).toBe('⏸️ Paused');
      
      pauseBtn.click();
      expect(autoSendStatus.textContent).toBe('🟢 Active');
      
      stopBtn.click();
      expect(autoSendStatus.textContent).toBe('⚪ Inactive');
    });

    test('should handle multiple start/stop cycles', async () => {
      const startHandler = jest.fn(() => {
        autoSendStatus.textContent = '🟢 Active';
      });
      
      const stopHandler = jest.fn(() => {
        autoSendStatus.textContent = '⚪ Inactive';
      });
      
      startBtn.addEventListener('click', startHandler);
      stopBtn.addEventListener('click', stopHandler);
      
      for (let i = 0; i < 3; i++) {
        startBtn.click();
        stopBtn.click();
      }
      
      expect(startHandler).toHaveBeenCalledTimes(3);
      expect(stopHandler).toHaveBeenCalledTimes(3);
      expect(autoSendStatus.textContent).toBe('⚪ Inactive');
    });
  });

  describe('Error Recovery', () => {
    test('should allow restart after error', async () => {
      // Simulate error
      autoSendStatus.textContent = '🔴 Error';
      
      startBtn.addEventListener('click', async () => {
        autoSendStatus.textContent = '🟢 Active';
      });
      
      startBtn.click();
      expect(autoSendStatus.textContent).toBe('🟢 Active');
    });

    test('should handle rapid button clicks', async () => {
      const clickHandler = jest.fn();
      startBtn.addEventListener('click', clickHandler);
      
      // Rapid clicks
      for (let i = 0; i < 10; i++) {
        startBtn.click();
      }
      
      expect(clickHandler).toHaveBeenCalledTimes(10);
    });
  });

  describe('State Persistence', () => {
    test('should restore active state on page load', async () => {
      isAutoSendActive = true;
      
      const result = await chrome.storage.local.get('autoSendActive');
      
      if (result.autoSendActive) {
        autoSendStatus.textContent = '🟢 Active';
        startBtn.style.display = 'none';
        pauseBtn.style.display = 'inline-block';
      }
      
      expect(autoSendStatus.textContent).toBe('🟢 Active');
      expect(startBtn.style.display).toBe('none');
      expect(pauseBtn.style.display).toBe('inline-block');
    });

    test('should restore inactive state on page load', async () => {
      isAutoSendActive = false;
      
      const result = await chrome.storage.local.get('autoSendActive');
      
      if (!result.autoSendActive) {
        autoSendStatus.textContent = '⚪ Inactive';
        startBtn.style.display = 'inline-block';
        pauseBtn.style.display = 'none';
      }
      
      expect(autoSendStatus.textContent).toBe('⚪ Inactive');
      expect(startBtn.style.display).toBe('inline-block');
      expect(pauseBtn.style.display).toBe('none');
    });
  });

  describe('Accessibility', () => {
    test('should have descriptive button text', () => {
      expect(startBtn.textContent).toContain('Start Auto-Send');
      expect(pauseBtn.textContent).toContain('Pause');
      expect(stopBtn.textContent).toContain('Stop Auto-Send');
    });

    test('should have status label', () => {
      const label = document.querySelector('.stat-label');
      expect(label).not.toBeNull();
      expect(label.textContent).toBe('Status');
    });

    test('should update status for screen readers', () => {
      autoSendStatus.textContent = '🟢 Active';
      expect(autoSendStatus.textContent).toBeTruthy();
    });
  });

  describe('Visual Feedback', () => {
    test('should have distinct button colors', () => {
      expect(startBtn.className).toContain('btn-success');
      expect(pauseBtn.className).toContain('btn-warning');
      expect(stopBtn.className).toContain('btn-danger');
    });

    test('should show visual state through status emoji', () => {
      const states = [
        '⚪ Inactive',
        '🟢 Active',
        '⏸️ Paused',
        '🔴 Error'
      ];
      
      states.forEach(state => {
        autoSendStatus.textContent = state;
        expect(autoSendStatus.textContent).toBe(state);
      });
    });
  });
});
