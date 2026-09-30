/**
 * OUTPUT VALIDATION LAYER  (Risk 13.1 / 13.2 / 13.3, FR5, AI 22.2)
 * ------------------------------------------------------------------
 * Never trust the prompt alone. After the AI generates text, we scan
 * it for forbidden phrasing that would turn educational navigation
 * into medical advice, broker advice, or a claim guarantee.
 *
 * Two tiers:
 *   - HARD violations  -> we rewrite/soften the phrase automatically
 *                         and log a flag. Output is still returned but
 *                         made safe.
 *   - SOFT cautions    -> logged for monitoring, not altered.
 *
 * This is the "belt and braces" requested: the system prompt forbids
 * these, AND this layer catches anything that slips through.
 */

export interface ValidationFlag {
  severity: 'hard' | 'soft';
  pattern: string;
  note: string;
}

export interface ValidationResult {
  text: string; // possibly-softened text
  flags: ValidationFlag[];
  safe: boolean; // false if any hard violation was found (still softened)
}

interface Rule {
  // regex run case-insensitively against the output
  test: RegExp;
  severity: 'hard' | 'soft';
  // replacement applied for hard rules (function for capture reuse)
  replacement?: (match: string) => string;
  /**
   * Receives the text before a match. Return true when the match sits in a
   * negated or hedged clause, where it is the safe phrasing rather than a
   * violation, so it is neither flagged nor rewritten.
   */
  exempt?: (before: string) => boolean;
  note: string;
}

/**
 * True when the clause leading up to a match is negated or hedged, e.g.
 * "the document does not state that any MRI [is covered]" or "ask whether
 * this [is covered]". The clause is cut at punctuation and at and/but/so/then,
 * so a later affirmative claim ("not a problem and it [is covered]") is not
 * shielded by an earlier negation.
 */
function inNegatedClause(before: string): boolean {
  const clause = before.split(/[.!?;,:\n]|\b(?:and|but|so|then)\b/i).pop() ?? '';
  const nearby = clause.trim().split(/\s+/).slice(-8).join(' ');
  return /\b(?:not|no|never|cannot|cant|unable|unclear|whether|if)\b|n['’]t\b/i.test(nearby);
}

const RULES: Rule[] = [
  // ─── Claim payment guarantees ────────────────────────────────
  {
    test: /\b(will|must|is|are|shall)\s+(definitely\s+)?(be\s+)?(covered|paid|reimbursed|approved)\b/gi,
    severity: 'hard',
    replacement: () => 'may be covered (confirm with your scheme)',
    exempt: inNegatedClause,
    note: 'Claim-payment guarantee softened to conditional language.',
  },
  {
    test: /\byour\s+scheme\s+must\s+pay\b/gi,
    severity: 'hard',
    replacement: () => 'ask your scheme whether this is payable',
    note: 'Absolute scheme-payment language replaced with a question to ask.',
  },
  {
    test: /\bthis\s+is\s+(definitely\s+)?(a\s+)?pmb\b/gi,
    severity: 'hard',
    replacement: () => 'this may relate to a PMB — confirm with your doctor and scheme',
    note: 'Self-declared PMB status softened (app must not declare PMB).',
  },
  {
    // Affirmative uses only. A negated use ("cannot guarantee", "no guarantee",
    // "not guaranteed", "unable to guarantee") is the safe phrasing we want, so
    // rewriting it would only corrupt the sentence.
    test: /(?<!\b(?:not|no|cannot|cant|can['’]t|never|without|unable to|\w+n['’]t)\s+(?:(?:be|been|able to|a|an|any|possible to)\s+)?)\bguarantee(d|s)?\b/gi,
    severity: 'hard',
    replacement: () => 'cannot be guaranteed; please confirm',
    note: 'Guarantee language removed.',
  },
  // ─── Telling users NOT to seek care ──────────────────────────
  {
    test: /\byou\s+(do\s+not|don't|dont)\s+need\s+to\s+(go\s+to\s+(hospital|casualty|the\s+er)|see\s+a\s+doctor)\b/gi,
    severity: 'hard',
    replacement: () =>
      'if you are worried about symptoms, seek medical care — only a medical professional can advise on this',
    note: 'Advice against seeking care removed (safety).',
  },
  // ─── Broker / scheme-switching advice ────────────────────────
  {
    test: /\byou\s+should\s+(switch|change|leave|join|move\s+to)\s+(your\s+)?(scheme|plan|medical\s+aid)\b/gi,
    severity: 'hard',
    replacement: () =>
      'decisions about changing schemes or plans should be discussed with an accredited broker',
    note: 'Scheme-switching advice replaced with broker referral.',
  },
  // ─── Diagnosis language ──────────────────────────────────────
  {
    test: /\byou\s+(have|are\s+suffering\s+from|are\s+experiencing)\s+(a|an)\s+\w+/gi,
    severity: 'soft',
    note: 'Possible diagnosis-style phrasing — review.',
  },
  // ─── Scheme-blaming / accusatory ─────────────────────────────
  {
    test: /\b(discovery|the\s+scheme|your\s+scheme|the\s+doctor)\s+is\s+(wrong|lying|cheating|overcharging|failing)\b/gi,
    severity: 'hard',
    replacement: () => 'there may be an issue worth clarifying — request written reasons',
    note: 'Accusatory language toward scheme/provider neutralised.',
  },
  {
    test: /\byou\s+should\s+dispute\s+this\s+immediately\b/gi,
    severity: 'soft',
    note: 'Encourages immediate dispute — prefer "follow the scheme dispute process".',
  },
];

export function validateOutput(input: string): ValidationResult {
  let text = input;
  const flags: ValidationFlag[] = [];

  for (const rule of RULES) {
    const isViolation = (offset: number) => !rule.exempt?.(text.slice(0, offset));
    const violations = [...text.matchAll(rule.test)].filter((m) => isViolation(m.index ?? 0));
    if (violations.length > 0) {
      flags.push({
        severity: rule.severity,
        pattern: rule.test.source,
        note: rule.note,
      });
      if (rule.severity === 'hard' && rule.replacement) {
        const current = text;
        text = current.replace(rule.test, (m, ...args) => {
          const offset = args.find((a) => typeof a === 'number') as number;
          return rule.exempt?.(current.slice(0, offset)) ? m : rule.replacement!(m);
        });
      }
    }
  }

  const safe = !flags.some((f) => f.severity === 'hard');
  return { text, flags, safe };
}

/**
 * Disclaimer that is appended to EVERY generated checklist, regardless
 * of scenario. Required by FR5 / FR11 / FR13.
 */
export const STANDARD_DISCLAIMER =
  'This is general educational guidance to help you navigate your medical aid — not medical, legal, broker, or financial advice, and not a guarantee of any claim outcome. Always confirm benefits, authorisation, and cover directly with your scheme, provider, or an accredited broker. If you have urgent symptoms, seek medical care immediately.';
