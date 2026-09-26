'use client';

import { useRef, useState, useTransition } from 'react';
import { useToast } from '@/components/ui/Toast';
import { addBanners, saveBannerOrder } from '../../actions';

export function BannerManager({ banners }: { banners: string[] }) {
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  const flash = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = (form: FormData) =>
    start(async () => {
      setError('');
      const res = await addBanners(form);
      if (!res.ok) return setError(res.error);
      if (fileRef.current) fileRef.current.value = '';
      flash('Cover images added');
    });

  const reorder = (next: string[], msg: string) =>
    start(async () => {
      const res = await saveBannerOrder(next);
      flash(res.ok ? msg : res.error);
    });

  const move = (k: number, d: -1 | 1) => {
    const next = [...banners];
    [next[k], next[k + d]] = [next[k + d], next[k]];
    reorder(next, 'Order saved');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p className="muted" style={{ margin: 0, fontSize: 14 }}>
        These photos rotate at the top of the home page every 5 seconds. Best size: wide landscape, about 2000 × 750 px.
        {banners.length === 0 && ' No cover images yet — the original banner is shown.'}
      </p>
      {banners.map((src, k) => (
        <div key={src} style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--color-divider)', paddingBottom: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" style={{ width: 160, aspectRatio: '2056 / 765', objectFit: 'cover', borderRadius: 8, background: 'var(--color-neutral-300)' }} />
          <span className="muted" style={{ fontSize: 13, marginRight: 'auto' }}>
            #{k + 1}
          </span>
          <button className="btn btn-ghost btn-sm" disabled={pending || k === 0} onClick={() => move(k, -1)} aria-label="Move up">
            ↑
          </button>
          <button className="btn btn-ghost btn-sm" disabled={pending || k === banners.length - 1} onClick={() => move(k, 1)} aria-label="Move down">
            ↓
          </button>
          <button
            className="btn btn-ghost btn-sm"
            disabled={pending}
            onClick={() => confirm('Remove this cover image?') && reorder(banners.filter((b) => b !== src), 'Image removed')}
          >
            Remove
          </button>
        </div>
      ))}
      <form action={upload} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input ref={fileRef} name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple className="input" style={{ flex: 1, minWidth: 200 }} required />
        <button className="btn btn-primary" disabled={pending}>
          {pending ? 'Uploading…' : 'Add images'}
        </button>
      </form>
      {error && <div className="form-error" role="alert">{error}</div>}
    </div>
  );
}
