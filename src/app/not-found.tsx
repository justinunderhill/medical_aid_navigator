import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="shell">
      <h1 className="h-display" style={{ marginBottom: 'var(--sp-3)' }}>
        We couldn&apos;t find that page.
      </h1>
      <p className="muted" style={{ marginBottom: 'var(--sp-4)' }}>
        The link may be old or mistyped. Head back and pick a situation to start.
      </p>
      <Link href="/" className="btn btn-primary">Back to home</Link>
    </main>
  );
}
