import { codeToHtml } from 'shiki';

// Cache for highlighted code to improve performance
const highlightCache = new Map<string, string>();

// Supported languages - focusing on most common ones for better performance
const SUPPORTED_LANGUAGES = [
  'javascript', 'typescript', 'jsx', 'tsx', 'python', 'java', 'c', 'cpp', 'csharp',
  'go', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'dart', 'scala', 'r',
  'html', 'css', 'scss', 'sass', 'less', 'json', 'xml', 'yaml', 'toml',
  'bash', 'shell', 'powershell', 'sql', 'dockerfile', 'nginx', 'apache',
  'markdown', 'latex', 'vim', 'lua', 'perl', 'haskell', 'clojure', 'erlang'
];

// Language aliases for better detection
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
  'c++': 'cpp',
  'cs': 'csharp',
  'php': 'php',
  'sh': 'bash',
  'bash': 'bash',
  'zsh': 'bash',
  'fish': 'bash',
  'ps1': 'powershell',
  'sql': 'sql',
  'html': 'html',
  'css': 'css',
  'scss': 'scss',
  'sass': 'sass',
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
  'swift': 'swift',
  'kotlin': 'kotlin',
  'kt': 'kotlin',
  'dart': 'dart',
  'scala': 'scala',
  'perl': 'perl',
  'pl': 'perl',
  'haskell': 'haskell',
  'hs': 'haskell',
  'clojure': 'clojure',
  'clj': 'clojure',
  'erlang': 'erlang',
  'erl': 'erlang',
  'latex': 'latex',
  'tex': 'latex'
};

// Improved language detection with more patterns
function detectLanguage(code: string): string {
  const content = code.toLowerCase().trim();
  const firstLine = content.split('\n')[0];

  // Shebang detection
  if (firstLine.startsWith('#!')) {
    if (firstLine.includes('python')) return 'python';
    if (firstLine.includes('node') || firstLine.includes('bun')) return 'javascript';
    if (firstLine.includes('bash') || firstLine.includes('sh')) return 'bash';
    if (firstLine.includes('ruby')) return 'ruby';
    if (firstLine.includes('perl')) return 'perl';
  }

  // File extension patterns
  if (content.includes('FROM ') && content.includes('RUN ')) return 'dockerfile';
  if (content.includes('server {') && content.includes('location ')) return 'nginx';

  // React/JSX patterns (check before general JS)
  if (content.includes('import react') ||
      content.includes('from \'react\'') ||
      content.includes('usestate') ||
      content.includes('useeffect') ||
      content.includes('<div') ||
      content.includes('jsx') ||
      content.includes('export default function')) {
    return content.includes('interface ') || content.includes(': react.') ? 'tsx' : 'jsx';
  }

  // TypeScript patterns (check before JavaScript)
  if (content.includes('interface ') ||
      content.includes('type ') ||
      content.includes(': string') ||
      content.includes(': number') ||
      content.includes(': boolean') ||
      content.includes('export type') ||
      content.includes('import type') ||
      content.includes('as const') ||
      content.includes('enum ')) {
    return 'typescript';
  }

  // JavaScript patterns
  if (content.includes('function ') ||
      content.includes('const ') ||
      content.includes('let ') ||
      content.includes('var ') ||
      content.includes('export ') ||
      content.includes('import ') ||
      content.includes('console.log') ||
      content.includes('require(') ||
      content.includes('=>')) {
    return 'javascript';
  }

  // Python patterns
  if (content.includes('def ') ||
      content.includes('import ') ||
      content.includes('from ') ||
      content.includes('print(') ||
      content.includes('class ') ||
      content.includes('if __name__') ||
      content.includes('elif ') ||
      content.includes('lambda ')) {
    return 'python';
  }

  // Java patterns
  if (content.includes('public class ') ||
      content.includes('public static void main') ||
      content.includes('package ') ||
      content.includes('import java.') ||
      content.includes('system.out.println')) {
    return 'java';
  }

  // C/C++ patterns
  if (content.includes('#include') ||
      content.includes('int main(') ||
      content.includes('std::') ||
      content.includes('using namespace')) {
    return content.includes('std::') || content.includes('namespace') ? 'cpp' : 'c';
  }

  // CSS patterns
  if (content.includes('{') && content.includes('}') &&
      (content.includes('color:') || content.includes('background:') ||
       content.includes('display:') || content.includes('margin:') ||
       content.includes('padding:') || content.includes('font-'))) {
    return 'css';
  }

  // HTML patterns
  if (content.includes('<!doctype') ||
      content.includes('<html') ||
      content.includes('<head>') ||
      content.includes('<body>') ||
      content.includes('<div') ||
      content.includes('<span')) {
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
  if (content.includes('select ') ||
      content.includes('insert ') ||
      content.includes('update ') ||
      content.includes('delete ') ||
      content.includes('create table') ||
      content.includes('alter table') ||
      content.includes('drop table')) {
    return 'sql';
  }

  // Shell/Bash patterns
  if (content.includes('echo ') ||
      content.includes('export ') ||
      content.includes('chmod ') ||
      content.startsWith('$ ') ||
      content.includes('grep ') ||
      content.includes('awk ') ||
      content.includes('sed ')) {
    return 'bash';
  }

  // YAML patterns
  if (content.includes('---') ||
      (content.includes(':') && content.includes('  ') && !content.includes(';'))) {
    return 'yaml';
  }

  return 'text';
}

// Validate if language is supported
function validateLanguage(lang: string): string {
  const normalizedLang = LANGUAGE_MAP[lang.toLowerCase()] || lang.toLowerCase();
  return SUPPORTED_LANGUAGES.includes(normalizedLang) ? normalizedLang : 'text';
}

// Main highlighting function with better error handling
export async function highlightCode(code: string, language?: string): Promise<{
  highlightedCode: string;
  detectedLanguage: string;
}> {
  // Clean the code
  const cleanCode = code.trim();
  if (!cleanCode) {
    return {
      highlightedCode: '<pre class="bg-gray-900 text-gray-300 p-4 rounded overflow-x-auto"><code></code></pre>',
      detectedLanguage: 'text'
    };
  }

  // Determine language
  const detectedLang = language || detectLanguage(cleanCode);
  const validatedLang = validateLanguage(detectedLang);

  // Create cache key
  const cacheKey = `${validatedLang}:${cleanCode.slice(0, 100)}:${cleanCode.length}`;

  // Check cache first
  if (highlightCache.has(cacheKey)) {
    return {
      highlightedCode: highlightCache.get(cacheKey)!,
      detectedLanguage: validatedLang
    };
  }

  try {
    const highlighted = await codeToHtml(cleanCode, {
      lang: validatedLang === 'text' ? 'txt' : validatedLang,
      theme: 'github-dark-dimmed',
      transformers: [
        {
          pre(node) {
            // Clean up and apply our styling
            node.properties.class = 'shiki-pre bg-gray-900 text-gray-100 overflow-x-auto';
            node.properties.style = 'background-color: #0d1117; color: #f0f6fc; padding: 1rem; margin: 0; border-radius: 0 0 0.5rem 0.5rem;';
          },
          code(node) {
            node.properties.class = 'shiki-code font-mono text-sm leading-relaxed';
          }
        }
      ]
    });

    // Cache the result (limit cache size)
    if (highlightCache.size > 100) {
      const firstKey = highlightCache.keys().next().value;
      highlightCache.delete(firstKey);
    }
    highlightCache.set(cacheKey, highlighted);

    return {
      highlightedCode: highlighted,
      detectedLanguage: validatedLang
    };
  } catch (error) {
    console.warn(`Failed to highlight ${validatedLang} code:`, error);

    // Enhanced fallback with basic syntax coloring
    const fallbackHtml = createFallbackHighlight(cleanCode, validatedLang);

    return {
      highlightedCode: fallbackHtml,
      detectedLanguage: validatedLang
    };
  }
}

// Create a basic fallback with simple syntax highlighting
function createFallbackHighlight(code: string, language: string): string {
  let highlighted = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  // Basic syntax coloring for common languages
  if (language === 'javascript' || language === 'typescript') {
    highlighted = highlighted
      .replace(/\b(function|const|let|var|if|else|for|while|return|import|export|class|extends)\b/g, '<span style="color: #ff7b72;">$1</span>')
      .replace(/\b(true|false|null|undefined)\b/g, '<span style="color: #79c0ff;">$1</span>')
      .replace(/'([^']*?)'/g, '<span style="color: #a5d6ff;">\'$1\'</span>')
      .replace(/"([^"]*?)"/g, '<span style="color: #a5d6ff;">"$1"</span>');
  } else if (language === 'python') {
    highlighted = highlighted
      .replace(/\b(def|class|if|elif|else|for|while|return|import|from|as|try|except|finally)\b/g, '<span style="color: #ff7b72;">$1</span>')
      .replace(/\b(True|False|None)\b/g, '<span style="color: #79c0ff;">$1</span>')
      .replace(/'([^']*?)'/g, '<span style="color: #a5d6ff;">\'$1\'</span>')
      .replace(/"([^"]*?)"/g, '<span style="color: #a5d6ff;">"$1"</span>');
  }

  return `<pre class="bg-gray-900 text-gray-100 p-4 rounded-b-lg overflow-x-auto" style="background-color: #0d1117; color: #f0f6fc;"><code class="font-mono text-sm leading-relaxed">${highlighted}</code></pre>`;
}

// Utility functions
export function clearHighlightCache() {
  highlightCache.clear();
}

export function getHighlightCacheStats() {
  return {
    size: highlightCache.size,
    languages: Array.from(new Set(Array.from(highlightCache.keys()).map(key => key.split(':')[0]))),
    memoryUsage: `~${Math.round(highlightCache.size * 0.5)}KB`
  };
}

// Preload common themes for better performance
export async function preloadThemes() {
  try {
    // This will cache the theme for faster subsequent loads
    await codeToHtml('console.log("test");', {
      lang: 'javascript',
      theme: 'github-dark-dimmed'
    });
  } catch (error) {
    console.warn('Failed to preload themes:', error);
  }
}
