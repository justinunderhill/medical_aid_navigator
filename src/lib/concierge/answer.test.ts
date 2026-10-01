import { expect, it, vi } from 'vitest';
import { answerConcierge } from './answer';

const { generate } = vi.hoisted(() => ({ generate: vi.fn() }));
vi.mock('@/lib/ai', () => ({ getProvider: () => ({ generate }) }));

it('preserves the JSON response format across follow-up turns', async () => {
  generate.mockResolvedValue('{"answer":"Ask about network rules.","destinations":["network-dsp"]}');
  await answerConcierge('What should I ask about those?', [
    { role: 'user', content: 'Explain co-payments.' },
    { role: 'assistant', content: 'A co-payment is an amount you pay yourself.' },
  ]);
  const options = generate.mock.calls[0][0];
  expect(options.jsonMode).toBe(true);
  expect(options.jsonSchema.required).toEqual(['answer', 'destinations']);
  expect(options.jsonSchema.additionalProperties).toBe(false);
  expect(JSON.parse(options.messages[1].content)).toEqual({
    answer: 'A co-payment is an amount you pay yourself.', destinations: [],
  });
  expect(options.messages[2]).toEqual({ role: 'user', content: 'What should I ask about those?' });
});
