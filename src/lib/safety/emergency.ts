/**
 * EMERGENCY SAFETY LAYER  (FR4 / NFR4)
 * ------------------------------------------------------------------
 * This module is DELIBERATELY deterministic. It must NEVER depend on
 * an AI call, network request, or anything that can fail or be
 * manipulated by user input / prompt injection.
 *
 * If a person is in a medical emergency, the correct guidance must
 * appear even if every other system (including the AI) is down.
 *
 * Rule of thumb: this layer is allowed FALSE POSITIVES (showing the
 * emergency notice when it wasn't strictly needed) but must avoid
 * FALSE NEGATIVES (missing a real emergency). When unsure, escalate.
 */

import { getScenario, SCENARIOS } from '@/data/scenarios';

// Scenario IDs that are emergencies by definition. Casualty / after-hours can
// be non-urgent, so it relies on structured answers and red-flag keywords.
export const EMERGENCY_SCENARIO_IDS = ['emergency-care'];

/**
 * Red-flag terms. Kept broad on purpose. Matched as whole-ish words
 * against a normalised, lower-cased version of the user's free text.
 * Add to this list liberally; the cost of a false alarm is low.
 */
const EMERGENCY_TERMS: string[] = [
  // breathing / airway
  'cant breathe', "can't breathe", 'cannot breathe', 'not breathing',
  'struggling to breathe', 'difficulty breathing', 'choking', 'turning blue',
  'blue lips', 'gasping',
  // cardiac / circulation
  'chest pain', 'heart attack', 'cardiac', 'crushing chest', 'collapsed',
  // neuro / stroke
  'stroke', 'face drooping', 'slurred speech', 'cant move', "can't move",
  'numb on one side', 'sudden weakness', 'seizure', 'convulsing', 'fitting',
  'unconscious', 'unresponsive', 'passed out', 'wont wake', "won't wake",
  'not waking up',
  // bleeding / trauma
  'severe bleeding', 'bleeding heavily', 'wont stop bleeding',
  "won't stop bleeding", 'gushing blood', 'deep cut', 'amputated',
  'broken bone sticking', 'major accident', 'car crash', 'fell from',
  // poisoning / overdose / allergic
  'overdose', 'poisoned', 'swallowed', 'anaphylaxis', 'allergic reaction',
  'throat closing', 'swelling throat',
  // obstetric / infant
  'baby not breathing', 'baby blue', 'not moving baby', 'high fever baby',
  'limp baby', 'newborn not',
  // self-harm / acute mental health crisis
  'suicidal', 'kill myself', 'end my life', 'want to die', 'self harm',
  'hurt myself',
  // generic severe
  'severe pain', 'worst pain', 'emergency', 'dying', 'critical condition',
];

export interface EmergencyCheckResult {
  isEmergency: boolean;
  /** Why it triggered — for logging/debug only, never shown raw to user */
  reason: 'scenario' | 'keyword' | 'flag' | null;
  matchedTerm?: string;
  /** Which structured answer triggered the 'flag' reason (debug only) */
  matchedAnswerId?: string;
}

/** An answer counts as an affirmative emergency flag when it is a boolean
 * true or an obvious "yes"-style string. Kept liberal on purpose. */
function isAffirmative(value: unknown): boolean {
  if (value === true) return true;
  if (typeof value === 'string') {
    return ['yes', 'true', 'y'].includes(value.trim().toLowerCase());
  }
  return false;
}

function normalise(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s']/g, ' ') // keep apostrophes
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Primary entry point. Pass the chosen scenario id, the user's free
 * text, and any structured answers from the guided flow.
 *
 * Structured-flag detection is DATA-DRIVEN: any question marked
 * `emergencyTrigger: true` in scenario data will escalate when answered
 * affirmatively. We first check the active scenario, then all scenario data so
 * triage answers carried into a classified scenario still keep their emergency
 * safety net.
 */
export function detectEmergency(input: {
  scenarioId?: string;
  freeText?: string;
  /** Structured answers from the guided question flow, keyed by question id. */
  answers?: Record<string, unknown>;
}): EmergencyCheckResult {
  const { scenarioId, freeText, answers } = input;

  // 1. Explicit structured flag from the guided question flow.
  //    Look up the scenario's questions and escalate if ANY question flagged
  //    `emergencyTrigger` was answered affirmatively.
  if (scenarioId && answers) {
    const scenario = getScenario(scenarioId);
    const triggered = scenario?.questions.find(
      (q) => q.emergencyTrigger && isAffirmative(answers[q.id])
    );
    if (triggered) {
      return { isEmergency: true, reason: 'flag', matchedAnswerId: triggered.id };
    }
  }

  if (answers) {
    const triggered = SCENARIOS.flatMap((s) => s.questions).find(
      (q) => q.emergencyTrigger && isAffirmative(answers[q.id])
    );
    if (triggered) {
      return { isEmergency: true, reason: 'flag', matchedAnswerId: triggered.id };
    }
  }

  // 2. Scenario is an emergency by definition.
  if (scenarioId && EMERGENCY_SCENARIO_IDS.includes(scenarioId)) {
    return { isEmergency: true, reason: 'scenario' };
  }

  // 3. Keyword scan of free text.
  if (freeText) {
    const haystack = normalise(freeText);
    for (const term of EMERGENCY_TERMS) {
      if (haystack.includes(normalise(term))) {
        return { isEmergency: true, reason: 'keyword', matchedTerm: term };
      }
    }
  }

  return { isEmergency: false, reason: null };
}

/**
 * The canonical emergency message. Static content — no AI involved.
 * Mirrors FR4 acceptance criteria: urge care, do not delay for
 * benefits, contact scheme after stabilisation, keep records.
 * Note: South African emergency numbers.
 */
/**
 * A short, always-safe urgent-care lead used by FALLBACK paths (e.g. the AI is
 * down or returned unparseable output). Because a fallback cannot know whether
 * the situation is actually an emergency — keyword/flag detection may have
 * missed it — fallback guidance must lead with this so a real emergency is
 * never buried under routine benefit steps. (Mitigates the keyword-miss +
 * AI-outage residual risk; see docs/SECURITY.md.)
 */
export const FALLBACK_URGENT_CARE_LEAD =
  'If anyone has severe or worsening symptoms — such as chest pain, trouble ' +
  'breathing, heavy bleeding, confusion, or loss of consciousness — do not ' +
  'wait to check benefits. Get medical care now: call 10177 (ambulance) or ' +
  '112 from a mobile, or go to the nearest appropriate emergency facility.';

export const EMERGENCY_GUIDANCE = {
  headline: 'If this is a medical emergency, get help now.',
  body: [
    'If someone is seriously unwell, do not wait to check medical aid benefits. Get medical care first.',
    'Call 10177 (ambulance) or 112 (from a mobile phone) immediately, or go to your nearest emergency room / casualty.',
    'Your scheme cannot refuse emergency stabilisation. Sort out benefits, authorisation, and codes afterwards.',
  ],
  afterCare: [
    'Once the person is stable, contact your medical scheme to report the admission or emergency visit.',
    'Keep every document: hospital records, ICD-10 codes, authorisation reference numbers, and clinical notes.',
    'Ask whether the condition may qualify as a Prescribed Minimum Benefit (PMB) emergency — confirm this with your doctor and scheme.',
  ],
  disclaimer:
    'This tool does not diagnose emergencies and is not a substitute for emergency services or a medical professional.',
} as const;
