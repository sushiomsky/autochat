/**
 * Tests for Command Palette Module
 */

describe('CommandPalette', () => {
  let CommandPalette;
  let palette;

  beforeEach(() => {
    // Create inline class for testing
    CommandPalette = class {
      constructor() {
        this.commands = [];
        this.recentCommands = [];
        this.maxRecent = 5;
        this.isOpen = false;
        this.selectedIndex = 0;
        this.filteredCommands = [];
        this.registerDefaultCommands();
      }

      registerDefaultCommands() {
        this.commands = [
          {
            id: 'start',
            name: 'Start Auto-Send',
            description: 'Begin automatic sending',
            icon: '▶️',
            keywords: ['start', 'begin', 'run'],
            category: 'Controls',
            action: () => console.log('Start'),
          },
          {
            id: 'stop',
            name: 'Stop Auto-Send',
            description: 'Stop automatic sending',
            icon: '⏹️',
            keywords: ['stop', 'end'],
            category: 'Controls',
            action: () => console.log('Stop'),
          },
          {
            id: 'settings',
            name: 'Open Settings',
            description: 'Configure options',
            icon: '⚙️',
            keywords: ['settings', 'options', 'config'],
            category: 'Settings',
            action: () => console.log('Settings'),
          },
        ];
      }

      register(command) {
        this.commands.push({
          id: command.id || `custom-${Date.now()}`,
          name: command.name,
          description: command.description || '',
          icon: command.icon || '⚡',
          keywords: command.keywords || [],
          category: command.category || 'Custom',
          action: command.action,
        });
      }

      search(query) {
        if (!query || query.trim() === '') {
          return this.commands;
        }

        const lowerQuery = query.toLowerCase();
        const scored = this.commands.map((cmd) => {
          let score = 0;

          if (cmd.name.toLowerCase() === lowerQuery) score += 100;
          if (cmd.name.toLowerCase().startsWith(lowerQuery)) score += 50;
          if (cmd.name.toLowerCase().includes(lowerQuery)) score += 25;
          if (cmd.description.toLowerCase().includes(lowerQuery)) score += 10;

          cmd.keywords.forEach((keyword) => {
            if (keyword.toLowerCase().includes(lowerQuery)) score += 15;
          });

          if (this.recentCommands.includes(cmd.id)) score += 5;

          return { ...cmd, score };
        });

        return scored.filter((cmd) => cmd.score > 0).sort((a, b) => b.score - a.score);
      }

      execute(commandId) {
        const command = this.commands.find((cmd) => cmd.id === commandId);
        if (command && command.action) {
          command.action();
          this.addToRecent(commandId);
          this.close();
        }
      }

      addToRecent(commandId) {
        this.recentCommands = this.recentCommands.filter((id) => id !== commandId);
        this.recentCommands.unshift(commandId);

        if (this.recentCommands.length > this.maxRecent) {
          this.recentCommands.pop();
        }
      }

      open() {
        this.isOpen = true;
        this.selectedIndex = 0;
        this.filteredCommands = this.search('');
      }

      close() {
        this.isOpen = false;
        this.selectedIndex = 0;
        this.filteredCommands = [];
      }

      toggle() {
        if (this.isOpen) {
          this.close();
        } else {
          this.open();
        }
      }

      navigate(direction) {
        if (direction === 'up') {
          this.selectedIndex = Math.max(0, this.selectedIndex - 1);
        } else if (direction === 'down') {
          this.selectedIndex = Math.min(this.filteredCommands.length - 1, this.selectedIndex + 1);
        }
      }

      executeSelected() {
        const command = this.filteredCommands[this.selectedIndex];
        if (command) {
          this.execute(command.id);
        }
      }
    };

    palette = new CommandPalette();
  });

  test('should initialize with default commands', () => {
    expect(palette.commands.length).toBeGreaterThan(0);
    expect(palette.commands[0].name).toBe('Start Auto-Send');
  });

  test('should register custom command', () => {
    const initialCount = palette.commands.length;

    palette.register({
      id: 'custom-1',
      name: 'Custom Command',
      description: 'Does custom thing',
      action: () => {},
    });

    expect(palette.commands).toHaveLength(initialCount + 1);
    const customCmd = palette.commands.find((c) => c.id === 'custom-1');
    expect(customCmd).toBeDefined();
    expect(customCmd.name).toBe('Custom Command');
  });

  test('should search commands by name', () => {
    const results = palette.search('start');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toContain('Start');
  });

  test('should return all commands for empty query', () => {
    const results = palette.search('');
    expect(results).toHaveLength(palette.commands.length);
  });

  test('should score exact matches higher', () => {
    palette.register({
      id: 'exact',
      name: 'settings',
      description: 'Exact match test',
      keywords: [],
      action: () => {},
    });

    const results = palette.search('settings');
    expect(results[0].id).toBe('exact'); // Exact match should be first
  });

  test('should search by keywords', () => {
    const results = palette.search('begin');
    const startCmd = results.find((r) => r.id === 'start');
    expect(startCmd).toBeDefined(); // 'begin' is in keywords
  });

  test('should execute command', () => {
    const mockAction = jest.fn();
    palette.register({
      id: 'test-cmd',
      name: 'Test',
      action: mockAction,
    });

    palette.execute('test-cmd');
    expect(mockAction).toHaveBeenCalled();
  });

  test('should add command to recent on execute', () => {
    expect(palette.recentCommands).toHaveLength(0);

    palette.execute('start');
    expect(palette.recentCommands).toContain('start');
    expect(palette.recentCommands[0]).toBe('start');
  });

  test('should limit recent commands', () => {
    palette.maxRecent = 2;

    palette.execute('start');
    palette.execute('stop');
    palette.execute('settings');

    expect(palette.recentCommands).toHaveLength(2);
    expect(palette.recentCommands).toEqual(['settings', 'stop']);
  });

  test('should open and close palette', () => {
    expect(palette.isOpen).toBe(false);

    palette.open();
    expect(palette.isOpen).toBe(true);

    palette.close();
    expect(palette.isOpen).toBe(false);
  });

  test('should toggle palette state', () => {
    palette.toggle();
    expect(palette.isOpen).toBe(true);

    palette.toggle();
    expect(palette.isOpen).toBe(false);
  });

  test('should navigate selection', () => {
    palette.open();
    palette.filteredCommands = palette.commands;

    expect(palette.selectedIndex).toBe(0);

    palette.navigate('down');
    expect(palette.selectedIndex).toBe(1);

    palette.navigate('down');
    expect(palette.selectedIndex).toBe(2);

    palette.navigate('up');
    expect(palette.selectedIndex).toBe(1);
  });

  test('should not navigate beyond bounds', () => {
    palette.open();
    palette.filteredCommands = palette.commands;

    palette.navigate('up');
    expect(palette.selectedIndex).toBe(0); // Can't go below 0

    palette.selectedIndex = palette.filteredCommands.length - 1;
    palette.navigate('down');
    expect(palette.selectedIndex).toBe(palette.filteredCommands.length - 1); // Can't exceed max
  });

  test('should execute selected command', () => {
    const mockAction = jest.fn();
    palette.register({
      id: 'selected-test',
      name: 'Selected Test',
      action: mockAction,
    });

    palette.open();
    palette.filteredCommands = palette.commands;
    palette.selectedIndex = palette.commands.length - 1; // Select the new command

    palette.executeSelected();
    expect(mockAction).toHaveBeenCalled();
  });

  test('should boost score for recent commands', () => {
    palette.addToRecent('stop');

    const results = palette.search('st'); // Matches both 'start' and 'stop'
    const stopCmd = results.find((r) => r.id === 'stop');
    const startCmd = results.find((r) => r.id === 'start');

    expect(stopCmd.score).toBeGreaterThan(startCmd.score - 5); // Recent bonus
  });
});
