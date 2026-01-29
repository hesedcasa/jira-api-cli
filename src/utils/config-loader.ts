import fs from 'fs';
import os from 'os';
import path from 'path';
import readline from 'readline';

/**
 * Main configuration structure
 */
export interface Config {
  host: string;
  email: string;
  apiToken: string;
  defaultFormat: 'json' | 'toon';
}

/**
 * Jira client options for jira.js library
 */
interface JiraClientOptions {
  host: string;
  authentication: {
    basic: {
      email: string;
      apiToken: string;
    };
  };
}

const CONFIG_PATH = path.join(os.homedir(), '.jiracli');

/**
 * Parse INI-style config file content
 */
function parseIniConfig(content: string): Partial<Config> {
  const config: Partial<Config> = {};
  const lines = content.split('\n');
  let currentSection: string | null = null;
  const warnings: string[] = [];

  // Define valid sections and their key handlers
  const sectionHandlers: Record<string, Record<string, (value: string, warnings: string[]) => void>> = {
    auth: {
      host: value => {
        config.host = value;
      },
      email: value => {
        config.email = value;
      },
      api_token: value => {
        config.apiToken = value;
      },
    },
    defaults: {
      format: (value, warn) => {
        if (value === 'json' || value === 'toon') {
          config.defaultFormat = value;
        } else {
          warn.push(`Invalid format value: "${value}". Must be 'json' or 'toon'.`);
        }
      },
    },
  };

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    // Section header
    const sectionMatch = trimmedLine.match(/^\[([^\]]+)\]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      if (!sectionHandlers[currentSection]) {
        warnings.push(`Unknown section: [${currentSection}]`);
      }
      continue;
    }

    // Key-value pair
    const keyValueMatch = trimmedLine.match(/^([^=]+)=(.*)$/);
    if (keyValueMatch && currentSection) {
      const key = keyValueMatch[1].trim();
      const value = keyValueMatch[2].trim();

      const handler = sectionHandlers[currentSection]?.[key];
      if (handler) {
        handler(value, warnings);
      } else if (sectionHandlers[currentSection]) {
        warnings.push(`Unknown key in [${currentSection}]: ${key}`);
      }
    }
  }

  // Log warnings if any
  if (warnings.length > 0) {
    console.warn('Configuration warnings:');
    warnings.forEach(w => console.warn(`  - ${w}`));
  }

  return config;
}

/**
 * Validate email format using basic regex pattern
 * @param email - Email address to validate
 * @returns true if email matches basic format (local@domain.tld)
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format using URL constructor
 * @param url - URL string to validate
 * @returns true if string is a valid URL with protocol (http:// or https://)
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Prompt for host URL with validation
 */
async function promptHost(currentValue?: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    const ask = () => {
      if (currentValue) {
        rl.write(currentValue);
      }
      rl.question('host: ', host => {
        host = host.trim();
        if (!host && currentValue) {
          rl.close();
          resolve(currentValue);
          return;
        }
        if (!host) {
          console.log('Host is required.');
          ask();
          return;
        }
        if (!isValidUrl(host)) {
          console.log('Invalid URL format. Please include http:// or https://');
          ask();
          return;
        }
        rl.close();
        resolve(host);
      });
    };

    rl.on('error', error => {
      reject(new Error(`Failed to read input: ${error.message}`));
    });

    ask();
  });
}

/**
 * Prompt for email with validation
 */
async function promptEmail(currentValue?: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    const ask = () => {
      if (currentValue) {
        rl.write(currentValue);
      }
      rl.question('email: ', email => {
        email = email.trim();
        if (!email && currentValue) {
          rl.close();
          resolve(currentValue);
          return;
        }
        if (!email) {
          console.log('Email is required.');
          ask();
          return;
        }
        if (!isValidEmail(email)) {
          console.log('Invalid email format. Please try again.');
          ask();
          return;
        }
        rl.close();
        resolve(email);
      });
    };

    rl.on('error', error => {
      reject(new Error(`Failed to read input: ${error.message}`));
    });

    ask();
  });
}

/**
 * Prompt for api_token with hidden input
 */
async function promptApiToken(currentValue?: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    const ask = () => {
      if (currentValue) {
        rl.write('********');
      }
      rl.question('api_token: ', apiToken => {
        apiToken = apiToken.trim();
        // Remove all asterisks from input (user may have deleted the pre-filled mask)
        const withoutAsterisks = apiToken.replace(/\*/g, '');
        if (!withoutAsterisks && currentValue) {
          rl.close();
          resolve(currentValue);
          return;
        }
        if (!withoutAsterisks) {
          console.log('API token is required.');
          ask();
          return;
        }
        rl.close();
        resolve(withoutAsterisks);
      });
    };

    rl.on('error', error => {
      reject(new Error(`Failed to read input: ${error.message}`));
    });

    ask();
  });
}

/**
 * Prompt for format preference (json/toon)
 */
async function promptFormat(currentValue: 'json' | 'toon' = 'json'): Promise<'json' | 'toon'> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    const ask = () => {
      rl.write(currentValue);
      rl.question('format: ', format => {
        format = format.trim().toLowerCase();
        if (!format) {
          rl.close();
          resolve(currentValue);
          return;
        }
        if (format === 'json' || format === 'toon') {
          rl.close();
          resolve(format as 'json' | 'toon');
          return;
        }
        console.log('Invalid format. Please choose json or toon.');
        ask();
      });
    };

    rl.on('error', error => {
      reject(new Error(`Failed to read input: ${error.message}`));
    });

    ask();
  });
}

/**
 * Interactive config setup using readline
 * Prompts user for host, email, and api_token, then writes config file
 * If config file exists, pre-populates existing values in input buffer
 */
export async function setupConfig(): Promise<void> {
  // Load existing config if it exists
  let existingConfig: Partial<Config> = {};
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
      existingConfig = parseIniConfig(content);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`Warning: Could not read existing config from ${CONFIG_PATH}: ${errorMessage}`);
      console.warn('Proceeding with configuration setup...\n');
    }
  }

  // Collect credentials (with existing values pre-populated in input buffer)
  const host = await promptHost(existingConfig.host);
  const email = await promptEmail(existingConfig.email);
  const apiToken = await promptApiToken(existingConfig.apiToken);

  // Optional fields (with existing values pre-populated in input buffer)
  const format = await promptFormat(existingConfig.defaultFormat);

  // Write config file
  let configContent = `[auth]
host=${host}
email=${email}
api_token=${apiToken}
`;

  if (format !== 'json') {
    configContent += `\n[defaults]\nformat=${format}\n`;
  }

  try {
    // Delete existing file first to ensure atomic write with correct permissions
    // This prevents an attacker from pre-creating the file with insecure permissions
    if (fs.existsSync(CONFIG_PATH)) {
      fs.unlinkSync(CONFIG_PATH);
    }

    // Write with mode 0o600 (read/write for owner only)
    // Using writeFileSync with mode option ensures permissions are set atomically
    fs.writeFileSync(CONFIG_PATH, configContent, { mode: 0o600 });
    console.log(`\n✓ Config saved to ${CONFIG_PATH}`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = error instanceof Error && 'code' in error ? (error as { code: string }).code : 'UNKNOWN';

    let helpfulMessage = `Cannot write config to ${CONFIG_PATH}`;

    if (errorCode === 'EACCES') {
      helpfulMessage += '\n\nPermission denied. Check file permissions or run with appropriate privileges.';
    } else if (errorCode === 'ENOENT') {
      helpfulMessage += `\n\nDirectory does not exist: ${path.dirname(CONFIG_PATH)}`;
    } else if (errorCode === 'ENOSPC') {
      helpfulMessage += '\n\nDisk is full. Free up space and try again.';
    } else if (errorCode === 'EROFS') {
      helpfulMessage += '\n\nFilesystem is read-only.';
    }

    helpfulMessage += `\n\nError [${errorCode}]: ${errorMessage}`;
    throw new Error(helpfulMessage);
  }
}

/**
 * Load Jira connection configuration from ~/.jiracli
 *
 * @returns Configuration object with auth settings and defaults
 * @throws {Error} If config file doesn't exist (suggests running setup command)
 * @throws {Error} If config file cannot be read (permissions, I/O errors)
 * @throws {Error} If required fields (host, email, apiToken) are missing
 * @throws {Error} If host is not a valid URL format
 * @throws {Error} If email is not a valid email format
 */
export function loadConfig(): Config {
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(`Please run: jira-api-cli config`);
  }

  let content: string;
  try {
    content = fs.readFileSync(CONFIG_PATH, 'utf-8');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Cannot read config: ${errorMessage}`);
  }

  const config = parseIniConfig(content);

  // Validate required fields (should be valid after setup, but double-check)
  if (!config.host || !config.email || !config.apiToken) {
    throw new Error(`Missing required fields in ${CONFIG_PATH}`);
  }

  // Validate host format
  if (!isValidUrl(config.host)) {
    throw new Error(`Invalid host: ${config.host} in ${CONFIG_PATH}`);
  }

  // Validate email format
  if (!isValidEmail(config.email)) {
    throw new Error(`Invalid email: ${config.email} in ${CONFIG_PATH}`);
  }

  return {
    host: config.host,
    email: config.email,
    apiToken: config.apiToken,
    defaultFormat: config.defaultFormat || 'json',
  };
}

/**
 * Get Jira client options for jira.js library
 *
 * @param config - Configuration object
 * @returns Jira client options for jira.js
 */
export function getJiraClientOptions(config: Config): JiraClientOptions {
  return {
    host: config.host,
    authentication: {
      basic: {
        email: config.email,
        apiToken: config.apiToken,
      },
    },
  };
}
