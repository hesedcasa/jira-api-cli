/**
 * Markdown to Atlassian Document Format (ADF) converter
 * Converts markdown text to ADF structure for Jira comments
 */

/**
 * ADF Document structure
 */
interface AdfDocument {
  type: string;
  version: number;
  content: AdfNode[];
}

/**
 * ADF Node structure
 */
interface AdfNode {
  type: string;
  content?: AdfNode[];
  text?: string;
  marks?: AdfMark[];
  attrs?: Record<string, unknown>;
}

/**
 * ADF Mark structure for text formatting
 */
interface AdfMark {
  type: string;
  attrs?: Record<string, unknown>;
}

/**
 * Convert markdown text to ADF document
 */
export function markdownToAdf(markdown: string): AdfDocument {
  const lines = markdown.split('\n');
  const content: AdfNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      content.push({
        type: 'heading',
        attrs: { level },
        content: parseInlineMarkdown(text),
      });
      i++;
      continue;
    }

    // Code blocks
    if (line.startsWith('```')) {
      const language = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      content.push({
        type: 'codeBlock',
        attrs: language ? { language } : {},
        content: [
          {
            type: 'text',
            text: codeLines.join('\n'),
          },
        ],
      });
      i++;
      continue;
    }

    // Bullet lists
    if (line.match(/^[\*\-\+]\s+/)) {
      const listItems: AdfNode[] = [];
      while (i < lines.length && lines[i].match(/^[\*\-\+]\s+/)) {
        const itemText = lines[i].replace(/^[\*\-\+]\s+/, '');
        listItems.push({
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: parseInlineMarkdown(itemText),
            },
          ],
        });
        i++;
      }
      content.push({
        type: 'bulletList',
        content: listItems,
      });
      continue;
    }

    // Ordered lists
    if (line.match(/^\d+\.\s+/)) {
      const listItems: AdfNode[] = [];
      while (i < lines.length && lines[i].match(/^\d+\.\s+/)) {
        const itemText = lines[i].replace(/^\d+\.\s+/, '');
        listItems.push({
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: parseInlineMarkdown(itemText),
            },
          ],
        });
        i++;
      }
      content.push({
        type: 'orderedList',
        content: listItems,
      });
      continue;
    }

    // Regular paragraph
    content.push({
      type: 'paragraph',
      content: parseInlineMarkdown(line),
    });
    i++;
  }

  // If no content, add empty paragraph
  if (content.length === 0) {
    content.push({
      type: 'paragraph',
      content: [],
    });
  }

  return {
    type: 'doc',
    version: 1,
    content,
  };
}

/**
 * Parse inline markdown (bold, italic, code, links)
 */
function parseInlineMarkdown(text: string): AdfNode[] {
  const nodes: AdfNode[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    // Bold with **text**
    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
    if (boldMatch) {
      nodes.push({
        type: 'text',
        text: boldMatch[1],
        marks: [{ type: 'strong' }],
      });
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Italic with *text*
    const italicMatch = remaining.match(/^\*([^*]+)\*/);
    if (italicMatch) {
      nodes.push({
        type: 'text',
        text: italicMatch[1],
        marks: [{ type: 'em' }],
      });
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Inline code with `code`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      nodes.push({
        type: 'text',
        text: codeMatch[1],
        marks: [{ type: 'code' }],
      });
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Links with [text](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      nodes.push({
        type: 'text',
        text: linkMatch[1],
        marks: [
          {
            type: 'link',
            attrs: { href: linkMatch[2] },
          },
        ],
      });
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Regular text - find next special character or end
    const nextSpecial = remaining.search(/[\*`\[]/);
    if (nextSpecial === -1) {
      nodes.push({
        type: 'text',
        text: remaining,
      });
      break;
    } else {
      nodes.push({
        type: 'text',
        text: remaining.slice(0, nextSpecial),
      });
      remaining = remaining.slice(nextSpecial);
    }
  }

  return nodes;
}

/**
 * Convert plain text to ADF document
 */
export function textToAdf(text: string): AdfDocument {
  const paragraphs = text.split('\n').filter(line => line.trim() !== '');

  if (paragraphs.length === 0) {
    return {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [],
        },
      ],
    };
  }

  return {
    type: 'doc',
    version: 1,
    content: paragraphs.map(para => ({
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: para,
        },
      ],
    })),
  };
}
