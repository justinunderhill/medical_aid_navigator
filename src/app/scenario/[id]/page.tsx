import { notFound } from 'next/navigation';
import { getScenario, SCENARIOS } from '@/data/scenarios';
import { ScenarioFlow } from '@/components/ScenarioFlow';

export function generateStaticParams() {
  return SCENARIOS.map((s) => ({ id: s.id }));
}

export default async function ScenarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scenario = getScenario(id);
  if (!scenario) notFound();
  return <ScenarioFlow scenario={scenario} />;
}
