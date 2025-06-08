'use client';

import { memo, useMemo } from 'react';
import { CodeBlock } from './code-block';
import { highlightCode } from '../../lib/syntax-highlighter';
import { useEffect, useState } from 'react';

interface MessageRendererProps {
  content: string;
  role: 'user' | 'assistant';
}

interface CodeBlockData {
  code: string;
  language: string;
  highlightedCode: string;
  filename?: string;
}

export const MessageRenderer = memo(function MessageRenderer({
  content,
  role
}: MessageRendererProps) {
  const [processedContent, setProcessedContent] = useState<string>(content);
  const [codeBlocks, setCodeBlocks] = useState<Map<string, CodeBlockData>>(new Map());

  // Process content and extract code blocks
  useEffect(() => {
    let processed = content;
    const blocks = new Map<string, CodeBlockData>();

    // Enhanced regex to match code blocks with optional language and filename
    const codeBlockRegex = /```(?:(\w+)(?:\s+(.+?))?)?\n([\s\S]*?)```/g;

    const processCodeBlocks = async () => {
      const matches = Array.from(content.matchAll(codeBlockRegex));

      for (let i = 0; i < matches.length; i++) {
        const [fullMatch, language, filename, code] = matches[i];
        const blockId = `code-block-${i}`;

        try {
          const { highlightedCode, detectedLanguage } = await highlightCode(
            code.trim(),
            language
          );

          blocks.set(blockId, {
            code: code.trim(),
            language: detectedLanguage,
            highlightedCode,
            filename: filename?.trim()
          });

          // Replace code block with placeholder
          processed = processed.replace(fullMatch, `__CODE_BLOCK_${blockId}__`);
        } catch (error) {
          console.error('Failed to process code block:', error);
        }
      }

      setCodeBlocks(blocks);
      setProcessedContent(processed);
    };

    if (codeBlockRegex.test(content)) {
      processCodeBlocks();
    } else {
      setProcessedContent(content);
      setCodeBlocks(new Map());
    }
  }, [content]);

  // Split content and render with code blocks
  const renderedContent = useMemo(() => {
    if (codeBlocks.size === 0) {
      return (
        <div className="whitespace-pre-wrap leading-relaxed">
          {processedContent}
        </div>
      );
    }

    const parts = processedContent.split(/(__CODE_BLOCK_code-block-\d+__)/);

    return (
      <div className="space-y-4">
        {parts.map((part, index) => {
          const codeBlockMatch = part.match(/^__CODE_BLOCK_(code-block-\d+)__$/);

          if (codeBlockMatch) {
            const blockId = codeBlockMatch[1];
            const blockData = codeBlocks.get(blockId);

            if (blockData) {
              return (
                <CodeBlock
                  key={`${blockId}-${index}`}
                  code={blockData.code}
                  language={blockData.language}
                  highlightedCode={blockData.highlightedCode}
                  filename={blockData.filename}
                />
              );
            }
          }

          // Regular text content
          if (part.trim()) {
            return (
              <div key={index} className="whitespace-pre-wrap leading-relaxed">
                {part}
              </div>
            );
          }

          return null;
        })}
      </div>
    );
  }, [processedContent, codeBlocks]);

  return <div className="message-content">{renderedContent}</div>;
});
