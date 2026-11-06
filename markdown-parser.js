/**
 * Clean, fast, zero-dependency Markdown Parser and React Renderer
 * Uses pure React.createElement so it requires no build step and runs natively.
 */
import React, { useState } from 'react';

/**
 * Parses raw markdown text into a structured array of AST block objects.
 */
export function parseMarkdown(rawText) {
  if (!rawText || typeof rawText !== 'string') return [];

  const lines = rawText.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const startI = i;
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Skip completely empty lines
    if (!trimmed) {
      i++;
      continue;
    }

    // 2. Fenced Code Blocks (```lang ... ```)
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim();
      const codeLines = [];
      const indentMatch = line.match(/^(\s*)/);
      const indentLen = indentMatch ? indentMatch[1].length : 0;
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        let codeLine = lines[i];
        if (indentLen > 0) {
          const stripRegex = new RegExp(`^\\s{1,${indentLen}}`);
          codeLine = codeLine.replace(stripRegex, '');
        }
        codeLines.push(codeLine);
        i++;
      }
      if (i < lines.length) i++; // consume closing ```
      blocks.push({
        type: 'code_block',
        language: lang || 'text',
        code: codeLines.join('\n')
      });
      continue;
    }

    // 3. Headings (# Heading) - support leading whitespace and up to 6 hashes
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = Math.min(headingMatch[1].length, 4);
      const text = headingMatch[2].trim();
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      blocks.push({
        type: 'heading',
        level,
        text,
        id
      });
      i++;
      continue;
    }

    // 4. Horizontal Rule (---, ***, ___)
    if (/^(\*{3,}|-{3,}|_{3,})\s*$/.test(trimmed)) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    // 5. Blockquote (> quote)
    if (trimmed.startsWith('>')) {
      const quoteLines = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({
        type: 'blockquote',
        text: quoteLines.join('\n')
      });
      continue;
    }

    // 6. Tables (| col1 | col2 |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && i + 1 < lines.length) {
      const nextLineTrim = lines[i + 1].trim();
      if (nextLineTrim.startsWith('|') && /^[|\s:\-]+$/.test(nextLineTrim)) {
        const parseRow = (rowStr) => {
          let s = rowStr.trim();
          if (s.startsWith('|')) s = s.slice(1);
          if (s.endsWith('|')) s = s.slice(0, -1);
          return s.split('|').map(c => c.trim());
        };

        const headers = parseRow(line);
        i += 2; // skip header and separator
        const rows = [];

        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          rows.push(parseRow(lines[i]));
          i++;
        }

        blocks.push({
          type: 'table',
          headers,
          rows
        });
        continue;
      }
    }

    // 7. Lists (ordered or unordered)
    const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/);
    if (listMatch) {
      const items = [];
      while (i < lines.length) {
        const currentLine = lines[i];
        const curTrim = currentLine.trim();

        // Check for blank line inside list
        if (!curTrim) {
          let peek = i + 1;
          while (peek < lines.length && !lines[peek].trim()) {
            peek++;
          }
          if (peek < lines.length && /^(\s*)([-*+]|\d+\.)\s+/.test(lines[peek])) {
            i = peek;
            continue;
          } else {
            break;
          }
        }

        // Break if line is a block element (fenced code, heading, blockquote, hr)
        if (curTrim.startsWith('```') ||
            curTrim.startsWith('#') ||
            curTrim.startsWith('>') ||
            /^(\*{3,}|-{3,}|_{3,})\s*$/.test(curTrim)) {
          break;
        }

        const match = currentLine.match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/);
        if (match) {
          const indent = match[1].length;
          const bullet = match[2];
          const text = match[3];
          const isOrdered = /^\d+\./.test(bullet);
          items.push({
            level: Math.floor(indent / 2),
            isOrdered,
            bullet,
            text
          });
          i++;
        } else if (items.length > 0 && /^\s{2,}/.test(currentLine)) {
          items[items.length - 1].text += ' ' + curTrim;
          i++;
        } else {
          break;
        }
      }
      if (items.length > 0) {
        blocks.push({
          type: 'list',
          items
        });
      }
      continue;
    }

    // 8. Paragraphs / General text
    const paraLines = [];
    while (i < lines.length) {
      const current = lines[i];
      const curTrim = current.trim();
      if (!curTrim) break;
      if (curTrim.match(/^#{1,6}\s+/) ||
          curTrim.startsWith('```') ||
          curTrim.startsWith('>') ||
          (curTrim.startsWith('|') && curTrim.endsWith('|') && i + 1 < lines.length && /^[|\s:\-]+$/.test(lines[i + 1].trim())) ||
          /^(\*{3,}|-{3,}|_{3,})\s*$/.test(curTrim) ||
          /^(\s*)([-*+]|\d+\.)\s+/.test(current)) {
        break;
      }
      paraLines.push(curTrim);
      i++;
    }

    if (paraLines.length > 0) {
      blocks.push({
        type: 'paragraph',
        text: paraLines.join(' ')
      });
    }

    // Guaranteed loop progress: advance i if no block advanced it
    if (i === startI) {
      blocks.push({
        type: 'paragraph',
        text: trimmed
      });
      i++;
    }
  }

  return blocks;
}

/**
 * Renders inline markdown tokens (bold, italic, code, links) as React elements.
 */
export function renderInline(text, options = {}) {
  const { onNavigate, highlightColor, textColor } = options;
  if (!text || typeof text !== 'string') return null;

  // Split into tokens: `code`, **bold**, *italic*, [text](url)
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Inline Code: `...`
    if (part.startsWith('`') && part.endsWith('`')) {
      const code = part.slice(1, -1);
      return React.createElement('code', {
        key: index,
        style: {
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          color: highlightColor || '#00ffff',
          padding: '2px 6px',
          borderRadius: '3px',
          fontFamily: 'Consolas, "Roboto Mono", monospace',
          fontSize: '0.86em',
          wordBreak: 'break-all'
        }
      }, code);
    }

    // Bold: **...**
    if (part.startsWith('**') && part.endsWith('**')) {
      const inner = part.slice(2, -2);
      return React.createElement('strong', {
        key: index,
        style: {
          fontWeight: 'bold',
          color: highlightColor || '#ffffff'
        }
      }, renderInline(inner, options));
    }

    // Italic: *...*
    if (part.startsWith('*') && part.endsWith('*')) {
      const inner = part.slice(1, -1);
      return React.createElement('em', {
        key: index,
        style: {
          fontStyle: 'italic',
          opacity: 0.9
        }
      }, renderInline(inner, options));
    }

    // Link: [text](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const label = linkMatch[1];
      const url = linkMatch[2];
      const isInternalMd = url.endsWith('.md') || url.includes('.md');

      return React.createElement('a', {
        key: index,
        href: url,
        onClick: (e) => {
          if (isInternalMd && onNavigate) {
            e.preventDefault();
            const cleanTarget = url.replace(/^\.\//, '').replace(/#.*$/, '');
            onNavigate(cleanTarget);
          }
        },
        target: isInternalMd ? undefined : '_blank',
        rel: isInternalMd ? undefined : 'noopener noreferrer',
        style: {
          color: highlightColor || '#00ffff',
          textDecoration: 'underline',
          fontWeight: 'bold',
          cursor: 'pointer'
        }
      }, renderInline(label, options));
    }

    return part;
  });
}

/**
 * Formatted Code Block component with Copy button
 */
export function CodeBlockItem({ language, code, highlightColor, textColor }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (e) {}
  };

  return React.createElement('div', {
    style: {
      margin: '14px 0',
      backgroundColor: '#0a0a0f',
      border: `1px solid ${highlightColor ? highlightColor + '40' : 'rgba(255, 255, 255, 0.2)'}`,
      borderRadius: '6px',
      overflow: 'hidden'
    }
  }, [
    React.createElement('div', {
      key: 'header',
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '6px 12px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        fontSize: '0.75rem',
        color: highlightColor || '#00ffff',
        fontFamily: 'Consolas, monospace'
      }
    }, [
      React.createElement('span', {
        key: 'lang',
        style: { fontWeight: 'bold', textTransform: 'uppercase' }
      }, `💻 ${language || 'CODE'}`),
      React.createElement('button', {
        key: 'copy',
        type: 'button',
        onClick: handleCopy,
        style: {
          background: copied ? 'rgba(0, 255, 128, 0.2)' : 'rgba(255, 255, 255, 0.1)',
          border: `1px solid ${copied ? '#00ff80' : 'rgba(255, 255, 255, 0.25)'}`,
          color: copied ? '#00ff80' : textColor || '#fff',
          borderRadius: '4px',
          padding: '3px 8px',
          fontSize: '0.72rem',
          cursor: 'pointer'
        }
      }, copied ? '✓ Copied' : 'Copy')
    ]),
    React.createElement('pre', {
      key: 'body',
      style: {
        margin: 0,
        padding: '14px',
        overflowX: 'auto',
        fontFamily: 'Consolas, Monaco, "Roboto Mono", monospace',
        fontSize: '0.84rem',
        lineHeight: '1.5',
        color: textColor || '#eee',
        whiteSpace: 'pre'
      }
    }, code)
  ]);
}

/**
 * Main Formatted Markdown Document Component
 */
export function FormattedMarkdown({ content, onNavigate, themeConfig = {}, searchQuery = '' }) {
  const {
    textColor = '#ffffff',
    highlightColor = '#00ffff',
    panelColor = '#1a1a24',
    secondaryTextColor = '#aaaaaa',
    dividerColor = 'rgba(255, 255, 255, 0.15)',
    headerColor = '#ffffff'
  } = themeConfig;

  if (!content) {
    return React.createElement('div', {
      style: { color: secondaryTextColor, padding: '20px' }
    }, 'No content available.');
  }

  const blocks = parseMarkdown(content);
  const inlineOpts = { onNavigate, highlightColor, textColor, panelColor };

  const renderedBlocks = blocks.map((block, idx) => {
    // Search filter matching
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const blockText = JSON.stringify(block).toLowerCase();
      if (!blockText.includes(q)) {
        return null;
      }
    }

    switch (block.type) {
      case 'heading': {
        const fontSizes = { 1: '1.65rem', 2: '1.35rem', 3: '1.15rem', 4: '1.0rem' };
        const margins = { 1: '1.8rem 0 0.8rem 0', 2: '1.5rem 0 0.6rem 0', 3: '1.2rem 0 0.5rem 0', 4: '1rem 0 0.4rem 0' };
        const isTopLevel = block.level <= 2;

        return React.createElement('div', {
          key: idx,
          id: block.id,
          style: {
            margin: margins[block.level] || '1rem 0',
            paddingBottom: isTopLevel ? '8px' : '4px',
            borderBottom: isTopLevel ? `2px solid ${highlightColor}40` : `1px solid ${dividerColor}`,
            color: block.level === 1 ? highlightColor : headerColor,
            fontWeight: 'bold',
            fontSize: fontSizes[block.level] || '1rem'
          }
        }, renderInline(block.text, inlineOpts));
      }

      case 'paragraph':
        return React.createElement('p', {
          key: idx,
          style: { margin: '0.8rem 0', color: textColor, lineHeight: '1.65' }
        }, renderInline(block.text, inlineOpts));

      case 'blockquote':
        return React.createElement('div', {
          key: idx,
          style: {
            margin: '1rem 0',
            padding: '12px 18px',
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            borderLeft: `4px solid ${highlightColor}`,
            borderRadius: '0 6px 6px 0',
            color: textColor,
            fontSize: '0.9rem',
            lineHeight: '1.6'
          }
        }, block.text.split('\n').map((line, lIdx) => (
          React.createElement('div', { key: lIdx, style: { margin: '4px 0' } }, renderInline(line, inlineOpts))
        )));

      case 'table':
        return React.createElement('div', {
          key: idx,
          style: { margin: '1.2rem 0', overflowX: 'auto', borderRadius: '6px', border: `1px solid ${dividerColor}` }
        }, React.createElement('table', {
          style: {
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.85rem',
            backgroundColor: 'rgba(0, 0, 0, 0.3)'
          }
        }, [
          React.createElement('thead', { key: 'thead' }, (
            React.createElement('tr', {
              style: {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderBottom: `2px solid ${highlightColor}60`
              }
            }, block.headers.map((h, hIdx) => (
              React.createElement('th', {
                key: hIdx,
                style: {
                  padding: '10px 14px',
                  textAlign: 'left',
                  color: highlightColor,
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap'
                }
              }, renderInline(h, inlineOpts))
            )))
          )),
          React.createElement('tbody', { key: 'tbody' }, (
            block.rows.map((row, rIdx) => (
              React.createElement('tr', {
                key: rIdx,
                style: {
                  borderBottom: `1px solid ${dividerColor}`,
                  backgroundColor: rIdx % 2 === 1 ? 'rgba(255, 255, 255, 0.02)' : 'transparent'
                }
              }, row.map((cell, cIdx) => (
                React.createElement('td', {
                  key: cIdx,
                  style: { padding: '8px 14px', verticalAlign: 'top', color: textColor }
                }, renderInline(cell, inlineOpts))
              )))
            ))
          ))
        ]));

      case 'list':
        return React.createElement('ul', {
          key: idx,
          style: {
            margin: '0.8rem 0',
            paddingLeft: '1.5rem',
            listStyleType: 'none'
          }
        }, block.items.map((item, itemIdx) => (
          React.createElement('li', {
            key: itemIdx,
            style: {
              margin: '5px 0',
              paddingLeft: `${item.level * 1.2}rem`,
              position: 'relative',
              lineHeight: '1.55'
            }
          }, [
            React.createElement('span', {
              key: 'bullet',
              style: {
                color: highlightColor,
                position: 'absolute',
                left: `${item.level * 1.2 - 1.2}rem`,
                fontWeight: 'bold',
                fontSize: '0.85em'
              }
            }, item.isOrdered ? item.bullet : '▸'),
            renderInline(item.text, inlineOpts)
          ])
        )));

      case 'code_block':
        return React.createElement(CodeBlockItem, {
          key: idx,
          language: block.language,
          code: block.code,
          highlightColor,
          textColor,
          panelColor
        });

      case 'hr':
        return React.createElement('hr', {
          key: idx,
          style: {
            margin: '1.8rem 0',
            border: 'none',
            borderTop: `1px solid ${highlightColor}40`
          }
        });

      default:
        return null;
    }
  }).filter(Boolean);

  return React.createElement('div', {
    className: 'formatted-doc-view',
    style: {
      color: textColor,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      fontSize: '0.92rem',
      lineHeight: '1.65'
    }
  }, renderedBlocks);
}
