import fs from 'fs';
import os from 'os';
import path from 'path';
import readline from 'readline';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getJiraClientOptions, loadConfig, setupConfig } from '../../../src/utils/config-loader.js';
import type { Config } from '../../../src/utils/config-loader.js';

describe('config-loader', () => {
  let existsSyncMock: ReturnType<typeof vi.spyOn>;
  let readFileSyncMock: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Mock fs module functions
    existsSyncMock = vi.spyOn(fs, 'existsSync');
    readFileSyncMock = vi.spyOn(fs, 'readFileSync');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadConfig', () => {
    it('should load valid INI configuration file', () => {
      const configContent = `[auth]
host=https://your-domain.atlassian.net
email=user@example.com
api_token=YOUR_API_TOKEN_HERE

[defaults]
format=json
`;

      existsSyncMock.mockReturnValue(true);
      readFileSyncMock.mockReturnValue(configContent);

      const config = loadConfig();

      expect(config.host).toBe('https://your-domain.atlassian.net');
      expect(config.email).toBe('user@example.com');
      expect(config.apiToken).toBe('YOUR_API_TOKEN_HERE');
      expect(config.defaultFormat).toBe('json');
    });

    it('should throw error if config file does not exist', () => {
      existsSyncMock.mockReturnValue(false);

      expect(() => loadConfig()).toThrow('Please run: jira-api-cli config');
    });

    it('should load config without defaults section', () => {
      const configContent = `[auth]
host=https://your-domain.atlassian.net
email=user@example.com
api_token=YOUR_API_TOKEN_HERE
`;

      existsSyncMock.mockReturnValue(true);
      readFileSyncMock.mockReturnValue(configContent);

      const config = loadConfig();

      expect(config.host).toBe('https://your-domain.atlassian.net');
      expect(config.email).toBe('user@example.com');
      expect(config.apiToken).toBe('YOUR_API_TOKEN_HERE');
      expect(config.defaultFormat).toBe('json'); // Default
    });

    it('should throw error if required fields are missing', () => {
      const configContent = `[auth]
host=https://your-domain.atlassian.net
# Missing email and api_token
`;

      existsSyncMock.mockReturnValue(true);
      readFileSyncMock.mockReturnValue(configContent);

      expect(() => loadConfig()).toThrow('Missing required fields');
    });

    it('should throw error if host is invalid URL', () => {
      const configContent = `[auth]
host=your-domain.atlassian.net
email=user@example.com
api_token=TOKEN_HERE
`;

      existsSyncMock.mockReturnValue(true);
      readFileSyncMock.mockReturnValue(configContent);

      expect(() => loadConfig()).toThrow('Invalid host');
    });

    it('should throw error if email is invalid', () => {
      const configContent = `[auth]
host=https://your-domain.atlassian.net
email=invalid-email
api_token=TOKEN_HERE
`;

      existsSyncMock.mockReturnValue(true);
      readFileSyncMock.mockReturnValue(configContent);

      expect(() => loadConfig()).toThrow('Invalid email');
    });

    it('should use json as default format if not specified', () => {
      const configContent = `[auth]
host=https://your-domain.atlassian.net
email=user@example.com
api_token=TOKEN_HERE
`;

      existsSyncMock.mockReturnValue(true);
      readFileSyncMock.mockReturnValue(configContent);

      const config = loadConfig();

      expect(config.defaultFormat).toBe('json');
    });

    it('should support all output formats: json, toon', () => {
      const formats: Array<'json' | 'toon'> = ['json', 'toon'];

      formats.forEach(format => {
        const configContent = `[auth]
host=https://your-domain.atlassian.net
email=user@example.com
api_token=TOKEN_HERE

[defaults]
format=${format}
`;

        existsSyncMock.mockReturnValue(true);
        readFileSyncMock.mockReturnValue(configContent);

        const config = loadConfig();
        expect(config.defaultFormat).toBe(format);
      });
    });

    it('should support http:// URLs for on-premise Jira', () => {
      const configContent = `[auth]
host=http://jira.internal.company.com
email=user@company.com
api_token=TOKEN_HERE
`;

      existsSyncMock.mockReturnValue(true);
      readFileSyncMock.mockReturnValue(configContent);

      const config = loadConfig();

      expect(config.host).toBe('http://jira.internal.company.com');
    });

    it('should ignore unknown sections and keys', () => {
      const configContent = `[auth]
host=https://your-domain.atlassian.net
email=user@example.com
api_token=YOUR_API_TOKEN_HERE

[unknown_section]
unknown_key=value

[defaults]
format=json
unknown_setting=value
`;

      existsSyncMock.mockReturnValue(true);
      readFileSyncMock.mockReturnValue(configContent);

      const config = loadConfig();

      expect(config.host).toBe('https://your-domain.atlassian.net');
      expect(config.email).toBe('user@example.com');
      expect(config.apiToken).toBe('YOUR_API_TOKEN_HERE');
      expect(config.defaultFormat).toBe('json');
    });
  });

  describe('getJiraClientOptions', () => {
    let config: Config;

    beforeEach(() => {
      const configContent = `[auth]
host=https://your-domain.atlassian.net
email=user@example.com
api_token=API_TOKEN_HERE

[defaults]
format=json
`;

      existsSyncMock.mockReturnValue(true);
      readFileSyncMock.mockReturnValue(configContent);
      config = loadConfig();
    });

    it('should return correct Jira client options', () => {
      const options = getJiraClientOptions(config);

      expect(options.host).toBe('https://your-domain.atlassian.net');
      expect(options.authentication).toBeDefined();
      expect(options.authentication.basic).toBeDefined();
      expect(options.authentication.basic.email).toBe('user@example.com');
      expect(options.authentication.basic.apiToken).toBe('API_TOKEN_HERE');
    });

    it('should use basic authentication structure', () => {
      const options = getJiraClientOptions(config);

      expect(options.authentication).toHaveProperty('basic');
      expect(options.authentication.basic).toHaveProperty('email');
      expect(options.authentication.basic).toHaveProperty('apiToken');
    });
  });

  describe('setupConfig', () => {
    let writeFileSyncMock: ReturnType<typeof vi.spyOn>;
    let unlinkSyncMock: ReturnType<typeof vi.spyOn>;
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;
    let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      writeFileSyncMock = vi.spyOn(fs, 'writeFileSync');
      unlinkSyncMock = vi.spyOn(fs, 'unlinkSync');
      consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it('should create new config file when none exists', async () => {
      existsSyncMock.mockReturnValue(false);

      // Mock the readline interface to provide answers
      let questionIndex = 0;
      const answers = ['https://test.atlassian.net', 'test@example.com', 'test-token', 'json'];
      vi.spyOn(readline, 'createInterface').mockImplementation(() => {
        const mockRl = {
          close: vi.fn(),
          write: vi.fn(),
          question: vi.fn((_query: string, callback: (answer: string) => void) => {
            callback(answers[questionIndex++] || '');
          }),
          on: vi.fn().mockReturnThis(),
        } as unknown as readline.Interface;
        return mockRl;
      });

      await setupConfig();

      expect(existsSyncMock).toHaveBeenCalled();
      expect(writeFileSyncMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('[auth]'),
        expect.objectContaining({ mode: 0o600 })
      );
    });

    it('should pre-populate existing config values', async () => {
      const existingConfigContent = `[auth]
host=https://existing.atlassian.net
email=existing@example.com
api_token=existing-token

[defaults]
format=toon
`;

      existsSyncMock.mockReturnValue(true);
      readFileSyncMock.mockReturnValue(existingConfigContent);

      let questionIndex = 0;
      const answers = ['', '', '', '']; // Empty answers mean accept existing
      vi.spyOn(readline, 'createInterface').mockImplementation(() => {
        const mockRl = {
          close: vi.fn(),
          write: vi.fn(),
          question: vi.fn((_query: string, callback: (answer: string) => void) => {
            callback(answers[questionIndex++] || '');
          }),
          on: vi.fn().mockReturnThis(),
        } as unknown as readline.Interface;
        return mockRl;
      });

      await setupConfig();

      // Should have written the existing values back
      expect(writeFileSyncMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('https://existing.atlassian.net'),
        expect.objectContaining({ mode: 0o600 })
      );
    });

    it('should validate URL format and reject invalid URLs', async () => {
      existsSyncMock.mockReturnValue(false);

      let questionIndex = 0;
      const answers = [
        'invalid-url', // First attempt - invalid
        'https://test.atlassian.net', // Second attempt - valid
        'test@example.com',
        'test-token',
        'json',
      ];
      const validationErrors: string[] = [];
      const consoleErrorSpy = vi.spyOn(console, 'log').mockImplementation(msg => {
        validationErrors.push(String(msg));
      });

      vi.spyOn(readline, 'createInterface').mockImplementation(() => {
        const mockRl = {
          close: vi.fn(),
          write: vi.fn(),
          question: vi.fn((_query: string, callback: (answer: string) => void) => {
            callback(answers[questionIndex++] || '');
          }),
          on: vi.fn().mockReturnThis(),
        } as unknown as readline.Interface;
        return mockRl;
      });

      await setupConfig();

      expect(validationErrors.some(msg => msg.includes('Invalid URL format'))).toBe(true);
      expect(writeFileSyncMock).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should validate email format and reject invalid emails', async () => {
      existsSyncMock.mockReturnValue(false);

      let questionIndex = 0;
      const answers = [
        'https://test.atlassian.net',
        'invalid-email', // First attempt - invalid
        'test@example.com', // Second attempt - valid
        'test-token',
        'json',
      ];
      const validationErrors: string[] = [];
      const consoleErrorSpy = vi.spyOn(console, 'log').mockImplementation(msg => {
        validationErrors.push(String(msg));
      });

      vi.spyOn(readline, 'createInterface').mockImplementation(() => {
        const mockRl = {
          close: vi.fn(),
          write: vi.fn(),
          question: vi.fn((_query: string, callback: (answer: string) => void) => {
            callback(answers[questionIndex++] || '');
          }),
          on: vi.fn().mockReturnThis(),
        } as unknown as readline.Interface;
        return mockRl;
      });

      await setupConfig();

      expect(validationErrors.some(msg => msg.includes('Invalid email format'))).toBe(true);
      expect(writeFileSyncMock).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should delete existing file before writing for atomic write', async () => {
      existsSyncMock.mockReturnValue(true);
      readFileSyncMock.mockReturnValue('');

      let questionIndex = 0;
      const answers = ['https://test.atlassian.net', 'test@example.com', 'test-token', 'json'];
      vi.spyOn(readline, 'createInterface').mockImplementation(() => {
        const mockRl = {
          close: vi.fn(),
          write: vi.fn(),
          question: vi.fn((_query: string, callback: (answer: string) => void) => {
            callback(answers[questionIndex++] || '');
          }),
          on: vi.fn().mockReturnThis(),
        } as unknown as readline.Interface;
        return mockRl;
      });

      await setupConfig();

      expect(unlinkSyncMock).toHaveBeenCalledWith(path.join(os.homedir(), '.jiracli'));
      expect(writeFileSyncMock).toHaveBeenCalled();
    });

    // Note: Error handling tests for EACCES and ENOSPC are difficult to unit test
    // due to the recursive nature of the prompt validation functions.
    // These scenarios are better tested via integration tests.

    it('should handle config read errors gracefully', async () => {
      existsSyncMock.mockReturnValue(true);
      readFileSyncMock.mockImplementation(() => {
        throw new Error('Read error');
      });

      let questionIndex = 0;
      const answers = ['https://test.atlassian.net', 'test@example.com', 'test-token', 'json'];
      vi.spyOn(readline, 'createInterface').mockImplementation(() => {
        const mockRl = {
          close: vi.fn(),
          write: vi.fn(),
          question: vi.fn((_query: string, callback: (answer: string) => void) => {
            callback(answers[questionIndex++] || '');
          }),
          on: vi.fn().mockReturnThis(),
        } as unknown as readline.Interface;
        return mockRl;
      });

      await setupConfig();

      // Should log warning about read error
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Could not read existing config'));
      // Should continue with setup
      expect(writeFileSyncMock).toHaveBeenCalled();
    });

    it('should write config with correct permissions (0o600)', async () => {
      existsSyncMock.mockReturnValue(false);

      let questionIndex = 0;
      const answers = ['https://test.atlassian.net', 'test@example.com', 'test-token', 'json'];
      vi.spyOn(readline, 'createInterface').mockImplementation(() => {
        const mockRl = {
          close: vi.fn(),
          write: vi.fn(),
          question: vi.fn((_query: string, callback: (answer: string) => void) => {
            callback(answers[questionIndex++] || '');
          }),
          on: vi.fn().mockReturnThis(),
        } as unknown as readline.Interface;
        return mockRl;
      });

      await setupConfig();

      expect(writeFileSyncMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ mode: 0o600 })
      );
    });

    it('should omit defaults section when format is json (default)', async () => {
      existsSyncMock.mockReturnValue(false);

      let questionIndex = 0;
      const answers = ['https://test.atlassian.net', 'test@example.com', 'test-token', 'json'];
      vi.spyOn(readline, 'createInterface').mockImplementation(() => {
        const mockRl = {
          close: vi.fn(),
          write: vi.fn(),
          question: vi.fn((_query: string, callback: (answer: string) => void) => {
            callback(answers[questionIndex++] || '');
          }),
          on: vi.fn().mockReturnThis(),
        } as unknown as readline.Interface;
        return mockRl;
      });

      await setupConfig();

      const writtenContent = writeFileSyncMock.mock.calls[0][1] as string;
      expect(writtenContent).not.toContain('[defaults]');
    });

    it('should include defaults section when format is not json', async () => {
      existsSyncMock.mockReturnValue(false);

      let questionIndex = 0;
      const answers = ['https://test.atlassian.net', 'test@example.com', 'test-token', 'toon'];
      vi.spyOn(readline, 'createInterface').mockImplementation(() => {
        const mockRl = {
          close: vi.fn(),
          write: vi.fn(),
          question: vi.fn((_query: string, callback: (answer: string) => void) => {
            callback(answers[questionIndex++] || '');
          }),
          on: vi.fn().mockReturnThis(),
        } as unknown as readline.Interface;
        return mockRl;
      });

      await setupConfig();

      const writtenContent = writeFileSyncMock.mock.calls[0][1] as string;
      expect(writtenContent).toContain('[defaults]');
      expect(writtenContent).toContain('format=toon');
    });

    it('should validate api_token is required', async () => {
      existsSyncMock.mockReturnValue(false);

      let questionIndex = 0;
      const answers = [
        'https://test.atlassian.net',
        'test@example.com',
        '', // First attempt - empty
        'test-token', // Second attempt - valid
        'json',
      ];
      const validationErrors: string[] = [];
      const consoleErrorSpy = vi.spyOn(console, 'log').mockImplementation(msg => {
        validationErrors.push(String(msg));
      });

      vi.spyOn(readline, 'createInterface').mockImplementation(() => {
        const mockRl = {
          close: vi.fn(),
          write: vi.fn(),
          question: vi.fn((_query: string, callback: (answer: string) => void) => {
            callback(answers[questionIndex++] || '');
          }),
          on: vi.fn().mockReturnThis(),
        } as unknown as readline.Interface;
        return mockRl;
      });

      await setupConfig();

      expect(validationErrors.some(msg => msg.includes('API token is required'))).toBe(true);
      expect(writeFileSyncMock).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should validate host is required', async () => {
      existsSyncMock.mockReturnValue(false);

      let questionIndex = 0;
      const answers = [
        '', // First attempt - empty
        'https://test.atlassian.net', // Second attempt - valid
        'test@example.com',
        'test-token',
        'json',
      ];
      const validationErrors: string[] = [];
      const consoleErrorSpy = vi.spyOn(console, 'log').mockImplementation(msg => {
        validationErrors.push(String(msg));
      });

      vi.spyOn(readline, 'createInterface').mockImplementation(() => {
        const mockRl = {
          close: vi.fn(),
          write: vi.fn(),
          question: vi.fn((_query: string, callback: (answer: string) => void) => {
            callback(answers[questionIndex++] || '');
          }),
          on: vi.fn().mockReturnThis(),
        } as unknown as readline.Interface;
        return mockRl;
      });

      await setupConfig();

      expect(validationErrors.some(msg => msg.includes('Host is required'))).toBe(true);
      expect(writeFileSyncMock).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should validate email is required', async () => {
      existsSyncMock.mockReturnValue(false);

      let questionIndex = 0;
      const answers = [
        'https://test.atlassian.net',
        '', // First attempt - empty
        'test@example.com', // Second attempt - valid
        'test-token',
        'json',
      ];
      const validationErrors: string[] = [];
      const consoleErrorSpy = vi.spyOn(console, 'log').mockImplementation(msg => {
        validationErrors.push(String(msg));
      });

      vi.spyOn(readline, 'createInterface').mockImplementation(() => {
        const mockRl = {
          close: vi.fn(),
          write: vi.fn(),
          question: vi.fn((_query: string, callback: (answer: string) => void) => {
            callback(answers[questionIndex++] || '');
          }),
          on: vi.fn().mockReturnThis(),
        } as unknown as readline.Interface;
        return mockRl;
      });

      await setupConfig();

      expect(validationErrors.some(msg => msg.includes('Email is required'))).toBe(true);
      expect(writeFileSyncMock).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });
});
