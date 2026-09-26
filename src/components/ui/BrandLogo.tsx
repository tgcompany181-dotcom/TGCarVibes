import Image from 'next/image';

/** TG Car & Van Rental logo. `onDark` uses the version with light lettering. Logo files are 1150×160. */
export function BrandLogo({ height = 40, onDark = false, priority = false }: { height?: number; onDark?: boolean; priority?: boolean }) {
  return (
    <Image
      src={onDark ? '/images/logo-light.png' : '/images/logo.png'}
      alt="TG Car & Van Rental"
      width={Math.round((height * 1150) / 160)}
      height={height}
      priority={priority}
      style={{ height, width: 'auto', maxWidth: '100%' }}
    />
  );
}
