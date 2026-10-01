'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageCircle, BookOpen, ShieldCheck, Info } from 'lucide-react';

const TABS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/man', label: 'Ask MAN', icon: MessageCircle },
  { href: '/explainers', label: 'Explainers', icon: BookOpen },
  { href: '/sources', label: 'Sources', icon: ShieldCheck },
  { href: '/about', label: 'About', icon: Info },
] as const;

/**
 * Bottom tab bar, mobile only (hidden via CSS above the mobile-shell
 * breakpoint — see globals.css). Always server-rendered so navigation works
 * without JS; only the active-tab highlighting needs the client.
 */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="mobile-nav" aria-label="Primary">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`mobile-nav-item${active ? ' is-active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 2} aria-hidden />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
