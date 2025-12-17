import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Config } from '../../../src/utils/config-loader.js';
import { JiraUtil } from '../../../src/utils/jira-utils.js';

// Mock jira.js Version3Client
vi.mock('jira.js', () => {
  class MockVersion3Client {
    projects = {
      searchProjects: vi.fn(),
      getProject: vi.fn(),
    };
    issueSearch = {
      searchForIssuesUsingJql: vi.fn(),
    };
    issues = {
      getIssue: vi.fn(),
      createIssue: vi.fn(),
      editIssue: vi.fn(),
      deleteIssue: vi.fn(),
    };
    issueComments = {
      addComment: vi.fn(),
    };
    users = {
      getUser: vi.fn(),
    };
    userSearch = {
      findUsers: vi.fn(),
    };
    myself = {
      getCurrentUser: vi.fn(),
    };
    serverInfo = {
      getServerInfo: vi.fn(),
    };
  }

  return {
    Version3Client: MockVersion3Client,
  };
});

describe('JiraUtil', () => {
  let mockConfig: Config;
  let jiraUtil: JiraUtil;

  beforeEach(() => {
    mockConfig = {
      profiles: {
        test: {
          host: 'https://test.atlassian.net',
          email: 'test@example.com',
          apiToken: 'test-token',
        },
        production: {
          host: 'https://production.atlassian.net',
          email: 'prod@example.com',
          apiToken: 'prod-token',
        },
      },
      defaultProfile: 'test',
      defaultFormat: 'json',
    };

    jiraUtil = new JiraUtil(mockConfig);
    vi.clearAllMocks();
  });

  describe('getClient', () => {
    it('should create a new client for a profile', () => {
      const client = jiraUtil.getClient('test');

      expect(client).toBeDefined();
    });

    it('should reuse existing client for the same profile', () => {
      const client1 = jiraUtil.getClient('test');
      const client2 = jiraUtil.getClient('test');

      expect(client1).toBe(client2);
    });

    it('should create different clients for different profiles', () => {
      const testClient = jiraUtil.getClient('test');
      const prodClient = jiraUtil.getClient('production');

      expect(testClient).not.toBe(prodClient);
    });

    it('should throw error for non-existent profile', () => {
      expect(() => jiraUtil.getClient('nonexistent')).toThrow('Profile "nonexistent" not found');
    });
  });

  describe('formatAsJson', () => {
    it('should format data as JSON', () => {
      const data = [
        { id: 1, key: 'PROJ-1', summary: 'First issue' },
        { id: 2, key: 'PROJ-2', summary: 'Second issue' },
      ];

      const result = jiraUtil.formatAsJson(data);

      const parsed = JSON.parse(result);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].id).toBe(1);
      expect(parsed[0].key).toBe('PROJ-1');
      expect(parsed[1].key).toBe('PROJ-2');
    });

    it('should format single object as JSON', () => {
      const data = { id: 1, key: 'PROJ-1' };

      const result = jiraUtil.formatAsJson(data);

      const parsed = JSON.parse(result);
      expect(parsed.id).toBe(1);
      expect(parsed.key).toBe('PROJ-1');
    });

    it('should format empty array as empty JSON array', () => {
      const result = jiraUtil.formatAsJson([]);

      expect(result).toBe('[]');
    });

    it('should handle null values in JSON', () => {
      const data = [{ id: 1, key: 'PROJ-1', assignee: null }];

      const result = jiraUtil.formatAsJson(data);

      const parsed = JSON.parse(result);
      expect(parsed[0].assignee).toBeNull();
    });

    it('should pretty-print JSON with indentation', () => {
      const data = { id: 1, key: 'PROJ-1' };

      const result = jiraUtil.formatAsJson(data);

      expect(result).toContain('\n');
      expect(result).toContain('  ');
    });
  });

  describe('formatAsToon', () => {
    it('should format data as TOON', () => {
      const data = [
        { id: 1, key: 'PROJ-1', summary: 'First issue' },
        { id: 2, key: 'PROJ-2', summary: 'Second issue' },
      ];

      const result = jiraUtil.formatAsToon(data);

      // TOON format should be a string
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return empty string for null/undefined', () => {
      expect(jiraUtil.formatAsToon(null)).toBe('');
      expect(jiraUtil.formatAsToon(undefined)).toBe('');
    });

    it('should handle empty array', () => {
      const result = jiraUtil.formatAsToon([]);

      expect(typeof result).toBe('string');
    });
  });

  describe('formatResult', () => {
    const sampleData = [{ id: 1, key: 'PROJ-1' }];

    it('should format as JSON when format is "json"', () => {
      const result = jiraUtil.formatResult(sampleData, 'json');

      expect(() => JSON.parse(result)).not.toThrow();
    });

    it('should format as TOON when format is "toon"', () => {
      const result = jiraUtil.formatResult(sampleData, 'toon');

      expect(typeof result).toBe('string');
    });

    it('should default to JSON format', () => {
      const result = jiraUtil.formatResult(sampleData);

      expect(() => JSON.parse(result)).not.toThrow();
    });
  });

  describe('clearClients', () => {
    it('should clear all clients from the pool', () => {
      // Create some clients
      jiraUtil.getClient('test');
      jiraUtil.getClient('production');

      // Clear the pool
      jiraUtil.clearClients();

      // Getting the same client again should create a new instance
      const newClient = jiraUtil.getClient('test');
      expect(newClient).toBeDefined();
    });

    it('should not throw when called multiple times', () => {
      jiraUtil.clearClients();
      expect(() => jiraUtil.clearClients()).not.toThrow();
    });
  });

  describe('API Methods - Error Handling', () => {
    it('listProjects should handle errors gracefully', async () => {
      const client = jiraUtil.getClient('test');
      vi.spyOn(client.projects, 'searchProjects').mockRejectedValue(new Error('API Error'));

      const result = await jiraUtil.listProjects('test', 'json');

      expect(result.success).toBe(false);
      expect(result.error).toContain('ERROR: API Error');
    });

    it('getProject should handle errors gracefully', async () => {
      const client = jiraUtil.getClient('test');
      vi.spyOn(client.projects, 'getProject').mockRejectedValue(new Error('Project not found'));

      const result = await jiraUtil.getProject('test', 'PROJ-1', 'json');

      expect(result.success).toBe(false);
      expect(result.error).toContain('ERROR: Project not found');
    });

    it('listIssues should handle errors gracefully', async () => {
      const client = jiraUtil.getClient('test');
      vi.spyOn(client.issueSearch, 'searchForIssuesUsingJql').mockRejectedValue(new Error('JQL Error'));

      const result = await jiraUtil.listIssues('test', 'project = PROJ', 50, 0, 'json');

      expect(result.success).toBe(false);
      expect(result.error).toContain('ERROR: JQL Error');
    });

    it('getIssue should handle errors gracefully', async () => {
      const client = jiraUtil.getClient('test');
      vi.spyOn(client.issues, 'getIssue').mockRejectedValue(new Error('Issue not found'));

      const result = await jiraUtil.getIssue('test', 'PROJ-1', 'json');

      expect(result.success).toBe(false);
      expect(result.error).toContain('ERROR: Issue not found');
    });

    it('createIssue should handle errors gracefully', async () => {
      const client = jiraUtil.getClient('test');
      vi.spyOn(client.issues, 'createIssue').mockRejectedValue(new Error('Validation error'));

      const result = await jiraUtil.createIssue('test', { summary: 'Test' }, 'json');

      expect(result.success).toBe(false);
      expect(result.error).toContain('ERROR: Validation error');
    });

    it('updateIssue should handle errors gracefully', async () => {
      const client = jiraUtil.getClient('test');
      vi.spyOn(client.issues, 'editIssue').mockRejectedValue(new Error('Update failed'));

      const result = await jiraUtil.updateIssue('test', 'PROJ-1', { summary: 'Updated' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('ERROR: Update failed');
    });

    it('addComment should handle errors gracefully', async () => {
      const client = jiraUtil.getClient('test');
      vi.spyOn(client.issueComments, 'addComment').mockRejectedValue(new Error('Comment add failed'));

      const result = await jiraUtil.addComment('test', 'PROJ-1', 'Test comment', false, 'json');

      expect(result.success).toBe(false);
      expect(result.error).toContain('ERROR: Comment add failed');
    });

    it('deleteIssue should handle errors gracefully', async () => {
      const client = jiraUtil.getClient('test');
      vi.spyOn(client.issues, 'deleteIssue').mockRejectedValue(new Error('Delete failed'));

      const result = await jiraUtil.deleteIssue('test', 'PROJ-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('ERROR: Delete failed');
    });

    it('testConnection should handle errors gracefully', async () => {
      const client = jiraUtil.getClient('test');
      vi.spyOn(client.serverInfo, 'getServerInfo').mockRejectedValue(new Error('Connection failed'));

      const result = await jiraUtil.testConnection('test');

      expect(result.success).toBe(false);
      expect(result.error).toContain('ERROR: Connection failed');
    });
  });

  describe('API Methods - Success Cases', () => {
    it('listProjects should return formatted projects', async () => {
      const client = jiraUtil.getClient('test');
      vi.spyOn(client.projects, 'searchProjects').mockResolvedValue({
        values: [
          { key: 'PROJ', name: 'Project 1', projectTypeKey: 'software', id: '10000' },
          { key: 'TEST', name: 'Test Project', projectTypeKey: 'business', id: '10001' },
        ],
      });

      const result = await jiraUtil.listProjects('test', 'json');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.result).toContain('PROJ');
      expect(result.result).toContain('TEST');
    });

    it('getProject should return project details', async () => {
      const client = jiraUtil.getClient('test');
      const mockProject = { key: 'PROJ', name: 'Project 1', id: '10000' };
      vi.spyOn(client.projects, 'getProject').mockResolvedValue(mockProject);

      const result = await jiraUtil.getProject('test', 'PROJ', 'json');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProject);
      expect(result.result).toContain('PROJ');
      expect(result.result).toContain('Project 1');
    });

    it('listIssues should return formatted issues', async () => {
      const client = jiraUtil.getClient('test');
      vi.spyOn(client.issueSearch, 'searchForIssuesUsingJql').mockResolvedValue({
        issues: [
          {
            key: 'PROJ-1',
            fields: {
              summary: 'Test issue',
              status: { name: 'Open' },
              assignee: { displayName: 'John Doe' },
              created: '2024-01-01T10:00:00Z',
            },
          },
        ],
        total: 1,
      });

      const result = await jiraUtil.listIssues('test', 'project = PROJ', 50, 0, 'json');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.result).toContain('PROJ-1');
      expect(result.result).toContain('Test issue');
    });

    it('createIssue should return created issue', async () => {
      const client = jiraUtil.getClient('test');
      vi.spyOn(client.issues, 'createIssue').mockResolvedValue({
        key: 'PROJ-123',
        id: '10123',
      });

      const result = await jiraUtil.createIssue('test', { summary: 'New issue' }, 'json');

      expect(result.success).toBe(true);
      expect(result.result).toContain('PROJ-123');
    });

    it('updateIssue should return success message', async () => {
      const client = jiraUtil.getClient('test');
      vi.spyOn(client.issues, 'editIssue').mockResolvedValue(undefined);

      const result = await jiraUtil.updateIssue('test', 'PROJ-1', { summary: 'Updated' });

      expect(result.success).toBe(true);
      expect(result.result).toContain('updated successfully');
    });

    it('addComment should add plain text comment successfully', async () => {
      const client = jiraUtil.getClient('test');
      const mockComment = {
        id: '10001',
        body: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'This is a plain text comment' }],
            },
          ],
        },
        author: {
          accountId: 'current',
          displayName: 'Current User',
        },
        created: '2024-01-15T12:00:00Z',
      };
      vi.spyOn(client.issueComments, 'addComment').mockResolvedValue(mockComment);

      const result = await jiraUtil.addComment('test', 'PROJ-1', 'This is a plain text comment', false, 'json');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockComment);
      expect(result.result).toContain('10001');
    });

    it('addComment should add markdown comment successfully', async () => {
      const client = jiraUtil.getClient('test');
      const mockComment = {
        id: '10002',
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
      };
      vi.spyOn(client.issueComments, 'addComment').mockResolvedValue(mockComment);

      const markdown = 'This is **bold** and *italic*\n\n- Item 1\n- Item 2';
      const result = await jiraUtil.addComment('test', 'PROJ-1', markdown, true, 'json');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockComment);
      expect(client.issueComments.addComment).toHaveBeenCalledWith(
        expect.objectContaining({
          issueIdOrKey: 'PROJ-1',
          comment: expect.objectContaining({
            type: 'doc',
            version: 1,
          }),
        })
      );
    });

    it('addComment should format result as toon', async () => {
      const client = jiraUtil.getClient('test');
      const mockComment = {
        id: '10003',
        body: {
          type: 'doc',
          version: 1,
          content: [],
        },
      };
      vi.spyOn(client.issueComments, 'addComment').mockResolvedValue(mockComment);

      const result = await jiraUtil.addComment('test', 'PROJ-1', 'Test comment', false, 'toon');

      expect(result.success).toBe(true);
      expect(typeof result.result).toBe('string');
    });

    it('addComment should handle empty comment', async () => {
      const client = jiraUtil.getClient('test');
      const mockComment = {
        id: '10004',
        body: {
          type: 'doc',
          version: 1,
          content: [{ type: 'paragraph', content: [] }],
        },
      };
      vi.spyOn(client.issueComments, 'addComment').mockResolvedValue(mockComment);

      const result = await jiraUtil.addComment('test', 'PROJ-1', '', false, 'json');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockComment);
    });

    it('deleteIssue should return success message', async () => {
      const client = jiraUtil.getClient('test');
      vi.spyOn(client.issues, 'deleteIssue').mockResolvedValue(undefined);

      const result = await jiraUtil.deleteIssue('test', 'PROJ-1');

      expect(result.success).toBe(true);
      expect(result.result).toContain('deleted successfully');
    });

    it('testConnection should return connection info', async () => {
      const client = jiraUtil.getClient('test');
      vi.spyOn(client.serverInfo, 'getServerInfo').mockResolvedValue({
        version: '9.0.0',
        serverTitle: 'Test Jira',
      });
      vi.spyOn(client.myself, 'getCurrentUser').mockResolvedValue({
        displayName: 'Test User',
        emailAddress: 'test@example.com',
      });

      const result = await jiraUtil.testConnection('test');

      expect(result.success).toBe(true);
      expect(result.result).toContain('Connection successful');
      expect(result.result).toContain('9.0.0');
      expect(result.result).toContain('Test User');
    });

    it('getUser should return user by account ID', async () => {
      const client = jiraUtil.getClient('test');
      const mockUser = {
        accountId: '123',
        displayName: 'John Doe',
        emailAddress: 'john@example.com',
      };
      vi.spyOn(client.users, 'getUser').mockResolvedValue(mockUser);

      const result = await jiraUtil.getUser('test', '123', undefined, 'json');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUser);
    });

    it('getUser should return current user when no params provided', async () => {
      const client = jiraUtil.getClient('test');
      const mockUser = {
        accountId: 'current',
        displayName: 'Current User',
        emailAddress: 'current@example.com',
      };
      vi.spyOn(client.myself, 'getCurrentUser').mockResolvedValue(mockUser);

      const result = await jiraUtil.getUser('test', undefined, undefined, 'json');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUser);
      expect(result.result).toContain('current');
    });

    it('getUser should search by username', async () => {
      const client = jiraUtil.getClient('test');
      const mockUser = {
        accountId: '456',
        displayName: 'Jane Doe',
        emailAddress: 'jane@example.com',
      };
      vi.spyOn(client.userSearch, 'findUsers').mockResolvedValue([mockUser]);

      const result = await jiraUtil.getUser('test', undefined, 'jane', 'json');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUser);
    });

    it('getUser should handle user not found by username', async () => {
      const client = jiraUtil.getClient('test');
      vi.spyOn(client.userSearch, 'findUsers').mockResolvedValue([]);

      const result = await jiraUtil.getUser('test', undefined, 'nonexistent', 'json');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });
});
