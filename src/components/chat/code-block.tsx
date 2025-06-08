'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface CodeBlockProps {
  code: string;
  language: string;
  highlightedCode: string;
  filename?: string;
}

export function CodeBlock({ code, language, highlightedCode, filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy code');
    }
  };

  return (
    <div className="relative group">
      {/* Header with language and copy button */}
      <div className="flex items-center justify-between bg-gray-800 px-4 py-2 rounded-t-lg">
        <div className="flex items-center gap-2">
          {filename && (
            <span className="text-gray-300 text-sm font-mono">{filename}</span>
          )}
          <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs font-mono uppercase">
            {language || 'text'}
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-700 rounded"
          title="Copy code"
        >
          {copied ? (
            <Check size={16} className="text-green-400" />
          ) : (
            <Copy size={16} className="text-gray-400" />
          )}
        </button>
      </div>

      {/* Code content */}
      <div className="overflow-x-auto">
        <div
          className="text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
      </div>
    </div>
  );
}
