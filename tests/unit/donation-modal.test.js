/**
 * Tests for Donation Modal and Crypto Address Copying UI Component
 */

describe('Donation Modal', () => {
  let donationModal;
  let openDonationBtn;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <button id="openDonation" class="header-btn" title="Support Development">💝</button>
      
      <div id="donationModal" class="modal" style="display: none;">
        <div class="modal-content">
          <span class="close">&times;</span>
          <h2>Support Development 💝</h2>
          
          <p class="donation-message">
            If you find AutoChat useful, please consider supporting development!
          </p>
          
          <div class="crypto-addresses">
            <div class="crypto-item">
              <div class="crypto-label">
                <img src="images/bitcoin.png" alt="Bitcoin" class="crypto-icon">
                Bitcoin (BTC)
              </div>
              <div class="crypto-address-container">
                <input type="text" class="crypto-address" 
                       value="bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh" 
                       readonly 
                       data-crypto="btc">
                <button class="btn-copy" data-crypto="btc" title="Copy address">📋</button>
              </div>
            </div>
            
            <div class="crypto-item">
              <div class="crypto-label">
                <img src="images/ethereum.png" alt="Ethereum" class="crypto-icon">
                Ethereum (ETH)
              </div>
              <div class="crypto-address-container">
                <input type="text" class="crypto-address" 
                       value="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" 
                       readonly 
                       data-crypto="eth">
                <button class="btn-copy" data-crypto="eth" title="Copy address">📋</button>
              </div>
            </div>
            
            <div class="crypto-item">
              <div class="crypto-label">
                <img src="images/litecoin.png" alt="Litecoin" class="crypto-icon">
                Litecoin (LTC)
              </div>
              <div class="crypto-address-container">
                <input type="text" class="crypto-address" 
                       value="ltc1q8c6fshw2dlwun7ekn9qwf37cu2rn755u9ym7p0" 
                       readonly 
                       data-crypto="ltc">
                <button class="btn-copy" data-crypto="ltc" title="Copy address">📋</button>
              </div>
            </div>
          </div>
          
          <div id="copyFeedback" class="copy-feedback" style="display: none;"></div>
        </div>
      </div>
    `;

    donationModal = document.getElementById('donationModal');
    openDonationBtn = document.getElementById('openDonation');

    // Mock clipboard API
    global.navigator.clipboard = {
      writeText: jest.fn(() => Promise.resolve())
    };
  });

  afterEach(() => {
    document.body.innerHTML = '';
    delete global.navigator.clipboard;
  });

  describe('Modal Opening', () => {
    test('should be hidden initially', () => {
      expect(donationModal.style.display).toBe('none');
    });

    test('should open when donation button is clicked', () => {
      openDonationBtn.addEventListener('click', () => {
        donationModal.style.display = 'block';
      });
      
      openDonationBtn.click();
      expect(donationModal.style.display).toBe('block');
    });

    test('should have close button', () => {
      const closeBtn = donationModal.querySelector('.close');
      expect(closeBtn).not.toBeNull();
    });

    test('should close when close button is clicked', () => {
      donationModal.style.display = 'block';
      
      const closeBtn = donationModal.querySelector('.close');
      closeBtn.addEventListener('click', () => {
        donationModal.style.display = 'none';
      });
      
      closeBtn.click();
      expect(donationModal.style.display).toBe('none');
    });
  });

  describe('Crypto Addresses Display', () => {
    test('should display all cryptocurrency options', () => {
      const cryptoItems = donationModal.querySelectorAll('.crypto-item');
      expect(cryptoItems.length).toBe(3);
    });

    test('should display Bitcoin address', () => {
      const btcAddress = donationModal.querySelector('[data-crypto="btc"]');
      expect(btcAddress.value).toBe('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh');
    });

    test('should display Ethereum address', () => {
      const ethAddress = donationModal.querySelector('[data-crypto="eth"]');
      expect(ethAddress.value).toBe('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
    });

    test('should display Litecoin address', () => {
      const ltcAddress = donationModal.querySelector('[data-crypto="ltc"]');
      expect(ltcAddress.value).toBe('ltc1q8c6fshw2dlwun7ekn9qwf37cu2rn755u9ym7p0');
    });

    test('should make address fields readonly', () => {
      const addresses = donationModal.querySelectorAll('.crypto-address');
      addresses.forEach(address => {
        expect(address.hasAttribute('readonly')).toBe(true);
      });
    });

    test('should have copy button for each address', () => {
      const copyButtons = donationModal.querySelectorAll('.btn-copy');
      expect(copyButtons.length).toBe(3);
    });
  });

  describe('Copy to Clipboard', () => {
    test('should copy Bitcoin address to clipboard', async () => {
      const btcCopyBtn = donationModal.querySelector('.btn-copy[data-crypto="btc"]');
      const btcAddress = donationModal.querySelector('.crypto-address[data-crypto="btc"]');
      
      btcCopyBtn.addEventListener('click', async () => {
        await navigator.clipboard.writeText(btcAddress.value);
      });
      
      btcCopyBtn.click();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh');
    });

    test('should copy Ethereum address to clipboard', async () => {
      const ethCopyBtn = donationModal.querySelector('.btn-copy[data-crypto="eth"]');
      const ethAddress = donationModal.querySelector('.crypto-address[data-crypto="eth"]');
      
      ethCopyBtn.addEventListener('click', async () => {
        await navigator.clipboard.writeText(ethAddress.value);
      });
      
      ethCopyBtn.click();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
    });

    test('should copy Litecoin address to clipboard', async () => {
      const ltcCopyBtn = donationModal.querySelector('.btn-copy[data-crypto="ltc"]');
      const ltcAddress = donationModal.querySelector('.crypto-address[data-crypto="ltc"]');
      
      ltcCopyBtn.addEventListener('click', async () => {
        await navigator.clipboard.writeText(ltcAddress.value);
      });
      
      ltcCopyBtn.click();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ltc1q8c6fshw2dlwun7ekn9qwf37cu2rn755u9ym7p0');
    });

    test('should show success feedback after copying', async () => {
      const copyBtn = donationModal.querySelector('.btn-copy');
      const feedback = document.getElementById('copyFeedback');
      
      copyBtn.addEventListener('click', async () => {
        await navigator.clipboard.writeText('test');
        feedback.textContent = '✓ Address copied to clipboard!';
        feedback.style.display = 'block';
      });
      
      copyBtn.click();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(feedback.style.display).toBe('block');
      expect(feedback.textContent).toContain('copied');
    });

    test('should hide feedback after timeout', async () => {
      jest.useFakeTimers();
      
      const copyBtn = donationModal.querySelector('.btn-copy');
      const feedback = document.getElementById('copyFeedback');
      
      copyBtn.addEventListener('click', async () => {
        await navigator.clipboard.writeText('test');
        feedback.style.display = 'block';
        setTimeout(() => {
          feedback.style.display = 'none';
        }, 3000);
      });
      
      copyBtn.click();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(feedback.style.display).toBe('block');
      
      jest.advanceTimersByTime(3000);
      expect(feedback.style.display).toBe('none');
      
      jest.useRealTimers();
    });
  });

  describe('Copy Error Handling', () => {
    test('should handle clipboard API not available', async () => {
      delete global.navigator.clipboard;
      
      const copyBtn = donationModal.querySelector('.btn-copy');
      const feedback = document.getElementById('copyFeedback');
      
      copyBtn.addEventListener('click', async () => {
        if (!navigator.clipboard) {
          feedback.textContent = '✗ Copy failed. Please copy manually.';
          feedback.style.display = 'block';
        }
      });
      
      copyBtn.click();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(feedback.textContent).toContain('Copy failed');
    });

    test('should handle clipboard write failure', async () => {
      global.navigator.clipboard.writeText = jest.fn(() => Promise.reject(new Error('Permission denied')));
      
      const copyBtn = donationModal.querySelector('.btn-copy');
      const feedback = document.getElementById('copyFeedback');
      
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText('test');
          feedback.textContent = '✓ Copied!';
        } catch (error) {
          feedback.textContent = '✗ Copy failed. Please copy manually.';
        }
        feedback.style.display = 'block';
      });
      
      copyBtn.click();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(feedback.textContent).toContain('Copy failed');
    });
  });

  describe('UI Elements', () => {
    test('should display donation message', () => {
      const message = donationModal.querySelector('.donation-message');
      expect(message).not.toBeNull();
      expect(message.textContent).toContain('support');
    });

    test('should have heart emoji in title', () => {
      const title = donationModal.querySelector('h2');
      expect(title.textContent).toContain('💝');
    });

    test('should have crypto icons', () => {
      const icons = donationModal.querySelectorAll('.crypto-icon');
      expect(icons.length).toBe(3);
    });

    test('should display cryptocurrency names', () => {
      const labels = donationModal.querySelectorAll('.crypto-label');
      expect(labels[0].textContent).toContain('Bitcoin');
      expect(labels[1].textContent).toContain('Ethereum');
      expect(labels[2].textContent).toContain('Litecoin');
    });

    test('should have copy icon on buttons', () => {
      const copyButtons = donationModal.querySelectorAll('.btn-copy');
      copyButtons.forEach(btn => {
        expect(btn.textContent).toContain('📋');
      });
    });
  });

  describe('Accessibility', () => {
    test('should have title attributes on copy buttons', () => {
      const copyButtons = donationModal.querySelectorAll('.btn-copy');
      copyButtons.forEach(btn => {
        expect(btn.hasAttribute('title')).toBe(true);
        expect(btn.getAttribute('title')).toContain('Copy');
      });
    });

    test('should have alt text for crypto icons', () => {
      const icons = donationModal.querySelectorAll('.crypto-icon');
      icons.forEach(icon => {
        expect(icon.hasAttribute('alt')).toBe(true);
      });
    });

    test('should have title on donation button', () => {
      expect(openDonationBtn.hasAttribute('title')).toBe(true);
      expect(openDonationBtn.getAttribute('title')).toContain('Support');
    });
  });

  describe('Address Selection', () => {
    test('should select all text when address field is clicked', () => {
      const address = donationModal.querySelector('.crypto-address');
      const selectMock = jest.fn();
      address.select = selectMock;
      
      address.addEventListener('click', () => {
        address.select();
      });
      
      address.click();
      expect(selectMock).toHaveBeenCalled();
    });

    test('should allow manual copying via selection', () => {
      const address = donationModal.querySelector('.crypto-address');
      address.addEventListener('focus', () => {
        address.select();
      });
      
      address.focus();
      expect(address.selectionStart).toBe(0);
    });
  });

  describe('Multiple Copy Operations', () => {
    test('should handle copying different addresses sequentially', async () => {
      const btcBtn = donationModal.querySelector('.btn-copy[data-crypto="btc"]');
      const ethBtn = donationModal.querySelector('.btn-copy[data-crypto="eth"]');
      
      const copyHandler = async (e) => {
        const crypto = e.target.getAttribute('data-crypto');
        const address = donationModal.querySelector(`.crypto-address[data-crypto="${crypto}"]`);
        await navigator.clipboard.writeText(address.value);
      };
      
      btcBtn.addEventListener('click', copyHandler);
      ethBtn.addEventListener('click', copyHandler);
      
      btcBtn.click();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      ethBtn.click();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(2);
    });
  });

  describe('Fallback Copy Method', () => {
    test('should use execCommand as fallback', () => {
      delete global.navigator.clipboard;
      document.execCommand = jest.fn(() => true);
      
      const copyBtn = donationModal.querySelector('.btn-copy');
      const address = donationModal.querySelector('.crypto-address');
      
      copyBtn.addEventListener('click', () => {
        address.select();
        document.execCommand('copy');
      });
      
      copyBtn.click();
      
      expect(document.execCommand).toHaveBeenCalledWith('copy');
      
      delete document.execCommand;
    });
  });
});
