'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Finger / mouse signature box. Writes a PNG data URL into a hidden input named `name`
 * (empty until the person has drawn something), so it submits with the surrounding form.
 */
export function SignaturePad({ name, label }: { name: string; label: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [value, setValue] = useState('');

  // size the canvas to its box (sharp on high-DPI phones)
  useEffect(() => {
    const c = canvasRef.current!;
    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      const { width, height } = c.getBoundingClientRect();
      c.width = Math.round(width * ratio);
      c.height = Math.round(height * ratio);
      const ctx = c.getContext('2d')!;
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#111';
      setValue('');
    };
    resize();
    window.addEventListener('orientationchange', resize);
    return () => window.removeEventListener('orientationchange', resize);
  }, []);

  const pos = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const down = (e: React.PointerEvent) => {
    e.preventDefault();
    canvasRef.current!.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = pos(e);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const p = pos(e);
    const ctx = canvasRef.current!.getContext('2d')!;
    ctx.beginPath();
    ctx.moveTo(last.current!.x, last.current!.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };
  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    setValue(canvasRef.current!.toDataURL('image/png'));
  };
  const clear = () => {
    const c = canvasRef.current!;
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height);
    setValue('');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <b>{label}</b>
        <button type="button" onClick={clear} className="btn btn-ghost btn-sm">
          Clear
        </button>
      </div>
      <canvas
        ref={canvasRef}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        aria-label={`${label} — draw your signature here`}
        style={{
          width: '100%',
          height: 160,
          display: 'block',
          touchAction: 'none',
          background: '#fff',
          border: `2px dashed ${value ? '#2e7d32' : '#a9aeb6'}`,
          borderRadius: 10,
          cursor: 'crosshair',
        }}
      />
      <div style={{ fontSize: 12, color: value ? '#2e7d32' : '#5a5f68', marginTop: 4 }}>
        {value ? '✓ Signed — tap “Clear” to sign again' : 'Sign above with your finger (or mouse)'}
      </div>
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
