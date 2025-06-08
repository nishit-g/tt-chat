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
  const [processedContent, setProcessedContent] = useState<string>('');
  const [codeBlocks, setCodeBlocks] = useState<Map<string, CodeBlockData>>(new Map());
  const [isProcessing, setIsProcessing] = useState(false);

  // Process content and extract code blocks
  useEffect(() => {
    const processContent = async () => {
      setIsProcessing(true);

      // Standard markdown code block regex
      // Matches: ```language\ncode\n``` or ```\ncode\n```
      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;

      let processed = content;
      const blocks = new Map<string, CodeBlockData>();
      const matches = Array.from(content.matchAll(codeBlockRegex));

      if (matches.length === 0) {
        // No code blocks, just set the content
        setProcessedContent(content);
        setCodeBlocks(new Map());
        setIsProcessing(false);
        return;
      }

      // Process each code block
      for (let i = 0; i < matches.length; i++) {
        const [fullMatch, language, code] = matches[i];
        const blockId = `code-block-${i}`;

        try {
          const { highlightedCode, detectedLanguage } = await highlightCode(
            code.trim(),
            language || undefined // Pass undefined if no language specified
          );

          blocks.set(blockId, {
            code: code.trim(),
            language: detectedLanguage,
            highlightedCode,
            // No filename from standard markdown
            filename: undefined
          });

          // Replace code block with placeholder
          processed = processed.replace(fullMatch, `__CODE_BLOCK_${blockId}__`);
        } catch (error) {
          console.error('Failed to process code block:', error);

          // Fallback: basic highlighting
          const escapedCode = code.trim()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

          blocks.set(blockId, {
            code: code.trim(),
            language: language || 'text',
            highlightedCode: `<pre class="bg-gray-900 text-gray-300 p-4 rounded overflow-x-auto font-mono text-sm"><code>${escapedCode}</code></pre>`,
            filename: undefined
          });

          processed = processed.replace(fullMatch, `__CODE_BLOCK_${blockId}__`);
        }
      }

      setCodeBlocks(blocks);
      setProcessedContent(processed);
      setIsProcessing(false);
    };

    processContent();
  }, [content]);

  // Split content and render with code blocks
  const renderedContent = useMemo(() => {
    if (isProcessing) {
      return (
        <div className="flex items-center gap-2 text-gray-500">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="text-sm">Processing code...</span>
        </div>
      );
    }

    if (codeBlocks.size === 0) {
      // No code blocks - render with simple markdown
      return <SimpleMarkdownRenderer content={processedContent} />;
    }

    const parts = processedContent.split(/(__CODE_BLOCK_code-block-\d+__)/);

    return (
      <div className="space-y-3">
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
              <SimpleMarkdownRenderer
                key={index}
                content={part}
              />
            );
          }

          return null;
        })}
      </div>
    );
  }, [processedContent, codeBlocks, isProcessing]);

  return <div className="message-content">{renderedContent}</div>;
});

// Simple markdown renderer for text content
function SimpleMarkdownRenderer({ content }: { content: string }) {
  const formattedText = useMemo(() => {
    return content
      // Bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic text
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-800 text-red-600 dark:text-red-400 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      // Headers
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
      // Lists
      .replace(/^\* (.*)$/gm, '<li class="ml-4">• $1</li>')
      .replace(/^\d+\. (.*)$/gm, '<li class="ml-4">$1</li>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-500 hover:text-blue-600 underline" target="_blank" rel="noopener noreferrer">$1</a>');
  }, [content]);

  return (
    <div
      className="whitespace-pre-wrap leading-relaxed prose prose-sm max-w-none dark:prose-invert"
      dangerouslySetInnerHTML={{ __html: formattedText }}
    />
  );
}
