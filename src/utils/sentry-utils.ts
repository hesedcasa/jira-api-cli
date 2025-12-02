import { encode } from '@toon-format/toon';
import axios, { type AxiosInstance } from 'axios';

import type { Config, SentryClientOptions } from './config-loader.js';
import { getSentryClientOptions } from './config-loader.js';

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
 * Sentry API Utility Module
 * Provides core Sentry API operations with formatting
 */
export class SentryUtil {
  private config: Config;
  private clientPool: Map<string, AxiosInstance>;

  constructor(config: Config) {
    this.config = config;
    this.clientPool = new Map();
  }

  /**
   * Get or create Sentry HTTP client for a profile
   */
  getClient(profileName: string): AxiosInstance {
    if (this.clientPool.has(profileName)) {
      return this.clientPool.get(profileName)!;
    }

    const options = getSentryClientOptions(this.config, profileName);
    const client = axios.create({
      baseURL: options.baseUrl,
      headers: {
        Authorization: `Bearer ${options.authToken}`,
        'Content-Type': 'application/json',
      },
    });

    this.clientPool.set(profileName, client);

    return client;
  }

  /**
   * Get client options for a profile
   */
  getClientOptions(profileName: string): SentryClientOptions {
    return getSentryClientOptions(this.config, profileName);
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
   * List a project's error events
   */
  async listProjectEvents(
    profileName: string,
    projectSlug: string,
    params?: {
      statsPeriod?: string;
      start?: string;
      end?: string;
      cursor?: string;
      full?: boolean;
    },
    format: 'json' | 'toon' = 'json'
  ): Promise<ApiResult> {
    try {
      const client = this.getClient(profileName);
      const options = this.getClientOptions(profileName);

      const response = await client.get(`/projects/${options.organization}/${projectSlug}/events/`, {
        params,
      });

      return {
        success: true,
        data: response.data,
        result: this.formatResult(response.data, format),
      };
    } catch (error: unknown) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.detail || error.message
        : error instanceof Error
          ? error.message
          : String(error);
      return {
        success: false,
        error: `ERROR: ${errorMessage}`,
      };
    }
  }

  /**
   * List a project's issues
   */
  async listProjectIssues(
    profileName: string,
    projectSlug: string,
    params?: {
      statsPeriod?: string;
      shortIdLookup?: boolean;
      query?: string;
      cursor?: string;
    },
    format: 'json' | 'toon' = 'json'
  ): Promise<ApiResult> {
    try {
      const client = this.getClient(profileName);
      const options = this.getClientOptions(profileName);

      const response = await client.get(`/projects/${options.organization}/${projectSlug}/issues/`, {
        params,
      });

      return {
        success: true,
        data: response.data,
        result: this.formatResult(response.data, format),
      };
    } catch (error: unknown) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.detail || error.message
        : error instanceof Error
          ? error.message
          : String(error);
      return {
        success: false,
        error: `ERROR: ${errorMessage}`,
      };
    }
  }

  /**
   * List an organization's issues
   */
  async listOrgIssues(
    profileName: string,
    params?: {
      statsPeriod?: string;
      start?: string;
      end?: string;
      project?: number[];
      environment?: string[];
      query?: string;
      sort?: string;
      limit?: number;
      cursor?: string;
    },
    format: 'json' | 'toon' = 'json'
  ): Promise<ApiResult> {
    try {
      const client = this.getClient(profileName);
      const options = this.getClientOptions(profileName);

      const response = await client.get(`/organizations/${options.organization}/issues/`, {
        params,
      });

      return {
        success: true,
        data: response.data,
        result: this.formatResult(response.data, format),
      };
    } catch (error: unknown) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.detail || error.message
        : error instanceof Error
          ? error.message
          : String(error);
      return {
        success: false,
        error: `ERROR: ${errorMessage}`,
      };
    }
  }

  /**
   * Retrieve an issue
   */
  async getIssue(profileName: string, issueId: string, format: 'json' | 'toon' = 'json'): Promise<ApiResult> {
    try {
      const client = this.getClient(profileName);
      const options = this.getClientOptions(profileName);

      const response = await client.get(`/organizations/${options.organization}/issues/${issueId}/`);

      return {
        success: true,
        data: response.data,
        result: this.formatResult(response.data, format),
      };
    } catch (error: unknown) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.detail || error.message
        : error instanceof Error
          ? error.message
          : String(error);
      return {
        success: false,
        error: `ERROR: ${errorMessage}`,
      };
    }
  }

  /**
   * Update an issue
   */
  async updateIssue(
    profileName: string,
    issueId: string,
    data: {
      status?: string;
      statusDetails?: Record<string, unknown>;
      assignedTo?: string;
      hasSeen?: boolean;
      isBookmarked?: boolean;
      isSubscribed?: boolean;
      isPublic?: boolean;
    }
  ): Promise<ApiResult> {
    try {
      const client = this.getClient(profileName);
      const options = this.getClientOptions(profileName);

      const response = await client.put(`/organizations/${options.organization}/issues/${issueId}/`, data);

      return {
        success: true,
        data: response.data,
        result: `✅ Issue ${issueId} updated successfully!`,
      };
    } catch (error: unknown) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.detail || error.message
        : error instanceof Error
          ? error.message
          : String(error);
      return {
        success: false,
        error: `ERROR: ${errorMessage}`,
      };
    }
  }

  /**
   * List an issue's events
   */
  async listIssueEvents(
    profileName: string,
    issueId: string,
    params?: {
      start?: string;
      end?: string;
      statsPeriod?: string;
      environment?: string[];
      full?: boolean;
      cursor?: string;
    },
    format: 'json' | 'toon' = 'json'
  ): Promise<ApiResult> {
    try {
      const client = this.getClient(profileName);
      const options = this.getClientOptions(profileName);

      const response = await client.get(`/organizations/${options.organization}/issues/${issueId}/events/`, {
        params,
      });

      return {
        success: true,
        data: response.data,
        result: this.formatResult(response.data, format),
      };
    } catch (error: unknown) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.detail || error.message
        : error instanceof Error
          ? error.message
          : String(error);
      return {
        success: false,
        error: `ERROR: ${errorMessage}`,
      };
    }
  }

  /**
   * Retrieve an event for a project
   */
  async getEvent(
    profileName: string,
    projectSlug: string,
    eventId: string,
    format: 'json' | 'toon' = 'json'
  ): Promise<ApiResult> {
    try {
      const client = this.getClient(profileName);
      const options = this.getClientOptions(profileName);

      const response = await client.get(`/projects/${options.organization}/${projectSlug}/events/${eventId}/`);

      return {
        success: true,
        data: response.data,
        result: this.formatResult(response.data, format),
      };
    } catch (error: unknown) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.detail || error.message
        : error instanceof Error
          ? error.message
          : String(error);
      return {
        success: false,
        error: `ERROR: ${errorMessage}`,
      };
    }
  }

  /**
   * Retrieve an issue event (specific event from an issue)
   */
  async getIssueEvent(
    profileName: string,
    issueId: string,
    eventId: string,
    format: 'json' | 'toon' = 'json'
  ): Promise<ApiResult> {
    try {
      const client = this.getClient(profileName);
      const options = this.getClientOptions(profileName);

      const response = await client.get(`/organizations/${options.organization}/issues/${issueId}/events/${eventId}/`);

      return {
        success: true,
        data: response.data,
        result: this.formatResult(response.data, format),
      };
    } catch (error: unknown) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.detail || error.message
        : error instanceof Error
          ? error.message
          : String(error);
      return {
        success: false,
        error: `ERROR: ${errorMessage}`,
      };
    }
  }

  /**
   * Retrieve tag details for an issue
   */
  async getTagDetails(
    profileName: string,
    issueId: string,
    tagKey: string,
    params?: {
      environment?: string[];
    },
    format: 'json' | 'toon' = 'json'
  ): Promise<ApiResult> {
    try {
      const client = this.getClient(profileName);
      const options = this.getClientOptions(profileName);

      const response = await client.get(`/organizations/${options.organization}/issues/${issueId}/tags/${tagKey}/`, {
        params,
      });

      return {
        success: true,
        data: response.data,
        result: this.formatResult(response.data, format),
      };
    } catch (error: unknown) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.detail || error.message
        : error instanceof Error
          ? error.message
          : String(error);
      return {
        success: false,
        error: `ERROR: ${errorMessage}`,
      };
    }
  }

  /**
   * List a tag's values for an issue
   */
  async listTagValues(
    profileName: string,
    issueId: string,
    tagKey: string,
    params?: {
      environment?: string[];
    },
    format: 'json' | 'toon' = 'json'
  ): Promise<ApiResult> {
    try {
      const client = this.getClient(profileName);
      const options = this.getClientOptions(profileName);

      const response = await client.get(
        `/organizations/${options.organization}/issues/${issueId}/tags/${tagKey}/values/`,
        {
          params,
        }
      );

      return {
        success: true,
        data: response.data,
        result: this.formatResult(response.data, format),
      };
    } catch (error: unknown) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.detail || error.message
        : error instanceof Error
          ? error.message
          : String(error);
      return {
        success: false,
        error: `ERROR: ${errorMessage}`,
      };
    }
  }

  /**
   * List an issue's hashes
   */
  async listIssueHashes(profileName: string, issueId: string, format: 'json' | 'toon' = 'json'): Promise<ApiResult> {
    try {
      const client = this.getClient(profileName);
      const options = this.getClientOptions(profileName);

      const response = await client.get(`/organizations/${options.organization}/issues/${issueId}/hashes/`);

      return {
        success: true,
        data: response.data,
        result: this.formatResult(response.data, format),
      };
    } catch (error: unknown) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.detail || error.message
        : error instanceof Error
          ? error.message
          : String(error);
      return {
        success: false,
        error: `ERROR: ${errorMessage}`,
      };
    }
  }

  /**
   * Debug issues related to source maps for a given event
   */
  async debugSourceMaps(
    profileName: string,
    projectSlug: string,
    eventId: string,
    params?: {
      frame_idx?: string;
      exception_idx?: string;
    },
    format: 'json' | 'toon' = 'json'
  ): Promise<ApiResult> {
    try {
      const client = this.getClient(profileName);
      const options = this.getClientOptions(profileName);

      const response = await client.get(
        `/projects/${options.organization}/${projectSlug}/events/${eventId}/source-map-debug/`,
        {
          params,
        }
      );

      return {
        success: true,
        data: response.data,
        result: this.formatResult(response.data, format),
      };
    } catch (error: unknown) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.detail || error.message
        : error instanceof Error
          ? error.message
          : String(error);
      return {
        success: false,
        error: `ERROR: ${errorMessage}`,
      };
    }
  }

  /**
   * Test Sentry API connection
   */
  async testConnection(profileName: string): Promise<ApiResult> {
    try {
      const client = this.getClient(profileName);
      const options = this.getClientOptions(profileName);

      // Test connection by fetching organization issues
      const response = await client.get(`/organizations/${options.organization}/issues/`, {
        params: { limit: 1 },
      });

      return {
        success: true,
        data: { organization: options.organization, baseUrl: options.baseUrl },
        result: `✅ Connection successful!\n\nProfile: ${profileName}\nOrganization: ${options.organization}\nBase URL: ${options.baseUrl}\nStatus: Connected`,
      };
    } catch (error: unknown) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.detail || error.message
        : error instanceof Error
          ? error.message
          : String(error);
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
