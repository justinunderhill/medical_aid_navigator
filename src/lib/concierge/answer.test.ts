import { beforeEach, expect, it, vi } from 'vitest';
import { answerConcierge, parseGeneralReply } from './answer';

const { generate, create } = vi.hoisted(() => ({ generate: vi.fn(), create: vi.fn() }));
vi.mock('@/lib/ai', () => ({ getProvider: () => ({ generate }) }));
vi.mock('@anthropic-ai/sdk', () => ({ default: class { messages = { create }; } }));
beforeEach(() => vi.clearAllMocks());

it('removes em dashes from general answers without changing figures or benefit ranges', () => {
  const reply = parseGeneralReply(JSON.stringify({
    answer: 'Ask your scheme — before booking. The limit is R2,500 for ages 18–65.\n\nKeep the pre-authorisation reference.',
    destinations: [],
  }));
  expect(reply.segments[0].text).toBe('Ask your scheme, before booking. The limit is R2,500 for ages 18–65.\n\nKeep the pre-authorisation reference.');
});

it('uses the same natural style for PDF answers while keeping cited evidence verbatim', async () => {
  create.mockResolvedValue({ content: [{ type: 'text', text: 'The limit is R2,500 — subject to authorisation.', citations: [{
    type: 'page_location', cited_text: 'R2,500 — subject to authorisation.',
    document_index: 0, document_title: 'Plan', start_page_number: 2, end_page_number: 3,
  }] }] });
  const reply = await answerConcierge('What is the limit?', [], new Uint8Array([1]));
  expect(reply.segments[0].text).toBe('The limit is R2,500, subject to authorisation.');
  expect(reply.segments[0].citations).toEqual([{ pageStart: 2, pageEnd: 2, quote: 'R2,500 — subject to authorisation.' }]);
  expect(create.mock.calls[0][0].system).toContain('Do not use em dashes');
});

it('preserves the JSON response format across follow-up turns', async () => {
  generate.mockResolvedValue('{"answer":"Ask about network rules.","destinations":["network-dsp"]}');
  await answerConcierge('What should I ask about those?', [
    { role: 'user', content: 'Explain co-payments.' },
    { role: 'assistant', content: 'A co-payment is an amount you pay yourself.' },
  ]);
  const options = generate.mock.calls[0][0];
  expect(options.jsonMode).toBe(true);
  expect(options.systemPrompt).toContain('Speak naturally, like a helpful person');
  expect(options.systemPrompt).toContain('Do not use em dashes');
  expect(options.jsonSchema.required).toEqual(['answer', 'destinations']);
  expect(options.jsonSchema.additionalProperties).toBe(false);
  expect(JSON.parse(options.messages[1].content)).toEqual({
    answer: 'A co-payment is an amount you pay yourself.', destinations: [],
  });
  expect(options.messages[2]).toEqual({ role: 'user', content: 'What should I ask about those?' });
});
