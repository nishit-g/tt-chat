import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { streamText, convertToCoreMessages, tool } from 'ai';
import { z } from 'zod';

export const maxDuration = 30;

// Simple model cache
const modelCache = new Map();

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

// Simple tools without caching complexity
const tools = {
  getCurrentTime: tool({
    description: 'Get the current time and date',
    parameters: z.object({}),
    execute: async () => {
      return {
        time: new Date().toLocaleString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        day: new Date().toLocaleDateString('en-US', { weekday: 'long' })
      };
    },
  }),

  analyzeCode: tool({
    description: 'Analyze code for issues and suggestions',
    parameters: z.object({
      code: z.string().describe('The code to analyze'),
      language: z.string().describe('Programming language')
    }),
    execute: async ({ code, language }) => {
      // Simple analysis
      const issues = [];
      const suggestions = [];

      if (language.toLowerCase() === 'javascript' || language.toLowerCase() === 'typescript') {
        if (code.includes('var ')) {
          issues.push('Use of var keyword detected');
          suggestions.push('Consider using const or let instead of var');
        }

        if (code.includes('document.getElementById') && code.split('document.getElementById').length > 2) {
          issues.push('Multiple DOM queries detected');
          suggestions.push('Cache DOM elements in variables');
        }
      }

      return {
        language,
        totalLines: code.split('\n').length,
        issues,
        suggestions,
        score: Math.max(80, 100 - issues.length * 10)
      };
    },
  })
};

export async function POST(req: Request) {
  try {
    const { messages, model = 'openai/gpt-4o-mini' } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid messages format', { status: 400 });
    }

    const modelInstance = getModel(model);

    const result = await streamText({
      model: modelInstance,
      messages: convertToCoreMessages(messages),
      maxTokens: 2000,
      temperature: 0.7,
      tools,
      system: `You are a helpful AI assistant. Be concise and direct in your responses.

Current date: ${new Date().toLocaleDateString()}
Current time: ${new Date().toLocaleTimeString()}

When writing code:
- Always specify the language in code blocks (e.g., \`\`\`javascript, \`\`\`python, etc.)
- Include helpful comments
- Follow best practices for the language
- Be clear and readable`,

      // Simple callbacks without complex optimization
      onFinish: async ({ usage, finishReason }) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ Response completed:`, {
            model,
            tokens: usage?.totalTokens || 0,
            reason: finishReason
          });
        }
      }
    });

    return result.toDataStreamResponse({
      headers: {
        'X-Model-Used': model,
        'Cache-Control': 'no-cache',
      }
    });

  } catch (error) {
    console.error('Chat API error:', error);

    // Return proper error response
    return new Response(
      JSON.stringify({
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error',
        model: req.url ? new URL(req.url).searchParams.get('model') : 'unknown'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Optional: GET endpoint for health check
export async function GET() {
  return Response.json({
    status: 'ok',
    models: ['openai/gpt-4o-mini', 'openai/gpt-4o', 'anthropic/claude-3-5-sonnet-20241022', 'google/gemini-2.0-flash-exp'],
    timestamp: new Date().toISOString()
  });
}
