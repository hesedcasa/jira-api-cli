# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

```bash
# Install dependencies
npm install

# Build the TypeScript source
npm run build

# Run the CLI (development mode with tsx)
npm start

# Run in development (same as start)
npm run dev

# Run tests
npm test                    # Run all tests once
npm run test:watch          # Run tests in watch mode
npm run test:ui             # Run tests with UI
npm run test:coverage       # Run tests with coverage report

# Code quality
npm run format              # Format code with ESLint and Prettier
npm run find-deadcode       # Find unused exports with ts-prune
npm run pre-commit          # Run format + find-deadcode

# Run single test file (pattern match)
npx vitest run jira-utils
npx vitest run -t "test name"

# Interactive configuration setup
bbk-cli config              # Setup or update configuration
```

## Project Architecture

This is a **Jira API CLI tool** that provides both interactive REPL and headless modes for Jira operations.

### Project Structure

```
src/
├── index.ts (29 lines)                    # Main entry point
├── cli/
│   ├── index.ts                           # Barrel export
│   └── wrapper.ts (334 lines)             # CLI class with REPL logic
├── commands/
│   ├── index.ts                           # Barrel export
│   ├── helpers.ts (45 lines)              # Command info helpers
│   └── runner.ts (121 lines)              # Headless command execution
├── config/
│   ├── index.ts                           # Barrel export
│   └── constants.ts (122 lines)           # Command definitions
└── utils/
    ├── index.ts                           # Barrel export
    ├── arg-parser.ts (74 lines)            # Command-line argument parser
    ├── config-loader.ts (120 lines)       # YAML config file loader
    ├── jira-client.ts (167 lines)         # Jira API wrapper functions
    └── jira-utils.ts (433 lines)          # Core Jira utility class

tests/
├── unit/
│   └── utils/
│       └── config-loader.test.ts          # Tests for config loading
└── integration/
    └── jira-client.test.ts                # Integration tests for Jira ops
```

### Core Components

#### Entry Point (`src/index.ts`)

- Bootstraps the application
- Parses command-line arguments via `parseArguments()`
- Routes to interactive REPL or headless mode

#### CLI Module (`src/cli/`)

- **wrapper class**: Main orchestrator managing:
  - `connect()` - Loads configuration from `~/.jiracli`
  - `start()` - Initiates interactive REPL with readline interface
  - `handleCommand()` - Parses and processes user commands
  - `runCommand()` - Executes Jira commands with result formatting
  - `disconnect()` - Graceful cleanup on exit signals (SIGINT/SIGTERM)

#### Commands Module (`src/commands/`)

- `helpers.ts` - Display command information and help
  - `printAvailableCommands()` - Lists all 12 available commands
  - `printCommandDetail(command)` - Shows detailed help for specific command
  - `getCurrentVersion()` - Reads version from package.json
- `runner.ts` - Execute commands in headless mode
  - `runCommand(command, arg, flag)` - Non-interactive command execution

#### Config Module (`src/config/`)

- `constants.ts` - Centralized configuration
  - `COMMANDS[]` - Array of 12 available Jira command names
  - `COMMANDS_INFO[]` - Brief descriptions for each command
  - `COMMANDS_DETAIL[]` - Detailed parameter documentation

#### Utils Module (`src/utils/`)

- `arg-parser.ts` - Command-line argument handling
  - `parseArguments(args)` - Parses CLI flags and routes execution
- `config-loader.ts` - Configuration file management
  - `loadConfig()` - Loads `~/.jiracli` INI-style config file
  - `setupConfig()` - Interactive configuration setup wizard
  - `getJiraClientOptions(config)` - Builds jira.js client options
  - TypeScript interfaces: `Config`, `JiraClientOptions`
- `jira-client.ts` - Jira API wrapper functions
  - Exports: `listProjects()`, `getProject()`, `listIssues()`, `getIssue()`, `createIssue()`, `updateIssue()`, `addComment()`, `deleteIssue()`, `downloadAttachment()`, `getUser()`, `testConnection()`, `clearClients()`
  - Manages singleton `JiraUtil` instance
- `jira-utils.ts` - Core Jira utility class
  - `JiraUtil` class - Client pooling and API calls
  - Implements all 12 Jira commands
  - Formats results as JSON or TOON

### Configuration System

The CLI loads Jira connection settings from `~/.jiracli` with INI-like format:

```ini
[auth]
host=https://your-domain.atlassian.net
email=your-email@example.com
api_token=YOUR_API_TOKEN_HERE

[defaults]
format=json
```

**Key behaviors:**

- Single profile configuration stored in home directory
- Configuration is validated on load with clear error messages
- API tokens are used for authentication (basic auth)
- Run `jira-api-cli config` to set up or update configuration interactively
- Config file is created with secure permissions (0o600 - read/write for owner only)

### REPL Interface

- Custom prompt: `jira>`
- **Special commands**: `help`, `commands`, `format <type>`, `clear`, `exit/quit/q`
- **Jira commands**: 11 commands accepting JSON arguments
  1. `list-projects` - List all accessible projects
  2. `get-project` - Get details of a specific project
  3. `list-issues` - List issues using JQL query
  4. `get-issue` - Get details of a specific issue
  5. `create-issue` - Create a new issue
  6. `update-issue` - Update an existing issue
  7. `add-comment` - Add a comment to an issue
  8. `delete-issue` - Delete an issue
  9. `download-attachment` - Download an attachment from an issue
  10. `get-user` - Get user information
  11. `test-connection` - Test Jira API connection

### TypeScript Configuration

- **Target**: ES2022 modules (package.json `"type": "module"`)
- **Output**: Compiles to `dist/` directory with modular structure
- **Declarations**: Generates `.d.ts` and `.d.ts.map` files for all modules
- **Source Maps**: Enabled for debugging
- **Import Style**: All imports must use `.js` extensions (TypeScript ES modules requirement)

## Available Commands

The CLI provides **11 Jira API commands**:

1. **list-projects** - List all accessible projects
2. **get-project** - Get details of a specific project
3. **list-issues** - List issues using JQL query
4. **get-issue** - Get details of a specific issue
5. **create-issue** - Create a new issue
6. **update-issue** - Update an existing issue
7. **add-comment** - Add a comment to an issue
8. **delete-issue** - Delete an issue
9. **download-attachment** - Download an attachment from an issue
10. **list-boards** - List agile boards (experimental)
11. **get-user** - Get user information
12. **test-connection** - Test Jira API connection

### Command Examples

```bash
# Start the CLI in interactive mode
npm start

# Inside the REPL:
jira> commands                          # List all 11 commands
jira> help                              # Show help
jira> format json                       # Change output format
jira> list-projects
jira> get-issue '{"issueIdOrKey":"PROJ-123"}'
jira> list-issues '{"jql":"project = PROJ AND status = Open","maxResults":10}'
jira> add-comment '{"issueIdOrKey":"PROJ-123","body":"Great work!","markdown":true}'
jira> download-attachment '{"issueIdOrKey":"PROJ-123","attachmentId":"12345","outputPath":"./image.png"}'
jira> exit                              # Exit

# Headless mode (one-off commands):
jira-api-cli test-connection
jira-api-cli list-projects
jira-api-cli get-issue '{"issueIdOrKey":"PROJ-123","format":"json"}'
jira-api-cli --commands        # List all commands
jira-api-cli list-issues -h    # Command-specific help
jira-api-cli --help            # General help
jira-api-cli --version         # Show version
```

## Code Structure & Module Responsibilities

### Entry Point (`index.ts`)

- Minimal bootstrapper
- Imports and coordinates other modules
- Handles top-level error catching

### CLI Class (`cli/wrapper.ts`)

- Interactive REPL management
- Configuration loading from `~/.jiracli`
- User command processing
- Jira command execution with result formatting
- Graceful shutdown handling

### Command Helpers (`commands/helpers.ts`)

- Pure functions for displaying command information
- No external dependencies except config
- Easy to test

### Command Runner (`commands/runner.ts`)

- Headless/non-interactive execution
- Single command → result → exit pattern
- Independent configuration loading per execution

### Constants (`config/constants.ts`)

- Single source of truth for all command definitions
- Command names, descriptions, and parameter documentation
- No logic, just data

### Config Loader (`utils/config-loader.ts`)

- Reads and parses `.claude/atlassian-config.local.md`
- Extracts YAML frontmatter with Jira profiles
- Validates required fields for each profile
- Provides default values for settings
- Builds jira.js client options

### Jira Client (`utils/jira-client.ts`)

- Wrapper functions for all Jira operations
- Manages singleton JiraUtil instance
- Exports clean async functions for each command

### Jira Utils (`utils/jira-utils.ts`)

- Core Jira API interaction logic
- Client pooling per profile
- API call execution
- Result formatting (JSON, TOON)
- All 10 command implementations

### Argument Parser (`utils/arg-parser.ts`)

- CLI flag parsing (--help, --version, --commands, etc.)
- Routing logic for different execution modes
- Command detection and validation

### Key Implementation Details

- **Barrel Exports**: Each module directory has `index.ts` exporting public APIs
- **ES Modules**: All imports use `.js` extensions (TypeScript requirement)
- **Argument Parsing**: Supports JSON arguments for command parameters
- **Client Caching**: `JiraUtil` maintains a single Jira client instance for efficient reuse
- **Signal Handling**: Graceful shutdown on Ctrl+C (SIGINT) and SIGTERM via `disconnect()` method
- **Error Handling**: Try-catch blocks with user-friendly error messages throughout
- **Configuration**: INI-style format in `~/.jiracli` with secure file permissions (0o600)
- **Format Flexibility**: Commands accept `format` parameter to override default output format

### Data Flow Architecture

**Interactive Mode:**

1. `src/index.ts` → parses args → no command detected
2. Creates `CLI` instance → calls `connect()` (loads config)
3. Calls `start()` → readline REPL loop
4. User input → `handleCommand()` → validates and routes
5. Jira commands → `runCommand()` → executes via `jira-client.ts` functions
6. Results formatted as JSON/TOON → displayed to user

**Headless Mode:**

1. `src/index.ts` → parses args → command detected
2. `runCommand()` called directly with args
3. Executes via `jira-client.ts` → outputs result
4. Process exits

### Client Management

The CLI uses a **lazy initialization pattern** for the Jira client:

- Client is created on-demand when first accessed
- Single `JiraUtil` instance maintains the client
- `clearClients()` function forces cleanup (useful for testing or token refresh)

## Dependencies

**Runtime**:

- `jira.js@^5.2.2` - Jira API client for Node.js
- `@toon-format/toon@^2.0.1` - TOON format encoder

**Development**:

- `typescript@^5.0.0` - TypeScript compiler
- `tsx@^4.0.0` - TypeScript execution runtime for development
- `vitest@^4.0.9` - Test framework with UI and coverage
- `eslint@^9.39.1` - Linting via `typescript-eslint`
- `prettier@3.8.0` - Code formatting with import sorting
- `ts-prune@^0.10.3` - Find unused exports

## Testing

This project uses **Vitest** for testing with the following configuration:

- **Test Framework**: Vitest with globals enabled
- **Test Files**: `tests/**/*.test.ts`
- **Coverage**: V8 coverage provider with text, JSON, and HTML reports
- **Coverage Exclusions**: Barrel exports (`index.ts`), test files, and config files

### Running Tests

```bash
# Run all tests once
npm test

# Watch mode for development
npm run test:watch

# Run with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Test Organization

```
tests/
├── unit/                             # Isolated unit tests
│   ├── cli/                          # CLI wrapper and argument parsing tests
│   ├── commands/                     # Command runner and helpers tests
│   └── utils/                        # Utility module tests
│       ├── arg-parser.test.ts
│       ├── config-loader.test.ts
│       ├── jira-client.test.ts
│       └── jira-utils.test.ts
└── integration/                      # End-to-end API tests
    └── jira-client.test.ts           # Jira API integration tests
```

**Note**: Integration tests (`tests/integration/`) require valid Jira credentials and will make real API calls. Unit tests (`tests/unit/`) mock all external dependencies.

## Important Notes

1. **Configuration Required**: CLI requires `~/.jiracli` config file (run `jira-api-cli config` to set up)
2. **ES2022 Modules**: Project uses `"type": "module"` - no CommonJS
3. **API Authentication**: Uses Jira API tokens with basic authentication (email:apiToken as base64)
4. **Single Profile**: Supports one Jira instance configuration
5. **Flexible Output**: JSON or TOON formats for different use cases
6. **Client Caching**: Reuses client instance for better performance
7. **Command Detection**: Headless mode detects commands by matching against `COMMANDS[]` in constants
8. **JSON Arguments**: Command parameters must be valid JSON strings - quote strings properly in shell

## Commit Message Convention

**Always use Conventional Commits format** for all commit messages and PR titles:

- `feat:` - New features or capabilities
- `fix:` - Bug fixes
- `docs:` - Documentation changes only
- `refactor:` - Code refactoring without changing functionality
- `test:` - Adding or modifying tests
- `chore:` - Maintenance tasks, dependency updates, build configuration

**Examples:**

```
feat: add list-boards command for agile boards
fix: handle connection timeout errors gracefully
docs: update configuration examples in README
refactor: extract API formatting into separate module
test: add integration tests for Jira operations
chore: update jira.js to latest version
```

When creating pull requests, the PR title must follow this format.

## Common Patterns

### Adding a New Jira Command

1. Add command name to `COMMANDS[]` in `src/config/constants.ts`
2. Add command info to `COMMANDS_INFO[]`
3. Add detail to `COMMANDS_DETAIL[]`
4. Implement method in `JiraUtil` class in `src/utils/jira-utils.ts`
5. Export wrapper function in `src/utils/jira-client.ts`
6. Add handler in `CLI.runCommand()` in `src/cli/wrapper.ts` for REPL mode
7. Add handler in `runCommand()` in `src/commands/runner.ts` for headless mode

### Testing New Features

- Unit tests go in `tests/unit/` mirroring the `src/` structure
- Integration tests for Jira operations go in `tests/integration/jira-client.test.ts`
- Use `describe.only()`/`it.only()` for focused test development
- Mock external dependencies (Jira API, file system) in unit tests
- Integration tests require real credentials and make actual API calls
