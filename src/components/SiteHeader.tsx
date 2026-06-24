import Link from 'next/link';

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="wordmark">
        <span className="wordmark-dot" aria-hidden />
        <span>
          Medical Aid Navigator
          <span className="wordmark-sub">Know what to ask first</span>
        </span>
      </Link>
      <nav className="nav-links" aria-label="Main">
        <Link href="/explainers">Explainers</Link>
        <Link href="/about">About &amp; privacy</Link>
      </nav>
    </header>
  );
}
