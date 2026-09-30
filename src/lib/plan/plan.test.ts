import { describe, it, expect } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import { looksLikePdf, validatePlanUpload, validateQuestion, MAX_PLAN_BYTES } from './validate';
import { toPlanAnswer } from './answer';

const bytes = (s: string) => new TextEncoder().encode(s);

describe('plan upload validation', () => {
  it('accepts a PDF header and rejects other content', () => {
    expect(looksLikePdf(bytes('%PDF-1.7 ...'))).toBe(true);
    expect(looksLikePdf(bytes('<html>'))).toBe(false);
    expect(validatePlanUpload(bytes('MZ-not-a-pdf')).ok).toBe(false);
  });
  it('rejects empty and oversized files', () => {
    expect(validatePlanUpload(new Uint8Array(0)).ok).toBe(false);
    const big = new Uint8Array(MAX_PLAN_BYTES + 1);
    big.set(bytes('%PDF-'));
    expect(validatePlanUpload(big).ok).toBe(false);
  });
  it('requires a real question and caps its length', () => {
    expect(validateQuestion('hi').ok).toBe(false);
    expect(validateQuestion(undefined).ok).toBe(false);
    const q = validateQuestion('x'.repeat(2000));
    expect(q.ok && q.value.length).toBe(500);
  });
});

describe('plan answer mapping', () => {
  const block = (text: string, citations: unknown[] = []) =>
    ({ type: 'text', text, citations } as unknown as Anthropic.ContentBlock);

  it('converts exclusive end pages to inclusive and keeps quotes', () => {
    const a = toPlanAnswer([
      block('Pre-auth is required.', [
        { type: 'page_location', cited_text: ' Pre-authorisation required ', document_index: 0, document_title: 'x', start_page_number: 14, end_page_number: 15 },
        { type: 'page_location', cited_text: 'DSP applies', document_index: 0, document_title: 'x', start_page_number: 22, end_page_number: 24 },
      ]),
    ]);
    expect(a.segments[0].citations).toEqual([
      { pageStart: 14, pageEnd: 14, quote: 'Pre-authorisation required' },
      { pageStart: 22, pageEnd: 23, quote: 'DSP applies' },
    ]);
  });
  it('softens claim guarantees even in document-grounded answers', () => {
    const a = toPlanAnswer([block('Your MRI will be covered in full.')]);
    expect(a.segments[0].text).not.toMatch(/will be covered/i);
    expect(a.flags.some((f) => f.severity === 'hard')).toBe(true);
  });
  it('drops empty blocks and non-text blocks', () => {
    const a = toPlanAnswer([block(''), { type: 'thinking' } as unknown as Anthropic.ContentBlock]);
    expect(a.segments).toHaveLength(0);
  });
});

describe('plainify', () => {
  it('removes headings, rules and checkboxes but keeps bold and bullets', async () => {
    const { plainify } = await import('./answer');
    const out = plainify('## Title\n\n---\n\n- [ ] **Call** scheme\n- keep this');
    expect(out).not.toMatch(/#|---|\[ \]/);
    expect(out).toContain('**Call** scheme');
    expect(out).toContain('- keep this');
  });
});
