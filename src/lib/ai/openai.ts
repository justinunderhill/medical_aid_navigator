import OpenAI from 'openai';
import type { AIProvider, GenerateOptions } from './types';

/**
 * OpenAI provider — swappable alternative (set AI_PROVIDER=openai).
 * Kept feature-equivalent to the Anthropic provider so the rest of the
 * app never needs to know which one is active.
 */
export function createOpenAIProvider(): AIProvider {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }
  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL ?? 'gpt-4o';

  return {
    name: 'openai',
    async generate(opts: GenerateOptions): Promise<string> {
      const response = await client.chat.completions.create({
        model,
        max_tokens: opts.maxTokens ?? 1500,
        temperature: opts.temperature ?? 0.3,
        ...(opts.jsonMode ? { response_format: { type: 'json_object' } } : {}),
        messages: [
          { role: 'system', content: opts.systemPrompt },
          ...opts.messages.map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
        ],
      });

      return response.choices[0]?.message?.content?.trim() ?? '';
    },
  };
}
