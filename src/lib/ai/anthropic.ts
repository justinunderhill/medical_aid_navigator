import Anthropic from '@anthropic-ai/sdk';
import type { AIProvider, GenerateOptions } from './types';

/**
 * Anthropic (Claude) provider — the recommended default.
 * Chosen for stronger adherence to refusal/guardrail instructions,
 * which matters because our biggest risk is the model overstepping
 * into claim guarantees or medical advice.
 */
export function createAnthropicProvider(): AIProvider {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set');
  }
  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';

  return {
    name: 'anthropic',
    async generate(opts: GenerateOptions): Promise<string> {
      const system = opts.jsonMode
        ? `${opts.systemPrompt}\n\nIMPORTANT: Respond with ONLY valid JSON. No markdown code fences, no preamble.`
        : opts.systemPrompt;

      const response = await client.messages.create({
        model,
        max_tokens: opts.maxTokens ?? 1500,
        temperature: opts.temperature ?? 0.3,
        system,
        messages: opts.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      return response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
        .trim();
    },
  };
}
