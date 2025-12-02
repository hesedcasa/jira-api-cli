import fs from 'fs';
import path from 'path';
import yaml from 'yaml';

/**
 * Sentry connection profile configuration
 */
interface SentryProfile {
  authToken: string;
  organization: string;
  baseUrl?: string;
}

/**
 * Main configuration structure
 */
export interface Config {
  profiles: Record<string, SentryProfile>;
  defaultProfile: string;
  defaultFormat: 'json' | 'toon';
}

/**
 * Sentry client options for API calls
 */
export interface SentryClientOptions {
  authToken: string;
  organization: string;
  baseUrl: string;
}

/**
 * Load Sentry connection profiles from .claude/sentry-connector.local.md
 *
 * @param projectRoot - Project root directory
 * @returns Configuration object with profiles and settings
 */
export function loadConfig(projectRoot: string): Config {
  const configPath = path.join(projectRoot, '.claude', 'sentry-connector.local.md');

  if (!fs.existsSync(configPath)) {
    throw new Error(
      `Configuration file not found at ${configPath}\n` +
        `Please create .claude/sentry-connector.local.md with your Sentry profiles.`
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
    const required: Array<keyof SentryProfile> = ['authToken', 'organization'];
    for (const field of required) {
      if (!profile[field]) {
        throw new Error(`Profile "${profileName}" missing required field: ${field}`);
      }
    }

    // Validate baseUrl format if provided
    if (profile.baseUrl && !profile.baseUrl.startsWith('http://') && !profile.baseUrl.startsWith('https://')) {
      throw new Error(`Profile "${profileName}" baseUrl must start with http:// or https://`);
    }
  }

  return {
    profiles: config.profiles,
    defaultProfile: config.defaultProfile || Object.keys(config.profiles)[0],
    defaultFormat: config.defaultFormat || 'json',
  };
}

/**
 * Get Sentry client options for a specific profile
 *
 * @param config - Configuration object
 * @param profileName - Profile name
 * @returns Sentry client options for API calls
 */
export function getSentryClientOptions(config: Config, profileName: string): SentryClientOptions {
  const profile = config.profiles[profileName];

  if (!profile) {
    const availableProfiles = Object.keys(config.profiles).join(', ');
    throw new Error(`Profile "${profileName}" not found. Available profiles: ${availableProfiles}`);
  }

  return {
    authToken: profile.authToken,
    organization: profile.organization,
    baseUrl: profile.baseUrl || 'https://sentry.io/api/0',
  };
}
