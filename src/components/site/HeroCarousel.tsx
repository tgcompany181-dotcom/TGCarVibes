'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import s from '@/app/site.module.css';

const INTERVAL_MS = 5000;

/** Cover image slideshow: cross-fades every 5 s, pauses on hover/focus and when the user prefers reduced motion. */
export function HeroCarousel({ images }: { images: string[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = images.length;

  useEffect(() => {
    if (n < 2 || paused) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), INTERVAL_MS);
    return () => clearInterval(t);
  }, [n, paused]);

  return (
    <div
      className={s.hero}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-roledescription={n > 1 ? 'carousel' : undefined}
    >
      {images.map((src, k) => (
        <Image
          key={src}
          src={src}
          alt={k === 0 ? 'TG Car Vibes cars at Bankstown' : ''}
          fill
          priority={k === 0}
          sizes="100vw"
          className={s.heroSlide}
          style={{ opacity: k === i ? 1 : 0 }}
          aria-hidden={k !== i}
        />
      ))}
      {n > 1 && (
        <div className={s.heroDots}>
          {images.map((src, k) => (
            <button key={src} type="button" aria-label={`Show cover image ${k + 1}`} aria-current={k === i} className={k === i ? s.heroDotOn : undefined} onClick={() => setI(k)} />
          ))}
        </div>
      )}
    </div>
  );
}
