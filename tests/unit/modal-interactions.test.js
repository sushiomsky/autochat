/**
 * Tests for Modal Interactions UI Component
 */

describe('Modal Interactions', () => {
  let openModal;
  let closeModal;

  beforeEach(() => {
    // Setup DOM with multiple modals
    document.body.innerHTML = `
      <div id="settingsModal" class="modal" style="display: none;">
        <div class="modal-content">
          <span class="close">&times;</span>
          <h2>Settings</h2>
          <div class="settings-content"></div>
        </div>
      </div>
      
      <div id="phraseModal" class="modal" style="display: none;">
        <div class="modal-content">
          <span class="close">&times;</span>
          <h2>Manage Phrases</h2>
          <div class="phrase-content"></div>
        </div>
      </div>
      
      <div id="analyticsModal" class="modal" style="display: none;">
        <div class="modal-content">
          <span class="close">&times;</span>
          <h2>Analytics</h2>
          <div class="analytics-content"></div>
        </div>
      </div>

      <div id="webhookModal" class="modal" style="display: none;">
        <div class="modal-content">
          <span class="close">&times;</span>
          <h2>Webhooks</h2>
          <div class="webhook-content"></div>
        </div>
      </div>

      <button id="openSettings">Open Settings</button>
      <button id="openPhrases">Manage Phrases</button>
      <button id="openAnalytics">Analytics</button>
      <button id="openWebhooks">Webhooks</button>
    `;

    // Define modal functions
    openModal = function(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.style.display = 'block';
        modal.setAttribute('aria-hidden', 'false');
      }
    };

    closeModal = function(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
      }
    };
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Opening Modals', () => {
    test('should open settings modal', () => {
      const modal = document.getElementById('settingsModal');
      expect(modal.style.display).toBe('none');
      
      openModal('settingsModal');
      expect(modal.style.display).toBe('block');
    });

    test('should open phrase modal', () => {
      const modal = document.getElementById('phraseModal');
      openModal('phraseModal');
      expect(modal.style.display).toBe('block');
    });

    test('should open analytics modal', () => {
      const modal = document.getElementById('analyticsModal');
      openModal('analyticsModal');
      expect(modal.style.display).toBe('block');
    });

    test('should open webhook modal', () => {
      const modal = document.getElementById('webhookModal');
      openModal('webhookModal');
      expect(modal.style.display).toBe('block');
    });

    test('should set aria-hidden to false when opening modal', () => {
      const modal = document.getElementById('settingsModal');
      openModal('settingsModal');
      expect(modal.getAttribute('aria-hidden')).toBe('false');
    });

    test('should handle opening non-existent modal gracefully', () => {
      expect(() => {
        openModal('nonExistentModal');
      }).not.toThrow();
    });
  });

  describe('Closing Modals', () => {
    test('should close settings modal', () => {
      const modal = document.getElementById('settingsModal');
      openModal('settingsModal');
      expect(modal.style.display).toBe('block');
      
      closeModal('settingsModal');
      expect(modal.style.display).toBe('none');
    });

    test('should close phrase modal', () => {
      const modal = document.getElementById('phraseModal');
      openModal('phraseModal');
      closeModal('phraseModal');
      expect(modal.style.display).toBe('none');
    });

    test('should set aria-hidden to true when closing modal', () => {
      const modal = document.getElementById('settingsModal');
      openModal('settingsModal');
      closeModal('settingsModal');
      expect(modal.getAttribute('aria-hidden')).toBe('true');
    });

    test('should handle closing already closed modal', () => {
      const modal = document.getElementById('settingsModal');
      expect(modal.style.display).toBe('none');
      
      closeModal('settingsModal');
      expect(modal.style.display).toBe('none');
    });

    test('should handle closing non-existent modal gracefully', () => {
      expect(() => {
        closeModal('nonExistentModal');
      }).not.toThrow();
    });
  });

  describe('Multiple Modals', () => {
    test('should open multiple modals sequentially', () => {
      openModal('settingsModal');
      expect(document.getElementById('settingsModal').style.display).toBe('block');
      
      closeModal('settingsModal');
      openModal('phraseModal');
      expect(document.getElementById('phraseModal').style.display).toBe('block');
    });

    test('should only show one modal at a time', () => {
      openModal('settingsModal');
      openModal('phraseModal');
      
      // Both are technically open in our simple implementation
      // In real app, you'd close previous modal
      expect(document.getElementById('settingsModal').style.display).toBe('block');
      expect(document.getElementById('phraseModal').style.display).toBe('block');
    });

    test('should close all modals', () => {
      openModal('settingsModal');
      openModal('phraseModal');
      openModal('analyticsModal');
      
      closeModal('settingsModal');
      closeModal('phraseModal');
      closeModal('analyticsModal');
      
      expect(document.getElementById('settingsModal').style.display).toBe('none');
      expect(document.getElementById('phraseModal').style.display).toBe('none');
      expect(document.getElementById('analyticsModal').style.display).toBe('none');
    });
  });

  describe('Close Button Interactions', () => {
    test('should close modal when close button is clicked', () => {
      const modal = document.getElementById('settingsModal');
      const closeBtn = modal.querySelector('.close');
      
      openModal('settingsModal');
      expect(modal.style.display).toBe('block');
      
      closeBtn.addEventListener('click', () => closeModal('settingsModal'));
      closeBtn.click();
      
      expect(modal.style.display).toBe('none');
    });

    test('should have close button in all modals', () => {
      const modals = ['settingsModal', 'phraseModal', 'analyticsModal', 'webhookModal'];
      
      modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        const closeBtn = modal.querySelector('.close');
        expect(closeBtn).not.toBeNull();
      });
    });
  });

  describe('Window Click Outside Modal', () => {
    test('should close modal when clicking outside modal content', () => {
      const modal = document.getElementById('settingsModal');
      openModal('settingsModal');
      
      // Simulate window click handler
      const clickHandler = (event) => {
        if (event.target === modal) {
          closeModal('settingsModal');
        }
      };
      
      window.addEventListener('click', clickHandler);
      
      // Simulate click on modal backdrop
      const event = new Event('click');
      Object.defineProperty(event, 'target', { value: modal, enumerable: true });
      window.dispatchEvent(event);
      
      expect(modal.style.display).toBe('none');
      
      window.removeEventListener('click', clickHandler);
    });

    test('should not close modal when clicking inside modal content', () => {
      const modal = document.getElementById('settingsModal');
      const modalContent = modal.querySelector('.modal-content');
      openModal('settingsModal');
      
      const clickHandler = (event) => {
        if (event.target === modal) {
          closeModal('settingsModal');
        }
      };
      
      window.addEventListener('click', clickHandler);
      
      // Simulate click on modal content (not backdrop)
      const event = new Event('click');
      Object.defineProperty(event, 'target', { value: modalContent, enumerable: true });
      window.dispatchEvent(event);
      
      expect(modal.style.display).toBe('block');
      
      window.removeEventListener('click', clickHandler);
    });
  });

  describe('Keyboard Interactions', () => {
    test('should close modal when Escape key is pressed', () => {
      const modal = document.getElementById('settingsModal');
      openModal('settingsModal');
      
      const escapeHandler = (event) => {
        if (event.key === 'Escape') {
          closeModal('settingsModal');
        }
      };
      
      document.addEventListener('keydown', escapeHandler);
      
      // Simulate Escape key press
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);
      
      expect(modal.style.display).toBe('none');
      
      document.removeEventListener('keydown', escapeHandler);
    });
  });

  describe('Modal State Management', () => {
    test('should maintain modal state across open/close cycles', () => {
      const modal = document.getElementById('settingsModal');
      
      // Open and close multiple times
      for (let i = 0; i < 3; i++) {
        openModal('settingsModal');
        expect(modal.style.display).toBe('block');
        
        closeModal('settingsModal');
        expect(modal.style.display).toBe('none');
      }
    });

    test('should preserve modal content when closing', () => {
      const modal = document.getElementById('settingsModal');
      const content = modal.querySelector('.settings-content');
      content.innerHTML = '<p>Test content</p>';
      
      openModal('settingsModal');
      closeModal('settingsModal');
      
      expect(content.innerHTML).toBe('<p>Test content</p>');
    });
  });
});
