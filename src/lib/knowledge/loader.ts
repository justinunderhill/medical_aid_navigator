import fs from 'fs';
import path from 'path';

/**
 * Knowledge base loader (NFR7 maintainability).
 * Reads grounding content from /content markdown files. Cached in memory.
 * Maps scenario ids to their grounding files; falls back to scheme-neutral
 * rules so the AI is never left ungrounded.
 */

const CONTENT_ROOT = path.join(process.cwd(), 'content');
const cache = new Map<string, string>();

function readContent(relPath: string): string {
  if (cache.has(relPath)) return cache.get(relPath)!;
  const full = path.join(CONTENT_ROOT, relPath);
  let text = '';
  try {
    text = fs.readFileSync(full, 'utf-8');
  } catch {
    text = '';
  }
  cache.set(relPath, text);
  return text;
}

const SCENARIO_FILE_MAP: Record<string, string> = {
  'emergency-care': 'scenarios/emergency-care.md',
  casualty: 'scenarios/casualty.md',
  'gp-visit': 'scenarios/gp-visit.md',
  'specialist-referral': 'scenarios/specialist-referral.md',
  'chronic-condition': 'scenarios/chronic-condition.md',
  'planned-procedure': 'scenarios/planned-procedure.md',
  'understand-pmb': 'concepts/pmb.md',
  'network-dsp': 'concepts/dsp.md',
  'claim-rejection': 'scenarios/claim-rejection.md',
  triage: 'schemes/scheme-neutral-rules.md',
};

export function getScenarioKnowledge(scenarioId: string): string {
  const file = SCENARIO_FILE_MAP[scenarioId];
  const scenario = file ? readContent(file) : '';
  const neutral = readContent('schemes/scheme-neutral-rules.md');
  return [scenario, neutral].filter(Boolean).join('\n\n');
}

/** A compact bundle of all concept explainers for grounding. */
export function getCoreConcepts(): string {
  const files = [
    'concepts/pmb.md',
    'concepts/dsp.md',
    'concepts/icd10.md',
    'concepts/authorisation.md',
    'concepts/chronic-benefit.md',
    'concepts/copayments.md',
    'concepts/claims-disputes.md',
  ];
  return files.map(readContent).filter(Boolean).join('\n\n---\n\n');
}

/** Load a single concept by slug (for the explainers page). */
export function getConcept(slug: string): string {
  return readContent(`concepts/${slug}.md`);
}

export function getCoreContent(slug: string): string {
  return readContent(`core/${slug}.md`);
}
