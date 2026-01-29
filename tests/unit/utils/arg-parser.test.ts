import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { parseArguments } from '../../../src/utils/arg-parser.js';

// Mock the imported modules
vi.mock('../../../src/commands/index.js', () => ({
  getCurrentVersion: vi.fn().mockReturnValue('1.4.0'),
  printAvailableCommands: vi.fn(),
  printCommandDetail: vi.fn(),
  runCommand: vi.fn(),
}));

vi.mock('../../../src/config/index.js', () => ({
  COMMANDS: [
    'list-projects',
    'get-project',
    'list-issues',
    'get-issue',
    'create-issue',
    'update-issue',
    'add-comment',
    'delete-issue',
    'download-attachment',
    'get-user',
    'test-connection',
  ],
}));

vi.mock('../../../src/utils/config-loader.js', () => ({
  setupConfig: vi.fn(),
}));

describe('arg-parser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('parseArguments', () => {
    it('should handle --version flag', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((): never => {
        throw new Error('process.exit called');
      });
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      try {
        await parseArguments(['--version']);
      } catch {
        // Expected
      }

      expect(consoleLogSpy).toHaveBeenCalledWith('1.4.0');
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should handle -v flag (short version)', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((): never => {
        throw new Error('process.exit called');
      });
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      try {
        await parseArguments(['-v']);
      } catch {
        // Expected
      }

      expect(consoleLogSpy).toHaveBeenCalledWith('1.4.0');
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should handle --commands flag', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((): never => {
        throw new Error('process.exit called');
      });
      const { printAvailableCommands } = await import('../../../src/commands/index.js');

      try {
        await parseArguments(['--commands']);
      } catch {
        // Expected
      }

      expect(printAvailableCommands).toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
    });

    it('should handle command -h for command-specific help', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((): never => {
        throw new Error('process.exit called');
      });
      const { printCommandDetail } = await import('../../../src/commands/index.js');

      try {
        await parseArguments(['list-projects', '-h']);
      } catch {
        // Expected
      }

      expect(printCommandDetail).toHaveBeenCalledWith('list-projects');
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
    });

    it('should handle --help flag', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((): never => {
        throw new Error('process.exit called');
      });
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      try {
        await parseArguments(['--help']);
      } catch {
        // Expected
      }

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Jira CLI'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Usage:'));
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should handle -h flag (short help)', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((): never => {
        throw new Error('process.exit called');
      });
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      try {
        await parseArguments(['-h']);
      } catch {
        // Expected
      }

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Jira CLI'));
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should execute valid command in headless mode', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((): never => {
        throw new Error('process.exit called');
      });
      const { runCommand } = await import('../../../src/commands/index.js');

      try {
        await parseArguments(['list-projects', '{"jql":"project = PROJ"}']);
      } catch {
        // Expected
      }

      expect(runCommand).toHaveBeenCalledWith('list-projects', '{"jql":"project = PROJ"}', null);
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
    });

    it('should execute command without arguments', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((): never => {
        throw new Error('process.exit called');
      });
      const { runCommand } = await import('../../../src/commands/index.js');

      try {
        await parseArguments(['test-connection']);
      } catch {
        // Expected
      }

      expect(runCommand).toHaveBeenCalledWith('test-connection', null, null);
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
    });

    it('should parse command with flag parameter', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((): never => {
        throw new Error('process.exit called');
      });
      const { runCommand } = await import('../../../src/commands/index.js');

      try {
        await parseArguments(['get-issue', '{"issueIdOrKey":"PROJ-123"}', '--format', 'json']);
      } catch {
        // Expected
      }

      expect(runCommand).toHaveBeenCalledWith('get-issue', '{"issueIdOrKey":"PROJ-123"}', '--format');
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
    });

    it('should return false for interactive mode (no arguments)', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const result = await parseArguments([]);

      expect(result).toBe(false);
      expect(exitSpy).not.toHaveBeenCalled();

      exitSpy.mockRestore();
    });

    it('should return false for unrecognized flags when not first argument', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const result = await parseArguments(['--unknown']);

      expect(result).toBe(false);
      expect(exitSpy).not.toHaveBeenCalled();

      exitSpy.mockRestore();
    });

    it('should prioritize --version flag even if other arguments exist', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((): never => {
        throw new Error('process.exit called');
      });
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const { runCommand } = await import('../../../src/commands/index.js');

      try {
        await parseArguments(['--version', 'list-projects', '{"jql":"project = PROJ"}']);
      } catch {
        // Expected
      }

      expect(consoleLogSpy).toHaveBeenCalledWith('1.4.0');
      expect(exitSpy).toHaveBeenCalledWith(0);
      expect(runCommand).not.toHaveBeenCalled();

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should prioritize --commands flag', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((): never => {
        throw new Error('process.exit called');
      });
      const { printAvailableCommands } = await import('../../../src/commands/index.js');
      const { runCommand } = await import('../../../src/commands/index.js');

      try {
        await parseArguments(['--commands', 'list-projects']);
      } catch {
        // Expected
      }

      expect(printAvailableCommands).toHaveBeenCalled();
      expect(runCommand).not.toHaveBeenCalled();

      exitSpy.mockRestore();
    });

    it('should handle all 11 commands as valid', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((): never => {
        throw new Error('process.exit called');
      });
      const { runCommand } = await import('../../../src/commands/index.js');

      const commands = [
        'list-projects',
        'get-project',
        'list-issues',
        'get-issue',
        'create-issue',
        'update-issue',
        'add-comment',
        'delete-issue',
        'download-attachment',
        'get-user',
        'test-connection',
      ];

      for (const cmd of commands) {
        try {
          await parseArguments([cmd]);
        } catch {
          // Expected for each command
        }
      }

      expect(runCommand).toHaveBeenCalledTimes(commands.length);

      exitSpy.mockRestore();
    });

    it('should handle config command and call setupConfig', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });
      const { setupConfig } = await import('../../../src/utils/config-loader.js');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.mocked(setupConfig).mockResolvedValue(undefined);

      try {
        await parseArguments(['config']);
      } catch {
        // Expected - process.exit throws
      }

      expect(setupConfig).toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle config command errors and exit with code 1', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });
      const { setupConfig } = await import('../../../src/utils/config-loader.js');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.mocked(setupConfig).mockRejectedValue(new Error('Write permission denied'));

      try {
        await parseArguments(['config']);
      } catch {
        // Expected - process.exit throws
      }

      expect(setupConfig).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Configuration setup failed: Write permission denied');
      expect(exitSpy).toHaveBeenCalledWith(1);

      exitSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle command with params and flags', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((): never => {
        throw new Error('process.exit called');
      });
      const { runCommand } = await import('../../../src/commands/index.js');

      try {
        await parseArguments(['get-issue', '{"issueIdOrKey":"PROJ-123"}', '--format', 'json']);
      } catch {
        // Expected
      }

      expect(runCommand).toHaveBeenCalledWith('get-issue', '{"issueIdOrKey":"PROJ-123"}', '--format');

      exitSpy.mockRestore();
    });

    it('should handle command with only params', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((): never => {
        throw new Error('process.exit called');
      });
      const { runCommand } = await import('../../../src/commands/index.js');

      try {
        await parseArguments(['list-issues', '{"jql":"project = PROJ"}']);
      } catch {
        // Expected
      }

      expect(runCommand).toHaveBeenCalledWith('list-issues', '{"jql":"project = PROJ"}', null);

      exitSpy.mockRestore();
    });

    it('should handle command with only flags', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((): never => {
        throw new Error('process.exit called');
      });
      const { runCommand } = await import('../../../src/commands/index.js');

      try {
        await parseArguments(['test-connection', '--verbose']);
      } catch {
        // Expected
      }

      expect(runCommand).toHaveBeenCalledWith('test-connection', null, '--verbose');

      exitSpy.mockRestore();
    });
  });

  describe('printGeneralHelp', () => {
    it('should display help message with all commands', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((): never => {
        throw new Error('process.exit called');
      });
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      try {
        await parseArguments(['--help']);
      } catch {
        // Expected
      }

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Jira CLI'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('jira-api-cli'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('jira-api-cli --commands'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('list-projects'));

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should display examples section', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((): never => {
        throw new Error('process.exit called');
      });
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      try {
        await parseArguments(['--help']);
      } catch {
        // Expected
      }

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Examples:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('jira-api-cli config'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('jira-api-cli list-projects'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('jira-api-cli get-issue'));

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should display config command in help', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((): never => {
        throw new Error('process.exit called');
      });
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      try {
        await parseArguments(['--help']);
      } catch {
        // Expected
      }

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('jira-api-cli config'));

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should display interactive mode option in help', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((): never => {
        throw new Error('process.exit called');
      });
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      try {
        await parseArguments(['--help']);
      } catch {
        // Expected
      }

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('start interactive CLI'));

      exitSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });
  });
});
