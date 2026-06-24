/**
 * Explainer concepts (Screen 5 / FR6–FR9 / acceptance criterion: 10+ concepts).
 * The `slug` maps to /content/concepts/{slug}.md for the full text.
 */

export interface ConceptMeta {
  slug: string;
  term: string;
  short: string; // one-line plain summary
}

export const CONCEPTS: ConceptMeta[] = [
  {
    slug: 'pmb',
    term: 'PMB (Prescribed Minimum Benefits)',
    short: 'Minimum benefits every scheme must cover by law — depends on diagnosis, codes, and rules.',
  },
  {
    slug: 'dsp',
    term: 'DSP & Networks',
    short: 'Providers your scheme prefers — using others can create co-payments.',
  },
  {
    slug: 'icd10',
    term: 'ICD-10 Codes',
    short: 'The diagnosis code on your claim — it affects how the claim is assessed.',
  },
  {
    slug: 'authorisation',
    term: 'Pre-Authorisation',
    short: 'Approval needed before some planned care, like scans and admissions.',
  },
  {
    slug: 'chronic-benefit',
    term: 'Chronic Benefits',
    short: 'How ongoing conditions and their medication get funded — needs registration.',
  },
  {
    slug: 'copayments',
    term: 'Co-payments',
    short: 'Amounts you pay yourself, on top of what the scheme pays.',
  },
  {
    slug: 'claims-disputes',
    term: 'Claim Rejections & Disputes',
    short: 'Why claims get rejected and the right way to query them.',
  },
];

/**
 * A few extra short-definition concepts the acceptance criteria reference
 * (medical savings, network provider, co-payment, chronic) so the explainers
 * page shows 10+ terms even where some share a content file.
 */
export const QUICK_DEFINITIONS: ConceptMeta[] = [
  {
    slug: 'copayments',
    term: 'Medical Savings',
    short: 'A pool of your own money in the plan, used for day-to-day claims until it runs out.',
  },
  {
    slug: 'dsp',
    term: 'Network Provider',
    short: 'A provider contracted by your scheme, usually at agreed (lower) rates.',
  },
  {
    slug: 'authorisation',
    term: 'Authorisation Number',
    short: 'The reference your scheme gives when it approves planned care — keep it.',
  },
];
