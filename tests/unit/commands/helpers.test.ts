import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getCurrentVersion, printAvailableCommands, printCommandDetail } from '../../../src/commands/helpers.js';
import { COMMANDS, COMMANDS_INFO } from '../../../src/config/constants.js';

describe('commands/helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('printAvailableCommands', () => {
    it('should print header and correct number of commands', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      printAvailableCommands();

      expect(consoleLogSpy).toHaveBeenCalledWith('\nAvailable Jira commands:');

      const calls = consoleLogSpy.mock.calls;
      const commandCalls = calls.filter(call => call[0] && typeof call[0] === 'string' && call[0].match(/^\d+\./));
      expect(commandCalls).toHaveLength(COMMANDS.length);

      consoleLogSpy.mockRestore();
    });

    it('should print commands with correct format: "number. command-name: description"', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      printAvailableCommands();

      const calls = consoleLogSpy.mock.calls;
      const commandCalls = calls
        .filter(call => call[0] && typeof call[0] === 'string' && call[0].match(/^\d+\./))
        .map(call => call[0]);

      commandCalls.forEach((output, index) => {
        // Check format: "N. command-name: description"
        expect(output).toMatch(/^\d+\.\s[\w-]+:\s.+/);
        // Check numbering starts from 1 and is sequential
        expect(output).toMatch(new RegExp(`^${index + 1}\\.`));
        // Check command name is included
        expect(output).toContain(COMMANDS[index]);
        // Check description is included
        expect(output).toContain(COMMANDS_INFO[index]);
      });

      consoleLogSpy.mockRestore();
    });

    it('should include all command names in output', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      printAvailableCommands();

      const allOutput = consoleLogSpy.mock.calls.map(call => call[0]).join(' ');
      COMMANDS.forEach(command => {
        expect(allOutput).toContain(command);
      });

      consoleLogSpy.mockRestore();
    });
  });

  describe('printCommandDetail', () => {
    it('should print detailed information for a valid command', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      printCommandDetail('list-projects');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('list-projects'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('List all accessible projects'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Parameters:'));

      consoleLogSpy.mockRestore();
    });

    it('should print details for command with required parameters', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      printCommandDetail('get-project');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('get-project'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('projectIdOrKey (required)'));

      consoleLogSpy.mockRestore();
    });

    it('should print details for command with markdown support', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      printCommandDetail('create-issue');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('create-issue'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('fields (required)'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('markdown'));

      consoleLogSpy.mockRestore();
    });

    it('should handle all valid commands from constants', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      COMMANDS.forEach(command => {
        consoleLogSpy.mockClear();
        printCommandDetail(command);
        // Each valid command should appear in output (not show "Unknown command")
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(command));
        expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('Unknown command'));
      });

      consoleLogSpy.mockRestore();
    });

    it('should handle empty command string', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      printCommandDetail('');

      expect(consoleLogSpy).toHaveBeenCalledWith('Please provide a command name.');
      expect(consoleLogSpy).toHaveBeenCalledWith('\nAvailable Jira commands:');

      consoleLogSpy.mockRestore();
    });

    it('should handle null command', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // @ts-expect-error - Testing null input
      printCommandDetail(null);

      expect(consoleLogSpy).toHaveBeenCalledWith('Please provide a command name.');
      expect(consoleLogSpy).toHaveBeenCalledWith('\nAvailable Jira commands:');

      consoleLogSpy.mockRestore();
    });

    it('should handle undefined command', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // @ts-expect-error - Testing undefined input
      printCommandDetail(undefined);

      expect(consoleLogSpy).toHaveBeenCalledWith('Please provide a command name.');
      expect(consoleLogSpy).toHaveBeenCalledWith('\nAvailable Jira commands:');

      consoleLogSpy.mockRestore();
    });

    it('should handle whitespace-only command', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      printCommandDetail('   ');

      expect(consoleLogSpy).toHaveBeenCalledWith('Please provide a command name.');
      expect(consoleLogSpy).toHaveBeenCalledWith('\nAvailable Jira commands:');

      consoleLogSpy.mockRestore();
    });

    it('should show error for unknown command', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      printCommandDetail('invalid-command');

      expect(consoleLogSpy).toHaveBeenCalledWith('Unknown command: invalid-command');
      expect(consoleLogSpy).toHaveBeenCalledWith('\nAvailable Jira commands:');

      consoleLogSpy.mockRestore();
    });

    it('should show error for unknown command and then list available commands', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      printCommandDetail('nonexistent');

      expect(consoleLogSpy.mock.calls[0][0]).toContain('Unknown command:');
      expect(consoleLogSpy.mock.calls[1][0]).toContain('Available Jira commands:');

      consoleLogSpy.mockRestore();
    });

    it('should trim whitespace from command name', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      printCommandDetail('  list-projects  ');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('list-projects'));
      expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('Unknown command'));

      consoleLogSpy.mockRestore();
    });

    it('should handle commands with mixed case (case-sensitive)', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      printCommandDetail('LIST-PROJECTS');

      expect(consoleLogSpy).toHaveBeenCalledWith('Unknown command: LIST-PROJECTS');
      expect(consoleLogSpy).toHaveBeenCalledWith('\nAvailable Jira commands:');

      consoleLogSpy.mockRestore();
    });
  });

  describe('getCurrentVersion', () => {
    it('should return version as string', () => {
      const version = getCurrentVersion();
      expect(typeof version).toBe('string');
    });

    it('should return version in semver format', () => {
      const version = getCurrentVersion();
      expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });
});
