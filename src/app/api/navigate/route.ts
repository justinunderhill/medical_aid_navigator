import { NextRequest, NextResponse } from 'next/server';
import { generateChecklist } from '@/lib/ai';
import type { NavigateRequest, NavigationChecklist } from '@/lib/ai/types';
import {
  detectEmergency,
  EMERGENCY_GUIDANCE,
  FALLBACK_URGENT_CARE_LEAD,
} from '@/lib/safety/emergency';
import { rateLimit, clientKey } from '@/lib/safety/guards';
import { parseNavigateRequestBody } from '@/lib/safety/requestValidation';
import { getScenario } from '@/data/scenarios';
import { STANDARD_DISCLAIMER } from '@/lib/safety/outputValidator';

export const runtime = 'nodejs';
export const maxDuration = 30;

function fallbackChecklistForScenario(scenarioId: string, freeText = ''): NavigationChecklist {
  const base: NavigationChecklist = {
    scenarioSummary:
      freeText || 'We could not generate detailed guidance right now, so this is a conservative checklist.',
    isEmergency: false,
    immediateNextStep:
      `${FALLBACK_URGENT_CARE_LEAD} Otherwise, contact your medical scheme directly and ask what the next documented step is for your situation.`,
    possibleBenefitCategory:
      'This may fall under one or more benefit categories — confirm with your scheme.',
    askYourScheme: [
      'Which benefit would this be assessed against?',
      'Is authorisation, a network provider, or a DSP required before I proceed?',
      'Are there limits, scheme rates, or co-payments I should confirm in writing?',
    ],
    askYourProvider: [
      'Which ICD-10 code will appear on the account?',
      'Are there procedure, tariff, or NAPPI codes I should send to the scheme?',
      'Will you bill at the scheme rate or a private rate?',
    ],
    documentsToRequest: [
      'ICD-10 code',
      'Relevant procedure, tariff, or NAPPI codes',
      'Written quote, account, referral, or motivation where applicable',
      'Authorisation reference if one is issued',
    ],
    riskAreas: [
      'Co-payments can arise from network/DSP rules, private rates, benefit limits, or missing authorisation.',
    ],
    whatNotToDo: [
      'Do not assume cover or payment based on this checklist.',
      'Do not delay urgent care to check benefits.',
    ],
    escalationSteps: [
      'If the answer is unclear, ask the scheme for written reasons or the next documented process step.',
    ],
    disclaimer: STANDARD_DISCLAIMER,
  };

  if (scenarioId === 'planned-procedure') {
    return {
      ...base,
      possibleBenefitCategory:
        'This may fall under radiology, procedure, or hospital benefits — confirm with your scheme before planned care.',
      askYourScheme: [
        'Does this scan, procedure, or admission need pre-authorisation?',
        'Which ICD-10 and procedure/tariff codes must be submitted?',
        'Is the facility and provider in network, and are any co-payments expected?',
      ],
      askYourProvider: [
        'Please provide the ICD-10 code, procedure/tariff codes, and a written quote.',
        'Will you bill at the scheme rate or a private rate?',
      ],
      documentsToRequest: ['Referral letter', 'ICD-10 code', 'Procedure/tariff codes', 'Written quote', 'Authorisation reference'],
    };
  }

  if (scenarioId === 'chronic-condition') {
    return {
      ...base,
      possibleBenefitCategory:
        'This may involve chronic benefits or a PMB/CDL pathway — confirm with your doctor and scheme.',
      askYourScheme: [
        'Is chronic registration required, and what form or motivation is needed?',
        'Is the medicine on the formulary, and is a DSP pharmacy required?',
        'What follow-up consultations, tests, or medicine items are covered under my plan?',
      ],
      askYourProvider: [
        'Please confirm the diagnosis wording and ICD-10 code for the chronic application.',
        'Can you provide the motivation, prescription, and any test results the scheme requires?',
      ],
      documentsToRequest: ['Chronic application form', 'ICD-10 code', 'Prescription', 'Doctor motivation', 'Relevant test results'],
    };
  }

  if (scenarioId === 'claim-rejection') {
    return {
      ...base,
      possibleBenefitCategory:
        'This may involve claims administration, coding, authorisation, PMB assessment, or network rules — confirm the reason in writing.',
      immediateNextStep:
        'Ask the scheme for the written rejection reason and the exact code or rule used to assess the claim.',
      askYourScheme: [
        'What is the written reason for the rejection?',
        'Was the claim assessed against the ICD-10 and procedure codes submitted?',
        'What correction, resubmission, or dispute process is available?',
      ],
      askYourProvider: [
        'Please confirm the ICD-10 code, procedure/tariff codes, dates, and itemised account details.',
        'If there is a coding or admin error, can the account be corrected and resubmitted?',
      ],
      documentsToRequest: ['Written rejection reason', 'Itemised account', 'ICD-10 code', 'Procedure/tariff codes', 'Proof of authorisation if relevant'],
      whatNotToDo: [
        'Do not accuse the scheme or provider without written reasons and corrected account details.',
        'Do not assume the claim outcome; follow the documented correction or dispute process.',
      ],
    };
  }

  if (scenarioId === 'understand-pmb') {
    return {
      ...base,
      possibleBenefitCategory:
        'PMBs include emergency medical conditions, a defined set of Diagnosis and Treatment Pairs, and 26 Chronic Disease List conditions — this tool cannot declare PMB status.',
      immediateNextStep:
        'Ask your doctor and scheme whether the diagnosis and treatment pathway may fall into a PMB pathway.',
      askYourScheme: [
        'Is this being assessed under a PMB pathway, and what documents do you need?',
        'Do I need to use a DSP or network provider?',
        'Which authorisation or registration process applies?',
      ],
      askYourProvider: [
        'What ICD-10 code are you using?',
        'What treatment pathway, motivation, or codes should the scheme review?',
      ],
      documentsToRequest: ['ICD-10 code', 'Doctor motivation if relevant', 'Treatment plan or quote', 'Scheme PMB or authorisation response'],
    };
  }

  return base;
}

/**
 * POST /api/navigate
 * The primary endpoint. Runs:
 *   1. rate limit
 *   2. deterministic emergency check (returns emergency payload fast)
 *   3. AI checklist generation (with grounding + output validation)
 */
export async function POST(req: NextRequest) {
  // 1. Rate limit
  const key = clientKey(req.headers);
  const limit = rateLimit(key);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment and try again.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
    );
  }

  let body: NavigateRequest;
  try {
    const parsed = parseNavigateRequestBody(await req.json());
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    body = parsed.value;
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const scenarioId = body.scenarioId;
  if (!scenarioId || !getScenario(scenarioId)) {
    return NextResponse.json({ error: 'Unknown scenario.' }, { status: 400 });
  }

  const freeText = body.freeText;
  const answers = body.answers ?? {};

  // 2. Fast emergency response (do not wait on the AI).
  const emergency = detectEmergency({ scenarioId, freeText, answers });

  if (emergency.isEmergency) {
    return NextResponse.json({
      isEmergency: true,
      emergency: EMERGENCY_GUIDANCE,
    });
  }

  // 3. AI generation with full pipeline.
  try {
    const checklist = await generateChecklist({
      scenarioId,
      freeText,
      answers,
      schemeName: body.schemeName,
      planName: body.planName,
    });
    const { _validationFlags, ...publicChecklist } = checklist;
    if (_validationFlags?.length) {
      console.warn('[navigate] output validation flags:', _validationFlags);
    }
    return NextResponse.json({ isEmergency: false, checklist: publicChecklist });
  } catch (err) {
    // NFR3: never show broken/blank guidance. Return a safe fallback checklist.
    console.error('[navigate] generation error:', err instanceof Error ? err.message : err);
    return NextResponse.json(
      {
        isEmergency: false,
        checklist: fallbackChecklistForScenario(scenarioId, freeText),
        fallback: true,
      },
      { status: 200 }
    );
  }
}
