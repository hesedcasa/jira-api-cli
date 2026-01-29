import {
  addComment,
  clearClients,
  createIssue,
  deleteIssue,
  downloadAttachment,
  getIssue,
  getProject,
  getUser,
  listIssues,
  listProjects,
  loadConfig,
  setupConfig,
  testConnection,
  updateIssue,
} from '../utils/index.js';

/**
 * Execute a Jira API command in headless mode
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
    // Handle config command first (before loading config)
    if (command === 'config') {
      await setupConfig();
      clearClients();
      process.exit(0);
    }

    // Load config to get default format
    const config = loadConfig();

    // Parse arguments
    const args = arg && arg.trim() !== '' ? JSON.parse(arg) : {};
    const format = args.format || config.defaultFormat;

    let result;

    switch (command) {
      case 'list-projects':
        result = await listProjects(format);
        break;

      case 'get-project':
        if (!args.projectIdOrKey) {
          console.error('ERROR: "projectIdOrKey" parameter is required');
          process.exit(1);
        }
        result = await getProject(args.projectIdOrKey, format);
        break;

      case 'list-issues':
        result = await listIssues(args.jql, args.maxResults, args.startAt, format);
        break;

      case 'get-issue':
        if (!args.issueIdOrKey) {
          console.error('ERROR: "issueIdOrKey" parameter is required');
          process.exit(1);
        }
        result = await getIssue(args.issueIdOrKey, format);
        break;

      case 'create-issue':
        if (!args.fields) {
          console.error('ERROR: "fields" parameter is required');
          process.exit(1);
        }
        result = await createIssue(args.fields, args.markdown || false, format);
        break;

      case 'update-issue':
        if (!args.issueIdOrKey || !args.fields) {
          console.error('ERROR: "issueIdOrKey" and "fields" parameters are required');
          process.exit(1);
        }
        result = await updateIssue(args.issueIdOrKey, args.fields, args.markdown || false);
        break;

      case 'add-comment':
        if (!args.issueIdOrKey || !args.body) {
          console.error('ERROR: "issueIdOrKey" and "body" parameters are required');
          process.exit(1);
        }
        result = await addComment(args.issueIdOrKey, args.body, args.markdown || false, format);
        break;

      case 'delete-issue':
        if (!args.issueIdOrKey) {
          console.error('ERROR: "issueIdOrKey" parameter is required');
          process.exit(1);
        }
        result = await deleteIssue(args.issueIdOrKey);
        break;

      case 'get-user':
        result = await getUser(args.accountId, args.username, format);
        break;

      case 'test-connection':
        result = await testConnection();
        break;

      case 'download-attachment':
        if (!args.issueIdOrKey || !args.attachmentId) {
          console.error('ERROR: "issueIdOrKey" and "attachmentId" parameters are required');
          process.exit(1);
        }
        result = await downloadAttachment(args.issueIdOrKey, args.attachmentId, args.outputPath);
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
