import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { streamText, convertToCoreMessages } from 'ai';

export const maxDuration = 30;

// Cached model instances for speed
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

export async function POST(req: Request) {
  try {
    const { messages, model = 'openai/gpt-4o-mini' } = await req.json();

    const result = await streamText({
      model: getModel(model),
      messages: convertToCoreMessages(messages),
      maxTokens: 2000, // Reduced for speed
      temperature: 0.7,
      system: 'You are a helpful AI assistant. Be concise and direct.',
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat error:', error);
    return new Response('Error', { status: 500 });
  }
}
