import Link from 'next/link';
import { ShareButton } from '@/components/ShareButton';

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="wordmark">
        <span className="wordmark-badge" aria-hidden>MN</span>
        <span>
          Medical Aid Navigator
          <span className="wordmark-sub">Know what to ask first</span>
        </span>
      </Link>
      <nav className="nav-links" aria-label="Main">
        <Link href="/explainers">Explainers</Link>
        <Link href="/sources">Sources</Link>
        <Link href="/about">About &amp; privacy</Link>
      </nav>
      <ShareButton />
    </header>
  );
}
