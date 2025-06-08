import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { streamText, convertToCoreMessages, tool } from 'ai';
import { z } from 'zod';
import { deduplicateAIRequest } from '@/lib/request-deduplicator';

export const maxDuration = 30;

// Model cache with performance tracking
const modelCache = new Map();
const requestStats = new Map();

function getModel(modelId: string) {
  if (modelCache.has(modelId)) {
    return modelCache.get(modelId);
  }

  const [provider, model] = modelId.split('/');
  let instance;

  switch (provider) {
    case 'openai':
      instance = openai(model);
      break;
    case 'anthropic':
      instance = anthropic(model);
      break;
    case 'google':
      instance = google(model);
      break;
    default:
      instance = openai('gpt-4o-mini');
  }

  modelCache.set(modelId, instance);
  return instance;
}

// Enhanced tools for testing
const tools = {
  getCurrentTime: tool({
    description: 'Get the current time and date with timezone info',
    parameters: z.object({}),
    execute: async () => {
      return {
        time: new Date().toLocaleString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
        timestamp: Date.now()
      };
    },
  }),

  analyzeCode: tool({
    description: 'Analyze code for performance issues and best practices',
    parameters: z.object({
      code: z.string().describe('The code to analyze'),
      language: z.string().describe('Programming language'),
      focus: z.enum(['performance', 'security', 'readability']).optional()
    }),
    execute: async ({ code, language, focus = 'performance' }) => {
      const analysis = {
        language,
        linesOfCode: code.split('\n').length,
        focus,
        issues: [] as string[],
        suggestions: [] as string[],
        score: 85
      };

      // Basic analysis based on language
      if (language.toLowerCase().includes('javascript') || language.toLowerCase().includes('typescript')) {
        if (code.includes('var ')) {
          analysis.issues.push('Use of deprecated var keyword');
          analysis.suggestions.push('Replace var with const or let');
          analysis.score -= 5;
        }

        if (code.includes('document.querySelector') && code.split('document.querySelector').length > 3) {
          analysis.issues.push('Multiple DOM queries detected');
          analysis.suggestions.push('Cache DOM elements in variables');
          analysis.score -= 10;
        }

        if (code.includes('for (') && code.includes('.length')) {
          analysis.suggestions.push('Consider using Array methods like map, filter, or forEach');
        }
      }

      if (language.toLowerCase().includes('python')) {
        if (code.includes('import *')) {
          analysis.issues.push('Wildcard imports detected');
          analysis.suggestions.push('Use specific imports instead of import *');
          analysis.score -= 5;
        }
      }

      return analysis;
    },
  }),

  searchDocumentation: tool({
    description: 'Search for documentation or examples',
    parameters: z.object({
      query: z.string().describe('What to search for'),
      category: z.enum(['react', 'javascript', 'typescript', 'css', 'general']).optional()
    }),
    execute: async ({ query, category = 'general' }) => {
      // Mock search results - in real app this would hit a search API
      const mockResults = [
        {
          title: `${category.toUpperCase()}: ${query}`,
          summary: `Here's what you need to know about ${query} in ${category}...`,
          url: `https://docs.example.com/${category}/${query.toLowerCase().replace(' ', '-')}`,
          relevance: 0.95
        },
        {
          title: `Best practices for ${query}`,
          summary: `Common patterns and recommendations for ${query}`,
          url: `https://bestpractices.dev/${query}`,
          relevance: 0.87
        }
      ];

      return {
        query,
        category,
        results: mockResults,
        totalFound: mockResults.length,
        searchTime: Math.random() * 100 + 20 // 20-120ms
      };
    },
  })
};

// Track request statistics
function updateRequestStats(model: string, duration: number, tokens: number) {
  const stats = requestStats.get(model) || {
    requests: 0,
    totalDuration: 0,
    totalTokens: 0,
    avgDuration: 0,
    avgTokensPerSecond: 0
  };

  stats.requests += 1;
  stats.totalDuration += duration;
  stats.totalTokens += tokens;
  stats.avgDuration = stats.totalDuration / stats.requests;
  stats.avgTokensPerSecond = stats.totalTokens / (stats.totalDuration / 1000);

  requestStats.set(model, stats);
}

export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    const { messages, model = 'openai/gpt-4o-mini', options = {} } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid messages format', { status: 400 });
    }

    const modelInstance = getModel(model);

    // Use request deduplication for identical requests
    const result = await deduplicateAIRequest(
      model,
      messages,
      async () => {
        return await streamText({
          model: modelInstance,
          messages: convertToCoreMessages(messages),
          maxTokens: options.maxTokens || 2000,
          temperature: options.temperature || 0.7,
          tools,
          system: `You are a helpful AI assistant focused on providing clear, accurate responses.

Current context:
- Date: ${new Date().toLocaleDateString()}
- Time: ${new Date().toLocaleTimeString()}
- Model: ${model}

When writing code:
- Always specify the language in code blocks (e.g., \`\`\`javascript, \`\`\`python)
- Include helpful comments
- Follow best practices for the language
- Be clear and readable

For code analysis:
- Focus on performance, security, and readability
- Provide specific, actionable suggestions
- Explain the reasoning behind recommendations`,

          // Enhanced callbacks for monitoring
          onFinish: async ({ usage, finishReason, text }) => {
            const duration = Date.now() - startTime;
            const tokens = usage?.totalTokens || 0;

            // Update statistics
            updateRequestStats(model, duration, tokens);

            if (process.env.NODE_ENV === 'development') {
              console.log(`✅ Request completed:`, {
                model,
                duration: `${duration}ms`,
                tokens,
                tokensPerSecond: tokens ? Math.round(tokens / (duration / 1000)) : 0,
                reason: finishReason,
                responseLength: text.length
              });
            }
          },

          onError: (error) => {
            console.error(`❌ Request failed for ${model}:`, error);
          }
        });
      },
      {
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        maxAge: 30000 // 30 seconds for deduplication
      }
    );

    return result.toDataStreamResponse({
      headers: {
        'X-Model-Used': model,
        'X-Request-Duration': (Date.now() - startTime).toString(),
        'X-Deduplication-Enabled': 'true',
        'Cache-Control': 'no-cache',
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('Optimized chat API error:', error);

    // Return detailed error response
    return new Response(
      JSON.stringify({
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error',
        model: req.url ? new URL(req.url).searchParams.get('model') : 'unknown',
        duration,
        timestamp: new Date().toISOString(),
        suggestion: getErrorSuggestion(error, req.url?.includes('model=') ?
          new URL(req.url).searchParams.get('model') || 'unknown' : 'unknown')
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'X-Error-Duration': duration.toString()
        }
      }
    );
  }
}

// Enhanced error suggestions
function getErrorSuggestion(error: any, model: string): string {
  const message = error?.message || '';

  if (message.includes('rate limit') || message.includes('429')) {
    return `Rate limited on ${model}. Try switching to a different model or wait before retrying.`;
  }

  if (message.includes('context') || message.includes('token')) {
    return `Context length exceeded for ${model}. Try summarizing your conversation or using a model with larger context window.`;
  }

  if (message.includes('timeout')) {
    return `Request timed out on ${model}. Try using a faster model like gpt-4o-mini or check your connection.`;
  }

  if (message.includes('authentication') || message.includes('401')) {
    return `Authentication failed for ${model}. Check your API keys in environment variables.`;
  }

  return `Error with ${model}. Try refreshing the page or switching to a different model.`;
}

// Performance monitoring endpoint
export async function GET() {
  const stats = Array.from(requestStats.entries()).map(([model, data]) => ({
    model,
    ...data,
    efficiency: data.avgDuration < 1000 ? 'excellent' :
                data.avgDuration < 3000 ? 'good' : 'needs-improvement'
  }));

  return Response.json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    models: {
      cached: Array.from(modelCache.keys()),
      stats
    },
    performance: {
      totalRequests: stats.reduce((sum, s) => sum + s.requests, 0),
      averageLatency: stats.length > 0 ?
        Math.round(stats.reduce((sum, s) => sum + s.avgDuration, 0) / stats.length) : 0,
      totalTokens: stats.reduce((sum, s) => sum + s.totalTokens, 0)
    },
    optimizations: [
      '✅ Request deduplication active',
      '✅ Model caching enabled',
      '✅ Performance monitoring',
      '✅ Enhanced error handling',
      '✅ Statistical tracking'
    ]
  }, {
    headers: {
      'Cache-Control': 'public, max-age=30',
      'X-Monitoring-Enabled': 'true'
    }
  });
}
