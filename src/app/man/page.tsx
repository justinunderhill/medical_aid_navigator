import type { Metadata } from 'next';
import { ManConcierge } from '@/components/ManConcierge';

export const metadata: Metadata = { title: 'Ask MAN — Medical Aid Navigator', description: 'Your AI concierge for medical aid questions, benefits documents, and finding your next step.' };

export default function ManPage() {
  return <main className="man-page"><h1 className="sr-only">Ask MAN</h1><ManConcierge dedicated /></main>;
}
