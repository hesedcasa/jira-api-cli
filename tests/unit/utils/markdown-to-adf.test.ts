import { describe, expect, it } from 'vitest';

import { markdownToAdf, textToAdf } from '../../../src/utils/markdown-to-adf.js';

describe('markdown-to-adf', () => {
  describe('textToAdf', () => {
    it('should convert plain text to ADF document', () => {
      const result = textToAdf('Hello world');

      expect(result).toEqual({
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Hello world',
              },
            ],
          },
        ],
      });
    });

    it('should convert multiple lines to multiple paragraphs', () => {
      const result = textToAdf('Line 1\nLine 2\nLine 3');

      expect(result.content).toHaveLength(3);
      expect(result.content[0]).toEqual({
        type: 'paragraph',
        content: [{ type: 'text', text: 'Line 1' }],
      });
      expect(result.content[1]).toEqual({
        type: 'paragraph',
        content: [{ type: 'text', text: 'Line 2' }],
      });
      expect(result.content[2]).toEqual({
        type: 'paragraph',
        content: [{ type: 'text', text: 'Line 3' }],
      });
    });

    it('should filter out empty lines', () => {
      const result = textToAdf('Line 1\n\n\nLine 2');

      expect(result.content).toHaveLength(2);
    });

    it('should handle empty input', () => {
      const result = textToAdf('');

      expect(result).toEqual({
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [],
          },
        ],
      });
    });

    it('should handle whitespace-only input', () => {
      const result = textToAdf('   \n  \n  ');

      expect(result).toEqual({
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [],
          },
        ],
      });
    });
  });

  describe('markdownToAdf', () => {
    describe('headings', () => {
      it('should convert h1 heading', () => {
        const result = markdownToAdf('# Heading 1');

        expect(result.content[0]).toEqual({
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Heading 1' }],
        });
      });

      it('should convert h2 heading', () => {
        const result = markdownToAdf('## Heading 2');

        expect(result.content[0]).toEqual({
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Heading 2' }],
        });
      });

      it('should convert h6 heading', () => {
        const result = markdownToAdf('###### Heading 6');

        expect(result.content[0]).toEqual({
          type: 'heading',
          attrs: { level: 6 },
          content: [{ type: 'text', text: 'Heading 6' }],
        });
      });

      it('should support inline formatting in headings', () => {
        const result = markdownToAdf('# **Bold** Heading');

        expect(result.content[0]).toEqual({
          type: 'heading',
          attrs: { level: 1 },
          content: [
            { type: 'text', text: 'Bold', marks: [{ type: 'strong' }] },
            { type: 'text', text: ' Heading' },
          ],
        });
      });
    });

    describe('code blocks', () => {
      it('should convert code block without language', () => {
        const result = markdownToAdf('```\nconst x = 1;\nconsole.log(x);\n```');

        expect(result.content[0]).toEqual({
          type: 'codeBlock',
          attrs: {},
          content: [
            {
              type: 'text',
              text: 'const x = 1;\nconsole.log(x);',
            },
          ],
        });
      });

      it('should convert code block with language', () => {
        const result = markdownToAdf('```javascript\nconst x = 1;\n```');

        expect(result.content[0]).toEqual({
          type: 'codeBlock',
          attrs: { language: 'javascript' },
          content: [
            {
              type: 'text',
              text: 'const x = 1;',
            },
          ],
        });
      });

      it('should handle empty code block', () => {
        const result = markdownToAdf('```\n```');

        expect(result.content[0]).toEqual({
          type: 'codeBlock',
          attrs: {},
          content: [
            {
              type: 'text',
              text: '',
            },
          ],
        });
      });
    });

    describe('bullet lists', () => {
      it('should convert bullet list with asterisks', () => {
        const result = markdownToAdf('* Item 1\n* Item 2\n* Item 3');

        expect(result.content[0]).toEqual({
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Item 1' }],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Item 2' }],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Item 3' }],
                },
              ],
            },
          ],
        });
      });

      it('should convert bullet list with hyphens', () => {
        const result = markdownToAdf('- Item 1\n- Item 2');

        expect(result.content[0].type).toBe('bulletList');
        expect(result.content[0].content).toHaveLength(2);
      });

      it('should convert bullet list with plus signs', () => {
        const result = markdownToAdf('+ Item 1\n+ Item 2');

        expect(result.content[0].type).toBe('bulletList');
        expect(result.content[0].content).toHaveLength(2);
      });

      it('should support inline formatting in list items', () => {
        const result = markdownToAdf('* **Bold** item\n* *Italic* item');

        expect(result.content[0].content?.[0].content?.[0].content?.[0]).toEqual({
          type: 'text',
          text: 'Bold',
          marks: [{ type: 'strong' }],
        });
      });
    });

    describe('ordered lists', () => {
      it('should convert ordered list', () => {
        const result = markdownToAdf('1. First\n2. Second\n3. Third');

        expect(result.content[0]).toEqual({
          type: 'orderedList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'First' }],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Second' }],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Third' }],
                },
              ],
            },
          ],
        });
      });

      it('should handle non-sequential numbers', () => {
        const result = markdownToAdf('1. First\n5. Second\n10. Third');

        expect(result.content[0].type).toBe('orderedList');
        expect(result.content[0].content).toHaveLength(3);
      });
    });

    describe('inline formatting', () => {
      it('should convert bold text', () => {
        const result = markdownToAdf('This is **bold** text');

        expect(result.content[0].content).toEqual([
          { type: 'text', text: 'This is ' },
          { type: 'text', text: 'bold', marks: [{ type: 'strong' }] },
          { type: 'text', text: ' text' },
        ]);
      });

      it('should convert italic text', () => {
        const result = markdownToAdf('This is *italic* text');

        expect(result.content[0].content).toEqual([
          { type: 'text', text: 'This is ' },
          { type: 'text', text: 'italic', marks: [{ type: 'em' }] },
          { type: 'text', text: ' text' },
        ]);
      });

      it('should convert inline code', () => {
        const result = markdownToAdf('Use `console.log()` to debug');

        expect(result.content[0].content).toEqual([
          { type: 'text', text: 'Use ' },
          { type: 'text', text: 'console.log()', marks: [{ type: 'code' }] },
          { type: 'text', text: ' to debug' },
        ]);
      });

      it('should convert links', () => {
        const result = markdownToAdf('Visit [Google](https://google.com) now');

        expect(result.content[0].content).toEqual([
          { type: 'text', text: 'Visit ' },
          {
            type: 'text',
            text: 'Google',
            marks: [{ type: 'link', attrs: { href: 'https://google.com' } }],
          },
          { type: 'text', text: ' now' },
        ]);
      });

      it('should handle multiple inline formats in one line', () => {
        const result = markdownToAdf('**Bold** and *italic* and `code` and [link](url)');

        expect(result.content[0].content).toHaveLength(7);
        expect(result.content[0].content?.[0]).toEqual({
          type: 'text',
          text: 'Bold',
          marks: [{ type: 'strong' }],
        });
        expect(result.content[0].content?.[2]).toEqual({
          type: 'text',
          text: 'italic',
          marks: [{ type: 'em' }],
        });
        expect(result.content[0].content?.[4]).toEqual({
          type: 'text',
          text: 'code',
          marks: [{ type: 'code' }],
        });
        expect(result.content[0].content?.[6]).toEqual({
          type: 'text',
          text: 'link',
          marks: [{ type: 'link', attrs: { href: 'url' } }],
        });
      });
    });

    describe('paragraphs', () => {
      it('should convert plain paragraph', () => {
        const result = markdownToAdf('This is a plain paragraph');

        expect(result.content[0]).toEqual({
          type: 'paragraph',
          content: [{ type: 'text', text: 'This is a plain paragraph' }],
        });
      });

      it('should skip empty lines', () => {
        const result = markdownToAdf('Line 1\n\nLine 2');

        expect(result.content).toHaveLength(2);
        expect(result.content[0].content?.[0]).toEqual({
          type: 'text',
          text: 'Line 1',
        });
        expect(result.content[1].content?.[0]).toEqual({
          type: 'text',
          text: 'Line 2',
        });
      });
    });

    describe('mixed content', () => {
      it('should handle heading followed by paragraph', () => {
        const result = markdownToAdf('# Title\n\nThis is content');

        expect(result.content).toHaveLength(2);
        expect(result.content[0].type).toBe('heading');
        expect(result.content[1].type).toBe('paragraph');
      });

      it('should handle list followed by paragraph', () => {
        const result = markdownToAdf('* Item 1\n* Item 2\n\nRegular text');

        expect(result.content).toHaveLength(2);
        expect(result.content[0].type).toBe('bulletList');
        expect(result.content[1].type).toBe('paragraph');
      });

      it('should handle complex markdown document', () => {
        const markdown = `# Title

This is a **bold** introduction.

## Section 1

Here's a list:
- Item 1
- Item 2

And some code:
\`\`\`javascript
const x = 1;
\`\`\`

Visit [this link](https://example.com) for more.`;

        const result = markdownToAdf(markdown);

        expect(result.type).toBe('doc');
        expect(result.version).toBe(1);
        expect(result.content.length).toBeGreaterThan(0);
      });
    });

    describe('edge cases', () => {
      it('should handle empty input', () => {
        const result = markdownToAdf('');

        expect(result).toEqual({
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [],
            },
          ],
        });
      });

      it('should handle only whitespace', () => {
        const result = markdownToAdf('   \n  \n  ');

        expect(result).toEqual({
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [],
            },
          ],
        });
      });

      it('should handle unclosed code block', () => {
        const result = markdownToAdf('```\ncode without closing');

        expect(result.content[0].type).toBe('codeBlock');
        expect(result.content[0].content?.[0].text).toBe('code without closing');
      });
    });
  });
});
