'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';

// Google Analytics 4 measurement ID (override with NEXT_PUBLIC_GA_ID if it ever changes)
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-YT5N8RVJEQ';

// Only the public website is tracked — admin, customer app and contract signing pages are private.
const PRIVATE = /^\/(admin|my|sign)(\/|$)/;

export default function GoogleAnalytics() {
  const pathname = usePathname() ?? '/';
  if (!GA_ID || PRIVATE.test(pathname)) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
      </Script>
    </>
  );
}
