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
    const r = validateOutput('This procedure is covered by your scheme.');
    expect(r.safe).toBe(false);
    expect(r.text).not.toMatch(/is covered/i);
    expect(r.text.toLowerCase()).toContain('confirm');
  });

  it.each([
    'The document does not state that any MRI is covered in full.',
    'There is no guarantee that this will be paid.',
    'Ask your scheme whether this is covered.',
    "We can't confirm it is covered.",
    "It isn't clear that this will be approved.",
    'Your plan document is unclear on whether the scan is reimbursed.',
  ])('leaves negated or hedged covered/paid language untouched: %s', (text) => {
    const r = validateOutput(text);
    expect(r.text).toBe(text);
    expect(r.flags.filter((f) => f.severity === 'hard')).toHaveLength(0);
  });

  it.each([
    'Your MRI will be covered.',
    'Yes, it is covered.',
    'Not sure, but it is definitely covered.',
    'This is not a problem and it is paid.',
    'Do not worry. The claim will be approved.',
  ])('still softens affirmative covered/paid language: %s', (text) => {
    const r = validateOutput(text);
    expect(r.safe).toBe(false);
    expect(r.text).toContain('may be covered (confirm with your scheme)');
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

  it.each([
    "I'm not able to guarantee any claim outcome.",
    'We cannot guarantee payment.',
    "We can't guarantee the outcome of this claim.",
    'There is no guarantee of cover.',
    'Cover is not guaranteed.',
    'This cannot be guaranteed.',
    "It isn't guaranteed.",
    'I am unable to guarantee the result.',
    'Payment is never guaranteed.',
    'This is not a guarantee of cover.',
  ])('leaves negated guarantee language untouched: %s', (text) => {
    const r = validateOutput(text);
    expect(r.text).toBe(text);
    expect(r.flags).toHaveLength(0);
  });

  it.each([
    'We guarantee this claim.',
    'Your claim is guaranteed to be paid.',
    'No, we guarantee it.',
    'Not sure, but we guarantee this scan.',
  ])('still softens affirmative guarantee language: %s', (text) => {
    const r = validateOutput(text);
    expect(r.safe).toBe(false);
    expect(r.text).toContain('cannot be guaranteed; please confirm');
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
