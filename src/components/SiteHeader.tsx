import Link from 'next/link';
import { ShareButton } from '@/components/ShareButton';
import { BrandMark } from '@/components/BrandMark';

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="wordmark">
        <BrandMark className="wordmark-badge" />
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
