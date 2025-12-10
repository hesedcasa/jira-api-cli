import { encode } from '@toon-format/toon';
import { ConfluenceClient } from 'confluence.js';

import type { Config } from './config-loader.js';
import { getConfluenceClientOptions } from './config-loader.js';

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
 * Confluence API Utility Module
 * Provides core Confluence API operations with formatting
 */
export class ConfluenceUtil {
  private config: Config;
  private clientPool: Map<string, ConfluenceClient>;

  constructor(config: Config) {
    this.config = config;
    this.clientPool = new Map();
  }

  /**
   * Get or create Confluence client for a profile
   */
  getClient(profileName: string): ConfluenceClient {
    if (this.clientPool.has(profileName)) {
      return this.clientPool.get(profileName)!;
    }

    const options = getConfluenceClientOptions(this.config, profileName);
    const client = new ConfluenceClient(options);
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
   * List all spaces
   */
  async listSpaces(profileName: string, format: 'json' | 'toon' = 'json'): Promise<ApiResult> {
    try {
      const client = this.getClient(profileName);
      const response = await client.space.getSpaces();

      // Simplify space data for display
      const spaces = response.results || [];
      const simplifiedSpaces = spaces.map(
        (s: { key?: string; name?: string; type?: string; id?: string }) => ({
          key: s.key,
          name: s.name,
          type: s.type,
          id: s.id,
        })
      );

      return {
        success: true,
        data: simplifiedSpaces,
        result: this.formatResult(simplifiedSpaces, format),
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
   * Get space details
   */
  async getSpace(profileName: string, spaceKey: string, format: 'json' | 'toon' = 'json'): Promise<ApiResult> {
    try {
      const client = this.getClient(profileName);
      const space = await client.space.getSpace({ spaceKey });

      return {
        success: true,
        data: space,
        result: this.formatResult(space, format),
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
   * List pages in a space or by CQL query
   */
  async listPages(
    profileName: string,
    spaceKey?: string,
    title?: string,
    limit = 25,
    start = 0,
    format: 'json' | 'toon' = 'json'
  ): Promise<ApiResult> {
    try {
      const client = this.getClient(profileName);

      // Build CQL query
      let cql = 'type=page';
      if (spaceKey) {
        cql += ` AND space="${spaceKey}"`;
      }
      if (title) {
        cql += ` AND title~"${title}"`;
      }

      const response = await client.content.searchContentByCQL({
        cql,
        limit,
        start,
      });

      // Simplify page data for display
      const simplifiedPages =
        response.results?.map(page => ({
          id: page.id,
          title: page.title,
          type: page.type,
          status: page.status,
          spaceKey: (page as { space?: { key?: string } }).space?.key,
        })) || [];

      return {
        success: true,
        data: simplifiedPages,
        result: this.formatResult(simplifiedPages, format),
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
   * Get page details
   */
  async getPage(profileName: string, pageId: string, format: 'json' | 'toon' = 'json'): Promise<ApiResult> {
    try {
      const client = this.getClient(profileName);
      const page = await client.content.getContentById({
        id: pageId,
        expand: ['body.storage', 'version', 'space'],
      });

      return {
        success: true,
        data: page,
        result: this.formatResult(page, format),
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
   * Create a new page
   */
  async createPage(
    profileName: string,
    spaceKey: string,
    title: string,
    body: string,
    parentId?: string,
    format: 'json' | 'toon' = 'json'
  ): Promise<ApiResult> {
    try {
      const client = this.getClient(profileName);

      const contentBody: {
        type: 'page';
        title: string;
        space: { key: string };
        body: { storage: { value: string; representation: 'storage' } };
        ancestors?: Array<{ id: string }>;
      } = {
        type: 'page',
        title,
        space: { key: spaceKey },
        body: {
          storage: {
            value: body,
            representation: 'storage',
          },
        },
      };

      if (parentId) {
        contentBody.ancestors = [{ id: parentId }];
      }

      const response = await client.content.createContent(contentBody);

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
   * Update an existing page
   */
  async updatePage(
    profileName: string,
    pageId: string,
    title: string,
    body: string,
    version: number
  ): Promise<ApiResult> {
    try {
      const client = this.getClient(profileName);

      await client.content.updateContent({
        id: pageId,
        body: {
          type: 'page',
          title,
          body: {
            storage: {
              value: body,
              representation: 'storage',
            },
          },
          version: {
            number: version + 1,
          },
        },
      });

      return {
        success: true,
        result: `Page ${pageId} updated successfully!`,
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
   * Add a comment to a page
   */
  async addComment(
    profileName: string,
    pageId: string,
    body: string,
    format: 'json' | 'toon' = 'json'
  ): Promise<ApiResult> {
    try {
      const client = this.getClient(profileName);

      const response = await client.content.createContent({
        type: 'comment',
        container: {
          id: pageId,
          type: 'page',
        },
        body: {
          storage: {
            value: body,
            representation: 'storage',
          },
        },
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
   * Delete a page
   */
  async deletePage(profileName: string, pageId: string): Promise<ApiResult> {
    try {
      const client = this.getClient(profileName);
      await client.content.deleteContent({ id: pageId });

      return {
        success: true,
        result: `Page ${pageId} deleted successfully!`,
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
        // Search for user by username
        const users = await client.search.searchUser({
          cql: `user.fullname~"${username}"`,
          limit: 1,
        });
        if (users.results && users.results.length > 0) {
          return {
            success: true,
            data: users.results[0],
            result: this.formatResult(users.results[0], format),
          };
        }
        return {
          success: false,
          error: `ERROR: User "${username}" not found`,
        };
      } else {
        // Get current user
        const user = await client.users.getCurrentUser();
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
   * Test Confluence API connection
   */
  async testConnection(profileName: string): Promise<ApiResult> {
    try {
      const client = this.getClient(profileName);
      const currentUser = await client.users.getCurrentUser();

      return {
        success: true,
        data: { currentUser },
        result: `Connection successful!\n\nProfile: ${profileName}\nLogged in as: ${currentUser.displayName} (${currentUser.email})`,
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
}
