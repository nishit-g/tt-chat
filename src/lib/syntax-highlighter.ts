interface HighlightResult {
  html: string;
  language: string;
  renderTime: number;
}

class SyntaxHighlter {
  private cache = new Map<string, string>();

  // Fast language detection
  detectLanguage(code: string): string {
    const sample = code.slice(0, 200).toLowerCase();

    // TypeScript detection
    if (sample.includes('interface ') || sample.includes(': string') || sample.includes(': number')) {
      return 'typescript';
    }

    // JSX detection
    if (sample.includes('<div') || sample.includes('jsx') || sample.includes('usestate')) {
      return 'jsx';
    }

    // JavaScript detection
    if (sample.includes('function ') || sample.includes('const ') || sample.includes('=>')) {
      return 'javascript';
    }

    // Python detection
    if (sample.includes('def ') || sample.includes('print(') || sample.includes('import ')) {
      return 'python';
    }

    // CSS detection
    if (sample.includes('color:') && sample.includes('{')) {
      return 'css';
    }

    // JSON detection
    if (sample.startsWith('{') || sample.startsWith('[')) {
      return 'json';
    }

    return 'text';
  }

  // Safe HTML escaping
  private escape(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Apply highlighting patterns
  private highlight(code: string, language: string): string {
    let result = this.escape(code);

    switch (language) {
      case 'javascript':
      case 'typescript':
      case 'jsx':
        result = result
          // Keywords
          .replace(/\b(async|await|function|const|let|var|class|if|else|for|while|return|import|export|interface|type|enum|try|catch|finally)\b/g,
            '<span style="color: #ff7b72; font-weight: 600;">$1</span>')
          // Literals
          .replace(/\b(true|false|null|undefined)\b/g,
            '<span style="color: #79c0ff;">$1</span>')
          // Strings
          .replace(/"([^"\\]|\\.)*"/g,
            '<span style="color: #a5d6ff;">$&</span>')
          .replace(/'([^'\\]|\\.)*'/g,
            '<span style="color: #a5d6ff;">$&</span>')
          .replace(/`([^`\\]|\\.)*`/g,
            '<span style="color: #7ee787;">$&</span>')
          // Comments
          .replace(/\/\/.*$/gm,
            '<span style="color: #8b949e; font-style: italic;">$&</span>')
          .replace(/\/\*[\s\S]*?\*\//g,
            '<span style="color: #8b949e; font-style: italic;">$&</span>')
          // Numbers
          .replace(/\b\d+(\.\d+)?\b/g,
            '<span style="color: #79c0ff;">$&</span>');
        break;

      case 'python':
        result = result
          .replace(/\b(def|class|if|elif|else|for|while|return|import|from|try|except|finally|with|lambda|async|await)\b/g,
            '<span style="color: #ff7b72; font-weight: 600;">$1</span>')
          .replace(/\b(True|False|None)\b/g,
            '<span style="color: #79c0ff;">$1</span>')
          .replace(/"([^"\\]|\\.)*"/g,
            '<span style="color: #a5d6ff;">$&</span>')
          .replace(/'([^'\\]|\\.)*'/g,
            '<span style="color: #a5d6ff;">$&</span>')
          .replace(/#.*$/gm,
            '<span style="color: #8b949e; font-style: italic;">$&</span>')
          .replace(/\b\d+(\.\d+)?\b/g,
            '<span style="color: #79c0ff;">$&</span>');
        break;

      case 'css':
        result = result
          .replace(/\/\*[\s\S]*?\*\//g,
            '<span style="color: #8b949e; font-style: italic;">$&</span>')
          .replace(/([.#]?[\w-]+)\s*\{/g,
            '<span style="color: #7ee787;">$1</span>{')
          .replace(/([\w-]+)\s*:/g,
            '<span style="color: #79c0ff;">$1</span>:')
          .replace(/:\s*([^;{}]+);/g,
            ': <span style="color: #a5d6ff;">$1</span>;');
        break;

      case 'json':
        result = result
          .replace(/"([^"\\]|\\.)*"\s*:/g,
            '<span style="color: #79c0ff; font-weight: 500;">$&</span>')
          .replace(/:\s*"([^"\\]|\\.)*"/g,
            ': <span style="color: #a5d6ff;">$1</span>')
          .replace(/:\s*(true|false|null)\b/g,
            ': <span style="color: #79c0ff;">$1</span>')
          .replace(/:\s*\d+(\.\d+)?/g,
            ': <span style="color: #79c0ff;">$1</span>');
        break;
    }

    return result;
  }

  // Cache key generation
  private getCacheKey(code: string, language: string): string {
    return `${language}:${code.length}:${code.slice(0, 30)}`;
  }

  // Main highlighting method
  async highlightCode(code: string, language?: string): Promise<HighlightResult> {
    const startTime = performance.now();

    // Detect language if not provided
    const detectedLanguage = language || this.detectLanguage(code);

    // Check cache
    const cacheKey = this.getCacheKey(code, detectedLanguage);
    let html = this.cache.get(cacheKey);

    if (!html) {
      // Highlight code
      html = this.highlight(code, detectedLanguage);

      // Cache with size limit
      if (this.cache.size > 200) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
      this.cache.set(cacheKey, html);
    }

    return {
      html,
      language: detectedLanguage,
      renderTime: performance.now() - startTime
    };
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton
export const sytaxHighlighter= new SyntaxHighlter();

// Simple function export
export async function highlightCode(code: string, language?: string): Promise<HighlightResult> {
  return sytaxHighlighter.highlightCode(code, language);
}
