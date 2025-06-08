'use client';
import { memo } from 'react';
import MarkdownCodeHighlighter from './markdown-code';

interface MessageRendererProps {
  content: string;
  role: 'user' | 'assistant';
}

export const MessageRenderer = memo(function MessageRenderer({
  content,
  role
}: MessageRendererProps) {
  // For user messages, keep simple text rendering
  if (role === 'user') {
    return (
      <div className="whitespace-pre-wrap leading-relaxed">
        {content}
      </div>
    );
  }

  // For assistant messages, use advanced block-based markdown
  return (
    <MarkdownCodeHighlighter
      content={content}
      id={`message-${Date.now()}`}
      size="default"
    />
  );
});

export default MessageRenderer;
