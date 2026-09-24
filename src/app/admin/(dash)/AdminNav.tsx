'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import s from '../admin.module.css';

export function AdminNav({ tabs }: { tabs: { href: string; label: string; badge: string }[] }) {
  const path = usePathname();
  return (
    <nav className={s.tabs} aria-label="Admin">
      {tabs.map((t) => {
        const on = t.href === '/admin' ? path === '/admin' : path.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} className={`${s.tab} ${on ? s.tabOn : ''}`} aria-current={on ? 'page' : undefined}>
            <span>{t.label}</span>
            <span className={s.badge}>{t.badge}</span>
          </Link>
        );
      })}
    </nav>
  );
}
