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
```

## Project Architecture

This is a **Confluence API CLI tool** that provides both interactive REPL and headless modes for Confluence operations.

### Project Structure

```
src/
├── index.ts                               # Main entry point
├── cli/
│   ├── index.ts                           # Barrel export
│   └── wrapper.ts                         # CLI class with REPL logic
├── commands/
│   ├── index.ts                           # Barrel export
│   ├── helpers.ts                         # Command info helpers
│   └── runner.ts                          # Headless command execution
├── config/
│   ├── index.ts                           # Barrel export
│   └── constants.ts                       # Command definitions
└── utils/
    ├── index.ts                           # Barrel export
    ├── argParser.ts                       # Command-line argument parser
    ├── config-loader.ts                   # YAML config file loader
    ├── confluence-client.ts               # Confluence API wrapper functions
    └── confluence-utils.ts                # Core Confluence utility class

tests/
├── unit/
│   └── utils/
│       └── config-loader.test.ts          # Tests for config loading
└── integration/
    └── (integration tests)
```

### Core Components

#### Entry Point (`src/index.ts`)

- Bootstraps the application
- Parses command-line arguments via `parseArguments()`
- Routes to interactive REPL or headless mode

#### CLI Module (`src/cli/`)

- **wrapper class**: Main orchestrator managing:
  - `connect()` - Loads configuration from `.claude/confluence-connector.local.md`
  - `start()` - Initiates interactive REPL with readline interface
  - `handleCommand()` - Parses and processes user commands
  - `runCommand()` - Executes Confluence commands with result formatting
  - `disconnect()` - Graceful cleanup on exit signals (SIGINT/SIGTERM)

#### Commands Module (`src/commands/`)

- `helpers.ts` - Display command information and help
  - `printAvailableCommands()` - Lists all 10 available commands
  - `printCommandDetail(command)` - Shows detailed help for specific command
  - `getCurrentVersion()` - Reads version from package.json
- `runner.ts` - Execute commands in headless mode
  - `runCommand(command, arg, flag)` - Non-interactive command execution

#### Config Module (`src/config/`)

- `constants.ts` - Centralized configuration
  - `COMMANDS[]` - Array of 10 available Confluence command names
  - `COMMANDS_INFO[]` - Brief descriptions for each command
  - `COMMANDS_DETAIL[]` - Detailed parameter documentation

#### Utils Module (`src/utils/`)

- `argParser.ts` - Command-line argument handling
  - `parseArguments(args)` - Parses CLI flags and routes execution
- `config-loader.ts` - Configuration file management
  - `loadConfig(projectRoot)` - Loads `.claude/confluence-connector.local.md`
  - `getConfluenceClientOptions(config, profileName)` - Builds confluence.js client options
  - TypeScript interfaces: `Config`, `ConfluenceProfile`, `ConfluenceClientOptions`
- `confluence-client.ts` - Confluence API wrapper functions
  - Exports: `listSpaces()`, `getSpace()`, `listPages()`, `getPage()`, `createPage()`, `updatePage()`, `addComment()`, `deletePage()`, `getUser()`, `testConnection()`, `clearClients()`
  - Manages singleton `ConfluenceUtil` instance
- `confluence-utils.ts` - Core Confluence utility class
  - `ConfluenceUtil` class - Client pooling and API calls
  - Implements all 10 Confluence commands
  - Formats results as JSON or TOON

### Configuration System

The CLI loads Confluence profiles from `.claude/confluence-connector.local.md` with YAML frontmatter:

```yaml
---
profiles:
  cloud:
    host: https://your-domain.atlassian.net/wiki
    email: your-email@example.com
    apiToken: YOUR_API_TOKEN_HERE

defaultProfile: cloud
defaultFormat: json
---
```

**Key behaviors:**

- Profiles are referenced by name in commands
- Multiple profiles support different Confluence instances (cloud, staging, etc.)
- Configuration is validated on load with clear error messages
- API tokens are used for authentication (basic auth)

### REPL Interface

- Custom prompt: `confluence>`
- **Special commands**: `help`, `commands`, `profiles`, `profile <name>`, `format <type>`, `clear`, `exit/quit/q`
- **Confluence commands**: 10 commands accepting JSON arguments
  1. `list-spaces` - List all accessible spaces
  2. `get-space` - Get details of a specific space
  3. `list-pages` - List pages in a space or by search criteria
  4. `get-page` - Get details of a specific page
  5. `create-page` - Create a new page
  6. `update-page` - Update an existing page
  7. `add-comment` - Add a comment to a page
  8. `delete-page` - Delete a page
  9. `get-user` - Get user information
  10. `test-connection` - Test Confluence API connection

### TypeScript Configuration

- **Target**: ES2022 modules (package.json `"type": "module"`)
- **Output**: Compiles to `dist/` directory with modular structure
- **Declarations**: Generates `.d.ts` files for all modules
- **Source Maps**: Enabled for debugging

## Available Commands

The CLI provides **10 Confluence API commands**:

1. **list-spaces** - List all accessible spaces
2. **get-space** - Get details of a specific space
3. **list-pages** - List pages in a space or by search criteria
4. **get-page** - Get details of a specific page
5. **create-page** - Create a new page
6. **update-page** - Update an existing page
7. **add-comment** - Add a comment to a page
8. **delete-page** - Delete a page
9. **get-user** - Get user information
10. **test-connection** - Test Confluence API connection

### Command Examples

```bash
# Start the CLI in interactive mode
npm start

# Inside the REPL:
confluence> commands                          # List all 10 commands
confluence> help                              # Show help
confluence> profiles                          # List available profiles
confluence> profile production                # Switch profile
confluence> format json                       # Change output format
confluence> list-spaces
confluence> get-space '{"spaceKey":"DOCS"}'
confluence> list-pages '{"spaceKey":"DOCS","title":"Getting Started","limit":10}'
confluence> get-page '{"pageId":"123456"}'
confluence> create-page '{"spaceKey":"DOCS","title":"New Page","body":"<p>Hello World</p>"}'
confluence> add-comment '{"pageId":"123456","body":"<p>Great article!</p>"}'
confluence> exit                              # Exit

# Headless mode (one-off commands):
npx confluence-api-cli test-connection '{"profile":"cloud"}'
npx confluence-api-cli list-spaces
npx confluence-api-cli get-page '{"pageId":"123456","format":"json"}'
npx confluence-api-cli --commands        # List all commands
npx confluence-api-cli list-pages -h     # Command-specific help
npx confluence-api-cli --help            # General help
npx confluence-api-cli --version         # Show version
```

## Code Structure & Module Responsibilities

### Entry Point (`index.ts`)

- Minimal bootstrapper
- Imports and coordinates other modules
- Handles top-level error catching

### CLI Class (`cli/wrapper.ts`)

- Interactive REPL management
- Configuration loading and profile switching
- User command processing
- Confluence command execution with result formatting
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

- Reads and parses `.claude/confluence-connector.local.md`
- Extracts YAML frontmatter with Confluence profiles
- Validates required fields for each profile
- Provides default values for settings
- Builds confluence.js client options

### Confluence Client (`utils/confluence-client.ts`)

- Wrapper functions for all Confluence operations
- Manages singleton ConfluenceUtil instance
- Exports clean async functions for each command

### Confluence Utils (`utils/confluence-utils.ts`)

- Core Confluence API interaction logic
- Client pooling per profile
- API call execution
- Result formatting (JSON, TOON)
- All 10 command implementations

### Argument Parser (`utils/argParser.ts`)

- CLI flag parsing (--help, --version, --commands, etc.)
- Routing logic for different execution modes
- Command detection and validation

### Key Implementation Details

- **Barrel Exports**: Each module directory has `index.ts` exporting public APIs
- **ES Modules**: All imports use `.js` extensions (TypeScript requirement)
- **Argument Parsing**: Supports JSON arguments for command parameters
- **Client Pooling**: Reuses Confluence clients per profile for efficiency
- **Signal Handling**: Graceful shutdown on Ctrl+C (SIGINT) and SIGTERM
- **Error Handling**: Try-catch blocks with user-friendly error messages
- **Configuration**: YAML frontmatter in `.claude/confluence-connector.local.md`

## Dependencies

**Runtime**:

- `confluence.js@^2.1.0` - Confluence API client for Node.js
- `yaml@^2.8.1` - YAML parser for config files
- `@toon-format/toon@^2.0.0` - TOON format encoder

**Development**:

- `typescript@^5.0.0` - TypeScript compiler
- `tsx@^4.0.0` - TypeScript execution runtime
- `vitest@^4.0.9` - Test framework
- `eslint@^9.39.1` - Linting
- `prettier@3.6.2` - Code formatting
- `ts-prune@^0.10.3` - Find unused exports

## Testing

This project uses **Vitest** for testing with the following configuration:

- **Test Framework**: Vitest with globals enabled
- **Test Files**: `tests/**/*.test.ts`
- **Coverage**: V8 coverage provider with text, JSON, and HTML reports

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

### Test Structure

```
tests/
├── unit/
│   └── utils/
│       └── config-loader.test.ts      # Config loading and validation
└── integration/
    └── (integration tests)
```

## Important Notes

1. **Configuration Required**: CLI requires `.claude/confluence-connector.local.md` with valid Confluence profiles
2. **ES2022 Modules**: Project uses `"type": "module"` - no CommonJS
3. **API Authentication**: Uses Confluence API tokens with basic authentication
4. **Multi-Profile**: Supports multiple Confluence instances (cloud, staging, etc.)
5. **Flexible Output**: JSON or TOON formats for different use cases
6. **Client Pooling**: Reuses clients per profile for better performance
7. **Storage Format**: Page content uses Confluence storage format (XHTML-based)

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
feat: add list-spaces command for Confluence spaces
fix: handle connection timeout errors gracefully
docs: update configuration examples in README
refactor: extract API formatting into separate module
test: add integration tests for Confluence operations
chore: update confluence.js to latest version
```

When creating pull requests, the PR title must follow this format.
