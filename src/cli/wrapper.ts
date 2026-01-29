import readline from 'readline';

import { getCurrentVersion, printAvailableCommands, printCommandDetail } from '../commands/index.js';
import { COMMANDS } from '../config/index.js';
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
  testConnection,
  updateIssue,
} from '../utils/index.js';
import type { Config } from '../utils/index.js';

/**
 * Main CLI class for Jira API interaction
 */
export class wrapper {
  private rl: readline.Interface;
  private config: Config | null = null;
  private currentFormat: 'json' | 'toon' = 'json';

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'jira> ',
    });
  }

  /**
   * Initialize the CLI and load configuration
   */
  async connect(): Promise<void> {
    try {
      this.config = loadConfig();
      this.currentFormat = this.config.defaultFormat;

      this.printHelp();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(errorMessage);
      process.exit(1);
    }
  }

  /**
   * Handles user input commands
   * @param input - The raw user input string
   */
  private async handleCommand(input: string): Promise<void> {
    const trimmed = input.trim();

    if (!trimmed) {
      this.rl.prompt();
      return;
    }

    // Handle special commands
    if (trimmed === 'exit' || trimmed === 'quit' || trimmed === 'q') {
      await this.disconnect();
      return;
    }

    if (trimmed === 'help' || trimmed === '?') {
      this.printHelp();
      this.rl.prompt();
      return;
    }

    if (trimmed === 'commands') {
      printAvailableCommands();
      this.rl.prompt();
      return;
    }

    if (trimmed === 'clear') {
      console.clear();
      this.rl.prompt();
      return;
    }

    if (trimmed.startsWith('format ')) {
      const newFormat = trimmed.substring(7).trim() as 'json' | 'toon';
      if (['json', 'toon'].includes(newFormat)) {
        this.currentFormat = newFormat;
        console.log(`✓ Output format set to: ${newFormat}`);
      } else {
        console.error('ERROR: Invalid format. Choose: json or toon');
      }
      this.rl.prompt();
      return;
    }

    // Parse command invocation: command [args...]
    const firstSpaceIndex = trimmed.indexOf(' ');
    const command = firstSpaceIndex === -1 ? trimmed : trimmed.substring(0, firstSpaceIndex);
    const arg = firstSpaceIndex === -1 ? '' : trimmed.substring(firstSpaceIndex + 1).trim();

    if (arg === '-h') {
      printCommandDetail(command);
      this.rl.prompt();
      return;
    }

    await this.runCommand(command, arg);
  }

  /**
   * Runs a Jira API command
   * @param command - The command name to execute
   * @param arg - JSON string or empty string for the command arguments
   * @throws {SyntaxError} If arg is malformed JSON (caught and logged as error)
   * @throws {Error} For Jira API errors (caught and logged as error)
   */
  private async runCommand(command: string, arg: string): Promise<void> {
    if (!this.config) {
      console.log('Configuration not loaded!');
      this.rl.prompt();
      return;
    }

    try {
      // Parse arguments
      const args = arg && arg.trim() !== '' ? JSON.parse(arg) : {};
      const format = args.format || this.currentFormat;

      let result;

      switch (command) {
        case 'list-projects':
          result = await listProjects(format);
          break;

        case 'get-project':
          if (!args.projectIdOrKey) {
            console.error('ERROR: "projectIdOrKey" parameter is required');
            this.rl.prompt();
            return;
          }
          result = await getProject(args.projectIdOrKey, format);
          break;

        case 'list-issues':
          result = await listIssues(args.jql, args.maxResults, args.startAt, format);
          break;

        case 'get-issue':
          if (!args.issueIdOrKey) {
            console.error('ERROR: "issueIdOrKey" parameter is required');
            this.rl.prompt();
            return;
          }
          result = await getIssue(args.issueIdOrKey, format);
          break;

        case 'create-issue':
          if (!args.fields) {
            console.error('ERROR: "fields" parameter is required');
            this.rl.prompt();
            return;
          }
          result = await createIssue(args.fields, args.markdown || false, format);
          break;

        case 'update-issue':
          if (!args.issueIdOrKey || !args.fields) {
            console.error('ERROR: "issueIdOrKey" and "fields" parameters are required');
            this.rl.prompt();
            return;
          }
          result = await updateIssue(args.issueIdOrKey, args.fields, args.markdown || false);
          break;

        case 'add-comment':
          if (!args.issueIdOrKey || !args.body) {
            console.error('ERROR: "issueIdOrKey" and "body" parameters are required');
            this.rl.prompt();
            return;
          }
          result = await addComment(args.issueIdOrKey, args.body, args.markdown || false, format);
          break;

        case 'delete-issue':
          if (!args.issueIdOrKey) {
            console.error('ERROR: "issueIdOrKey" parameter is required');
            this.rl.prompt();
            return;
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
            this.rl.prompt();
            return;
          }
          result = await downloadAttachment(args.issueIdOrKey, args.attachmentId, args.outputPath);
          break;

        default:
          console.error(`Unknown command: ${command}. Type "commands" to see available commands.`);
          this.rl.prompt();
          return;
      }

      // Display result
      if (result.success) {
        console.log('\n' + result.result);
      } else {
        console.error('\n' + result.error);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error running command:', errorMessage);
    }

    this.rl.prompt();
  }

  /**
   * Prints help message
   */
  private printHelp(): void {
    const version = getCurrentVersion();
    const currentFormat = this.currentFormat;
    const commandList = COMMANDS.join(', ');

    console.log(`
Jira API CLI v${version}

Current Settings:
  Format:  ${currentFormat}

Usage:

commands              list all available Jira API commands
<command> -h          quick help on <command>
<command> <arg>       run <command> with JSON argument
format <type>         set output format (json, toon)
clear                 clear the screen
exit, quit, q         exit the CLI

All commands:

${commandList}

Examples:
  list-projects
  get-project {"projectIdOrKey":"PROJ"}
  list-issues {"jql":"project = PROJ AND status = Open","maxResults":10}
  get-issue {"issueIdOrKey":"PROJ-123"}
  create-issue {"fields":{"summary":"New task","project":{"key":"PROJ"},"issuetype":{"name":"Task"}}}
  test-connection

`);
  }

  /**
   * Starts the interactive REPL loop
   */
  async start(): Promise<void> {
    this.rl.prompt();

    this.rl.on('line', async line => {
      await this.handleCommand(line);
    });

    this.rl.on('close', async () => {
      clearClients();
      process.exit(0);
    });

    const gracefulShutdown = async () => {
      try {
        await this.disconnect();
      } catch (error) {
        console.error('Error during shutdown:', error);
      } finally {
        process.exit(0);
      }
    };

    ['SIGINT', 'SIGTERM'].forEach(sig => {
      process.on(sig, () => {
        gracefulShutdown();
      });
    });
  }

  /**
   * Disconnects from Jira and closes the CLI
   */
  private async disconnect(): Promise<void> {
    console.log('\nClosing Jira connections...');
    clearClients();
    this.rl.close();
  }
}
