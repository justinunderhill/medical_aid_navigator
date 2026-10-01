// Explicit opt-in live checks; uses only synthetic questions and a generated PDF.
// Usage: node scripts/release-smoke.mjs https://your-deployment.example
import assert from 'node:assert/strict';
import { jsPDF } from 'jspdf';

const base = process.argv[2];
assert(base && /^https?:\/\//.test(base), 'Supply the deployment URL');
const scenarios = ['emergency-care', 'casualty', 'gp-visit', 'specialist-referral', 'chronic-condition', 'planned-procedure', 'understand-pmb', 'network-dsp', 'claim-rejection', 'triage'];
async function check(path, init = {}, expected = 200) {
  const response = await fetch(new URL(path, base), { ...init, signal: AbortSignal.timeout(65000) });
  assert.equal(response.status, expected, `${path}: unexpected HTTP status`);
  return response;
}
function json(body) { return { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }; }
function form(question, pdf, history = []) {
  const body = new FormData();
  body.set('question', question); body.set('history', JSON.stringify(history));
  if (pdf) body.set('plan', new Blob([pdf], { type: 'application/pdf' }), 'synthetic-benefits.pdf');
  return { method: 'POST', body };
}

for (const route of ['/', '/man', '/cover', '/about', '/sources', '/explainers', '/offline', ...scenarios.map(s => `/scenario/${s}`)]) {
  const html = await (await check(route)).text();
  assert(html.includes('<main'), `${route}: missing page content`);
}
console.log('PASS: all public pages and 10 scenario routes');
await check('/does-not-exist', {}, 404);
const manifest = await (await check('/manifest.webmanifest')).json();
assert.equal(manifest.display, 'standalone');
for (const icon of manifest.icons) assert((await check(icon.src)).headers.get('content-type')?.includes('image'));
const versionResponse = await check('/api/version');
assert(versionResponse.headers.get('cache-control')?.includes('no-store'));
const { version } = await versionResponse.json();
assert(typeof version === 'string' && version.length > 0);
const workerResponse = await check('/sw.js');
assert(workerResponse.headers.get('content-type')?.includes('javascript'));
assert(workerResponse.headers.get('cache-control')?.includes('no-store'));
assert((await workerResponse.text()).includes(`man-shell-${version}`));
assert.equal((await (await check('/api/health')).json()).status, 'ok');
console.log('PASS: 404, health, install manifest, icons, service worker');

const chat = await (await check('/api/concierge', form('Explain co-payments in two sentences.'))).json();
assert(chat.segments?.some(s => s.text.length > 20));
const followup = await (await check('/api/concierge', form('What should I ask about those before booking?', undefined, [
  { role: 'user', content: 'Explain co-payments in two sentences.' },
  { role: 'assistant', content: chat.segments.map(s => s.text).join('\n').slice(0, 3000) },
]))).json();
assert(followup.segments?.length);
console.log('PASS: live MAN answer and follow-up');

const pdf = new jsPDF();
pdf.text(['SYNTHETIC TEST ONLY - Example Scheme Benefits 2026', 'Example Core plan', 'MRI: R5,000 annual limit per beneficiary.', 'Pre-authorisation required before planned MRI scans.', 'R750 co-payment per scan.'], 15, 20);
for (const endpoint of ['/api/concierge', '/api/plan-cover']) {
  const result = await (await check(endpoint, form('What MRI limit and co-payment does this plan state?', pdf.output('arraybuffer')))).json();
  const text = result.segments.map(s => s.text).join('');
  assert(/5[ ,]?000/.test(text) && /750/.test(text), `${endpoint}: incorrect synthetic figures`);
  assert(result.segments.some(s => s.citations.some(c => c.pageStart === 1)), `${endpoint}: missing page citation`);
}
console.log('PASS: both PDF endpoints return synthetic figures and page citations');
await check('/api/concierge', form('Read my plan', new TextEncoder().encode('not a pdf')), 400);
const urgent = await (await check('/api/concierge', form('Someone is unconscious and not breathing'))).json();
assert.equal(urgent.isEmergency, true);
const emergency = await (await check('/api/navigate', json({ scenarioId: 'emergency-care' }))).json();
assert.equal(emergency.isEmergency, true);
console.log('PASS: invalid PDF rejection and emergency interception');

const classification = await (await check('/api/classify-scenario', json({ text: 'My medical aid claim was rejected and I want to query it.' }))).json();
assert.equal(classification.scenarioId, 'claim-rejection');
const navigation = await (await check('/api/navigate', json({ scenarioId: 'gp-visit', freeText: 'Routine GP appointment. What should I ask about benefits?', answers: {} }))).json();
assert(!navigation.fallback, 'Checklist used provider failure fallback');
assert(navigation.checklist?.askYourScheme?.length);
assert(navigation.checklist?.immediateNextStep);
console.log('PASS: live scenario classification and checklist generation');
