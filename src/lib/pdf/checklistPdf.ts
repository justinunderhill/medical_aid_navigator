import { jsPDF } from 'jspdf';
import type { Checklist } from '@/components/ChecklistView';

/**
 * Builds a styled, printable PDF of the navigation checklist.
 * Colours mirror the app's brand tokens (src/styles/tokens.css) so the
 * downloaded document looks like part of the product, not a raw dump.
 */

// Brand palette as [r, g, b] (from tokens.css).
const INK: [number, number, number] = [0x13, 0x23, 0x2b];
const INK_SOFT: [number, number, number] = [0x4a, 0x5d, 0x63];
const TEAL: [number, number, number] = [0x0e, 0x6e, 0x66];
const AMBER: [number, number, number] = [0xb5, 0x73, 0x1a];
const ALERT: [number, number, number] = [0xb3, 0x26, 0x1e];

type Variant = 'do' | 'ask' | 'warn';

export function buildChecklistPdf(c: Checklist, appName = 'Medical Aid Navigator'): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentW = pageW - margin * 2;
  let y = margin;

  // Ensure there is room for the next `needed` points; new page if not.
  const ensure = (needed: number) => {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const wrapped = (text: string, fontSize: number): string[] => {
    doc.setFontSize(fontSize);
    return doc.splitTextToSize(text, contentW);
  };

  // ---- Title band ----
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...TEAL);
  doc.setFontSize(18);
  doc.text(appName, margin, y);
  y += 22;
  doc.setFontSize(13);
  doc.setTextColor(...INK);
  doc.text('Your checklist', margin, y);
  y += 10;
  doc.setDrawColor(...TEAL);
  doc.setLineWidth(1.5);
  doc.line(margin, y, pageW - margin, y);
  y += 20;

  // ---- Situation summary ----
  if (c.scenarioSummary) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10.5);
    doc.setTextColor(...INK_SOFT);
    const lines = wrapped(c.scenarioSummary, 10.5);
    ensure(lines.length * 14 + 8);
    doc.text(lines, margin, y);
    y += lines.length * 14 + 12;
  }

  // ---- A heading + paragraph block ----
  const paragraph = (title: string, body: string, variant: Variant = 'do') => {
    if (!body) return;
    heading(title, variant);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    const lines = wrapped(body, 11);
    ensure(lines.length * 14 + 6);
    doc.text(lines, margin, y);
    y += lines.length * 14 + 12;
  };

  // ---- A heading + bullet list block ----
  const list = (title: string, items: string[], variant: Variant = 'do') => {
    if (!items || items.length === 0) return;
    heading(title, variant);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    for (const item of items) {
      const lines = wrapped(item, 11);
      ensure(lines.length * 14 + 4);
      doc.text('•', margin, y);
      doc.text(lines, margin + 14, y);
      y += lines.length * 14 + 4;
    }
    y += 8;
  };

  function heading(title: string, variant: Variant) {
    const colour = variant === 'ask' ? AMBER : variant === 'warn' ? ALERT : TEAL;
    ensure(24);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...colour);
    doc.text(title, margin, y);
    y += 16;
  }

  paragraph('Immediate next step', c.immediateNextStep, 'do');
  paragraph('Possible benefit category', c.possibleBenefitCategory, 'ask');
  list('Ask your scheme', c.askYourScheme, 'ask');
  list('Ask your provider or doctor', c.askYourProvider, 'ask');
  list('Documents and codes to request', c.documentsToRequest, 'do');
  list('Possible risk areas', c.riskAreas, 'warn');
  list('What not to do', c.whatNotToDo, 'warn');
  list('If you need to escalate', c.escalationSteps, 'do');

  // ---- Disclaimer footer ----
  if (c.disclaimer) {
    ensure(40);
    doc.setDrawColor(...INK_SOFT);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageW - margin, y);
    y += 12;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(...INK_SOFT);
    const lines = wrapped(c.disclaimer, 8.5);
    ensure(lines.length * 11);
    doc.text(lines, margin, y);
    y += lines.length * 11;
  }

  // ---- Attribution (matches the site footer; name links to author's site) ----
  y += 14;
  ensure(14);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(...INK_SOFT);
  const prefix = 'I hope this helps someone — ';
  const name = 'Justin Underhill';
  const prefixW = doc.getTextWidth(prefix);
  const nameW = doc.getTextWidth(name);
  const startX = (pageW - (prefixW + nameW)) / 2;
  doc.text(prefix, startX, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEAL);
  doc.textWithLink(name, startX + prefixW, y, {
    url: 'https://www.justinunderhill.com/',
  });

  return doc;
}
