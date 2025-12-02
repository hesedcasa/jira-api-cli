import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { getSentryClientOptions, loadConfig } from '../../../src/utils/config-loader.js';
import type { Config } from '../../../src/utils/config-loader.js';

describe('config-loader', () => {
  let testDir: string;

  beforeEach(() => {
    // Create a temporary directory for test configs
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sentry-api-cli-test-'));
    fs.mkdirSync(path.join(testDir, '.claude'));
  });

  afterEach(() => {
    // Clean up test directory
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  describe('loadConfig', () => {
    it('should load valid Sentry configuration file', () => {
      const configContent = `---
profiles:
  production:
    authToken: YOUR_AUTH_TOKEN_HERE
    organization: your-org-slug
  staging:
    authToken: STAGING_TOKEN_HERE
    organization: staging-org
    baseUrl: https://staging.sentry.io/api/0

defaultProfile: production
defaultFormat: json
---

# Sentry Connection Profiles
`;

      const configPath = path.join(testDir, '.claude', 'sentry-connector.local.md');
      fs.writeFileSync(configPath, configContent);

      const config = loadConfig(testDir);

      expect(config.profiles).toBeDefined();
      expect(config.profiles.production).toBeDefined();
      expect(config.profiles.production.authToken).toBe('YOUR_AUTH_TOKEN_HERE');
      expect(config.profiles.production.organization).toBe('your-org-slug');

      expect(config.profiles.staging).toBeDefined();
      expect(config.profiles.staging.authToken).toBe('STAGING_TOKEN_HERE');
      expect(config.profiles.staging.baseUrl).toBe('https://staging.sentry.io/api/0');

      expect(config.defaultProfile).toBe('production');
      expect(config.defaultFormat).toBe('json');
    });

    it('should throw error if config file does not exist', () => {
      expect(() => loadConfig(testDir)).toThrow('Configuration file not found');
    });

    it('should throw error if frontmatter is missing', () => {
      const configContent = `# Sentry Connection Profiles

This is just markdown content without frontmatter.
`;

      const configPath = path.join(testDir, '.claude', 'sentry-connector.local.md');
      fs.writeFileSync(configPath, configContent);

      expect(() => loadConfig(testDir)).toThrow('Invalid configuration file format');
    });

    it('should throw error if profiles are missing', () => {
      const configContent = `---
defaultProfile: production
---
`;

      const configPath = path.join(testDir, '.claude', 'sentry-connector.local.md');
      fs.writeFileSync(configPath, configContent);

      expect(() => loadConfig(testDir)).toThrow('Configuration must include "profiles" object');
    });

    it('should throw error if profile is missing required fields', () => {
      const configContent = `---
profiles:
  incomplete:
    authToken: TOKEN_HERE
    # Missing organization
---
`;

      const configPath = path.join(testDir, '.claude', 'sentry-connector.local.md');
      fs.writeFileSync(configPath, configContent);

      expect(() => loadConfig(testDir)).toThrow('missing required field');
    });

    it('should throw error if baseUrl does not start with http:// or https://', () => {
      const configContent = `---
profiles:
  invalid:
    authToken: TOKEN_HERE
    organization: my-org
    baseUrl: sentry.io/api/0
---
`;

      const configPath = path.join(testDir, '.claude', 'sentry-connector.local.md');
      fs.writeFileSync(configPath, configContent);

      expect(() => loadConfig(testDir)).toThrow('baseUrl must start with http:// or https://');
    });

    it('should use first profile as default if defaultProfile not specified', () => {
      const configContent = `---
profiles:
  first:
    authToken: FIRST_TOKEN
    organization: first-org
  second:
    authToken: SECOND_TOKEN
    organization: second-org
---
`;

      const configPath = path.join(testDir, '.claude', 'sentry-connector.local.md');
      fs.writeFileSync(configPath, configContent);

      const config = loadConfig(testDir);

      expect(config.defaultProfile).toBe('first');
    });

    it('should use json as default format if not specified', () => {
      const configContent = `---
profiles:
  production:
    authToken: TOKEN_HERE
    organization: my-org
---
`;

      const configPath = path.join(testDir, '.claude', 'sentry-connector.local.md');
      fs.writeFileSync(configPath, configContent);

      const config = loadConfig(testDir);

      expect(config.defaultFormat).toBe('json');
    });

    it('should support all output formats: json, toon', () => {
      const formats: Array<'json' | 'toon'> = ['json', 'toon'];

      formats.forEach(format => {
        const configContent = `---
profiles:
  production:
    authToken: TOKEN_HERE
    organization: my-org
defaultFormat: ${format}
---
`;

        const configPath = path.join(testDir, '.claude', 'sentry-connector.local.md');
        fs.writeFileSync(configPath, configContent);

        const config = loadConfig(testDir);
        expect(config.defaultFormat).toBe(format);
      });
    });

    it('should support custom baseUrl for self-hosted Sentry', () => {
      const configContent = `---
profiles:
  selfhosted:
    authToken: TOKEN_HERE
    organization: my-org
    baseUrl: https://sentry.mycompany.com/api/0
---
`;

      const configPath = path.join(testDir, '.claude', 'sentry-connector.local.md');
      fs.writeFileSync(configPath, configContent);

      const config = loadConfig(testDir);

      expect(config.profiles.selfhosted.baseUrl).toBe('https://sentry.mycompany.com/api/0');
    });
  });

  describe('getSentryClientOptions', () => {
    let config: Config;

    beforeEach(() => {
      const configContent = `---
profiles:
  production:
    authToken: PROD_TOKEN
    organization: prod-org
  staging:
    authToken: STAGING_TOKEN
    organization: staging-org
    baseUrl: https://staging.sentry.io/api/0
---
`;

      const configPath = path.join(testDir, '.claude', 'sentry-connector.local.md');
      fs.writeFileSync(configPath, configContent);

      config = loadConfig(testDir);
    });

    it('should return correct Sentry client options for profile', () => {
      const options = getSentryClientOptions(config, 'production');

      expect(options.authToken).toBe('PROD_TOKEN');
      expect(options.organization).toBe('prod-org');
      expect(options.baseUrl).toBe('https://sentry.io/api/0'); // Default
    });

    it('should return correct options with custom baseUrl', () => {
      const options = getSentryClientOptions(config, 'staging');

      expect(options.authToken).toBe('STAGING_TOKEN');
      expect(options.organization).toBe('staging-org');
      expect(options.baseUrl).toBe('https://staging.sentry.io/api/0');
    });

    it('should throw error for non-existent profile', () => {
      expect(() => getSentryClientOptions(config, 'nonexistent')).toThrow('Profile "nonexistent" not found');
    });

    it('should list available profiles in error message', () => {
      try {
        getSentryClientOptions(config, 'nonexistent');
        expect.fail('Should have thrown error');
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        expect(errorMessage).toContain('Available profiles:');
        expect(errorMessage).toContain('production');
        expect(errorMessage).toContain('staging');
      }
    });

    it('should include all required fields', () => {
      const options = getSentryClientOptions(config, 'production');

      expect(options).toHaveProperty('authToken');
      expect(options).toHaveProperty('organization');
      expect(options).toHaveProperty('baseUrl');
    });
  });
});
