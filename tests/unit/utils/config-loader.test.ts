import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { getConfluenceClientOptions, loadConfig } from '../../../src/utils/config-loader.js';
import type { Config } from '../../../src/utils/config-loader.js';

describe('config-loader', () => {
  let testDir: string;

  beforeEach(() => {
    // Create a temporary directory for test configs
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'confluence-api-cli-test-'));
    fs.mkdirSync(path.join(testDir, '.claude'));
  });

  afterEach(() => {
    // Clean up test directory
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  describe('loadConfig', () => {
    it('should load valid Confluence configuration file', () => {
      const configContent = `---
profiles:
  cloud:
    host: https://your-domain.atlassian.net/wiki
    email: user@example.com
    apiToken: YOUR_API_TOKEN_HERE
  staging:
    host: https://staging.atlassian.net/wiki
    email: staging@example.com
    apiToken: STAGING_TOKEN_HERE

defaultProfile: cloud
defaultFormat: json
---

# Confluence Connection Profiles
`;

      const configPath = path.join(testDir, '.claude', 'confluence-connector.local.md');
      fs.writeFileSync(configPath, configContent);

      const config = loadConfig(testDir);

      expect(config.profiles).toBeDefined();
      expect(config.profiles.cloud).toBeDefined();
      expect(config.profiles.cloud.host).toBe('https://your-domain.atlassian.net/wiki');
      expect(config.profiles.cloud.email).toBe('user@example.com');
      expect(config.profiles.cloud.apiToken).toBe('YOUR_API_TOKEN_HERE');

      expect(config.profiles.staging).toBeDefined();
      expect(config.profiles.staging.host).toBe('https://staging.atlassian.net/wiki');

      expect(config.defaultProfile).toBe('cloud');
      expect(config.defaultFormat).toBe('json');
    });

    it('should throw error if config file does not exist', () => {
      expect(() => loadConfig(testDir)).toThrow('Configuration file not found');
    });

    it('should throw error if frontmatter is missing', () => {
      const configContent = `# Confluence Connection Profiles

This is just markdown content without frontmatter.
`;

      const configPath = path.join(testDir, '.claude', 'confluence-connector.local.md');
      fs.writeFileSync(configPath, configContent);

      expect(() => loadConfig(testDir)).toThrow('Invalid configuration file format');
    });

    it('should throw error if profiles are missing', () => {
      const configContent = `---
defaultProfile: cloud
---
`;

      const configPath = path.join(testDir, '.claude', 'confluence-connector.local.md');
      fs.writeFileSync(configPath, configContent);

      expect(() => loadConfig(testDir)).toThrow('Configuration must include "profiles" object');
    });

    it('should throw error if profile is missing required fields', () => {
      const configContent = `---
profiles:
  incomplete:
    host: https://your-domain.atlassian.net/wiki
    email: user@example.com
    # Missing apiToken
---
`;

      const configPath = path.join(testDir, '.claude', 'confluence-connector.local.md');
      fs.writeFileSync(configPath, configContent);

      expect(() => loadConfig(testDir)).toThrow('missing required field');
    });

    it('should throw error if host does not start with http:// or https://', () => {
      const configContent = `---
profiles:
  invalid:
    host: your-domain.atlassian.net/wiki
    email: user@example.com
    apiToken: TOKEN_HERE
---
`;

      const configPath = path.join(testDir, '.claude', 'confluence-connector.local.md');
      fs.writeFileSync(configPath, configContent);

      expect(() => loadConfig(testDir)).toThrow('host must start with http:// or https://');
    });

    it('should throw error if email is invalid', () => {
      const configContent = `---
profiles:
  invalid:
    host: https://your-domain.atlassian.net/wiki
    email: invalid-email
    apiToken: TOKEN_HERE
---
`;

      const configPath = path.join(testDir, '.claude', 'confluence-connector.local.md');
      fs.writeFileSync(configPath, configContent);

      expect(() => loadConfig(testDir)).toThrow('email appears to be invalid');
    });

    it('should use first profile as default if defaultProfile not specified', () => {
      const configContent = `---
profiles:
  first:
    host: https://first.atlassian.net/wiki
    email: first@example.com
    apiToken: FIRST_TOKEN
  second:
    host: https://second.atlassian.net/wiki
    email: second@example.com
    apiToken: SECOND_TOKEN
---
`;

      const configPath = path.join(testDir, '.claude', 'confluence-connector.local.md');
      fs.writeFileSync(configPath, configContent);

      const config = loadConfig(testDir);

      expect(config.defaultProfile).toBe('first');
    });

    it('should use json as default format if not specified', () => {
      const configContent = `---
profiles:
  cloud:
    host: https://your-domain.atlassian.net/wiki
    email: user@example.com
    apiToken: TOKEN_HERE
---
`;

      const configPath = path.join(testDir, '.claude', 'confluence-connector.local.md');
      fs.writeFileSync(configPath, configContent);

      const config = loadConfig(testDir);

      expect(config.defaultFormat).toBe('json');
    });

    it('should support all output formats: json, toon', () => {
      const formats: Array<'json' | 'toon'> = ['json', 'toon'];

      formats.forEach(format => {
        const configContent = `---
profiles:
  cloud:
    host: https://your-domain.atlassian.net/wiki
    email: user@example.com
    apiToken: TOKEN_HERE
defaultFormat: ${format}
---
`;

        const configPath = path.join(testDir, '.claude', 'confluence-connector.local.md');
        fs.writeFileSync(configPath, configContent);

        const config = loadConfig(testDir);
        expect(config.defaultFormat).toBe(format);
      });
    });

    it('should support http:// URLs for on-premise Confluence', () => {
      const configContent = `---
profiles:
  onpremise:
    host: http://confluence.internal.company.com
    email: user@company.com
    apiToken: TOKEN_HERE
---
`;

      const configPath = path.join(testDir, '.claude', 'confluence-connector.local.md');
      fs.writeFileSync(configPath, configContent);

      const config = loadConfig(testDir);

      expect(config.profiles.onpremise.host).toBe('http://confluence.internal.company.com');
    });
  });

  describe('getConfluenceClientOptions', () => {
    let config: Config;

    beforeEach(() => {
      const configContent = `---
profiles:
  cloud:
    host: https://your-domain.atlassian.net/wiki
    email: cloud@example.com
    apiToken: CLOUD_TOKEN
  onpremise:
    host: http://confluence.internal.company.com
    email: onprem@company.com
    apiToken: ONPREM_TOKEN
---
`;

      const configPath = path.join(testDir, '.claude', 'confluence-connector.local.md');
      fs.writeFileSync(configPath, configContent);

      config = loadConfig(testDir);
    });

    it('should return correct Confluence client options for profile', () => {
      const options = getConfluenceClientOptions(config, 'cloud');

      expect(options.host).toBe('https://your-domain.atlassian.net/wiki');
      expect(options.authentication).toBeDefined();
      expect(options.authentication.basic).toBeDefined();
      expect(options.authentication.basic.email).toBe('cloud@example.com');
      expect(options.authentication.basic.apiToken).toBe('CLOUD_TOKEN');
    });

    it('should return correct options for on-premise profile', () => {
      const options = getConfluenceClientOptions(config, 'onpremise');

      expect(options.host).toBe('http://confluence.internal.company.com');
      expect(options.authentication.basic.email).toBe('onprem@company.com');
      expect(options.authentication.basic.apiToken).toBe('ONPREM_TOKEN');
    });

    it('should throw error for non-existent profile', () => {
      expect(() => getConfluenceClientOptions(config, 'nonexistent')).toThrow('Profile "nonexistent" not found');
    });

    it('should list available profiles in error message', () => {
      try {
        getConfluenceClientOptions(config, 'nonexistent');
        expect.fail('Should have thrown error');
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        expect(errorMessage).toContain('Available profiles:');
        expect(errorMessage).toContain('cloud');
        expect(errorMessage).toContain('onpremise');
      }
    });

    it('should use basic authentication structure', () => {
      const options = getConfluenceClientOptions(config, 'cloud');

      expect(options.authentication).toHaveProperty('basic');
      expect(options.authentication.basic).toHaveProperty('email');
      expect(options.authentication.basic).toHaveProperty('apiToken');
    });
  });
});
