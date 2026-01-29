/**
 * Jira API client wrapper functions
 */
import { loadConfig } from './config-loader.js';
import type { ApiResult } from './jira-utils.js';
import { JiraUtil } from './jira-utils.js';

let jiraUtil: JiraUtil | null = null;

/**
 * Initialize Jira utility
 */
async function initJira(): Promise<JiraUtil> {
  if (jiraUtil) return jiraUtil;

  try {
    const config = loadConfig();
    jiraUtil = new JiraUtil(config);
    return jiraUtil;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to initialize Jira client: ${errorMessage}`);
  }
}

/**
 * List all projects
 * @param format - Output format (json, toon)
 */
export async function listProjects(format: 'json' | 'toon' = 'json'): Promise<ApiResult> {
  const jira = await initJira();
  return await jira.listProjects(format);
}

/**
 * Get project details
 * @param projectIdOrKey - Project ID or key
 * @param format - Output format (json, toon)
 */
export async function getProject(projectIdOrKey: string, format: 'json' | 'toon' = 'json'): Promise<ApiResult> {
  const jira = await initJira();
  return await jira.getProject(projectIdOrKey, format);
}

/**
 * List issues using JQL
 * @param jql - JQL query string
 * @param maxResults - Maximum number of results
 * @param startAt - Starting index
 * @param format - Output format (json, toon)
 */
export async function listIssues(
  jql?: string,
  maxResults = 50,
  startAt = 0,
  format: 'json' | 'toon' = 'json'
): Promise<ApiResult> {
  const jira = await initJira();
  return await jira.listIssues(jql, maxResults, startAt, format);
}

/**
 * Get issue details
 * @param issueIdOrKey - Issue ID or key
 * @param format - Output format (json, toon)
 */
export async function getIssue(issueIdOrKey: string, format: 'json' | 'toon' = 'json'): Promise<ApiResult> {
  const jira = await initJira();
  return await jira.getIssue(issueIdOrKey, format);
}

/**
 * Create a new issue
 * @param fields - Issue fields
 * @param markdown - Whether to convert markdown to ADF
 * @param format - Output format (json, toon)
 */
export async function createIssue(
  fields: Record<string, unknown>,
  markdown = false,
  format: 'json' | 'toon' = 'json'
): Promise<ApiResult> {
  const jira = await initJira();
  return await jira.createIssue(fields, markdown, format);
}

/**
 * Update an existing issue
 * @param issueIdOrKey - Issue ID or key
 * @param fields - Issue fields to update
 * @param markdown - Whether to convert markdown to ADF
 * @returns ApiResult with success message (note: update operations don't return formatted data, unlike query operations)
 */
export async function updateIssue(
  issueIdOrKey: string,
  fields: Record<string, unknown>,
  markdown = false
): Promise<ApiResult> {
  const jira = await initJira();
  return await jira.updateIssue(issueIdOrKey, fields, markdown);
}

/**
 * Add a comment to an issue
 * @param issueIdOrKey - Issue ID or key
 * @param body - Comment body
 * @param markdown - Whether to convert markdown to ADF
 * @param format - Output format (json, toon)
 */
export async function addComment(
  issueIdOrKey: string,
  body: string,
  markdown = false,
  format: 'json' | 'toon' = 'json'
): Promise<ApiResult> {
  const jira = await initJira();
  return await jira.addComment(issueIdOrKey, body, markdown, format);
}

/**
 * Delete an issue
 * @param issueIdOrKey - Issue ID or key
 * @returns ApiResult with success message (note: delete operations don't return formatted data, unlike query operations)
 */
export async function deleteIssue(issueIdOrKey: string): Promise<ApiResult> {
  const jira = await initJira();
  return await jira.deleteIssue(issueIdOrKey);
}

/**
 * Get user information
 * @param accountId - User account ID
 * @param username - Username (deprecated, use accountId)
 * @param format - Output format (json, toon)
 */
export async function getUser(
  accountId?: string,
  username?: string,
  format: 'json' | 'toon' = 'json'
): Promise<ApiResult> {
  const jira = await initJira();
  return await jira.getUser(accountId, username, format);
}

/**
 * Test Jira API connection
 */
export async function testConnection(): Promise<ApiResult> {
  const jira = await initJira();
  return await jira.testConnection();
}

/**
 * Clear clients (for cleanup)
 */
export function clearClients(): void {
  if (jiraUtil) {
    jiraUtil.clearClients();
    jiraUtil = null;
  }
}

/**
 * Download attachment from an issue
 * @param issueIdOrKey - Issue ID or key
 * @param attachmentId - Attachment ID
 * @param outputPath - Output file path (optional)
 */
export async function downloadAttachment(
  issueIdOrKey: string,
  attachmentId: string,
  outputPath?: string
): Promise<ApiResult> {
  const jira = await initJira();
  return await jira.downloadAttachment(issueIdOrKey, attachmentId, outputPath);
}
