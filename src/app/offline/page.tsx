import Link from 'next/link';
import { WifiOff } from 'lucide-react';

export const metadata = { title: 'You’re offline — Medical Aid Navigator' };

export default function OfflinePage() {
  return (
    <main className="shell">
      <section className="emergency-gate" aria-labelledby="offline-title">
        <div className="emergency-gate-icon" aria-hidden>
          <WifiOff size={26} />
        </div>
        <p className="eyebrow">No connection</p>
        <h1 id="offline-title">You&rsquo;re offline</h1>
        <p>
          Medical Aid Navigator needs a connection to build a checklist. If
          this is a medical emergency, do not wait for signal — call 10177
          (ambulance) or 112 from a mobile, or go to the nearest appropriate
          emergency facility.
        </p>
        <div className="emergency-gate-actions">
          <Link className="btn btn-primary" href="/">
            Try again
          </Link>
        </div>
      </section>
    </main>
  );
}
