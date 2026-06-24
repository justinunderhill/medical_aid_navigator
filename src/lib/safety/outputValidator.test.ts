import { describe, it, expect } from 'vitest';
import { validateOutput, STANDARD_DISCLAIMER } from './outputValidator';

describe('validateOutput', () => {
  it('passes clean educational text through unchanged and marks it safe', () => {
    const input =
      'Ask your scheme whether this may be covered and confirm whether authorisation is required.';
    const r = validateOutput(input);
    expect(r.safe).toBe(true);
    expect(r.text).toBe(input);
    expect(r.flags).toHaveLength(0);
  });

  it('softens a claim-payment guarantee', () => {
    const r = validateOutput('This procedure will be covered by your scheme.');
    expect(r.safe).toBe(false);
    expect(r.text).not.toMatch(/will be covered/i);
    expect(r.text.toLowerCase()).toContain('confirm');
  });

  it('softens a self-declared PMB status', () => {
    const r = validateOutput('Good news: this is a PMB.');
    expect(r.safe).toBe(false);
    expect(r.text.toLowerCase()).toContain('confirm with your doctor and scheme');
  });

  it('removes the word "guarantee"', () => {
    const r = validateOutput('We guarantee this claim.');
    expect(r.safe).toBe(false);
    expect(r.text).not.toMatch(/\bguarantee\b/i);
  });

  it('removes advice against seeking care', () => {
    const r = validateOutput('You do not need to go to hospital for this.');
    expect(r.safe).toBe(false);
    expect(r.text.toLowerCase()).toContain('seek medical care');
  });

  it('redirects scheme-switching advice to an accredited broker', () => {
    const r = validateOutput('You should switch your scheme to a cheaper plan.');
    expect(r.safe).toBe(false);
    expect(r.text.toLowerCase()).toContain('broker');
  });

  it('neutralises accusatory language about a scheme', () => {
    const r = validateOutput('Honestly, your scheme is lying to you.');
    expect(r.safe).toBe(false);
    expect(r.text).not.toMatch(/is lying/i);
  });

  it('flags diagnosis-style phrasing as a soft caution without altering text', () => {
    const input = 'It sounds like you have a fracture.';
    const r = validateOutput(input);
    expect(r.flags.some((f) => f.severity === 'soft')).toBe(true);
    // soft cautions are logged, not rewritten, and do not make output unsafe
    expect(r.safe).toBe(true);
    expect(r.text).toBe(input);
  });

  it('exposes a standard disclaimer that disclaims medical advice', () => {
    expect(STANDARD_DISCLAIMER.toLowerCase()).toContain('not medical');
  });
});
