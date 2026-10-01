import type { Metadata } from 'next';
import { ManConcierge } from '@/components/ManConcierge';

export const metadata: Metadata = {
  title: 'Your cover',
  description: 'Upload your medical aid plan document and get answers cited to the exact page.',
};

export default function CoverPage() {
  return (
    <main className="man-page cover-page">
      <h1 className="sr-only">Your cover — ask MAN</h1>
      <ManConcierge dedicated />
    </main>
  );
}
