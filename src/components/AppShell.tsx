'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';

/** Keep the chat composer inside the visible viewport, including the Android keyboard. */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const chat = pathname === '/man' || pathname === '/cover';
  const shell = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!chat) return;
    const viewport = window.visualViewport;
    const update = () => {
      const height = viewport?.height ?? window.innerHeight;
      shell.current?.style.setProperty('--chat-height', `${height}px`);
      shell.current?.style.setProperty('--chat-top', `${viewport?.offsetTop ?? 0}px`);
      shell.current?.classList.toggle('is-compact', height < 500);
    };
    update();
    viewport?.addEventListener('resize', update);
    viewport?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => {
      viewport?.removeEventListener('resize', update);
      viewport?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [chat, pathname]);
  return <div ref={shell} className={`app-shell${chat ? ' app-shell-chat' : ''}`}>{children}</div>;
}
