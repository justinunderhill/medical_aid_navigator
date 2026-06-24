'use client';

import { useState } from 'react';
import { Copy, Check, Download } from 'lucide-react';

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

function Section({
  title,
  items,
  variant = 'do',
}: {
  title: string;
  items: string[];
  variant?: 'do' | 'ask' | 'warn';
}) {
  if (!items || items.length === 0) return null;
  const cls = variant === 'ask' ? 'ask' : variant === 'warn' ? 'warn' : '';
  return (
    <div className={`result-section ${cls}`}>
      <h3>{title}</h3>
      <ul>
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
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
  block('Documents & codes to request', c.documentsToRequest);
  block('Possible risk areas', c.riskAreas);
  block('What not to do', c.whatNotToDo);
  block('Escalation steps', c.escalationSteps);
  if (c.disclaimer) lines.push('---', c.disclaimer);
  return lines.join('\n');
}

export function ChecklistView({ checklist }: { checklist: Checklist }) {
  const [copied, setCopied] = useState(false);

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
    const blob = new Blob([toPlainText(checklist)], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'medical-aid-checklist.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="reveal checklist-document">
      <header className="checklist-header">
        <p className="eyebrow">Working checklist</p>
        {checklist.scenarioSummary && (
          <p className="muted">
            {checklist.scenarioSummary}
          </p>
        )}
      </header>

      {checklist.immediateNextStep && (
        <div className="result-section">
          <h3>Immediate next step</h3>
          <p>{checklist.immediateNextStep}</p>
        </div>
      )}

      {checklist.possibleBenefitCategory && (
        <div className="result-section ask">
          <h3>Possible benefit category</h3>
          <p>{checklist.possibleBenefitCategory}</p>
        </div>
      )}

      <Section title="Ask your scheme" items={checklist.askYourScheme} variant="ask" />
      <Section title="Ask your provider or doctor" items={checklist.askYourProvider} variant="ask" />
      <Section title="Documents and codes to request" items={checklist.documentsToRequest} />
      <Section title="Possible risk areas" items={checklist.riskAreas} variant="warn" />
      <Section title="What not to do" items={checklist.whatNotToDo} variant="warn" />
      <Section title="If you need to escalate" items={checklist.escalationSteps} />

      <div className="checklist-actions">
        <button className="btn btn-primary" onClick={copy}>
          {copied ? <Check size={18} /> : <Copy size={18} />}
          {copied ? 'Copied' : 'Copy checklist'}
        </button>
        <button className="btn btn-secondary" onClick={download}>
          <Download size={18} /> Download
        </button>
      </div>

      {checklist.disclaimer && (
        <p className="small muted" style={{ padding: '0 var(--sp-4) var(--sp-4)' }}>
          {checklist.disclaimer}
        </p>
      )}
    </div>
  );
}
