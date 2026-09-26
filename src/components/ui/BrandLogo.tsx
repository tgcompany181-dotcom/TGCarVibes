import Image from 'next/image';

/** TG Car Vibes logo (silver & gold, transparent — works on light and dark backgrounds). File is 1072×160. */
export function BrandLogo({ height = 40, priority = false }: { height?: number; priority?: boolean }) {
  return (
    <Image
      src="/images/tg-car-vibes-logo.png"
      alt="TG Car Vibes"
      width={Math.round((height * 1072) / 160)}
      height={height}
      priority={priority}
      style={{ height, width: 'auto', maxWidth: '100%' }}
    />
  );
}
