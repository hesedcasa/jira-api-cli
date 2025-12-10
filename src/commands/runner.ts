import {
  addComment,
  clearClients,
  createPage,
  deletePage,
  getPage,
  getSpace,
  getUser,
  listPages,
  listSpaces,
  loadConfig,
  testConnection,
  updatePage,
} from '../utils/index.js';

/**
 * Execute a Confluence API command in headless mode
 * @param command - The command name to execute
 * @param arg - JSON string or null for the command arguments
 */
export const runCommand = async (
  command: string,
  arg: string | null,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _flag: string | null
): Promise<void> => {
  try {
    // Load config to get default profile
    const projectRoot = process.env.CLAUDE_PROJECT_ROOT || process.cwd();
    const config = loadConfig(projectRoot);

    // Parse arguments
    const args = arg && arg.trim() !== '' ? JSON.parse(arg) : {};
    const profile = args.profile || config.defaultProfile;
    const format = args.format || config.defaultFormat;

    let result;

    switch (command) {
      case 'list-spaces':
        result = await listSpaces(profile, format);
        break;

      case 'get-space':
        if (!args.spaceKey) {
          console.error('ERROR: "spaceKey" parameter is required');
          process.exit(1);
        }
        result = await getSpace(profile, args.spaceKey, format);
        break;

      case 'list-pages':
        result = await listPages(profile, args.spaceKey, args.title, args.limit, args.start, format);
        break;

      case 'get-page':
        if (!args.pageId) {
          console.error('ERROR: "pageId" parameter is required');
          process.exit(1);
        }
        result = await getPage(profile, args.pageId, format);
        break;

      case 'create-page':
        if (!args.spaceKey || !args.title || !args.body) {
          console.error('ERROR: "spaceKey", "title", and "body" parameters are required');
          process.exit(1);
        }
        result = await createPage(profile, args.spaceKey, args.title, args.body, args.parentId, format);
        break;

      case 'update-page':
        if (!args.pageId || !args.title || !args.body || args.version === undefined) {
          console.error('ERROR: "pageId", "title", "body", and "version" parameters are required');
          process.exit(1);
        }
        result = await updatePage(profile, args.pageId, args.title, args.body, args.version);
        break;

      case 'add-comment':
        if (!args.pageId || !args.body) {
          console.error('ERROR: "pageId" and "body" parameters are required');
          process.exit(1);
        }
        result = await addComment(profile, args.pageId, args.body, format);
        break;

      case 'delete-page':
        if (!args.pageId) {
          console.error('ERROR: "pageId" parameter is required');
          process.exit(1);
        }
        result = await deletePage(profile, args.pageId);
        break;

      case 'get-user':
        result = await getUser(profile, args.accountId, args.username, format);
        break;

      case 'test-connection':
        result = await testConnection(profile);
        break;

      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }

    // Display result
    if (result.success) {
      console.log(result.result);
    } else {
      console.error(result.error);
      process.exit(1);
    }

    // Clear clients
    clearClients();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error executing command:', errorMessage);
    clearClients();
    process.exit(1);
  }
};
