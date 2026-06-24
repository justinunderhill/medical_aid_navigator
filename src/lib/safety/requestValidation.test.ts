import { describe, expect, it } from 'vitest';
import {
  parseClassifyScenarioBody,
  parseNavigateRequestBody,
} from './requestValidation';

describe('parseNavigateRequestBody', () => {
  it('accepts string, boolean, and multi-select answer values', () => {
    const parsed = parseNavigateRequestBody({
      scenarioId: 'claim-rejection',
      freeText: 'Rejected at pharmacy',
      answers: {
        hasWrittenReasons: true,
        rejectionReason: 'Code mismatch',
        claimRelatesTo: ['PMB', 'Authorisation'],
      },
      schemeName: 'Example Scheme',
      planName: 'Core Plan',
    });

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.answers?.claimRelatesTo).toEqual(['PMB', 'Authorisation']);
    expect(parsed.value.schemeName).toBe('Example Scheme');
  });

  it('rejects non-object answers', () => {
    const parsed = parseNavigateRequestBody({
      scenarioId: 'gp-visit',
      answers: 'yes',
    });

    expect(parsed.ok).toBe(false);
  });

  it('requires a string scenario id', () => {
    const parsed = parseNavigateRequestBody({
      scenarioId: 123,
    });

    expect(parsed.ok).toBe(false);
  });
});

describe('parseClassifyScenarioBody', () => {
  it('sanitises triage text', () => {
    const parsed = parseClassifyScenarioBody({
      text: '  I need a specialist\u0000 referral  ',
    });

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.text).toBe('I need a specialist referral');
  });

  it('rejects non-string triage text', () => {
    const parsed = parseClassifyScenarioBody({ text: ['not', 'text'] });
    expect(parsed.ok).toBe(false);
  });
});
