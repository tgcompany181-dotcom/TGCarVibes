import type { Tone } from '@/lib/derive';

export function Tag({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return <span className={`tag tag-${tone}`}>{children}</span>;
}
