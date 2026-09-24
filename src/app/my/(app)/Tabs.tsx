'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import s from '../my.module.css';

const TABS = [
  ['/my', 'Home'],
  ['/my/payments', 'Payments'],
  ['/my/contact', 'Contact'],
] as const;

export function Tabs() {
  const path = usePathname();
  return (
    <nav className={s.tabs} aria-label="My rental">
      {TABS.map(([href, label]) => (
        <Link key={href} href={href} className={`${s.tab} ${path === href ? s.tabOn : ''}`} aria-current={path === href ? 'page' : undefined}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
