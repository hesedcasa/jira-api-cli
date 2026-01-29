# Jira API CLI

[![npm jira-api-cli package](https://img.shields.io/npm/v/jira-api-cli.svg)](https://npmjs.org/package/jira-api-cli)

A powerful command-line interface for Jira API interaction with support for issues, projects, boards, and multiple output formats.

## Features

- 💻 **Interactive REPL** for Jira exploration and management
- 🚀 **Headless mode** for one-off command execution and automation
- 🔐 **Multi-profile support** for managing different Jira instances
- 📊 **Multiple output formats**: JSON or TOON
- 🎯 **Issue management**: create, read, update, delete issues
- 💬 **Comment support**: add comments to issues with markdown support
- 📋 **Project operations**: list and view project details
- 🔍 **JQL query support** for advanced issue searching
- 👤 **User management**: retrieve user information
- 📎 **Attachment support**: download attachments from issues
- 📊 **Board support**: list agile boards (coming soon)
- ✅ **Connection testing** for quick diagnostics

## Requirements

- [Node.js](https://nodejs.org/) v20.0 or newer
- [npm](https://www.npmjs.com/)
- Jira Cloud account with API access

## Installation

```bash
npm install -g jira-api-cli
```

## Configuration

### Step 1: Create API Token

1. Go to [Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click "Create API token"
3. Give it a label (e.g., "Jira CLI")
4. Copy the generated token

### Step 2: Run Interactive Setup

The easiest way to configure the CLI is using the interactive setup command:

```bash
jira-api-cli config
```

This will prompt you for:
- Your Jira host URL (e.g., `https://your-domain.atlassian.net`)
- Your Atlassian account email
- Your API token
- Default output format (json or toon)

### Manual Configuration

Alternatively, you can manually create the configuration file at `~/.jiracli`:

```ini
[auth]
host=https://your-domain.atlassian.net
email=your-email@example.com
api_token=YOUR_API_TOKEN_HERE

[defaults]
format=json
```

### Configuration Options

- **[auth] section**:
  - `host`: Your Jira Cloud instance URL (must start with https://)
  - `email`: Your Atlassian account email
  - `api_token`: Your Jira API token

- **[defaults] section**:
  - `format`: Default output format (`json` or `toon`)

## Quick Start

### Interactive Mode

Start the CLI and interact with Jira through a REPL:

```bash
jira-api-cli
```

Once started, you'll see the `jira>` prompt:

```
jira> list-projects
jira> get-issue {"issueIdOrKey":"PROJ-123"}
jira> list-issues {"jql":"project = PROJ AND status = Open","maxResults":10}
```

### Headless Mode

Execute single commands directly:

```bash
# Test connection
jira-api-cli test-connection

# List all projects
jira-api-cli list-projects

# Get issue details
jira-api-cli get-issue '{"issueIdOrKey":"PROJ-123"}'

# List issues with JQL
jira-api-cli list-issues '{"jql":"project = PROJ AND status = Open","maxResults":10}'

# Add comment to an issue
jira-api-cli add-comment '{"issueIdOrKey":"PROJ-123","body":"Status update from CLI","markdown":true}'

# Create a new issue
jira-api-cli create-issue '{"fields":{"summary":"New bug","project":{"key":"PROJ"},"issuetype":{"name":"Bug"}}}'
```

## Available Commands

### Project Commands

- **list-projects** - List all accessible projects

  ```bash
  jira> list-projects
  jira> list-projects {"format":"json"}
  ```

- **get-project** - Get details of a specific project
  ```bash
  jira> get-project {"projectIdOrKey":"PROJ"}
  ```

### Issue Commands

- **list-issues** - List issues using JQL query

  ```bash
  jira> list-issues
  jira> list-issues {"jql":"project = PROJ AND status = Open"}
  jira> list-issues {"jql":"assignee = currentUser()","maxResults":20}
  ```

- **get-issue** - Get details of a specific issue

  ```bash
  jira> get-issue {"issueIdOrKey":"PROJ-123"}
  ```

- **create-issue** - Create a new issue

  ```bash
  jira> create-issue {"fields":{"summary":"New task","project":{"key":"PROJ"},"issuetype":{"name":"Task"}}}
  ```

- **update-issue** - Update an existing issue

  ```bash
  jira> update-issue {"issueIdOrKey":"PROJ-123","fields":{"summary":"Updated summary"}}
  ```

- **add-comment** - Add a comment to an issue

  ```bash
  # Plain text comment
  jira> add-comment {"issueIdOrKey":"PROJ-123","body":"This is a comment"}

  # Markdown comment
  jira> add-comment {"issueIdOrKey":"PROJ-123","body":"This is **bold** and *italic*\n\n- Item 1\n- Item 2","markdown":true}
  ```

- **delete-issue** - Delete an issue
  ```bash
  jira> delete-issue {"issueIdOrKey":"PROJ-123"}
  ```

### Attachment Commands

- **download-attachment** - Download an attachment from an issue

  ```bash
  # Download to current directory with original filename
  jira> download-attachment '{"issueIdOrKey":"PROJ-123","attachmentId":"12345"}'

  # Download to custom path
  jira> download-attachment '{"issueIdOrKey":"PROJ-123","attachmentId":"12345","outputPath":"./images/screenshot.png"}'
  ```

### User Commands

- **get-user** - Get user information
  ```bash
  jira> get-user
  jira> get-user {"accountId":"5b11a8888c00000000ede99g"}
  ```

### Board Commands

- **list-boards** - List agile boards (experimental)
  ```bash
  jira> list-boards
  jira> list-boards {"projectIdOrKey":"PROJ","type":"scrum"}
  ```

### Utility Commands

- **test-connection** - Test Jira API connection
  ```bash
  jira> test-connection
  ```

## Interactive Mode Commands

Special commands available in the REPL:

- **commands** - List all available commands
- **help** or **?** - Show help message
- **format \<type\>** - Set output format (json, toon)
- **clear** - Clear the screen
- **exit**, **quit**, or **q** - Exit the CLI

## Output Formats

### JSON Format

Machine-readable JSON format (default):

```bash
jira> format json
jira> list-projects
```

### TOON Format

[Token-Oriented Object Notation](https://github.com/toon-format/toon) for AI-optimized output:

```bash
jira> format toon
jira> list-issues
```

## Security

⚠️ **Important Security Notes:**

1. **Never commit** `~/.jiracli` to version control
2. The config file is created with secure permissions
3. Keep your API tokens secure and rotate them periodically
4. API tokens have the same permissions as your user account

## Development

### Build from Source

```bash
# Clone repository
git clone https://github.com/hesedcasa/jira-api-cli.git
cd jira-api-cli

# Install dependencies
npm install

# Build
npm run build

# Run in development mode
npm start
```

### Run Tests

```bash
npm test                    # Run all tests once
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Run tests with coverage
```

### Code Quality

```bash
npm run format              # Format code with ESLint and Prettier
npm run find-deadcode       # Find unused exports
npm run pre-commit          # Run format + find-deadcode
```

## Troubleshooting

### Connection Issues

```bash
# Test your connection
jira-api-cli test-connection

# Common issues:
# 1. Invalid API token - regenerate token
# 2. Wrong email address - use Atlassian account email
# 3. Incorrect host URL - ensure https:// prefix
```

### Authentication Errors

- Verify your API token is correct
- Check that the email matches your Atlassian account
- Ensure the host URL includes `https://`

### Permission Errors

- API tokens inherit your user permissions
- Check that your Jira account has access to the project/issue
- Some operations require specific Jira permissions

## License

Apache-2.0

## Acknowledgments

Built with [jira.js](https://github.com/MrRefactoring/jira.js) - A modern Jira REST API client for Node.js
