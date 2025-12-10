import readline from 'readline';

import { getCurrentVersion, printAvailableCommands, printCommandDetail } from '../commands/index.js';
import { COMMANDS } from '../config/index.js';
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
import type { Config } from '../utils/index.js';

/**
 * Main CLI class for Confluence API interaction
 */
export class wrapper {
  private rl: readline.Interface;
  private config: Config | null = null;
  private currentProfile: string | null = null;
  private currentFormat: 'json' | 'toon' = 'json';

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'confluence> ',
    });
  }

  /**
   * Initialize the CLI and load configuration
   */
  async connect(): Promise<void> {
    try {
      const projectRoot = process.env.CLAUDE_PROJECT_ROOT || process.cwd();
      this.config = loadConfig(projectRoot);
      this.currentProfile = this.config.defaultProfile;
      this.currentFormat = this.config.defaultFormat;

      this.printHelp();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Failed to load configuration:', errorMessage);
      console.error('\nMake sure:');
      console.error('1. .claude/confluence-connector.local.md exists');
      console.error('2. The file contains valid Confluence profiles in YAML frontmatter');
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

    if (trimmed.startsWith('profile ')) {
      const newProfile = trimmed.substring(8).trim();
      if (this.config && this.config.profiles[newProfile]) {
        this.currentProfile = newProfile;
        console.log(`Switched to profile: ${newProfile}`);
      } else {
        const available = this.config ? Object.keys(this.config.profiles).join(', ') : 'none';
        console.error(`ERROR: Profile "${newProfile}" not found. Available: ${available}`);
      }
      this.rl.prompt();
      return;
    }

    if (trimmed.startsWith('format ')) {
      const newFormat = trimmed.substring(7).trim() as 'json' | 'toon';
      if (['json', 'toon'].includes(newFormat)) {
        this.currentFormat = newFormat;
        console.log(`Output format set to: ${newFormat}`);
      } else {
        console.error('ERROR: Invalid format. Choose: json or toon');
      }
      this.rl.prompt();
      return;
    }

    if (trimmed === 'profiles') {
      if (this.config) {
        console.log('\nAvailable profiles:');
        Object.keys(this.config.profiles).forEach((name, i) => {
          const current = name === this.currentProfile ? ' (current)' : '';
          console.log(`${i + 1}. ${name}${current}`);
        });
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
   * Runs a Confluence API command
   * @param command - The command name to execute
   * @param arg - JSON string or null for the command arguments
   */
  private async runCommand(command: string, arg: string): Promise<void> {
    if (!this.config || !this.currentProfile) {
      console.log('Configuration not loaded!');
      this.rl.prompt();
      return;
    }

    try {
      // Parse arguments
      const args = arg && arg.trim() !== '' ? JSON.parse(arg) : {};
      const profile = args.profile || this.currentProfile;
      const format = args.format || this.currentFormat;

      let result;

      switch (command) {
        case 'list-spaces':
          result = await listSpaces(profile, format);
          break;

        case 'get-space':
          if (!args.spaceKey) {
            console.error('ERROR: "spaceKey" parameter is required');
            this.rl.prompt();
            return;
          }
          result = await getSpace(profile, args.spaceKey, format);
          break;

        case 'list-pages':
          result = await listPages(profile, args.spaceKey, args.title, args.limit, args.start, format);
          break;

        case 'get-page':
          if (!args.pageId) {
            console.error('ERROR: "pageId" parameter is required');
            this.rl.prompt();
            return;
          }
          result = await getPage(profile, args.pageId, format);
          break;

        case 'create-page':
          if (!args.spaceKey || !args.title || !args.body) {
            console.error('ERROR: "spaceKey", "title", and "body" parameters are required');
            this.rl.prompt();
            return;
          }
          result = await createPage(profile, args.spaceKey, args.title, args.body, args.parentId, format);
          break;

        case 'update-page':
          if (!args.pageId || !args.title || !args.body || args.version === undefined) {
            console.error('ERROR: "pageId", "title", "body", and "version" parameters are required');
            this.rl.prompt();
            return;
          }
          result = await updatePage(profile, args.pageId, args.title, args.body, args.version);
          break;

        case 'add-comment':
          if (!args.pageId || !args.body) {
            console.error('ERROR: "pageId" and "body" parameters are required');
            this.rl.prompt();
            return;
          }
          result = await addComment(profile, args.pageId, args.body, format);
          break;

        case 'delete-page':
          if (!args.pageId) {
            console.error('ERROR: "pageId" parameter is required');
            this.rl.prompt();
            return;
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
    const currentProfile = this.currentProfile || 'none';
    const currentFormat = this.currentFormat;
    const commandList = COMMANDS.join(', ');

    console.log(`
Confluence API CLI v${version}

Current Settings:
  Profile: ${currentProfile}
  Format:  ${currentFormat}

Usage:

commands              list all available Confluence API commands
<command> -h          quick help on <command>
<command> <arg>       run <command> with JSON argument
profile <name>        switch to a different Confluence profile
profiles              list all available profiles
format <type>         set output format (json, toon)
clear                 clear the screen
exit, quit, q         exit the CLI

All commands:

${commandList}

Examples:
  list-spaces
  get-space {"spaceKey":"DOCS"}
  list-pages {"spaceKey":"DOCS","title":"Getting Started","limit":10}
  get-page {"pageId":"123456"}
  create-page {"spaceKey":"DOCS","title":"New Page","body":"<p>Hello World</p>"}
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
   * Disconnects from Confluence and closes the CLI
   */
  private async disconnect(): Promise<void> {
    console.log('\nClosing Confluence connections...');
    clearClients();
    this.rl.close();
  }
}
