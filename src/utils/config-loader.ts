import fs from 'fs';
import path from 'path';
import yaml from 'yaml';

/**
 * Confluence connection profile configuration
 */
interface ConfluenceProfile {
  host: string;
  email: string;
  apiToken: string;
}

/**
 * Main configuration structure
 */
export interface Config {
  profiles: Record<string, ConfluenceProfile>;
  defaultProfile: string;
  defaultFormat: 'json' | 'toon';
}

/**
 * Confluence client options for confluence.js library
 */
interface ConfluenceClientOptions {
  host: string;
  authentication: {
    basic: {
      email: string;
      apiToken: string;
    };
  };
}

/**
 * Load Confluence connection profiles from .claude/confluence-connector.local.md
 *
 * @param projectRoot - Project root directory
 * @returns Configuration object with profiles and settings
 */
export function loadConfig(projectRoot: string): Config {
  const configPath = path.join(projectRoot, '.claude', 'confluence-connector.local.md');

  if (!fs.existsSync(configPath)) {
    throw new Error(
      `Configuration file not found at ${configPath}\n` +
        `Please create .claude/confluence-connector.local.md with your Confluence profiles.`
    );
  }

  const content = fs.readFileSync(configPath, 'utf-8');

  // Extract YAML frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

  if (!frontmatterMatch) {
    throw new Error(`Invalid configuration file format. Expected YAML frontmatter (---...---) at the beginning.`);
  }

  const frontmatter = frontmatterMatch[1];
  const config = yaml.parse(frontmatter) as Partial<Config>;

  // Validate configuration
  if (!config.profiles || typeof config.profiles !== 'object') {
    throw new Error('Configuration must include "profiles" object');
  }

  // Validate each profile
  for (const [profileName, profile] of Object.entries(config.profiles)) {
    const required: Array<keyof ConfluenceProfile> = ['host', 'email', 'apiToken'];
    for (const field of required) {
      if (!profile[field]) {
        throw new Error(`Profile "${profileName}" missing required field: ${field}`);
      }
    }

    // Validate host format
    if (!profile.host.startsWith('http://') && !profile.host.startsWith('https://')) {
      throw new Error(`Profile "${profileName}" host must start with http:// or https://`);
    }

    // Validate email format (basic check)
    if (!profile.email.includes('@')) {
      throw new Error(`Profile "${profileName}" email appears to be invalid`);
    }
  }

  return {
    profiles: config.profiles,
    defaultProfile: config.defaultProfile || Object.keys(config.profiles)[0],
    defaultFormat: config.defaultFormat || 'json',
  };
}

/**
 * Get Confluence client options for a specific profile
 *
 * @param config - Configuration object
 * @param profileName - Profile name
 * @returns Confluence client options for confluence.js
 */
export function getConfluenceClientOptions(config: Config, profileName: string): ConfluenceClientOptions {
  const profile = config.profiles[profileName];

  if (!profile) {
    const availableProfiles = Object.keys(config.profiles).join(', ');
    throw new Error(`Profile "${profileName}" not found. Available profiles: ${availableProfiles}`);
  }

  return {
    host: profile.host,
    authentication: {
      basic: {
        email: profile.email,
        apiToken: profile.apiToken,
      },
    },
  };
}
