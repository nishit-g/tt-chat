// components/chat/block-based-markdown.tsx
'use client';

import { memo, useMemo, useState, createContext, useContext, useEffect } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { marked } from 'marked';
import type { ComponentProps } from 'react';
import type { ExtraProps } from 'react-markdown';
import { Check, Copy } from 'lucide-react';
import { sytaxHighlighter } from '../../lib/syntax-highlighter';

type CodeComponentProps = ComponentProps<'code'> & ExtraProps;
type MarkdownSize = 'default' | 'small';

const MarkdownSizeContext = createContext<MarkdownSize>('default');

const components: Components = {
  code: CodeBlock as Components['code'],
  pre: ({ children }) => <>{children}</>,
};

function CodeBlock({ children, className, ...props }: CodeComponentProps) {
  const size = useContext(MarkdownSizeContext);
  const match = /language-(\w+)/.exec(className || '');
  const [highlightedCode, setHighlightedCode] = useState<string>('');
  const [isReady, setIsReady] = useState(false);

  const code = String(children).replace(/\n$/, '');

  useEffect(() => {
    if (match) {
      const lang = match[1];

      sytaxHighlighter.highlightCode(code, lang)
        .then(result => {
          setHighlightedCode(result.html);
          setIsReady(true);
        })
        .catch(error => {
          console.error('Highlighting error:', error);
          // Fallback to escaped HTML
          setHighlightedCode(code.replace(/</g, '&lt;').replace(/>/g, '&gt;'));
          setIsReady(true);
        });
    } else {
      setIsReady(true);
    }
  }, [code, match]);

  if (match) {
    const lang = match[1];

    return (
      <div className="rounded-lg overflow-hidden bg-gray-900 text-gray-100 my-4">
        <CodeHeader lang={lang} code={code} />
        <div className="relative">
          {!isReady && (
            <div className="p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                <div className="h-4 bg-gray-700 rounded w-5/6"></div>
              </div>
            </div>
          )}
          {isReady && (
            <div
              className="p-4 overflow-x-auto font-mono text-sm leading-relaxed"
              style={{
                backgroundColor: '#1e1e1e',
                color: '#d4d4d4',
                fontFamily: "'Consolas', 'Monaco', 'SF Mono', 'Roboto Mono', monospace",
                tabSize: 2,
                whiteSpace: 'pre'
              }}
              dangerouslySetInnerHTML={{ __html: highlightedCode }}
            />
          )}
        </div>
      </div>
    );
  }

  // Inline code
  const inlineClasses = size === 'small'
    ? 'mx-0.5 px-1 py-0.5 bg-gray-100 dark:bg-gray-800 text-foreground font-mono text-xs rounded'
    : 'mx-0.5 px-2 py-1 bg-gray-100 dark:bg-gray-800 text-foreground font-mono rounded';

  return (
    <code className={inlineClasses} {...props}>
      {children}
    </code>
  );
}

function CodeHeader({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  return (
    <div className="flex justify-between items-center px-4 py-2 bg-gray-800 border-b border-gray-700">
      <span className="text-sm font-mono text-gray-300">{lang}</span>

      <button
        onClick={copyCode}
        className="text-sm hover:text-blue-400 transition-colors flex items-center gap-1 text-gray-300"
        title="Copy code"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4" />
            <span className="text-xs">Copied!</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            <span className="text-xs">Copy</span>
          </>
        )}
      </button>
    </div>
  );
}

// Parse markdown into blocks for streaming
function parseMarkdownIntoBlocks(markdown: string): string[] {
  try {
    const tokens = marked.lexer(markdown);
    return tokens.map((token) => token.raw);
  } catch {
    return [markdown];
  }
}

function PureMarkdownBlock({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, [remarkMath]]}
      rehypePlugins={[rehypeKatex]}
      components={components}
    >
      {content}
    </ReactMarkdown>
  );
}

const MarkdownBlock = memo(
  PureMarkdownBlock,
  (prev, next) => prev.content === next.content
);

// Main component
const MarkdownCodeHighlighter = memo(
  ({ content, id, size = 'default' }: {
    content: string;
    id: string;
    size?: MarkdownSize;
  }) => {
    const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content]);

    const proseClasses = size === 'small'
      ? 'prose prose-sm dark:prose-invert max-w-none prose-code:before:content-none prose-code:after:content-none'
      : 'prose prose-base dark:prose-invert max-w-none prose-code:before:content-none prose-code:after:content-none';

    return (
      <MarkdownSizeContext.Provider value={size}>
        <div className={proseClasses}>
          {blocks.map((block, index) => (
            <MarkdownBlock
              content={block}
              key={`${id}-${index}`}
            />
          ))}
        </div>
      </MarkdownSizeContext.Provider>
    );
  }
);

MarkdownCodeHighlighter.displayName = 'MarkdownCodeHighlighter';

export default MarkdownCodeHighlighter;
