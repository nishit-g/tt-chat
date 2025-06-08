import { codeToHtml } from 'shiki';

// Cache for highlighted code to improve performance
const highlightCache = new Map<string, string>();

// Popular languages for web development
const LANGUAGE_MAP: Record<string, string> = {
  'js': 'javascript',
  'jsx': 'jsx',
  'ts': 'typescript',
  'tsx': 'tsx',
  'py': 'python',
  'rb': 'ruby',
  'go': 'go',
  'rs': 'rust',
  'java': 'java',
  'c': 'c',
  'cpp': 'cpp',
  'cs': 'csharp',
  'php': 'php',
  'sh': 'bash',
  'bash': 'bash',
  'zsh': 'bash',
  'fish': 'fish',
  'sql': 'sql',
  'html': 'html',
  'css': 'css',
  'scss': 'scss',
  'less': 'less',
  'json': 'json',
  'xml': 'xml',
  'yaml': 'yaml',
  'yml': 'yaml',
  'toml': 'toml',
  'md': 'markdown',
  'markdown': 'markdown',
  'dockerfile': 'dockerfile',
  'nginx': 'nginx',
  'apache': 'apache',
  'vim': 'vim',
  'lua': 'lua',
  'r': 'r',
  'matlab': 'matlab',
  'swift': 'swift',
  'kotlin': 'kotlin',
  'dart': 'dart',
  'perl': 'perl',
  'haskell': 'haskell',
  'clojure': 'clojure',
  'scala': 'scala',
  'elixir': 'elixir',
  'erlang': 'erlang',
  'ocaml': 'ocaml',
  'fsharp': 'fsharp',
  'powershell': 'powershell',
  'batch': 'batch'
};

// Detect language from code content
function detectLanguage(code: string): string {
  const content = code.toLowerCase().trim();

  // React/JSX patterns
  if (content.includes('import react') || content.includes('jsx') ||
      content.includes('usestate') || content.includes('<div') ||
      content.includes('export default function')) {
    return content.includes('interface') || content.includes(': React.') ? 'tsx' : 'jsx';
  }

  // TypeScript patterns
  if (content.includes('interface ') || content.includes('type ') ||
      content.includes(': string') || content.includes(': number') ||
      content.includes('export type') || content.includes('import type')) {
    return 'typescript';
  }

  // JavaScript patterns
  if (content.includes('function ') || content.includes('const ') ||
      content.includes('export ') || content.includes('import ') ||
      content.includes('console.log')) {
    return 'javascript';
  }

  // Python patterns
  if (content.includes('def ') || content.includes('import ') ||
      content.includes('print(') || content.includes('class ') ||
      content.includes('if __name__')) {
    return 'python';
  }

  // CSS patterns
  if (content.includes('{') && content.includes('}') &&
      (content.includes('color:') || content.includes('background:') ||
       content.includes('display:') || content.includes('margin:'))) {
    return 'css';
  }

  // HTML patterns
  if (content.includes('<!doctype') || content.includes('<html') ||
      content.includes('<head>') || content.includes('<body>')) {
    return 'html';
  }

  // JSON patterns
  if ((content.startsWith('{') && content.endsWith('}')) ||
      (content.startsWith('[') && content.endsWith(']'))) {
    try {
      JSON.parse(content);
      return 'json';
    } catch {
      // Not valid JSON, continue detection
    }
  }

  // SQL patterns
  if (content.includes('select ') || content.includes('insert ') ||
      content.includes('update ') || content.includes('delete ') ||
      content.includes('create table')) {
    return 'sql';
  }

  // Shell/Bash patterns
  if (content.includes('#!/bin/bash') || content.includes('#!/bin/sh') ||
      content.includes('echo ') || content.includes('export ') ||
      content.includes('chmod ') || content.startsWith('$ ')) {
    return 'bash';
  }

  return 'text';
}

// Main highlighting function
export async function highlightCode(code: string, language?: string): Promise<{
  highlightedCode: string;
  detectedLanguage: string;
}> {
  const detectedLang = language || detectLanguage(code);
  const normalizedLang = LANGUAGE_MAP[detectedLang.toLowerCase()] || detectedLang;

  // Create cache key
  const cacheKey = `${normalizedLang}:${code}`;

  // Check cache first
  if (highlightCache.has(cacheKey)) {
    return {
      highlightedCode: highlightCache.get(cacheKey)!,
      detectedLanguage: normalizedLang
    };
  }

  try {
    const highlighted = await codeToHtml(code, {
      lang: normalizedLang,
      theme: 'github-dark',
      transformers: [
        {
          pre(node) {
            // Remove default styling to use our own
            delete node.properties.style;
            node.properties.class = 'shiki-code-block bg-gray-900 p-4 rounded-b-lg overflow-x-auto';
          },
          code(node) {
            node.properties.class = 'block font-mono text-sm';
          }
        }
      ]
    });

    // Cache the result
    highlightCache.set(cacheKey, highlighted);

    return {
      highlightedCode: highlighted,
      detectedLanguage: normalizedLang
    };
  } catch (error) {
    console.warn('Failed to highlight code:', error);

    // Fallback to plain text with basic formatting
    const fallback = `<pre class="shiki-code-block bg-gray-900 p-4 rounded-b-lg overflow-x-auto"><code class="block font-mono text-sm text-gray-300">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;

    return {
      highlightedCode: fallback,
      detectedLanguage: 'text'
    };
  }
}

// Clear cache periodically to prevent memory leaks
export function clearHighlightCache() {
  highlightCache.clear();
}

// Get cache stats for debugging
export function getHighlightCacheStats() {
  return {
    size: highlightCache.size,
    entries: Array.from(highlightCache.keys()).slice(0, 5) // First 5 for debugging
  };
}
