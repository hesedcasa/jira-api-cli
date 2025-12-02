/**
 * Sentry API client wrapper functions
 */
import { loadConfig } from './config-loader.js';
import type { ApiResult } from './sentry-utils.js';
import { SentryUtil } from './sentry-utils.js';

const projectRoot = process.env.CLAUDE_PROJECT_ROOT || process.cwd();

let sentryUtil: SentryUtil | null = null;

/**
 * Initialize Sentry utility
 */
async function initSentry(): Promise<SentryUtil> {
  if (sentryUtil) return sentryUtil;

  try {
    const config = loadConfig(projectRoot);
    sentryUtil = new SentryUtil(config);
    return sentryUtil;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to initialize Sentry client: ${errorMessage}`);
  }
}

/**
 * List a project's error events
 * @param profile - Sentry profile name
 * @param projectSlug - Project slug or ID
 * @param params - Query parameters
 * @param format - Output format (json, toon)
 */
export async function listProjectEvents(
  profile: string,
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
  const sentry = await initSentry();
  return await sentry.listProjectEvents(profile, projectSlug, params, format);
}

/**
 * List a project's issues
 * @param profile - Sentry profile name
 * @param projectSlug - Project slug or ID
 * @param params - Query parameters
 * @param format - Output format (json, toon)
 */
export async function listProjectIssues(
  profile: string,
  projectSlug: string,
  params?: {
    statsPeriod?: string;
    shortIdLookup?: boolean;
    query?: string;
    cursor?: string;
  },
  format: 'json' | 'toon' = 'json'
): Promise<ApiResult> {
  const sentry = await initSentry();
  return await sentry.listProjectIssues(profile, projectSlug, params, format);
}

/**
 * List an organization's issues
 * @param profile - Sentry profile name
 * @param params - Query parameters
 * @param format - Output format (json, toon)
 */
export async function listOrgIssues(
  profile: string,
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
  const sentry = await initSentry();
  return await sentry.listOrgIssues(profile, params, format);
}

/**
 * Retrieve an issue
 * @param profile - Sentry profile name
 * @param issueId - Issue ID
 * @param format - Output format (json, toon)
 */
export async function getIssue(profile: string, issueId: string, format: 'json' | 'toon' = 'json'): Promise<ApiResult> {
  const sentry = await initSentry();
  return await sentry.getIssue(profile, issueId, format);
}

/**
 * Update an issue
 * @param profile - Sentry profile name
 * @param issueId - Issue ID
 * @param data - Update data
 */
export async function updateIssue(
  profile: string,
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
  const sentry = await initSentry();
  return await sentry.updateIssue(profile, issueId, data);
}

/**
 * List an issue's events
 * @param profile - Sentry profile name
 * @param issueId - Issue ID
 * @param params - Query parameters
 * @param format - Output format (json, toon)
 */
export async function listIssueEvents(
  profile: string,
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
  const sentry = await initSentry();
  return await sentry.listIssueEvents(profile, issueId, params, format);
}

/**
 * Retrieve an event for a project
 * @param profile - Sentry profile name
 * @param projectSlug - Project slug or ID
 * @param eventId - Event ID
 * @param format - Output format (json, toon)
 */
export async function getEvent(
  profile: string,
  projectSlug: string,
  eventId: string,
  format: 'json' | 'toon' = 'json'
): Promise<ApiResult> {
  const sentry = await initSentry();
  return await sentry.getEvent(profile, projectSlug, eventId, format);
}

/**
 * Retrieve an issue event
 * @param profile - Sentry profile name
 * @param issueId - Issue ID
 * @param eventId - Event ID
 * @param format - Output format (json, toon)
 */
export async function getIssueEvent(
  profile: string,
  issueId: string,
  eventId: string,
  format: 'json' | 'toon' = 'json'
): Promise<ApiResult> {
  const sentry = await initSentry();
  return await sentry.getIssueEvent(profile, issueId, eventId, format);
}

/**
 * Retrieve tag details for an issue
 * @param profile - Sentry profile name
 * @param issueId - Issue ID
 * @param tagKey - Tag key
 * @param params - Query parameters
 * @param format - Output format (json, toon)
 */
export async function getTagDetails(
  profile: string,
  issueId: string,
  tagKey: string,
  params?: {
    environment?: string[];
  },
  format: 'json' | 'toon' = 'json'
): Promise<ApiResult> {
  const sentry = await initSentry();
  return await sentry.getTagDetails(profile, issueId, tagKey, params, format);
}

/**
 * List a tag's values for an issue
 * @param profile - Sentry profile name
 * @param issueId - Issue ID
 * @param tagKey - Tag key
 * @param params - Query parameters
 * @param format - Output format (json, toon)
 */
export async function listTagValues(
  profile: string,
  issueId: string,
  tagKey: string,
  params?: {
    environment?: string[];
  },
  format: 'json' | 'toon' = 'json'
): Promise<ApiResult> {
  const sentry = await initSentry();
  return await sentry.listTagValues(profile, issueId, tagKey, params, format);
}

/**
 * List an issue's hashes
 * @param profile - Sentry profile name
 * @param issueId - Issue ID
 * @param format - Output format (json, toon)
 */
export async function listIssueHashes(
  profile: string,
  issueId: string,
  format: 'json' | 'toon' = 'json'
): Promise<ApiResult> {
  const sentry = await initSentry();
  return await sentry.listIssueHashes(profile, issueId, format);
}

/**
 * Debug issues related to source maps for a given event
 * @param profile - Sentry profile name
 * @param projectSlug - Project slug or ID
 * @param eventId - Event ID
 * @param params - Query parameters
 * @param format - Output format (json, toon)
 */
export async function debugSourceMaps(
  profile: string,
  projectSlug: string,
  eventId: string,
  params?: {
    frame_idx?: string;
    exception_idx?: string;
  },
  format: 'json' | 'toon' = 'json'
): Promise<ApiResult> {
  const sentry = await initSentry();
  return await sentry.debugSourceMaps(profile, projectSlug, eventId, params, format);
}

/**
 * Test Sentry API connection
 * @param profile - Sentry profile name
 */
export async function testConnection(profile: string): Promise<ApiResult> {
  const sentry = await initSentry();
  return await sentry.testConnection(profile);
}

/**
 * Clear Sentry client pool (for cleanup)
 */
export function clearClients(): void {
  if (sentryUtil) {
    sentryUtil.clearClients();
    sentryUtil = null;
  }
}
