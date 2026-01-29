import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { runCommand } from '../../../src/commands/runner.js';
// Import the mocked functions from the barrel export
import {
  addComment,
  clearClients,
  createIssue,
  deleteIssue,
  downloadAttachment,
  getIssue,
  getProject,
  getUser,
  listIssues,
  listProjects,
  loadConfig,
  setupConfig,
  testConnection,
  updateIssue,
} from '../../../src/utils/index.js';

// Mock the utils barrel export at the index level
// This is necessary because runner.ts imports from utils/index.js
vi.mock('../../../src/utils/index.js', () => ({
  loadConfig: vi.fn(),
  setupConfig: vi.fn(),
  listProjects: vi.fn(),
  getProject: vi.fn(),
  listIssues: vi.fn(),
  getIssue: vi.fn(),
  createIssue: vi.fn(),
  updateIssue: vi.fn(),
  addComment: vi.fn(),
  deleteIssue: vi.fn(),
  downloadAttachment: vi.fn(),
  getUser: vi.fn(),
  testConnection: vi.fn(),
  clearClients: vi.fn(),
}));

// Mock process.env
const originalEnv = process.env;

describe('commands/runner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const mockConfig = {
    host: 'https://test.atlassian.net',
    email: 'user@example.com',
    apiToken: 'test_token',
    defaultFormat: 'json' as const,
  };

  describe('runCommand', () => {
    it('should execute list-projects command', async () => {
      vi.mocked(loadConfig).mockReturnValue(mockConfig);
      vi.mocked(listProjects).mockResolvedValue({ success: true, result: '{"projects": []}' });

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('list-projects', null, null);

      expect(vi.mocked(loadConfig)).toHaveBeenCalled();
      expect(vi.mocked(listProjects)).toHaveBeenCalledWith('json');
      expect(consoleLogSpy).toHaveBeenCalledWith('{"projects": []}');
      expect(vi.mocked(clearClients)).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });

    it('should execute list-projects with custom format', async () => {
      vi.mocked(loadConfig).mockReturnValue(mockConfig);
      vi.mocked(listProjects).mockResolvedValue({ success: true, result: '{}' });

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('list-projects', '{"format":"toon"}', null);

      expect(vi.mocked(listProjects)).toHaveBeenCalledWith('toon');
      expect(consoleLogSpy).toHaveBeenCalledWith('{}');

      consoleLogSpy.mockRestore();
    });

    it('should execute get-project with projectIdOrKey', async () => {
      vi.mocked(loadConfig).mockReturnValue(mockConfig);
      vi.mocked(getProject).mockResolvedValue({ success: true, result: '{"key":"PROJ"}' });

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await runCommand('get-project', '{"projectIdOrKey":"PROJ"}', null);

      expect(vi.mocked(getProject)).toHaveBeenCalledWith('PROJ', 'json');
      expect(consoleLogSpy).toHaveBeenCalledWith('{"key":"PROJ"}');
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should exit with error if get-project missing parameters', async () => {
      vi.mocked(loadConfig).mockReturnValue(mockConfig);

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      try {
        await runCommand('get-project', '{}', null);
      } catch {
        // Expected
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith('ERROR: "projectIdOrKey" parameter is required');
      expect(exitSpy).toHaveBeenCalledWith(1);

      exitSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should execute list-issues with all parameters', async () => {
      vi.mocked(loadConfig).mockReturnValue(mockConfig);
      vi.mocked(listIssues).mockResolvedValue({ success: true, result: '{"issues": []}' });

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('list-issues', '{"jql":"project = PROJ","maxResults":10,"startAt":0}', null);

      expect(vi.mocked(listIssues)).toHaveBeenCalledWith('project = PROJ', 10, 0, 'json');
      expect(consoleLogSpy).toHaveBeenCalledWith('{"issues": []}');

      consoleLogSpy.mockRestore();
    });

    it('should execute list-issues with minimal parameters', async () => {
      vi.mocked(loadConfig).mockReturnValue(mockConfig);
      vi.mocked(listIssues).mockResolvedValue({ success: true, result: '{"issues": []}' });

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('list-issues', '{}', null);

      expect(vi.mocked(listIssues)).toHaveBeenCalledWith(undefined, undefined, undefined, 'json');
      expect(consoleLogSpy).toHaveBeenCalledWith('{"issues": []}');

      consoleLogSpy.mockRestore();
    });

    it('should execute get-issue command', async () => {
      vi.mocked(loadConfig).mockReturnValue(mockConfig);
      vi.mocked(getIssue).mockResolvedValue({ success: true, result: '{"key":"PROJ-123","summary":"Test"}' });

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('get-issue', '{"issueIdOrKey":"PROJ-123"}', null);

      expect(vi.mocked(getIssue)).toHaveBeenCalledWith('PROJ-123', 'json');
      expect(consoleLogSpy).toHaveBeenCalledWith('{"key":"PROJ-123","summary":"Test"}');

      consoleLogSpy.mockRestore();
    });

    it('should exit with error if get-issue missing parameters', async () => {
      vi.mocked(loadConfig).mockReturnValue(mockConfig);

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      try {
        await runCommand('get-issue', '{}', null);
      } catch {
        // Expected
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith('ERROR: "issueIdOrKey" parameter is required');
      expect(exitSpy).toHaveBeenCalledWith(1);

      exitSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should execute create-issue command', async () => {
      vi.mocked(loadConfig).mockReturnValue(mockConfig);
      vi.mocked(createIssue).mockResolvedValue({ success: true, result: '{"key":"PROJ-456"}' });

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand(
        'create-issue',
        '{"fields":{"summary":"New issue","project":{"key":"PROJ"},"issuetype":{"name":"Task"}}}',
        null
      );

      expect(vi.mocked(createIssue)).toHaveBeenCalledWith(
        { summary: 'New issue', project: { key: 'PROJ' }, issuetype: { name: 'Task' } },
        false,
        'json'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith('{"key":"PROJ-456"}');

      consoleLogSpy.mockRestore();
    });

    it('should execute create-issue with markdown', async () => {
      vi.mocked(loadConfig).mockReturnValue(mockConfig);
      vi.mocked(createIssue).mockResolvedValue({ success: true, result: '{}' });

      await runCommand('create-issue', '{"fields":{"summary":"New issue"},"markdown":true}', null);

      expect(vi.mocked(createIssue)).toHaveBeenCalledWith({ summary: 'New issue' }, true, 'json');
    });

    it('should exit with error if create-issue missing required parameters', async () => {
      vi.mocked(loadConfig).mockReturnValue(mockConfig);

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      try {
        await runCommand('create-issue', '{}', null);
      } catch {
        // Expected
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith('ERROR: "fields" parameter is required');
      expect(exitSpy).toHaveBeenCalledWith(1);

      exitSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should execute update-issue command', async () => {
      vi.mocked(loadConfig).mockReturnValue(mockConfig);
      vi.mocked(updateIssue).mockResolvedValue({ success: true, result: 'updated successfully' });

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('update-issue', '{"issueIdOrKey":"PROJ-123","fields":{"summary":"Updated"}}', null);

      expect(vi.mocked(updateIssue)).toHaveBeenCalledWith('PROJ-123', { summary: 'Updated' }, false);

      consoleLogSpy.mockRestore();
    });

    it('should exit with error if update-issue missing required parameters', async () => {
      vi.mocked(loadConfig).mockReturnValue(mockConfig);

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      try {
        await runCommand('update-issue', '{"issueIdOrKey":"PROJ-123"}', null);
      } catch {
        // Expected
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith('ERROR: "issueIdOrKey" and "fields" parameters are required');
      expect(exitSpy).toHaveBeenCalledWith(1);

      exitSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should execute add-comment command', async () => {
      vi.mocked(loadConfig).mockReturnValue(mockConfig);
      vi.mocked(addComment).mockResolvedValue({ success: true, result: '{"id":"123"}' });

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('add-comment', '{"issueIdOrKey":"PROJ-123","body":"Great work!"}', null);

      expect(vi.mocked(addComment)).toHaveBeenCalledWith('PROJ-123', 'Great work!', false, 'json');

      consoleLogSpy.mockRestore();
    });

    it('should execute add-comment with markdown', async () => {
      vi.mocked(loadConfig).mockReturnValue(mockConfig);
      vi.mocked(addComment).mockResolvedValue({ success: true, result: '{}' });

      await runCommand('add-comment', '{"issueIdOrKey":"PROJ-123","body":"This is **bold**","markdown":true}', null);

      expect(vi.mocked(addComment)).toHaveBeenCalledWith('PROJ-123', 'This is **bold**', true, 'json');
    });

    it('should exit with error if add-comment missing required parameters', async () => {
      vi.mocked(loadConfig).mockReturnValue(mockConfig);

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      try {
        await runCommand('add-comment', '{"issueIdOrKey":"PROJ-123"}', null);
      } catch {
        // Expected
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith('ERROR: "issueIdOrKey" and "body" parameters are required');
      expect(exitSpy).toHaveBeenCalledWith(1);

      exitSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should execute delete-issue command', async () => {
      vi.mocked(loadConfig).mockReturnValue(mockConfig);
      vi.mocked(deleteIssue).mockResolvedValue({ success: true, result: 'deleted successfully' });

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('delete-issue', '{"issueIdOrKey":"PROJ-123"}', null);

      expect(vi.mocked(deleteIssue)).toHaveBeenCalledWith('PROJ-123');

      consoleLogSpy.mockRestore();
    });

    it('should exit with error if delete-issue missing required parameters', async () => {
      vi.mocked(loadConfig).mockReturnValue(mockConfig);

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      try {
        await runCommand('delete-issue', '{}', null);
      } catch {
        // Expected
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith('ERROR: "issueIdOrKey" parameter is required');
      expect(exitSpy).toHaveBeenCalledWith(1);

      exitSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should execute get-user with accountId', async () => {
      vi.mocked(loadConfig).mockReturnValue(mockConfig);
      vi.mocked(getUser).mockResolvedValue({ success: true, result: '{"displayName":"User"}' });

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('get-user', '{"accountId":"123"}', null);

      expect(vi.mocked(getUser)).toHaveBeenCalledWith('123', undefined, 'json');

      consoleLogSpy.mockRestore();
    });

    it('should execute get-user with username', async () => {
      vi.mocked(loadConfig).mockReturnValue(mockConfig);
      vi.mocked(getUser).mockResolvedValue({ success: true, result: '{}' });

      await runCommand('get-user', '{"username":"john"}', null);

      expect(vi.mocked(getUser)).toHaveBeenCalledWith(undefined, 'john', 'json');
    });

    it('should execute get-user without parameters (current user)', async () => {
      vi.mocked(loadConfig).mockReturnValue(mockConfig);
      vi.mocked(getUser).mockResolvedValue({ success: true, result: '{}' });

      await runCommand('get-user', null, null);

      expect(vi.mocked(getUser)).toHaveBeenCalledWith(undefined, undefined, 'json');
    });

    it('should execute test-connection command', async () => {
      vi.mocked(loadConfig).mockReturnValue(mockConfig);
      vi.mocked(testConnection).mockResolvedValue({ success: true, result: 'Connected successfully' });

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runCommand('test-connection', null, null);

      expect(vi.mocked(testConnection)).toHaveBeenCalledWith();
      expect(consoleLogSpy).toHaveBeenCalledWith('Connected successfully');

      consoleLogSpy.mockRestore();
    });

    it('should execute download-attachment command', async () => {
      vi.mocked(loadConfig).mockReturnValue(mockConfig);
      vi.mocked(downloadAttachment).mockResolvedValue({ success: true, result: 'Downloaded' });

      await runCommand('download-attachment', '{"issueIdOrKey":"PROJ-123","attachmentId":"456"}', null);

      expect(vi.mocked(downloadAttachment)).toHaveBeenCalledWith('PROJ-123', '456', undefined);
    });

    it('should execute download-attachment with custom outputPath', async () => {
      vi.mocked(loadConfig).mockReturnValue(mockConfig);
      vi.mocked(downloadAttachment).mockResolvedValue({ success: true, result: 'Downloaded' });

      await runCommand(
        'download-attachment',
        '{"issueIdOrKey":"PROJ-123","attachmentId":"456","outputPath":"/tmp/file.pdf"}',
        null
      );

      expect(vi.mocked(downloadAttachment)).toHaveBeenCalledWith('PROJ-123', '456', '/tmp/file.pdf');
    });

    it('should exit with error if download-attachment missing required parameters', async () => {
      vi.mocked(loadConfig).mockReturnValue(mockConfig);

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      try {
        await runCommand('download-attachment', '{"issueIdOrKey":"PROJ-123"}', null);
      } catch {
        // Expected
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith('ERROR: "issueIdOrKey" and "attachmentId" parameters are required');
      expect(exitSpy).toHaveBeenCalledWith(1);

      exitSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle command failure', async () => {
      vi.mocked(loadConfig).mockReturnValue(mockConfig);
      vi.mocked(getProject).mockResolvedValue({ success: false, error: 'Project not found' });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      try {
        await runCommand('get-project', '{"projectIdOrKey":"INVALID"}', null);
      } catch {
        // Expected
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith('Project not found');
      expect(exitSpy).toHaveBeenCalledWith(1);

      exitSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle unknown command', async () => {
      vi.mocked(loadConfig).mockReturnValue(mockConfig);

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      try {
        await runCommand('unknown-command', '{}', null);
      } catch {
        // Expected
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith('Unknown command: unknown-command');
      expect(exitSpy).toHaveBeenCalledWith(1);

      exitSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle JSON parse error in arguments', async () => {
      vi.mocked(loadConfig).mockReturnValue(mockConfig);

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      try {
        await runCommand('list-projects', 'invalid json', null);
      } catch {
        // Expected
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error executing command:',
        expect.stringContaining('not valid JSON')
      );
      expect(vi.mocked(clearClients)).toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(1);

      exitSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should clear clients on successful execution', async () => {
      vi.mocked(loadConfig).mockReturnValue(mockConfig);
      vi.mocked(listProjects).mockResolvedValue({ success: true, result: '{}' });

      await runCommand('list-projects', null, null);

      expect(vi.mocked(clearClients)).toHaveBeenCalled();
    });

    it('should clear clients on error', async () => {
      vi.mocked(loadConfig).mockImplementation(() => {
        throw new Error('Config error');
      });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      try {
        await runCommand('list-projects', null, null);
      } catch {
        // Expected
      }

      expect(vi.mocked(clearClients)).toHaveBeenCalled();

      exitSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle exceptions and display error message', async () => {
      vi.mocked(loadConfig).mockImplementation(() => {
        throw new Error('Configuration load failed');
      });

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      try {
        await runCommand('list-projects', null, null);
      } catch {
        // Expected
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error executing command:', 'Configuration load failed');
      expect(exitSpy).toHaveBeenCalledWith(1);

      exitSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle config command and call setupConfig', async () => {
      vi.mocked(setupConfig).mockResolvedValue(undefined);

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      try {
        await runCommand('config', null, null);
      } catch {
        // Expected
      }

      expect(vi.mocked(setupConfig)).toHaveBeenCalled();
      expect(vi.mocked(clearClients)).toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
    });

    it('should handle config command errors', async () => {
      vi.mocked(setupConfig).mockRejectedValue(new Error('Write permission denied'));

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      try {
        await runCommand('config', null, null);
      } catch {
        // Expected
      }

      expect(vi.mocked(setupConfig)).toHaveBeenCalled();
      expect(vi.mocked(clearClients)).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error executing command:', 'Write permission denied');
      expect(exitSpy).toHaveBeenCalledWith(1);

      exitSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should use format from args if provided', async () => {
      vi.mocked(loadConfig).mockReturnValue(mockConfig);
      vi.mocked(listProjects).mockResolvedValue({ success: true, result: '{}' });

      await runCommand('list-projects', '{"format":"toon"}', null);

      expect(vi.mocked(listProjects)).toHaveBeenCalledWith('toon');
    });

    it('should use default format from config if not specified in args', async () => {
      vi.mocked(loadConfig).mockReturnValue(mockConfig);
      vi.mocked(listProjects).mockResolvedValue({ success: true, result: '{}' });

      await runCommand('list-projects', null, null);

      expect(vi.mocked(listProjects)).toHaveBeenCalledWith('json');
    });
  });
});
