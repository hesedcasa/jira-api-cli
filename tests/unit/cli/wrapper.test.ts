import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { wrapper } from '../../../src/cli/wrapper.js';

// Create shared mock interface for readline
const mockRlInterface = {
  prompt: vi.fn(),
  on: vi.fn(),
  close: vi.fn(),
};

// Mock readline
vi.mock('readline', () => ({
  default: {
    createInterface: vi.fn(() => mockRlInterface),
  },
  createInterface: vi.fn(() => mockRlInterface),
}));

// Mock the commands module
vi.mock('../../../src/commands/index.js', () => ({
  getCurrentVersion: vi.fn().mockReturnValue('1.4.0'),
  printAvailableCommands: vi.fn(),
  printCommandDetail: vi.fn(),
}));

// Mock the config module
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

// Mock the utils module
vi.mock('../../../src/utils/index.js', () => ({
  clearClients: vi.fn(),
  addComment: vi.fn(),
  createIssue: vi.fn(),
  deleteIssue: vi.fn(),
  downloadAttachment: vi.fn(),
  getIssue: vi.fn(),
  getProject: vi.fn(),
  getUser: vi.fn(),
  listIssues: vi.fn(),
  listProjects: vi.fn(),
  loadConfig: vi.fn(),
  testConnection: vi.fn(),
  updateIssue: vi.fn(),
}));

const originalEnv = process.env;

const mockConfig = {
  host: 'https://test.atlassian.net',
  email: 'user@example.com',
  apiToken: 'test_token',
  defaultFormat: 'json' as const,
};

describe('cli/wrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    // Reset the mock readline interface
    mockRlInterface.prompt.mockClear();
    mockRlInterface.on.mockClear();
    mockRlInterface.close.mockClear();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('wrapper', () => {
    let cli: wrapper;

    beforeEach(() => {
      cli = new wrapper();
    });

    describe('constructor', () => {
      it('should create readline interface with correct prompt', async () => {
        const readline = await import('readline');

        const newCli = new wrapper();

        expect(readline.default.createInterface).toHaveBeenCalledWith({
          input: process.stdin,
          output: process.stdout,
          prompt: 'jira> ',
        });
        expect(newCli).toBeDefined();
      });
    });

    describe('connect', () => {
      it('should load config successfully', async () => {
        const { loadConfig } = await import('../../../src/utils/index.js');
        vi.mocked(loadConfig).mockReturnValue(mockConfig);

        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli.connect();

        expect(loadConfig).toHaveBeenCalled();
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Jira API CLI'));

        consoleLogSpy.mockRestore();
      });

      it('should set default format', async () => {
        const { loadConfig } = await import('../../../src/utils/index.js');
        vi.mocked(loadConfig).mockReturnValue(mockConfig);

        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli.connect();

        // @ts-expect-error - accessing private property for testing
        expect(cli.currentFormat).toBe('json');

        consoleLogSpy.mockRestore();
      });

      it('should set toon format from config', async () => {
        const { loadConfig } = await import('../../../src/utils/index.js');
        const toonConfig = { ...mockConfig, defaultFormat: 'toon' as const };
        vi.mocked(loadConfig).mockReturnValue(toonConfig);

        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli.connect();

        // @ts-expect-error - accessing private property for testing
        expect(cli.currentFormat).toBe('toon');

        consoleLogSpy.mockRestore();
      });

      it('should exit with error if config load fails', async () => {
        const { loadConfig } = await import('../../../src/utils/index.js');
        vi.mocked(loadConfig).mockImplementation(() => {
          throw new Error('Config file not found');
        });

        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
          throw new Error('process.exit called');
        });

        try {
          await cli.connect();
        } catch {
          // Expected
        }

        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load configuration:', 'Config file not found');
        expect(exitSpy).toHaveBeenCalledWith(1);

        consoleErrorSpy.mockRestore();
        exitSpy.mockRestore();
      });
    });

    describe('handleCommand', () => {
      beforeEach(async () => {
        const { loadConfig } = await import('../../../src/utils/index.js');
        vi.mocked(loadConfig).mockReturnValue(mockConfig);
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        await cli.connect();
        consoleLogSpy.mockRestore();
      });

      it('should handle empty input', async () => {
        await cli['handleCommand']('   ');

        expect(mockRlInterface.prompt).toHaveBeenCalled();
      });

      it('should handle exit command', async () => {
        const { clearClients } = await import('../../../src/utils/index.js');
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['handleCommand']('exit');

        expect(mockRlInterface.close).toHaveBeenCalled();
        expect(clearClients).toHaveBeenCalled();

        consoleLogSpy.mockRestore();
      });

      it('should handle quit command', async () => {
        const { clearClients } = await import('../../../src/utils/index.js');
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['handleCommand']('quit');

        expect(mockRlInterface.close).toHaveBeenCalled();
        expect(clearClients).toHaveBeenCalled();

        consoleLogSpy.mockRestore();
      });

      it('should handle q command', async () => {
        const { clearClients } = await import('../../../src/utils/index.js');
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['handleCommand']('q');

        expect(mockRlInterface.close).toHaveBeenCalled();
        expect(clearClients).toHaveBeenCalled();

        consoleLogSpy.mockRestore();
      });

      it('should handle help command', async () => {
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['handleCommand']('help');

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Jira API CLI'));
        expect(mockRlInterface.prompt).toHaveBeenCalled();

        consoleLogSpy.mockRestore();
      });

      it('should handle ? command as help', async () => {
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['handleCommand']('?');

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Jira API CLI'));
        expect(mockRlInterface.prompt).toHaveBeenCalled();

        consoleLogSpy.mockRestore();
      });

      it('should handle commands command', async () => {
        const { printAvailableCommands } = await import('../../../src/commands/index.js');

        await cli['handleCommand']('commands');

        expect(printAvailableCommands).toHaveBeenCalled();
        expect(mockRlInterface.prompt).toHaveBeenCalled();
      });

      it('should handle clear command', async () => {
        const consoleSpy = vi.spyOn(console, 'clear').mockImplementation(() => {});

        await cli['handleCommand']('clear');

        expect(consoleSpy).toHaveBeenCalled();
        expect(mockRlInterface.prompt).toHaveBeenCalled();

        consoleSpy.mockRestore();
      });

      it('should switch format to json', async () => {
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['handleCommand']('format json');

        expect(consoleLogSpy).toHaveBeenCalledWith('✓ Output format set to: json');
        expect(mockRlInterface.prompt).toHaveBeenCalled();

        consoleLogSpy.mockRestore();
      });

      it('should switch format to toon', async () => {
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['handleCommand']('format toon');

        expect(consoleLogSpy).toHaveBeenCalledWith('✓ Output format set to: toon');
        expect(mockRlInterface.prompt).toHaveBeenCalled();

        consoleLogSpy.mockRestore();
      });

      it('should show error for invalid format', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await cli['handleCommand']('format xml');

        expect(consoleErrorSpy).toHaveBeenCalledWith('ERROR: Invalid format. Choose: json or toon');
        expect(mockRlInterface.prompt).toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
      });

      it('should show command detail with -h flag', async () => {
        const { printCommandDetail } = await import('../../../src/commands/index.js');

        await cli['handleCommand']('list-projects -h');

        expect(printCommandDetail).toHaveBeenCalledWith('list-projects');
        expect(mockRlInterface.prompt).toHaveBeenCalled();
      });

      it('should show error for unknown command', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await cli['handleCommand']('unknown-command');

        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown command:'));
        expect(mockRlInterface.prompt).toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
      });

      it('should trim whitespace from command', async () => {
        const { listProjects } = await import('../../../src/utils/index.js');
        vi.mocked(listProjects).mockResolvedValue({ success: true, result: '{}' });
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['handleCommand']('  list-projects  ');

        expect(listProjects).toHaveBeenCalled();
        expect(mockRlInterface.prompt).toHaveBeenCalled();

        consoleLogSpy.mockRestore();
      });
    });

    describe('runCommand', () => {
      beforeEach(async () => {
        const { loadConfig } = await import('../../../src/utils/index.js');
        vi.mocked(loadConfig).mockReturnValue(mockConfig);
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        await cli.connect();
        consoleLogSpy.mockRestore();
      });

      it('should execute list-projects command', async () => {
        const { listProjects } = await import('../../../src/utils/index.js');
        vi.mocked(listProjects).mockResolvedValue({ success: true, result: '{"projects": []}' });
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['runCommand']('list-projects', '');

        expect(listProjects).toHaveBeenCalledWith('json');

        consoleLogSpy.mockRestore();
      });

      it('should execute get-project with projectIdOrKey', async () => {
        const { getProject } = await import('../../../src/utils/index.js');
        vi.mocked(getProject).mockResolvedValue({ success: true, result: '{"key":"PROJ"}' });
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['runCommand']('get-project', '{"projectIdOrKey":"PROJ"}');

        expect(getProject).toHaveBeenCalledWith('PROJ', 'json');

        consoleLogSpy.mockRestore();
      });

      it('should show error if get-project missing parameters', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await cli['runCommand']('get-project', '{}');

        expect(consoleErrorSpy).toHaveBeenCalledWith('ERROR: "projectIdOrKey" parameter is required');
        expect(mockRlInterface.prompt).toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
      });

      it('should execute list-issues with all parameters', async () => {
        const { listIssues } = await import('../../../src/utils/index.js');
        vi.mocked(listIssues).mockResolvedValue({ success: true, result: '{"issues": []}' });
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['runCommand']('list-issues', '{"jql":"project = PROJ","maxResults":10,"startAt":0}');

        expect(listIssues).toHaveBeenCalledWith('project = PROJ', 10, 0, 'json');

        consoleLogSpy.mockRestore();
      });

      it('should execute get-issue with parameters', async () => {
        const { getIssue } = await import('../../../src/utils/index.js');
        vi.mocked(getIssue).mockResolvedValue({ success: true, result: '{"id":"123"}' });
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['runCommand']('get-issue', '{"issueIdOrKey":"PROJ-123"}');

        expect(getIssue).toHaveBeenCalledWith('PROJ-123', 'json');

        consoleLogSpy.mockRestore();
      });

      it('should show error if get-issue missing parameters', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await cli['runCommand']('get-issue', '{}');

        expect(consoleErrorSpy).toHaveBeenCalledWith('ERROR: "issueIdOrKey" parameter is required');
        expect(mockRlInterface.prompt).toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
      });

      it('should execute create-issue with required parameters', async () => {
        const { createIssue } = await import('../../../src/utils/index.js');
        vi.mocked(createIssue).mockResolvedValue({ success: true, result: '{"id":"456"}' });
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['runCommand'](
          'create-issue',
          '{"fields":{"summary":"Bug report","project":{"key":"PROJ"},"issuetype":{"name":"Bug"}}}'
        );

        expect(createIssue).toHaveBeenCalledWith(
          { summary: 'Bug report', project: { key: 'PROJ' }, issuetype: { name: 'Bug' } },
          false,
          'json'
        );

        consoleLogSpy.mockRestore();
      });

      it('should show error if create-issue missing parameters', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await cli['runCommand']('create-issue', '{}');

        expect(consoleErrorSpy).toHaveBeenCalledWith('ERROR: "fields" parameter is required');
        expect(mockRlInterface.prompt).toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
      });

      it('should execute update-issue with parameters', async () => {
        const { updateIssue } = await import('../../../src/utils/index.js');
        vi.mocked(updateIssue).mockResolvedValue({ success: true, result: 'updated successfully' });
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['runCommand']('update-issue', '{"issueIdOrKey":"PROJ-123","fields":{"summary":"Updated"}}');

        expect(updateIssue).toHaveBeenCalledWith('PROJ-123', { summary: 'Updated' }, false);

        consoleLogSpy.mockRestore();
      });

      it('should show error if update-issue missing parameters', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await cli['runCommand']('update-issue', '{"issueIdOrKey":"PROJ-123"}');

        expect(consoleErrorSpy).toHaveBeenCalledWith('ERROR: "issueIdOrKey" and "fields" parameters are required');
        expect(mockRlInterface.prompt).toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
      });

      it('should execute add-comment with parameters', async () => {
        const { addComment } = await import('../../../src/utils/index.js');
        vi.mocked(addComment).mockResolvedValue({ success: true, result: '{"id":"123"}' });
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['runCommand']('add-comment', '{"issueIdOrKey":"PROJ-123","body":"Great work!"}');

        expect(addComment).toHaveBeenCalledWith('PROJ-123', 'Great work!', false, 'json');

        consoleLogSpy.mockRestore();
      });

      it('should execute add-comment with markdown', async () => {
        const { addComment } = await import('../../../src/utils/index.js');
        vi.mocked(addComment).mockResolvedValue({ success: true, result: '{}' });
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['runCommand']('add-comment', '{"issueIdOrKey":"PROJ-123","body":"This is **bold**","markdown":true}');

        expect(addComment).toHaveBeenCalledWith('PROJ-123', 'This is **bold**', true, 'json');

        consoleLogSpy.mockRestore();
      });

      it('should show error if add-comment missing parameters', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await cli['runCommand']('add-comment', '{"issueIdOrKey":"PROJ-123"}');

        expect(consoleErrorSpy).toHaveBeenCalledWith('ERROR: "issueIdOrKey" and "body" parameters are required');
        expect(mockRlInterface.prompt).toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
      });

      it('should execute delete-issue with parameters', async () => {
        const { deleteIssue } = await import('../../../src/utils/index.js');
        vi.mocked(deleteIssue).mockResolvedValue({ success: true, result: 'deleted successfully' });
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['runCommand']('delete-issue', '{"issueIdOrKey":"PROJ-123"}');

        expect(deleteIssue).toHaveBeenCalledWith('PROJ-123');

        consoleLogSpy.mockRestore();
      });

      it('should show error if delete-issue missing parameters', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await cli['runCommand']('delete-issue', '{}');

        expect(consoleErrorSpy).toHaveBeenCalledWith('ERROR: "issueIdOrKey" parameter is required');
        expect(mockRlInterface.prompt).toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
      });

      it('should execute get-user', async () => {
        const { getUser } = await import('../../../src/utils/index.js');
        vi.mocked(getUser).mockResolvedValue({ success: true, result: '{"userId":"5b10a2844c20165700ede21g"}' });
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['runCommand']('get-user', '{"accountId":"123"}');

        expect(getUser).toHaveBeenCalledWith('123', undefined, 'json');

        consoleLogSpy.mockRestore();
      });

      it('should execute test-connection', async () => {
        const { testConnection } = await import('../../../src/utils/index.js');
        vi.mocked(testConnection).mockResolvedValue({ success: true, result: 'Connected' });
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['runCommand']('test-connection', '');

        expect(testConnection).toHaveBeenCalledWith();

        consoleLogSpy.mockRestore();
      });

      it('should execute download-attachment with parameters', async () => {
        const { downloadAttachment } = await import('../../../src/utils/index.js');
        vi.mocked(downloadAttachment).mockResolvedValue({ success: true, result: 'Downloaded' });
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['runCommand']('download-attachment', '{"issueIdOrKey":"PROJ-123","attachmentId":"12345"}');

        expect(downloadAttachment).toHaveBeenCalledWith('PROJ-123', '12345', undefined);

        consoleLogSpy.mockRestore();
      });

      it('should show error if download-attachment missing parameters', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await cli['runCommand']('download-attachment', '{"issueIdOrKey":"PROJ-123"}');

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'ERROR: "issueIdOrKey" and "attachmentId" parameters are required'
        );
        expect(mockRlInterface.prompt).toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
      });

      it('should use format from args if provided', async () => {
        const { listProjects } = await import('../../../src/utils/index.js');
        vi.mocked(listProjects).mockResolvedValue({ success: true, result: '{}' });
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['runCommand']('list-projects', '{"format":"toon"}');

        expect(listProjects).toHaveBeenCalledWith('toon');

        consoleLogSpy.mockRestore();
      });

      it('should use current format by default', async () => {
        const { listProjects } = await import('../../../src/utils/index.js');
        vi.mocked(listProjects).mockResolvedValue({ success: true, result: '{}' });
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['runCommand']('list-projects', '');

        expect(listProjects).toHaveBeenCalledWith('json');

        consoleLogSpy.mockRestore();
      });

      it('should display success result', async () => {
        const { listProjects } = await import('../../../src/utils/index.js');
        vi.mocked(listProjects).mockResolvedValue({ success: true, result: '{"projects": []}' });
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['runCommand']('list-projects', '');

        expect(consoleLogSpy).toHaveBeenCalledWith('\n{"projects": []}');

        consoleLogSpy.mockRestore();
      });

      it('should display error result', async () => {
        const { listProjects } = await import('../../../src/utils/index.js');
        vi.mocked(listProjects).mockResolvedValue({ success: false, error: 'API Error' });
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await cli['runCommand']('list-projects', '');

        expect(consoleErrorSpy).toHaveBeenCalledWith('\nAPI Error');

        consoleErrorSpy.mockRestore();
      });

      it('should handle command errors', async () => {
        const { listProjects } = await import('../../../src/utils/index.js');
        vi.mocked(listProjects).mockRejectedValue(new Error('Network error'));
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await cli['runCommand']('list-projects', '');

        expect(consoleErrorSpy).toHaveBeenCalledWith('Error running command:', 'Network error');

        consoleErrorSpy.mockRestore();
      });

      it('should show error if configuration not loaded', async () => {
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        // @ts-expect-error - accessing private property for testing
        cli.config = null;

        await cli['runCommand']('list-projects', '');

        expect(consoleLogSpy).toHaveBeenCalledWith('Configuration not loaded!');
        expect(mockRlInterface.prompt).toHaveBeenCalled();

        consoleLogSpy.mockRestore();
      });
    });

    describe('printHelp', () => {
      beforeEach(async () => {
        const { loadConfig } = await import('../../../src/utils/index.js');
        vi.mocked(loadConfig).mockReturnValue(mockConfig);
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        await cli.connect();
        consoleLogSpy.mockRestore();
      });

      it('should print help message with current settings', () => {
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        cli['printHelp']();

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Jira API CLI v1.4.0'));
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Format:  json'));

        consoleLogSpy.mockRestore();
      });
    });

    describe('start', () => {
      beforeEach(async () => {
        const { loadConfig } = await import('../../../src/utils/index.js');
        vi.mocked(loadConfig).mockReturnValue(mockConfig);
      });

      it('should setup readline event handlers', async () => {
        await cli.start();

        expect(mockRlInterface.prompt).toHaveBeenCalled();
        expect(mockRlInterface.on).toHaveBeenCalledWith('line', expect.any(Function));
        expect(mockRlInterface.on).toHaveBeenCalledWith('close', expect.any(Function));
      });

      it('should setup signal handlers for SIGINT and SIGTERM', async () => {
        const onSpy = vi.spyOn(process, 'on').mockImplementation(() => process);

        await cli.start();

        expect(onSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));
        expect(onSpy).toHaveBeenCalledWith('SIGTERM', expect.any(Function));

        onSpy.mockRestore();
      });
    });

    describe('disconnect', () => {
      beforeEach(async () => {
        const { loadConfig } = await import('../../../src/utils/index.js');
        vi.mocked(loadConfig).mockReturnValue(mockConfig);
      });

      it('should clear clients and close readline', async () => {
        const { clearClients } = await import('../../../src/utils/index.js');
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await cli['disconnect']();

        expect(consoleLogSpy).toHaveBeenCalledWith('\nClosing Jira connections...');
        expect(clearClients).toHaveBeenCalled();
        expect(mockRlInterface.close).toHaveBeenCalled();

        consoleLogSpy.mockRestore();
      });
    });
  });
});
