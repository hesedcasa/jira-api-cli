import { encode } from '@toon-format/toon';
import fs from 'fs';
import { Version3Client } from 'jira.js';
import path from 'path';

import type { Config } from './config-loader.js';
import { getJiraClientOptions } from './config-loader.js';
import { markdownToAdf, textToAdf } from './markdown-to-adf.js';

/**
 * Generic API result
 */
export interface ApiResult {
  success: boolean;
  result?: string;
  data?: unknown;
  error?: string;
}

/**
 * Jira API Utility Module
 * Provides core Jira API operations with formatting
 */
export class JiraUtil {
  private config: Config;
  private clientPool: Map<string, Version3Client>;

  constructor(config: Config) {
    this.config = config;
    this.clientPool = new Map();
  }

  /**
   * Get or create Jira client for a profile
   */
  getClient(profileName: string): Version3Client {
    if (this.clientPool.has(profileName)) {
      return this.clientPool.get(profileName)!;
    }

    const options = getJiraClientOptions(this.config, profileName);
    const client = new Version3Client(options);
    this.clientPool.set(profileName, client);

    return client;
  }

  /**
   * Format data as JSON
   */
  formatAsJson(data: unknown): string {
    return JSON.stringify(data, null, 2);
  }

  /**
   * Format data as TOON (Token-Oriented Object Notation)
   */
  formatAsToon(data: unknown): string {
    if (!data) {
      return '';
    }

    return encode(data);
  }

  /**
   * Format result with specified format
   */
  formatResult(data: unknown, format: 'json' | 'toon' = 'json'): string {
    if (format === 'toon') {
      return this.formatAsToon(data);
    }
    return this.formatAsJson(data);
  }

  /**
   * List all projects
   */
  async listProjects(profileName: string, format: 'json' | 'toon' = 'json'): Promise<ApiResult> {
    try {
      const client = this.getClient(profileName);
      const response = await client.projects.searchProjects();

      // Simplify project data for display
      const projects = response.values || [];
      const simplifiedProjects = projects.map(
        (p: { key?: string; name?: string; projectTypeKey?: string; id?: string }) => ({
          key: p.key,
          name: p.name,
          projectTypeKey: p.projectTypeKey,
          id: p.id,
        })
      );

      return {
        success: true,
        data: simplifiedProjects,
        result: this.formatResult(simplifiedProjects, format),
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `ERROR: ${errorMessage}`,
      };
    }
  }

  /**
   * Get project details
   */
  async getProject(profileName: string, projectIdOrKey: string, format: 'json' | 'toon' = 'json'): Promise<ApiResult> {
    try {
      const client = this.getClient(profileName);
      const project = await client.projects.getProject({ projectIdOrKey });

      return {
        success: true,
        data: project,
        result: this.formatResult(project, format),
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `ERROR: ${errorMessage}`,
      };
    }
  }

  /**
   * List issues using JQL
   */
  async listIssues(
    profileName: string,
    jql?: string,
    maxResults = 50,
    startAt = 0,
    format: 'json' | 'toon' = 'json'
  ): Promise<ApiResult> {
    try {
      const client = this.getClient(profileName);
      const response = await client.issueSearch.searchForIssuesUsingJql({
        jql: jql || '',
        maxResults,
        startAt,
      });

      // Simplify issue data for display
      const simplifiedIssues =
        response.issues?.map(issue => ({
          key: issue.key,
          summary: issue.fields?.summary,
          status: (issue.fields?.status as { name?: string })?.name,
          assignee: (issue.fields?.assignee as { displayName?: string })?.displayName || 'Unassigned',
          created: issue.fields?.created,
        })) || [];

      return {
        success: true,
        data: simplifiedIssues,
        result: this.formatResult(simplifiedIssues, format),
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `ERROR: ${errorMessage}`,
      };
    }
  }

  /**
   * Get issue details
   */
  async getIssue(profileName: string, issueIdOrKey: string, format: 'json' | 'toon' = 'json'): Promise<ApiResult> {
    try {
      const client = this.getClient(profileName);
      const issue = await client.issues.getIssue({ issueIdOrKey });

      return {
        success: true,
        data: issue,
        result: this.formatResult(issue, format),
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `ERROR: ${errorMessage}`,
      };
    }
  }

  /**
   * Create a new issue
   */
  async createIssue(
    profileName: string,
    fields: Record<string, unknown>,
    format: 'json' | 'toon' = 'json'
  ): Promise<ApiResult> {
    try {
      const client = this.getClient(profileName);
      const response = await client.issues.createIssue({
        fields: fields as Parameters<typeof client.issues.createIssue>[0]['fields'],
      });

      return {
        success: true,
        data: response,
        result: this.formatResult(response, format),
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `ERROR: ${errorMessage}`,
      };
    }
  }

  /**
   * Update an existing issue
   */
  async updateIssue(profileName: string, issueIdOrKey: string, fields: Record<string, unknown>): Promise<ApiResult> {
    try {
      const client = this.getClient(profileName);
      await client.issues.editIssue({
        issueIdOrKey,
        fields: fields as Parameters<typeof client.issues.editIssue>[0]['fields'],
      });

      return {
        success: true,
        result: `✅ Issue ${issueIdOrKey} updated successfully!`,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `ERROR: ${errorMessage}`,
      };
    }
  }

  /**
   * Add a comment to an issue
   */
  async addComment(
    profileName: string,
    issueIdOrKey: string,
    body: string,
    markdown = false,
    format: 'json' | 'toon' = 'json'
  ): Promise<ApiResult> {
    try {
      const client = this.getClient(profileName);

      // Convert body to ADF format
      const bodyContent = markdown ? markdownToAdf(body) : textToAdf(body);

      const response = await client.issueComments.addComment({
        issueIdOrKey,
        comment: bodyContent as Parameters<typeof client.issueComments.addComment>[0]['comment'],
      });

      return {
        success: true,
        data: response,
        result: this.formatResult(response, format),
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `ERROR: ${errorMessage}`,
      };
    }
  }

  /**
   * Delete an issue
   */
  async deleteIssue(profileName: string, issueIdOrKey: string): Promise<ApiResult> {
    try {
      const client = this.getClient(profileName);
      await client.issues.deleteIssue({ issueIdOrKey });

      return {
        success: true,
        result: `✅ Issue ${issueIdOrKey} deleted successfully!`,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `ERROR: ${errorMessage}`,
      };
    }
  }

  /**
   * Get user information
   */
  async getUser(
    profileName: string,
    accountId?: string,
    username?: string,
    format: 'json' | 'toon' = 'json'
  ): Promise<ApiResult> {
    try {
      const client = this.getClient(profileName);

      if (accountId) {
        const user = await client.users.getUser({ accountId });
        return {
          success: true,
          data: user,
          result: this.formatResult(user, format),
        };
      } else if (username) {
        // Username lookup is deprecated but we can try
        const users = await client.userSearch.findUsers({ query: username });
        if (users.length > 0) {
          return {
            success: true,
            data: users[0],
            result: this.formatResult(users[0], format),
          };
        }
        return {
          success: false,
          error: `ERROR: User "${username}" not found`,
        };
      } else {
        // Get current user
        const user = await client.myself.getCurrentUser();
        return {
          success: true,
          data: user,
          result: this.formatResult(user, format),
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `ERROR: ${errorMessage}`,
      };
    }
  }

  /**
   * Test Jira API connection
   */
  async testConnection(profileName: string): Promise<ApiResult> {
    try {
      const client = this.getClient(profileName);
      const serverInfo = await client.serverInfo.getServerInfo();
      const currentUser = await client.myself.getCurrentUser();

      return {
        success: true,
        data: { serverInfo, currentUser },
        result: `✅ Connection successful!\n\nProfile: ${profileName}\nServer Version: ${serverInfo.version}\nServer Title: ${serverInfo.serverTitle}\nLogged in as: ${currentUser.displayName} (${currentUser.emailAddress})`,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `ERROR: ${errorMessage}`,
      };
    }
  }

  /**
   * Clear client pool (for cleanup)
   */
  clearClients(): void {
    this.clientPool.clear();
  }

  /**
   * Download attachment from an issue
   */
  async downloadAttachment(
    profileName: string,
    issueIdOrKey: string,
    attachmentId: string,
    outputPath?: string
  ): Promise<ApiResult> {
    try {
      const client = this.getClient(profileName);

      // Get attachment metadata
      const attachment = await client.issueAttachments.getAttachment({ id: attachmentId });

      if (!attachment.content) {
        return {
          success: false,
          error: `ERROR: Attachment ${attachmentId} has no content URL`,
        };
      }

      // Get profile credentials for authenticated download
      const profile = this.config.profiles[profileName];
      if (!profile) {
        return {
          success: false,
          error: `ERROR: Profile "${profileName}" not found`,
        };
      }

      // Build Basic auth header
      const authString = Buffer.from(`${profile.email}:${profile.apiToken}`).toString('base64');

      // Download the attachment content
      const response = await fetch(attachment.content, {
        headers: {
          Authorization: `Basic ${authString}`,
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `ERROR: Failed to download attachment: ${response.status} ${response.statusText}`,
        };
      }

      // Determine output filename
      const filename = attachment.filename || `attachment-${attachmentId}`;
      const finalPath = outputPath || path.join(process.cwd(), filename);

      // Save to file
      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(finalPath, buffer);

      return {
        success: true,
        data: {
          attachmentId: attachment.id,
          filename: attachment.filename,
          mimeType: attachment.mimeType,
          size: attachment.size,
          savedTo: finalPath,
        },
        result: `Downloaded attachment "${filename}" (${attachment.size} bytes) to ${finalPath}`,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `ERROR: ${errorMessage}`,
      };
    }
  }
}
