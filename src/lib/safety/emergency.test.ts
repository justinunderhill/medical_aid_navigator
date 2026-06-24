import { describe, it, expect } from 'vitest';
import {
  detectEmergency,
  EMERGENCY_GUIDANCE,
  FALLBACK_URGENT_CARE_LEAD,
} from './emergency';

describe('detectEmergency', () => {
  it('escalates emergency-by-definition scenarios', () => {
    const r = detectEmergency({ scenarioId: 'emergency-care' });
    expect(r.isEmergency).toBe(true);
    expect(r.reason).toBe('scenario');
  });

  it('does not escalate a routine scenario with no red flags', () => {
    const r = detectEmergency({
      scenarioId: 'gp-visit',
      freeText: 'just a routine check-up',
      answers: {},
    });
    expect(r.isEmergency).toBe(false);
    expect(r.reason).toBe(null);
  });

  // H2: emergency triggering is driven by the `emergencyTrigger` flag in the
  // scenario data, NOT a hard-coded answer key. These tests lock that in.
  describe('data-driven emergencyTrigger flag', () => {
    it('escalates when a flagged question is answered boolean true (casualty)', () => {
      const r = detectEmergency({
        scenarioId: 'casualty',
        answers: { severeSymptoms: true },
      });
      expect(r.isEmergency).toBe(true);
      expect(r.reason).toBe('flag');
      expect(r.matchedAnswerId).toBe('severeSymptoms');
    });

    it('escalates on a "yes"-style string answer too', () => {
      const r = detectEmergency({
        scenarioId: 'triage',
        answers: { severeSymptoms: 'yes' },
      });
      expect(r.isEmergency).toBe(true);
      expect(r.reason).toBe('flag');
    });

    it('does NOT escalate when the flagged question is answered false', () => {
      const r = detectEmergency({
        scenarioId: 'casualty',
        answers: { severeSymptoms: false },
      });
      expect(r.isEmergency).toBe(false);
    });

    it('ignores affirmative answers on non-trigger questions', () => {
      const r = detectEmergency({
        scenarioId: 'casualty',
        answers: { careReceived: true },
      });
      expect(r.isEmergency).toBe(false);
    });

    it('escalates on the casualty unconscious-or-breathing-abnormally trigger', () => {
      const r = detectEmergency({
        scenarioId: 'casualty',
        answers: { unconsciousOrBreathingAbnormally: true },
      });
      expect(r.isEmergency).toBe(true);
      expect(r.reason).toBe('flag');
      expect(r.matchedAnswerId).toBe('unconsciousOrBreathingAbnormally');
    });

    it('still escalates carried triage answers after classification to another scenario', () => {
      const r = detectEmergency({
        scenarioId: 'claim-rejection',
        answers: { severeSymptoms: true },
      });
      expect(r.isEmergency).toBe(true);
      expect(r.reason).toBe('flag');
      expect(r.matchedAnswerId).toBe('severeSymptoms');
    });
  });

  describe('free-text red-flag keyword scan', () => {
    const emergencyPhrases = [
      'I think he is having a heart attack',
      "she can't breathe",
      'there is severe bleeding',
      'my husband is unconscious',
      'I want to die',
      'the baby is not breathing',
    ];

    for (const phrase of emergencyPhrases) {
      it(`escalates on: "${phrase}"`, () => {
        const r = detectEmergency({ scenarioId: 'gp-visit', freeText: phrase });
        expect(r.isEmergency).toBe(true);
        expect(r.reason).toBe('keyword');
      });
    }

    it('normalises casing and punctuation before matching', () => {
      const r = detectEmergency({ freeText: 'CHEST PAIN!!!' });
      expect(r.isEmergency).toBe(true);
      expect(r.reason).toBe('keyword');
    });

    it('does not over-trigger on clearly benign text', () => {
      const r = detectEmergency({
        scenarioId: 'gp-visit',
        freeText: 'I want to book a routine dental cleaning next month',
      });
      expect(r.isEmergency).toBe(false);
    });
  });

  it('emergency copy contains SA emergency numbers (10177 / 112)', () => {
    const joined = EMERGENCY_GUIDANCE.body.join(' ');
    expect(joined).toContain('10177');
    expect(joined).toContain('112');
  });

  it('fallback urgent-care lead points to emergency services', () => {
    expect(FALLBACK_URGENT_CARE_LEAD).toContain('10177');
    expect(FALLBACK_URGENT_CARE_LEAD).toContain('112');
  });
});
