/**
 * Command Palette (Ctrl+K)
 * Quick access to all features via keyboard
 */

export class CommandPalette {
  constructor() {
    this.commands = [];
    this.recentCommands = [];
    this.maxRecent = 5;
    this.isOpen = false;
    this.selectedIndex = 0;
    this.filteredCommands = [];
    
    this.registerDefaultCommands();
    this.loadRecent();
  }

  /**
   * Register default commands
   */
  registerDefaultCommands() {
    this.commands = [
      // Auto-send controls
      {
        id: 'start',
        name: 'Start Auto-Send',
        description: 'Begin automatic message sending',
        icon: '▶️',
        keywords: ['start', 'begin', 'run', 'go'],
        category: 'Controls',
        action: () => document.getElementById('startAutoSend')?.click()
      },
      {
        id: 'stop',
        name: 'Stop Auto-Send',
        description: 'Stop automatic message sending',
        icon: '⏹️',
        keywords: ['stop', 'end', 'halt'],
        category: 'Controls',
        action: () => document.getElementById('stopAutoSend')?.click()
      },
      {
        id: 'pause',
        name: 'Pause/Resume Auto-Send',
        description: 'Toggle pause state',
        icon: '⏸️',
        keywords: ['pause', 'resume', 'toggle'],
        category: 'Controls',
        shortcut: 'Ctrl+P',
        action: () => document.getElementById('pauseAutoSend')?.click()
      },
      {
        id: 'send-once',
        name: 'Send Random Message Once',
        description: 'Send a single message immediately',
        icon: '📤',
        keywords: ['send', 'once', 'single', 'test'],
        category: 'Controls',
        action: () => document.getElementById('sendRandomOnce')?.click()
      },

      // Field management
      {
        id: 'mark-field',
        name: 'Mark Chat Input Field',
        description: 'Select the input field on the page',
        icon: '🎯',
        keywords: ['mark', 'select', 'field', 'input'],
        category: 'Setup',
        action: () => document.getElementById('markChatInput')?.click()
      },

      // Settings
      {
        id: 'open-settings',
        name: 'Open Advanced Settings',
        description: 'Configure advanced options',
        icon: '⚙️',
        keywords: ['settings', 'options', 'configure', 'advanced'],
        category: 'Settings',
        action: () => document.getElementById('openSettings')?.click()
      },
      {
        id: 'toggle-theme',
        name: 'Toggle Dark/Light Mode',
        description: 'Switch between dark and light themes',
        icon: '🌙',
        keywords: ['theme', 'dark', 'light', 'mode'],
        category: 'Settings',
        action: () => document.getElementById('themeToggle')?.click()
      },
      {
        id: 'import-settings',
        name: 'Import Settings',
        description: 'Import configuration from JSON file',
        icon: '📥',
        keywords: ['import', 'load', 'restore'],
        category: 'Settings',
        action: () => document.getElementById('importSettings')?.click()
      },
      {
        id: 'export-settings',
        name: 'Export Settings',
        description: 'Export configuration as JSON file',
        icon: '📤',
        keywords: ['export', 'save', 'backup'],
        category: 'Settings',
        action: () => document.getElementById('exportSettings')?.click()
      },

      // Analytics
      {
        id: 'open-analytics',
        name: 'Open Analytics',
        description: 'View statistics and analytics',
        icon: '📊',
        keywords: ['analytics', 'stats', 'statistics', 'data'],
        category: 'Analytics',
        action: () => document.getElementById('openAnalytics')?.click()
      },
      {
        id: 'export-analytics',
        name: 'Export Analytics',
        description: 'Download analytics data as JSON',
        icon: '💾',
        keywords: ['export', 'download', 'analytics', 'data'],
        category: 'Analytics',
        action: () => document.getElementById('exportAnalytics')?.click()
      },
      {
        id: 'reset-stats',
        name: 'Reset Statistics',
        description: 'Clear all statistics data',
        icon: '🔄',
        keywords: ['reset', 'clear', 'stats'],
        category: 'Analytics',
        action: () => document.getElementById('resetStats')?.click()
      },

      // Phrases
      {
        id: 'manage-phrases',
        name: 'Manage Phrases',
        description: 'Open phrase management modal',
        icon: '📝',
        keywords: ['phrases', 'messages', 'manage'],
        category: 'Phrases',
        action: () => document.getElementById('managePhrases')?.click()
      },
      {
        id: 'load-default-phrases',
        name: 'Load Default Phrases',
        description: 'Load built-in phrase library',
        icon: '📚',
        keywords: ['load', 'default', 'library'],
        category: 'Phrases',
        action: () => document.getElementById('loadDefaultPhrases')?.click()
      },

      // Mode switches
      {
        id: 'mode-random',
        name: 'Switch to Random Mode',
        description: 'Send messages in random order',
        icon: '🎲',
        keywords: ['random', 'shuffle', 'mode'],
        category: 'Mode',
        action: () => {
          const select = document.getElementById('sendMode');
          if (select) {
            select.value = 'random';
            select.dispatchEvent(new Event('change'));
          }
        }
      },
      {
        id: 'mode-sequential',
        name: 'Switch to Sequential Mode',
        description: 'Send messages in order',
        icon: '📋',
        keywords: ['sequential', 'order', 'mode'],
        category: 'Mode',
        action: () => {
          const select = document.getElementById('sendMode');
          if (select) {
            select.value = 'sequential';
            select.dispatchEvent(new Event('change'));
          }
        }
      },

      // Preview
      {
        id: 'preview-mode',
        name: 'Toggle Preview Mode',
        description: 'Test without actually sending',
        icon: '👁️',
        keywords: ['preview', 'test', 'dry-run'],
        category: 'Preview',
        action: () => this.togglePreviewMode()
      },

      // Help
      {
        id: 'show-shortcuts',
        name: 'Show Keyboard Shortcuts',
        description: 'Display all keyboard shortcuts',
        icon: '⌨️',
        keywords: ['shortcuts', 'keys', 'keyboard', 'help'],
        category: 'Help',
        action: () => this.showShortcuts()
      },
      {
        id: 'show-help',
        name: 'Show Help',
        description: 'Open help documentation',
        icon: '❓',
        keywords: ['help', 'docs', 'documentation'],
        category: 'Help',
        action: () => this.showHelp()
      }
    ];
  }

  /**
   * Register a custom command
   * @param {object} command - Command object
   */
  register(command) {
    this.commands.push({
      id: command.id || `custom-${Date.now()}`,
      name: command.name,
      description: command.description || '',
      icon: command.icon || '⚡',
      keywords: command.keywords || [],
      category: command.category || 'Custom',
      shortcut: command.shortcut,
      action: command.action
    });
  }

  /**
   * Search commands
   * @param {string} query - Search query
   * @returns {Array<object>} Matching commands
   */
  search(query) {
    if (!query || query.trim() === '') {
      // Show recent commands first, then all commands
      const recent = this.commands.filter(cmd => 
        this.recentCommands.includes(cmd.id)
      );
      const others = this.commands.filter(cmd => 
        !this.recentCommands.includes(cmd.id)
      );
      return [...recent, ...others];
    }

    const lowerQuery = query.toLowerCase();
    const scored = this.commands.map(cmd => {
      let score = 0;

      // Exact name match
      if (cmd.name.toLowerCase() === lowerQuery) score += 100;
      
      // Name starts with query
      if (cmd.name.toLowerCase().startsWith(lowerQuery)) score += 50;
      
      // Name contains query
      if (cmd.name.toLowerCase().includes(lowerQuery)) score += 25;
      
      // Description contains query
      if (cmd.description.toLowerCase().includes(lowerQuery)) score += 10;
      
      // Keywords match
      cmd.keywords.forEach(keyword => {
        if (keyword.toLowerCase().includes(lowerQuery)) score += 15;
      });

      // Recent command bonus
      if (this.recentCommands.includes(cmd.id)) score += 5;

      return { ...cmd, score };
    });

    return scored
      .filter(cmd => cmd.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Execute a command
   * @param {string} commandId - Command ID
   */
  execute(commandId) {
    const command = this.commands.find(cmd => cmd.id === commandId);
    if (command && command.action) {
      command.action();
      this.addToRecent(commandId);
      this.close();
    }
  }

  /**
   * Add command to recent
   * @param {string} commandId - Command ID
   */
  addToRecent(commandId) {
    // Remove if already in recent
    this.recentCommands = this.recentCommands.filter(id => id !== commandId);
    
    // Add to beginning
    this.recentCommands.unshift(commandId);
    
    // Keep only maxRecent
    if (this.recentCommands.length > this.maxRecent) {
      this.recentCommands.pop();
    }

    this.saveRecent();
  }

  /**
   * Save recent commands to storage
   */
  async saveRecent() {
    await chrome.storage.local.set({ recentCommands: this.recentCommands });
  }

  /**
   * Load recent commands from storage
   */
  async loadRecent() {
    const data = await chrome.storage.local.get(['recentCommands']);
    this.recentCommands = data.recentCommands || [];
  }

  /**
   * Open the command palette
   */
  open() {
    this.isOpen = true;
    this.selectedIndex = 0;
    this.filteredCommands = this.search('');
  }

  /**
   * Close the command palette
   */
  close() {
    this.isOpen = false;
    this.selectedIndex = 0;
    this.filteredCommands = [];
  }

  /**
   * Toggle the command palette
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Navigate selection
   * @param {string} direction - 'up' or 'down'
   */
  navigate(direction) {
    if (direction === 'up') {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
    } else if (direction === 'down') {
      this.selectedIndex = Math.min(
        this.filteredCommands.length - 1,
        this.selectedIndex + 1
      );
    }
  }

  /**
   * Execute selected command
   */
  executeSelected() {
    const command = this.filteredCommands[this.selectedIndex];
    if (command) {
      this.execute(command.id);
    }
  }

  /**
   * Get commands by category
   * @returns {object} Commands grouped by category
   */
  getByCategory() {
    const grouped = {};
    this.commands.forEach(cmd => {
      if (!grouped[cmd.category]) {
        grouped[cmd.category] = [];
      }
      grouped[cmd.category].push(cmd);
    });
    return grouped;
  }

  /**
   * Toggle preview mode (custom action)
   */
  togglePreviewMode() {
    const checkbox = document.getElementById('previewMode');
    if (checkbox) {
      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event('change'));
    }
  }

  /**
   * Show keyboard shortcuts
   */
  showShortcuts() {
    const shortcuts = this.commands
      .filter(cmd => cmd.shortcut)
      .map(cmd => `${cmd.icon} ${cmd.name}: ${cmd.shortcut}`)
      .join('\n');

    alert(`Keyboard Shortcuts:\n\n${shortcuts}\n\nCtrl+K: Open Command Palette\nEsc: Close modals`);
  }

  /**
   * Show help
   */
  showHelp() {
    alert('AutoChat Enhanced Help\n\nUse Ctrl+K to open the command palette and quickly access any feature.\n\nFor full documentation, visit the GitHub repository.');
  }
}

// Singleton instance
export const commandPalette = new CommandPalette();
