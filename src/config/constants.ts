/**
 * Confluence API CLI Commands Configuration
 */

/**
 * Available Confluence API commands
 */
export const COMMANDS: string[] = [
  'list-spaces',
  'get-space',
  'list-pages',
  'get-page',
  'create-page',
  'update-page',
  'add-comment',
  'delete-page',
  'get-user',
  'test-connection',
];

/**
 * Brief descriptions for each command
 */
export const COMMANDS_INFO: string[] = [
  'List all accessible spaces',
  'Get details of a specific space',
  'List pages in a space or by search criteria',
  'Get details of a specific page',
  'Create a new page',
  'Update an existing page',
  'Add a comment to a page',
  'Delete a page',
  'Get user information',
  'Test Confluence API connection',
];

/**
 * Detailed parameter information for each command
 */
export const COMMANDS_DETAIL: string[] = [
  `
Parameters:
- profile (optional): string - Confluence profile name (default: configured default profile)
- format (optional): string - Output format: json or toon (default: json)

Example:
list-spaces '{"profile":"cloud","format":"json"}'`,
  `
Parameters:
- spaceKey (required): string - Space key
- profile (optional): string - Confluence profile name (default: configured default profile)
- format (optional): string - Output format: json or toon (default: json)

Example:
get-space '{"spaceKey":"DOCS","profile":"cloud","format":"json"}'`,
  `
Parameters:
- spaceKey (optional): string - Space key to filter pages
- title (optional): string - Title search string
- limit (optional): number - Maximum number of results (default: 25)
- start (optional): number - Starting index for pagination (default: 0)
- profile (optional): string - Confluence profile name (default: configured default profile)
- format (optional): string - Output format: json or toon (default: json)

Example:
list-pages '{"spaceKey":"DOCS","title":"Getting Started","limit":10,"profile":"cloud","format":"json"}'`,
  `
Parameters:
- pageId (required): string - Page ID
- profile (optional): string - Confluence profile name (default: configured default profile)
- format (optional): string - Output format: json or toon (default: json)

Example:
get-page '{"pageId":"123456","profile":"cloud","format":"json"}'`,
  `
Parameters:
- spaceKey (required): string - Space key where the page will be created
- title (required): string - Page title
- body (required): string - Page body content in storage format (XHTML)
- parentId (optional): string - Parent page ID for nested pages
- profile (optional): string - Confluence profile name (default: configured default profile)
- format (optional): string - Output format: json or toon (default: json)

Example:
create-page '{"spaceKey":"DOCS","title":"New Page","body":"<p>Hello World</p>","profile":"cloud","format":"json"}'`,
  `
Parameters:
- pageId (required): string - Page ID to update
- title (required): string - New page title
- body (required): string - New page body content in storage format (XHTML)
- version (required): number - Current page version number
- profile (optional): string - Confluence profile name (default: configured default profile)

Example:
update-page '{"pageId":"123456","title":"Updated Title","body":"<p>Updated content</p>","version":1,"profile":"cloud"}'`,
  `
Parameters:
- pageId (required): string - Page ID to add comment to
- body (required): string - Comment body content in storage format (XHTML)
- profile (optional): string - Confluence profile name (default: configured default profile)
- format (optional): string - Output format: json or toon (default: json)

Example:
add-comment '{"pageId":"123456","body":"<p>Great article!</p>","profile":"cloud"}'`,
  `
Parameters:
- pageId (required): string - Page ID to delete
- profile (optional): string - Confluence profile name (default: configured default profile)

Example:
delete-page '{"pageId":"123456","profile":"cloud"}'`,
  `
Parameters:
- accountId (optional): string - User account ID
- username (optional): string - Username to search for
- profile (optional): string - Confluence profile name (default: configured default profile)
- format (optional): string - Output format: json or toon (default: json)

Example:
get-user '{"accountId":"5b10a2844c20165700ede21g","profile":"cloud","format":"json"}'`,
  `
Parameters:
- profile (optional): string - Confluence profile name (default: configured default profile)

Example:
test-connection '{"profile":"cloud"}'`,
];
