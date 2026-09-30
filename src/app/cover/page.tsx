import type { Metadata } from 'next';
import { PlanCover } from '@/components/PlanCover';
import { Disclaimer } from '@/components/Disclaimer';

export const metadata: Metadata = {
  title: 'Your cover',
  description: 'Upload your medical aid plan document and get answers cited to the exact page.',
};

export default function CoverPage() {
  return (
    <main className="desk-shell cover-page">
      <PlanCover />
      <Disclaimer />
    </main>
  );
}
