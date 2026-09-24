import type { Metadata, Viewport } from 'next';
import { Archivo, Kaushan_Script } from 'next/font/google';
import './globals.css';

const archivo = Archivo({ subsets: ['latin'], weight: ['400', '600', '800'], variable: '--font-archivo', display: 'swap' });
const kaushan = Kaushan_Script({ subsets: ['latin'], weight: '400', variable: '--font-kaushan', display: 'swap' });

export const metadata: Metadata = {
  title: 'TG Car Vibes — long-term car hire in Sydney',
  description:
    'Long-term car rental from Bankstown Square NSW. Petrol automatics from $200 per week, minimum 8 weeks, bond 2 weeks’ rent refundable.',
};

export const viewport: Viewport = { themeColor: '#f3f2f2', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU" className={`${archivo.variable} ${kaushan.variable}`}>
      <body>{children}</body>
    </html>
  );
}
