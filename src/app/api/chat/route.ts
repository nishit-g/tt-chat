import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { streamText, convertToCoreMessages, tool } from 'ai';
import { z } from 'zod';

export const maxDuration = 30;

// Enhanced model cache with performance monitoring
const modelCache = new Map();
const modelStats = new Map();

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
  modelStats.set(modelId, { requests: 0, totalTokens: 0, averageLatency: 0 });
  return instance;
}

// AI Tools for enhanced capabilities
const tools = {
  getCurrentTime: tool({
    description: 'Get the current time and date',
    parameters: z.object({}),
    execute: async () => {
      return {
        time: new Date().toLocaleString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timestamp: Date.now()
      };
    },
  }),

  searchCode: tool({
    description: 'Search for code examples or documentation',
    parameters: z.object({
      query: z.string().describe('Search query for code or documentation'),
      language: z.string().optional().describe('Programming language to focus on')
    }),
    execute: async ({ query, language }) => {
      // This would integrate with your search API or local code search
      return {
        results: [
          `Found ${Math.floor(Math.random() * 50)} results for "${query}"${language ? ` in ${language}` : ''}`,
          'This is a mock implementation - integrate with your preferred search API'
        ]
      };
    },
  }),

  generateCode: tool({
    description: 'Generate optimized code for specific tasks',
    parameters: z.object({
      task: z.string().describe('Description of the coding task'),
      language: z.string().describe('Programming language'),
      framework: z.string().optional().describe('Framework or library to use')
    }),
    execute: async ({ task, language, framework }) => {
      return {
        suggestion: `Generated ${language} code${framework ? ` with ${framework}` : ''} for: ${task}`,
        bestPractices: [
          'Use TypeScript for better type safety',
          'Implement proper error handling',
          'Add comprehensive comments',
          'Follow the framework\'s conventions'
        ]
      };
    },
  }),

  analyzePerformance: tool({
    description: 'Analyze code performance and suggest optimizations',
    parameters: z.object({
      code: z.string().describe('Code to analyze'),
      language: z.string().describe('Programming language')
    }),
    execute: async ({ code, language }) => {
      // Simple mock analysis - replace with actual performance analysis
      const lines = code.split('\n').length;
      const complexity = lines > 50 ? 'High' : lines > 20 ? 'Medium' : 'Low';

      return {
        complexity,
        suggestions: [
          'Consider breaking large functions into smaller ones',
          'Use memoization for expensive calculations',
          'Implement lazy loading for large datasets',
          'Consider using Web Workers for heavy computations'
        ],
        estimatedPerformance: `${complexity} complexity detected in ${lines} lines of ${language}`
      };
    },
  })
};

export async function POST(req: Request) {
  try {
    const startTime = Date.now();
    const {
      messages,
      model = 'openai/gpt-4o-mini',
      temperature = 0.7,
      maxTokens = 2000,
      useTools = false,
      systemPrompt
    } = await req.json();

    const modelInstance = getModel(model);
    const stats = modelStats.get(model);

    // Enhanced system prompt for better responses
    const enhancedSystemPrompt = systemPrompt || `You are an expert AI assistant with deep knowledge in programming, technology, and problem-solving.

Key Guidelines:
- Provide clear, actionable answers
- Include code examples when relevant
- Explain complex concepts step by step
- Suggest best practices and optimizations
- Be concise but comprehensive
- When showing code, always include proper syntax highlighting with language specification

Current context: ${new Date().toLocaleString()}`;

    const result = await streamText({
      model: modelInstance,
      messages: convertToCoreMessages(messages),
      system: enhancedSystemPrompt,
      maxTokens,
      temperature,

      // Advanced AI SDK features
      tools: useTools ? tools : undefined,

      // Enhanced streaming with metadata
      onFinish: async ({ text, toolCalls, usage, finishReason }) => {
        const endTime = Date.now();
        const latency = endTime - startTime;

        // Update model statistics
        if (stats) {
          stats.requests += 1;
          stats.totalTokens += usage?.totalTokens || 0;
          stats.averageLatency = (stats.averageLatency + latency) / 2;
        }

        // Log performance metrics (for development)
        if (process.env.NODE_ENV === 'development') {
          console.log(`🚀 Model Performance:`, {
            model,
            latency: `${latency}ms`,
            tokens: usage?.totalTokens,
            finishReason,
            toolsUsed: toolCalls?.length || 0
          });
        }
      },

      // Experimental features for better UX
      experimental_telemetry: {
        isEnabled: true,
        functionId: 't3-chat-stream'
      }
    });

    return result.toDataStreamResponse({
      // Add custom headers for client-side performance monitoring
      headers: {
        'X-Model-Used': model,
        'X-Request-Start': startTime.toString(),
        'X-Tools-Enabled': useTools.toString()
      }
    });

  } catch (error) {
    console.error('Chat error:', error);

    // Enhanced error response with more context
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorType = error instanceof Error ? error.constructor.name : 'UnknownError';

    return new Response(
      JSON.stringify({
        error: errorMessage,
        type: errorType,
        timestamp: Date.now(),
        suggestion: 'Try switching to a different model or reducing the prompt complexity'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// New endpoint for model statistics
export async function GET() {
  const stats = Array.from(modelStats.entries()).map(([model, data]) => ({
    model,
    ...data,
    cached: modelCache.has(model)
  }));

  return Response.json({
    modelStats: stats,
    cacheSize: modelCache.size,
    uptime: process.uptime?.() || 0
  });
}
