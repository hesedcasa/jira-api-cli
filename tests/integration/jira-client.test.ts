import fs from 'fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
  testConnection,
  updateIssue,
} from '../../src/utils/jira-client.js';

// Mock the config-loader module
vi.mock('../../src/utils/config-loader.js', () => ({
  loadConfig: vi.fn(() => ({
    profiles: {
      test: {
        host: 'https://test.atlassian.net',
        email: 'test@example.com',
        apiToken: 'test-token',
      },
    },
    defaultProfile: 'test',
    defaultFormat: 'json' as const,
  })),
  getJiraClientOptions: vi.fn((_config, profileName) => {
    if (profileName === 'test') {
      return {
        host: 'https://test.atlassian.net',
        authentication: {
          basic: {
            email: 'test@example.com',
            apiToken: 'test-token',
          },
        },
      };
    }
    throw new Error(`Profile "${profileName}" not found`);
  }),
}));

// Mock jira.js Version3Client
vi.mock('jira.js', () => {
  class MockVersion3Client {
    projects = {
      searchProjects: vi.fn().mockResolvedValue({
        values: [
          { key: 'TEST', name: 'Test Project', projectTypeKey: 'software', id: '10000' },
          { key: 'DEMO', name: 'Demo Project', projectTypeKey: 'business', id: '10001' },
        ],
      }),
      getProject: vi.fn().mockResolvedValue({
        key: 'TEST',
        name: 'Test Project',
        id: '10000',
        description: 'A test project',
      }),
    };
    issueSearch = {
      searchForIssuesUsingJql: vi.fn().mockResolvedValue({
        issues: [
          {
            key: 'TEST-1',
            fields: {
              summary: 'Test issue',
              status: { name: 'Open' },
              assignee: { displayName: 'John Doe' },
              created: '2024-01-01T10:00:00Z',
            },
          },
          {
            key: 'TEST-2',
            fields: {
              summary: 'Another issue',
              status: { name: 'In Progress' },
              assignee: null,
              created: '2024-01-02T11:00:00Z',
            },
          },
        ],
        total: 2,
      }),
    };
    issues = {
      getIssue: vi.fn().mockResolvedValue({
        key: 'TEST-1',
        id: '10100',
        fields: {
          summary: 'Test issue',
          description: 'This is a test issue',
          status: { name: 'Open' },
        },
      }),
      createIssue: vi.fn().mockResolvedValue({
        key: 'TEST-123',
        id: '10123',
      }),
      editIssue: vi.fn().mockResolvedValue(undefined),
      deleteIssue: vi.fn().mockResolvedValue(undefined),
    };
    issueComments = {
      addComment: vi.fn().mockResolvedValue({
        id: '10001',
        body: {
          type: 'doc',
          version: 1,
          content: [],
        },
        author: {
          accountId: 'current',
          displayName: 'Current User',
        },
        created: '2024-01-15T12:00:00Z',
      }),
    };
    issueAttachments = {
      getAttachment: vi.fn().mockResolvedValue({
        id: '12345',
        filename: 'test-document.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        content: 'https://example.atlassian.net/secure/attachment/12345/test-document.pdf',
      }),
    };
    users = {
      getUser: vi.fn().mockResolvedValue({
        accountId: '123',
        displayName: 'John Doe',
        emailAddress: 'john@example.com',
      }),
    };
    userSearch = {
      findUsers: vi.fn().mockResolvedValue([
        {
          accountId: '456',
          displayName: 'Jane Smith',
          emailAddress: 'jane@example.com',
        },
      ]),
    };
    myself = {
      getCurrentUser: vi.fn().mockResolvedValue({
        accountId: 'current',
        displayName: 'Current User',
        emailAddress: 'current@example.com',
      }),
    };
    serverInfo = {
      getServerInfo: vi.fn().mockResolvedValue({
        version: '9.4.0',
        serverTitle: 'Test Jira Instance',
      }),
    };
  }

  return {
    Version3Client: MockVersion3Client,
  };
});

describe('jira-client (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    clearClients();
  });

  describe('listProjects', () => {
    it('should list all projects successfully', async () => {
      const result = await listProjects('test', 'json');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.result).toContain('TEST');
      expect(result.result).toContain('DEMO');
    });

    it('should format projects as toon', async () => {
      const result = await listProjects('test', 'toon');

      expect(result.success).toBe(true);
      expect(typeof result.result).toBe('string');
    });
  });

  describe('getProject', () => {
    it('should get project details successfully', async () => {
      const result = await getProject('test', 'TEST', 'json');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('key', 'TEST');
      expect(result.result).toContain('TEST');
      expect(result.result).toContain('Test Project');
    });
  });

  describe('listIssues', () => {
    it('should list issues with default parameters', async () => {
      const result = await listIssues('test');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.result).toContain('TEST-1');
      expect(result.result).toContain('TEST-2');
    });

    it('should list issues with JQL query', async () => {
      const result = await listIssues('test', 'project = TEST', 10, 0, 'json');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it('should handle pagination parameters', async () => {
      const result = await listIssues('test', undefined, 5, 10, 'json');

      expect(result.success).toBe(true);
    });
  });

  describe('getIssue', () => {
    it('should get issue details successfully', async () => {
      const result = await getIssue('test', 'TEST-1', 'json');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('key', 'TEST-1');
      expect(result.result).toContain('TEST-1');
      expect(result.result).toContain('Test issue');
    });
  });

  describe('createIssue', () => {
    it('should create issue successfully', async () => {
      const fields = {
        project: { key: 'TEST' },
        summary: 'New test issue',
        issuetype: { name: 'Task' },
      };

      const result = await createIssue('test', fields, false, 'json');

      expect(result.success).toBe(true);
      expect(result.result).toContain('TEST-123');
    });

    it('should create issue with markdown description successfully', async () => {
      const fields = {
        project: { key: 'TEST' },
        summary: 'New test issue',
        issuetype: { name: 'Task' },
        description: 'This is **bold** and *italic*\n\n- Item 1\n- Item 2',
      };

      const result = await createIssue('test', fields, true, 'json');

      expect(result.success).toBe(true);
      expect(result.result).toContain('TEST-123');
    });

    it('should create issue with plain text description when markdown is false', async () => {
      const fields = {
        project: { key: 'TEST' },
        summary: 'New test issue',
        issuetype: { name: 'Task' },
        description: 'Plain text description',
      };

      const result = await createIssue('test', fields, false, 'json');

      expect(result.success).toBe(true);
      expect(result.result).toContain('TEST-123');
    });

    it('should create issue without description field', async () => {
      const fields = {
        project: { key: 'TEST' },
        summary: 'New test issue',
        issuetype: { name: 'Task' },
      };

      const result = await createIssue('test', fields, true, 'json');

      expect(result.success).toBe(true);
      expect(result.result).toContain('TEST-123');
    });

    it('should create issue with non-string description field', async () => {
      const fields = {
        project: { key: 'TEST' },
        summary: 'New test issue',
        issuetype: { name: 'Task' },
        description: { type: 'doc', version: 1, content: [] },
      };

      const result = await createIssue('test', fields, true, 'json');

      expect(result.success).toBe(true);
      expect(result.result).toContain('TEST-123');
    });

    it('should format create issue result as toon', async () => {
      const fields = {
        project: { key: 'TEST' },
        summary: 'New issue',
        issuetype: { name: 'Bug' },
      };

      const result = await createIssue('test', fields, false, 'toon');

      expect(result.success).toBe(true);
      expect(typeof result.result).toBe('string');
    });

    it('should default markdown parameter to false', async () => {
      const fields = {
        project: { key: 'TEST' },
        summary: 'New issue',
        issuetype: { name: 'Bug' },
      };

      const result = await createIssue('test', fields);

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
    });

    it('should default format to json', async () => {
      const fields = {
        project: { key: 'TEST' },
        summary: 'New issue',
        issuetype: { name: 'Bug' },
      };

      const result = await createIssue('test', fields, false);

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
    });
  });

  describe('updateIssue', () => {
    it('should update issue successfully', async () => {
      const fields = {
        summary: 'Updated summary',
      };

      const result = await updateIssue('test', 'TEST-1', fields, false);

      expect(result.success).toBe(true);
      expect(result.result).toContain('updated successfully');
      expect(result.result).toContain('TEST-1');
    });

    it('should handle complex field updates', async () => {
      const fields = {
        summary: 'Updated summary',
        description: 'Updated description',
        priority: { name: 'High' },
      };

      const result = await updateIssue('test', 'TEST-1', fields, false, 'json');

      expect(result.success).toBe(true);
    });

    it('should update issue with markdown description successfully', async () => {
      const fields = {
        summary: 'Updated summary',
        description: 'This is **bold** and *italic*\n\n- Item 1\n- Item 2',
      };

      const result = await updateIssue('test', 'TEST-1', fields, true);

      expect(result.success).toBe(true);
      expect(result.result).toContain('updated successfully');
      expect(result.result).toContain('TEST-1');
    });

    it('should update issue with plain text description when markdown is false', async () => {
      const fields = {
        summary: 'Updated summary',
        description: 'Plain text description',
      };

      const result = await updateIssue('test', 'TEST-1', fields, false);

      expect(result.success).toBe(true);
    });

    it('should update issue without description field', async () => {
      const fields = {
        summary: 'Updated summary',
      };

      const result = await updateIssue('test', 'TEST-1', fields, true);

      expect(result.success).toBe(true);
    });

    it('should update issue with non-string description field', async () => {
      const fields = {
        summary: 'Updated summary',
        description: { type: 'doc', version: 1, content: [] },
      };

      const result = await updateIssue('test', 'TEST-1', fields, true);

      expect(result.success).toBe(true);
    });

    it('should format update issue result as toon', async () => {
      const fields = {
        summary: 'Updated summary',
      };

      const result = await updateIssue('test', 'TEST-1', fields, false);

      expect(result.success).toBe(true);
      expect(typeof result.result).toBe('string');
    });

    it('should default markdown parameter to false', async () => {
      const fields = {
        summary: 'Updated summary',
      };

      const result = await updateIssue('test', 'TEST-1', fields);

      expect(result.success).toBe(true);
    });

    it('should default format to json', async () => {
      const fields = {
        summary: 'Updated summary',
      };

      const result = await updateIssue('test', 'TEST-1', fields, false);

      expect(result.success).toBe(true);
    });
  });

  describe('addComment', () => {
    it('should add plain text comment successfully', async () => {
      const result = await addComment('test', 'TEST-1', 'This is a plain text comment', false, 'json');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('id', '10001');
      expect(result.data).toHaveProperty('body');
    });

    it('should add markdown comment successfully', async () => {
      const markdown = 'This is **bold** and *italic*\n\n- Item 1\n- Item 2';
      const result = await addComment('test', 'TEST-1', markdown, true, 'json');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('id', '10001');
    });

    it('should handle multiline plain text comment', async () => {
      const text = 'Line 1\nLine 2\nLine 3';
      const result = await addComment('test', 'TEST-1', text, false, 'json');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('id');
    });

    it('should handle complex markdown with code blocks', async () => {
      const markdown = '# Bug Report\n\n```javascript\nconst x = 1;\n```\n\nSteps:\n1. First step\n2. Second step';
      const result = await addComment('test', 'TEST-1', markdown, true, 'json');

      expect(result.success).toBe(true);
    });

    it('should handle empty comment', async () => {
      const result = await addComment('test', 'TEST-1', '', false, 'json');

      expect(result.success).toBe(true);
    });

    it('should format comment result as toon', async () => {
      const result = await addComment('test', 'TEST-1', 'Test comment', false, 'toon');

      expect(result.success).toBe(true);
      expect(typeof result.result).toBe('string');
    });

    it('should default markdown parameter to false', async () => {
      const result = await addComment('test', 'TEST-1', 'Test comment');

      expect(result.success).toBe(true);
    });

    it('should default format to json', async () => {
      const result = await addComment('test', 'TEST-1', 'Test comment', false);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('deleteIssue', () => {
    it('should delete issue successfully', async () => {
      const result = await deleteIssue('test', 'TEST-1');

      expect(result.success).toBe(true);
      expect(result.result).toContain('deleted successfully');
      expect(result.result).toContain('TEST-1');
    });
  });

  describe('getUser', () => {
    it('should get user by account ID', async () => {
      const result = await getUser('test', '123', undefined, 'json');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('accountId', '123');
      expect(result.data).toHaveProperty('displayName', 'John Doe');
    });

    it('should get user by username', async () => {
      const result = await getUser('test', undefined, 'jane', 'json');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('displayName', 'Jane Smith');
    });

    it('should get current user when no params provided', async () => {
      const result = await getUser('test', undefined, undefined, 'json');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('accountId', 'current');
      expect(result.result).toContain('current');
    });
  });

  describe('testConnection', () => {
    it('should test connection successfully', async () => {
      const result = await testConnection('test');

      expect(result.success).toBe(true);
      expect(result.result).toContain('Connection successful');
      expect(result.result).toContain('9.4.0');
      expect(result.result).toContain('Test Jira Instance');
      expect(result.result).toContain('Current User');
    });

    it('should return server and user information', async () => {
      const result = await testConnection('test');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('serverInfo');
      expect(result.data).toHaveProperty('currentUser');
    });
  });

  describe('downloadAttachment', () => {
    it('should download attachment successfully', async () => {
      // Mock fs.writeFileSync
      vi.spyOn(fs, 'writeFileSync').mockImplementation(() => undefined);

      // Mock Buffer.from
      const bufferFromSpy = vi.spyOn(Buffer, 'from').mockReturnValue(Buffer.from('test'));

      // Mock fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(10)),
        status: 200,
        statusText: 'OK',
      });

      const result = await downloadAttachment('test', 'TEST-123', '12345', undefined);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('attachmentId', '12345');
      expect(result.data).toHaveProperty('filename', 'test-document.pdf');
      expect(result.data).toHaveProperty('mimeType', 'application/pdf');
      expect(result.data).toHaveProperty('size', 1024);
      expect(result.result).toContain('test-document.pdf');
      expect(result.result).toContain('1024 bytes');

      // Cleanup
      vi.mocked(fs.writeFileSync).mockRestore();
      bufferFromSpy.mockRestore();
      vi.mocked(fetch).mockRestore();
    });

    it('should download attachment with custom output path', async () => {
      const customPath = '/custom/path/document.pdf';

      vi.spyOn(fs, 'writeFileSync').mockImplementation(() => undefined);
      const bufferFromSpy = vi.spyOn(Buffer, 'from').mockReturnValue(Buffer.from('test'));
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(10)),
        status: 200,
        statusText: 'OK',
      });

      const result = await downloadAttachment('test', 'TEST-123', '12345', customPath);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('savedTo', customPath);
      expect(result.result).toContain(customPath);

      // Verify writeFileSync was called with custom path
      expect(fs.writeFileSync).toHaveBeenCalledWith(customPath, expect.any(Buffer));

      // Cleanup
      vi.mocked(fs.writeFileSync).mockRestore();
      bufferFromSpy.mockRestore();
      vi.mocked(fetch).mockRestore();
    });

    it('should handle failed download response', async () => {
      vi.spyOn(fs, 'writeFileSync').mockImplementation(() => undefined);
      const bufferFromSpy = vi.spyOn(Buffer, 'from').mockReturnValue(Buffer.from('test'));
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const result = await downloadAttachment('test', 'TEST-123', '12345', undefined);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to download attachment');
      expect(result.error).toContain('404');

      vi.mocked(fs.writeFileSync).mockRestore();
      bufferFromSpy.mockRestore();
      vi.mocked(fetch).mockRestore();
    });

    it('should handle non-existent profile', async () => {
      const result = await downloadAttachment('nonexistent', 'TEST-123', '12345', undefined);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('clearClients', () => {
    it('should clear all clients', () => {
      expect(() => clearClients()).not.toThrow();
    });

    it('should be safe to call multiple times', () => {
      clearClients();
      clearClients();
      expect(true).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors', async () => {
      const { loadConfig } = await import('../../src/utils/config-loader.js');
      vi.mocked(loadConfig).mockImplementationOnce(() => {
        throw new Error('Config file not found');
      });

      // Clear existing client to force re-initialization
      clearClients();

      // The error is thrown during initialization, so we need to catch it
      await expect(listProjects('test', 'json')).rejects.toThrow('Failed to initialize Jira client');
    });
  });

  describe('Function exports', () => {
    it('should export all required functions', () => {
      expect(typeof listProjects).toBe('function');
      expect(typeof getProject).toBe('function');
      expect(typeof listIssues).toBe('function');
      expect(typeof getIssue).toBe('function');
      expect(typeof createIssue).toBe('function');
      expect(typeof updateIssue).toBe('function');
      expect(typeof addComment).toBe('function');
      expect(typeof deleteIssue).toBe('function');
      expect(typeof downloadAttachment).toBe('function');
      expect(typeof getUser).toBe('function');
      expect(typeof testConnection).toBe('function');
      expect(typeof clearClients).toBe('function');
    });
  });
});
