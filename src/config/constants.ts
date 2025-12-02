/**
 * Sentry API CLI Commands Configuration
 */

/**
 * Available Sentry API commands
 */
export const COMMANDS: string[] = [
  'list-project-events',
  'list-project-issues',
  'list-org-issues',
  'get-issue',
  'update-issue',
  'list-issue-events',
  'get-event',
  'get-issue-event',
  'get-tag-details',
  'list-tag-values',
  'list-issue-hashes',
  'debug-source-maps',
  'test-connection',
];

/**
 * Brief descriptions for each command
 */
export const COMMANDS_INFO: string[] = [
  'List a project\'s error events',
  'List a project\'s issues',
  'List an organization\'s issues',
  'Retrieve an issue',
  'Update an issue',
  'List an issue\'s events',
  'Retrieve an event for a project',
  'Retrieve an issue event',
  'Retrieve tag details for an issue',
  'List a tag\'s values for an issue',
  'List an issue\'s hashes',
  'Debug issues related to source maps',
  'Test Sentry API connection',
];

/**
 * Detailed parameter information for each command
 */
export const COMMANDS_DETAIL: string[] = [
  `
Parameters:
- projectSlug (required): string - Project slug or ID
- statsPeriod (optional): string - Time period (e.g., "24h", "7d")
- start (optional): string - ISO-8601 timestamp
- end (optional): string - ISO-8601 timestamp
- cursor (optional): string - Pagination cursor
- full (optional): boolean - Include full event body
- profile (optional): string - Sentry profile name (default: configured default profile)
- format (optional): string - Output format: json or toon (default: json)

Example:
list-project-events '{"projectSlug":"my-project","statsPeriod":"24h","profile":"production","format":"json"}'`,
  `
Parameters:
- projectSlug (required): string - Project slug or ID
- statsPeriod (optional): string - Time period (default: "24h")
- shortIdLookup (optional): boolean - Enable short ID lookups
- query (optional): string - Search query (default: "is:unresolved")
- cursor (optional): string - Pagination cursor
- profile (optional): string - Sentry profile name (default: configured default profile)
- format (optional): string - Output format: json or toon (default: json)

Example:
list-project-issues '{"projectSlug":"my-project","query":"is:unresolved","profile":"production","format":"json"}'`,
  `
Parameters:
- statsPeriod (optional): string - Time period (e.g., "24h", "14d")
- start (optional): string - ISO-8601 timestamp
- end (optional): string - ISO-8601 timestamp
- project (optional): number[] - Filter by project IDs
- environment (optional): string[] - Filter by environments
- query (optional): string - Search query (default: "is:unresolved")
- sort (optional): string - Sort order (date, new, trends, freq, user, inbox)
- limit (optional): number - Maximum results (max 100)
- cursor (optional): string - Pagination cursor
- profile (optional): string - Sentry profile name (default: configured default profile)
- format (optional): string - Output format: json or toon (default: json)

Example:
list-org-issues '{"query":"is:unresolved","limit":50,"sort":"date","profile":"production","format":"json"}'`,
  `
Parameters:
- issueId (required): string - Issue ID
- profile (optional): string - Sentry profile name (default: configured default profile)
- format (optional): string - Output format: json or toon (default: json)

Example:
get-issue '{"issueId":"123456789","profile":"production","format":"json"}'`,
  `
Parameters:
- issueId (required): string - Issue ID
- status (optional): string - Issue status (resolved, resolvedInNextRelease, unresolved, ignored)
- statusDetails (optional): object - Additional status details
- assignedTo (optional): string - Actor ID or username
- hasSeen (optional): boolean - Mark as seen
- isBookmarked (optional): boolean - Bookmark status
- isSubscribed (optional): boolean - Subscription status
- isPublic (optional): boolean - Public visibility
- profile (optional): string - Sentry profile name (default: configured default profile)

Example:
update-issue '{"issueId":"123456789","status":"resolved","profile":"production"}'`,
  `
Parameters:
- issueId (required): string - Issue ID
- start (optional): string - ISO-8601 timestamp
- end (optional): string - ISO-8601 timestamp
- statsPeriod (optional): string - Time period
- environment (optional): string[] - Filter by environments
- full (optional): boolean - Include full event body
- cursor (optional): string - Pagination cursor
- profile (optional): string - Sentry profile name (default: configured default profile)
- format (optional): string - Output format: json or toon (default: json)

Example:
list-issue-events '{"issueId":"123456789","statsPeriod":"24h","profile":"production","format":"json"}'`,
  `
Parameters:
- projectSlug (required): string - Project slug or ID
- eventId (required): string - Event ID (hexadecimal)
- profile (optional): string - Sentry profile name (default: configured default profile)
- format (optional): string - Output format: json or toon (default: json)

Example:
get-event '{"projectSlug":"my-project","eventId":"abc123def456","profile":"production","format":"json"}'`,
  `
Parameters:
- issueId (required): string - Issue ID
- eventId (required): string - Event ID
- profile (optional): string - Sentry profile name (default: configured default profile)
- format (optional): string - Output format: json or toon (default: json)

Example:
get-issue-event '{"issueId":"123456789","eventId":"abc123def456","profile":"production","format":"json"}'`,
  `
Parameters:
- issueId (required): string - Issue ID
- tagKey (required): string - Tag key to look up
- environment (optional): string[] - Filter by environments
- profile (optional): string - Sentry profile name (default: configured default profile)
- format (optional): string - Output format: json or toon (default: json)

Example:
get-tag-details '{"issueId":"123456789","tagKey":"browser","profile":"production","format":"json"}'`,
  `
Parameters:
- issueId (required): string - Issue ID
- tagKey (required): string - Tag key to look up
- environment (optional): string[] - Filter by environments
- profile (optional): string - Sentry profile name (default: configured default profile)
- format (optional): string - Output format: json or toon (default: json)

Example:
list-tag-values '{"issueId":"123456789","tagKey":"environment","profile":"production","format":"json"}'`,
  `
Parameters:
- issueId (required): string - Issue ID
- profile (optional): string - Sentry profile name (default: configured default profile)
- format (optional): string - Output format: json or toon (default: json)

Example:
list-issue-hashes '{"issueId":"123456789","profile":"production","format":"json"}'`,
  `
Parameters:
- projectSlug (required): string - Project slug or ID
- eventId (required): string - Event ID
- frame_idx (optional): string - Frame index
- exception_idx (optional): string - Exception index
- profile (optional): string - Sentry profile name (default: configured default profile)
- format (optional): string - Output format: json or toon (default: json)

Example:
debug-source-maps '{"projectSlug":"my-project","eventId":"abc123def456","profile":"production","format":"json"}'`,
  `
Parameters:
- profile (optional): string - Sentry profile name (default: configured default profile)

Example:
test-connection '{"profile":"production"}'`,
];
