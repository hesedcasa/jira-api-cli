/**
 * Confluence API client wrapper functions
 */
import { loadConfig } from './config-loader.js';
import type { ApiResult } from './confluence-utils.js';
import { ConfluenceUtil } from './confluence-utils.js';

const projectRoot = process.env.CLAUDE_PROJECT_ROOT || process.cwd();

let confluenceUtil: ConfluenceUtil | null = null;

/**
 * Initialize Confluence utility
 */
async function initConfluence(): Promise<ConfluenceUtil> {
  if (confluenceUtil) return confluenceUtil;

  try {
    const config = loadConfig(projectRoot);
    confluenceUtil = new ConfluenceUtil(config);
    return confluenceUtil;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to initialize Confluence client: ${errorMessage}`);
  }
}

/**
 * List all spaces
 * @param profile - Confluence profile name
 * @param format - Output format (json, toon)
 */
export async function listSpaces(profile: string, format: 'json' | 'toon' = 'json'): Promise<ApiResult> {
  const confluence = await initConfluence();
  return await confluence.listSpaces(profile, format);
}

/**
 * Get space details
 * @param profile - Confluence profile name
 * @param spaceKey - Space key
 * @param format - Output format (json, toon)
 */
export async function getSpace(profile: string, spaceKey: string, format: 'json' | 'toon' = 'json'): Promise<ApiResult> {
  const confluence = await initConfluence();
  return await confluence.getSpace(profile, spaceKey, format);
}

/**
 * List pages in a space or by search criteria
 * @param profile - Confluence profile name
 * @param spaceKey - Space key (optional)
 * @param title - Title search string (optional)
 * @param limit - Maximum number of results
 * @param start - Starting index for pagination
 * @param format - Output format (json, toon)
 */
export async function listPages(
  profile: string,
  spaceKey?: string,
  title?: string,
  limit = 25,
  start = 0,
  format: 'json' | 'toon' = 'json'
): Promise<ApiResult> {
  const confluence = await initConfluence();
  return await confluence.listPages(profile, spaceKey, title, limit, start, format);
}

/**
 * Get page details
 * @param profile - Confluence profile name
 * @param pageId - Page ID
 * @param format - Output format (json, toon)
 */
export async function getPage(profile: string, pageId: string, format: 'json' | 'toon' = 'json'): Promise<ApiResult> {
  const confluence = await initConfluence();
  return await confluence.getPage(profile, pageId, format);
}

/**
 * Create a new page
 * @param profile - Confluence profile name
 * @param spaceKey - Space key where the page will be created
 * @param title - Page title
 * @param body - Page body content (storage format)
 * @param parentId - Parent page ID (optional)
 * @param format - Output format (json, toon)
 */
export async function createPage(
  profile: string,
  spaceKey: string,
  title: string,
  body: string,
  parentId?: string,
  format: 'json' | 'toon' = 'json'
): Promise<ApiResult> {
  const confluence = await initConfluence();
  return await confluence.createPage(profile, spaceKey, title, body, parentId, format);
}

/**
 * Update an existing page
 * @param profile - Confluence profile name
 * @param pageId - Page ID to update
 * @param title - New page title
 * @param body - New page body content (storage format)
 * @param version - Current page version number
 */
export async function updatePage(
  profile: string,
  pageId: string,
  title: string,
  body: string,
  version: number
): Promise<ApiResult> {
  const confluence = await initConfluence();
  return await confluence.updatePage(profile, pageId, title, body, version);
}

/**
 * Add a comment to a page
 * @param profile - Confluence profile name
 * @param pageId - Page ID to add comment to
 * @param body - Comment body content (storage format)
 * @param format - Output format (json, toon)
 */
export async function addComment(
  profile: string,
  pageId: string,
  body: string,
  format: 'json' | 'toon' = 'json'
): Promise<ApiResult> {
  const confluence = await initConfluence();
  return await confluence.addComment(profile, pageId, body, format);
}

/**
 * Delete a page
 * @param profile - Confluence profile name
 * @param pageId - Page ID to delete
 */
export async function deletePage(profile: string, pageId: string): Promise<ApiResult> {
  const confluence = await initConfluence();
  return await confluence.deletePage(profile, pageId);
}

/**
 * Get user information
 * @param profile - Confluence profile name
 * @param accountId - User account ID
 * @param username - Username
 * @param format - Output format (json, toon)
 */
export async function getUser(
  profile: string,
  accountId?: string,
  username?: string,
  format: 'json' | 'toon' = 'json'
): Promise<ApiResult> {
  const confluence = await initConfluence();
  return await confluence.getUser(profile, accountId, username, format);
}

/**
 * Test Confluence API connection
 * @param profile - Confluence profile name
 */
export async function testConnection(profile: string): Promise<ApiResult> {
  const confluence = await initConfluence();
  return await confluence.testConnection(profile);
}

/**
 * Clear Confluence client pool (for cleanup)
 */
export function clearClients(): void {
  if (confluenceUtil) {
    confluenceUtil.clearClients();
    confluenceUtil = null;
  }
}
