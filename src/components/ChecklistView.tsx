'use client';

import { useState, useMemo } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { Copy, Check, Download } from 'lucide-react';
import { buildChecklistPdf } from '@/lib/pdf/checklistPdf';
import { briefContainer, briefItem } from '@/lib/motion';

export interface Checklist {
  scenarioSummary: string;
  isEmergency: boolean;
  immediateNextStep: string;
  possibleBenefitCategory: string;
  askYourScheme: string[];
  askYourProvider: string[];
  documentsToRequest: string[];
  riskAreas: string[];
  whatNotToDo: string[];
  escalationSteps: string[];
  disclaimer?: string;
}

const CONFIRMATION_REMINDER =
  'Confirm benefits, authorisation, network status, costs, and next steps directly with your scheme, provider, or an accredited broker. This checklist does not guarantee any claim outcome.';

function Section({
  title,
  items,
  variant = 'do',
  itemVariants,
}: {
  title: string;
  items: string[];
  variant?: 'do' | 'ask' | 'warn';
  itemVariants: Variants;
}) {
  if (!items || items.length === 0) return null;
  const cls = variant === 'ask' ? 'ask' : variant === 'warn' ? 'warn' : '';
  return (
    <motion.div className={`result-section ${cls}`} variants={itemVariants}>
      <h3>{title}</h3>
      <ul>
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </motion.div>
  );
}

function toPlainText(c: Checklist): string {
  const lines: string[] = [];
  lines.push('MEDICAL AID NAVIGATOR — YOUR CHECKLIST');
  lines.push('');
  if (c.scenarioSummary) lines.push(`Situation: ${c.scenarioSummary}`, '');
  if (c.immediateNextStep) lines.push(`IMMEDIATE NEXT STEP:`, c.immediateNextStep, '');
  if (c.possibleBenefitCategory) lines.push(`POSSIBLE BENEFIT CATEGORY:`, c.possibleBenefitCategory, '');
  const block = (t: string, arr: string[]) => {
    if (arr?.length) {
      lines.push(t.toUpperCase() + ':');
      arr.forEach((a) => lines.push(`  - ${a}`));
      lines.push('');
    }
  };
  block('Ask your scheme', c.askYourScheme);
  block('Ask your provider / doctor', c.askYourProvider);
  block('Codes and documents to request', c.documentsToRequest);
  block('Cost or co-payment risks to check', c.riskAreas);
  block('What not to do', c.whatNotToDo);
  block('Escalation steps', c.escalationSteps);
  lines.push('CONFIRM BEFORE PROCEEDING:', CONFIRMATION_REMINDER, '');
  if (c.disclaimer) lines.push('---', c.disclaimer);
  return lines.join('\n');
}

export function ChecklistView({ checklist }: { checklist: Checklist }) {
  const [copied, setCopied] = useState(false);
  const reduce = useReducedMotion() ?? false;
  const container = useMemo(() => briefContainer(reduce), [reduce]);
  const item = useMemo(() => briefItem(reduce), [reduce]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(toPlainText(checklist));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — download still works */
    }
  };

  const download = () => {
    const doc = buildChecklistPdf(checklist);
    doc.save('medical-aid-checklist.pdf');
  };

  return (
    <motion.div
      className="checklist-document"
      variants={container}
      initial="hidden"
      animate="visible"
    >
      <motion.header className="checklist-header" variants={item}>
        <p className="eyebrow">Decision brief</p>
        {checklist.scenarioSummary && (
          <p className="muted">
            {checklist.scenarioSummary}
          </p>
        )}
      </motion.header>

      {checklist.immediateNextStep && (
        <motion.div className="result-section" variants={item}>
          <h3>Immediate next step</h3>
          <p>{checklist.immediateNextStep}</p>
        </motion.div>
      )}

      {checklist.possibleBenefitCategory && (
        <motion.div className="callout callout-amber" variants={item}>
          <h3>Possible benefit category</h3>
          <p>{checklist.possibleBenefitCategory}</p>
        </motion.div>
      )}

      <Section title="Ask your scheme" items={checklist.askYourScheme} variant="ask" itemVariants={item} />
      <Section title="Ask your provider or doctor" items={checklist.askYourProvider} variant="ask" itemVariants={item} />
      <Section title="Codes and documents to request" items={checklist.documentsToRequest} itemVariants={item} />
      <Section title="Cost or co-payment risks to check" items={checklist.riskAreas} variant="warn" itemVariants={item} />
      <Section title="What not to do" items={checklist.whatNotToDo} variant="warn" itemVariants={item} />
      <Section title="If you need to escalate" items={checklist.escalationSteps} itemVariants={item} />

      <motion.div className="result-section ask" variants={item}>
        <h3>Confirm before proceeding</h3>
        <p>{CONFIRMATION_REMINDER}</p>
      </motion.div>

      <motion.div className="checklist-actions" variants={item}>
        <button className="btn btn-primary" onClick={copy}>
          {copied ? <Check size={18} /> : <Copy size={18} />}
          {copied ? 'Copied' : 'Copy checklist'}
        </button>
        <button className="btn btn-secondary" onClick={download}>
          <Download size={18} /> Download PDF
        </button>
      </motion.div>

      {checklist.disclaimer && (
        <motion.p className="small muted" style={{ padding: '0 var(--sp-4) var(--sp-4)' }} variants={item}>
          {checklist.disclaimer}
        </motion.p>
      )}
    </motion.div>
  );
}
