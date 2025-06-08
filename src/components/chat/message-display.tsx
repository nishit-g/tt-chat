import { marked } from 'marked';
import { codeToHtml } from 'shiki';

interface MessageDisplayProps {
  content: string;
  role: 'user' | 'assistant';
}

export async function MessageDisplay({ content, role }: MessageDisplayProps) {
  // Configure marked for code highlighting
  marked.setOptions({
    highlight: async (code, lang) => {
      try {
        const html = await codeToHtml(code, {
          lang: lang || 'text',
          theme: 'github-dark',
        });
        return html;
      } catch {
        return code;
      }
    },
  });

  const htmlContent = await marked(content);

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
    </div>
  );
}
