/**
 * Scenario definitions (FR2 / FR3).
 * Single source of truth for: homepage cards, scenario selection,
 * guided question flows, and routing.
 *
 * Content is intentionally kept separate from code (NFR7) — questions
 * live here as data; longer knowledge lives in /content markdown.
 */

export type QuestionType = 'single' | 'multi' | 'text' | 'boolean';
export type ScenarioCategory = 'urgent' | 'care' | 'claims';

export interface Question {
  id: string;
  label: string;
  type: QuestionType;
  options?: string[];
  /** If true, answering "yes"/this option may trigger emergency layer */
  emergencyTrigger?: boolean;
  optional?: boolean;
}

export interface Scenario {
  id: string;
  title: string; // user-facing card title
  blurb: string; // one-line description
  icon: string; // lucide icon name (used by UI)
  category: ScenarioCategory;
  isEmergency: boolean;
  /** routes "I'm not sure" style entry */
  isTriage?: boolean;
  questions: Question[];
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'emergency-care',
    title: 'I need emergency care',
    blurb: 'Someone is seriously unwell or injured right now.',
    icon: 'siren',
    category: 'urgent',
    isEmergency: true,
    questions: [
      {
        id: 'whatHappened',
        label: 'Briefly, what happened?',
        type: 'text',
        optional: true,
      },
      {
        id: 'forWhom',
        label: 'Is this for an adult or a child?',
        type: 'single',
        options: ['Adult', 'Child', 'Infant / baby'],
        optional: true,
      },
      {
        id: 'consciousBreathingNormally',
        label: 'Is the person conscious and breathing normally?',
        type: 'boolean',
        optional: true,
      },
    ],
  },
  {
    id: 'casualty',
    title: 'Going to casualty / after-hours',
    blurb: 'You are heading to casualty or an after-hours clinic.',
    icon: 'clock',
    category: 'urgent',
    isEmergency: false,
    questions: [
      {
        id: 'severeSymptoms',
        label: 'Are there severe symptoms (e.g. chest pain, trouble breathing, heavy bleeding, loss of consciousness)?',
        type: 'boolean',
        emergencyTrigger: true,
      },
      {
        id: 'unconsciousOrBreathingAbnormally',
        label: 'Is the person unconscious or not breathing normally?',
        type: 'boolean',
        emergencyTrigger: true,
        optional: true,
      },
      {
        id: 'careReceived',
        label: 'Has any care been received yet?',
        type: 'boolean',
        optional: true,
      },
      {
        id: 'context',
        label: 'Anything else you want the checklist to consider? (optional)',
        type: 'text',
        optional: true,
      },
    ],
  },
  {
    id: 'gp-visit',
    title: 'See a GP or pharmacy clinic',
    blurb: 'A routine, non-urgent visit to a GP or clinic.',
    icon: 'stethoscope',
    category: 'care',
    isEmergency: false,
    questions: [
      {
        id: 'inNetwork',
        label: 'Do you know if the GP/clinic is in your scheme network?',
        type: 'single',
        options: ['Yes, in network', 'No, out of network', 'Not sure'],
        optional: true,
      },
      {
        id: 'fromBenefit',
        label: 'Do you know which benefit this would come from?',
        type: 'single',
        options: ['Day-to-day', 'Savings', 'Not sure'],
        optional: true,
      },
      {
        id: 'visitTiming',
        label: 'Is this before or after the visit?',
        type: 'single',
        options: ['Before the visit', 'After the visit', 'Not sure'],
        optional: true,
      },
      {
        id: 'context',
        label: 'Anything else you want the checklist to consider? (optional)',
        type: 'text',
        optional: true,
      },
    ],
  },
  {
    id: 'specialist-referral',
    title: 'I was referred to a specialist',
    blurb: 'A GP or doctor referred you to a specialist.',
    icon: 'user-round-search',
    category: 'care',
    isEmergency: false,
    questions: [
      { id: 'hasReferral', label: 'Do you have a GP referral letter?', type: 'boolean', optional: true },
      { id: 'appointmentHappened', label: 'Has the appointment happened yet?', type: 'boolean', optional: true },
      {
        id: 'inNetwork',
        label: 'Is the specialist in-network (if you know)?',
        type: 'single',
        options: ['In network', 'Out of network', 'Not sure'],
        optional: true,
      },
      { id: 'schemeConfirmed', label: 'Has the scheme confirmed cover?', type: 'boolean', optional: true },
      {
        id: 'hasCodesOrMotivation',
        label: 'Do you have the procedure codes or a motivation letter?',
        type: 'single',
        options: ['Yes', 'No', 'Not sure'],
        optional: true,
      },
      {
        id: 'context',
        label: 'Anything else you want the checklist to consider? (optional)',
        type: 'text',
        optional: true,
      },
    ],
  },
  {
    id: 'chronic-condition',
    title: 'I was diagnosed with a chronic condition',
    blurb: 'Registering for chronic medicine benefits.',
    icon: 'pill',
    category: 'care',
    isEmergency: false,
    questions: [
      { id: 'hasDiagnosis', label: 'Has a doctor made the diagnosis?', type: 'boolean', optional: true },
      { id: 'registrationSubmitted', label: 'Has chronic registration been submitted to the scheme?', type: 'boolean', optional: true },
      { id: 'onFormulary', label: 'Do you know if the medication is on the scheme formulary?', type: 'single', options: ['Yes', 'No', 'Not sure'], optional: true },
      { id: 'chronicCoverApproved', label: 'Has the scheme approved chronic cover yet?', type: 'boolean', optional: true },
      {
        id: 'dspPharmacyRequired',
        label: 'Is a DSP pharmacy required?',
        type: 'single',
        options: ['Yes', 'No', 'Not sure'],
        optional: true,
      },
      {
        id: 'context',
        label: 'Anything else you want the checklist to consider? (optional)',
        type: 'text',
        optional: true,
      },
    ],
  },
  {
    id: 'planned-procedure',
    title: 'A scan, procedure, or hospital admission',
    blurb: 'Planned care that may need authorisation.',
    icon: 'clipboard-list',
    category: 'care',
    isEmergency: false,
    questions: [
      {
        id: 'careType',
        label: 'What kind of care?',
        type: 'single',
        options: ['Scan (e.g. MRI/CT)', 'Day procedure', 'Hospital admission', 'Not sure'],
        optional: true,
      },
      { id: 'hasAuth', label: 'Has authorisation been obtained?', type: 'boolean', optional: true },
      { id: 'hasQuote', label: 'Do you have a quote and the procedure codes?', type: 'boolean', optional: true },
      {
        id: 'context',
        label: 'Anything else you want the checklist to consider? (optional)',
        type: 'text',
        optional: true,
      },
    ],
  },
  {
    id: 'understand-pmb',
    title: 'I need to understand PMBs',
    blurb: 'What Prescribed Minimum Benefits mean for you.',
    icon: 'book-open',
    category: 'claims',
    isEmergency: false,
    questions: [
      {
        id: 'context',
        label: 'What prompted this? (optional)',
        type: 'text',
        optional: true,
      },
    ],
  },
  {
    id: 'network-dsp',
    title: 'Check network or DSP rules',
    blurb: 'Designated Service Providers and co-payments.',
    icon: 'map-pin',
    category: 'claims',
    isEmergency: false,
    questions: [
      {
        id: 'providerType',
        label: 'What are you checking?',
        type: 'single',
        options: ['A hospital', 'A pharmacy', 'A doctor/specialist', 'Not sure'],
        optional: true,
      },
      {
        id: 'networkTiming',
        label: 'Are you checking before booking or after using the provider?',
        type: 'single',
        options: ['Before booking', 'After using the provider', 'Not sure'],
        optional: true,
      },
      {
        id: 'schemeConfirmedNetwork',
        label: 'Has the scheme confirmed whether this provider is in-network or a DSP?',
        type: 'single',
        options: ['Yes', 'No', 'Not sure'],
        optional: true,
      },
      {
        id: 'context',
        label: 'Anything else you want the checklist to consider? (optional)',
        type: 'text',
        optional: true,
      },
    ],
  },
  {
    id: 'claim-rejection',
    title: 'My claim was rejected',
    blurb: 'Understand why and what to do next.',
    icon: 'file-x',
    category: 'claims',
    isEmergency: false,
    questions: [
      {
        id: 'rejectionReason',
        label: 'Do you know the rejection reason? (paste it if you have it)',
        type: 'text',
        optional: true,
      },
      { id: 'hasWrittenReasons', label: 'Have you received written reasons?', type: 'boolean', optional: true },
      {
        id: 'claimRelatesTo',
        label: 'Might it relate to any of these?',
        type: 'multi',
        options: ['Emergency', 'PMB', 'Chronic', 'Authorisation', 'Network / DSP', 'Not sure'],
        optional: true,
      },
      {
        id: 'claimType',
        label: 'What type of claim was it?',
        type: 'single',
        options: ['Hospital', 'Day-to-day', 'Chronic', 'Specialist', 'Other', 'Not sure'],
        optional: true,
      },
      {
        id: 'hasBillingCodes',
        label: "Do you have the provider's billing codes?",
        type: 'single',
        options: ['Yes', 'No', 'Not sure'],
        optional: true,
      },
      {
        id: 'context',
        label: 'Anything else you want the checklist to consider? (optional)',
        type: 'text',
        optional: true,
      },
    ],
  },
  {
    id: 'triage',
    title: "I'm not sure what to do",
    blurb: 'Answer a couple of questions and we will point you the right way.',
    icon: 'help-circle',
    category: 'care',
    isEmergency: false,
    isTriage: true,
    questions: [
      {
        id: 'severeSymptoms',
        label: 'First — are there severe or frightening symptoms right now?',
        type: 'boolean',
        emergencyTrigger: true,
      },
      {
        id: 'situation',
        label: 'In a sentence, what is happening?',
        type: 'text',
        optional: true,
      },
      {
        id: 'helpNeeded',
        label: 'What kind of help do you need most right now?',
        type: 'single',
        options: ['Where to go for care', 'Authorisation', 'A rejected claim', 'PMB or chronic cover', 'Network or DSP rules', 'Not sure'],
        optional: true,
      },
    ],
  },
];

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
