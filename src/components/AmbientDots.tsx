import { useRef, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Galaxy starfield — twinkling stars with gentle mouse parallax.
 * Adapts to light/dark mode for proper visibility.
 */

interface Star {
  x: number;
  y: number;
  ox: number;
  oy: number;
  r: number;
  twinklePhase: number;
  twinkleSpeed: number;
  driftPhase: number;
  driftSpeed: number;
  baseAlpha: number;
  depth: number;         // 0..1 — parallax layer (0 = far, 1 = near)
}

export const AmbientDots: React.FC = () => {
  const cvs = useRef<HTMLCanvasElement>(null);
  const stars = useRef<Star[]>([]);
  const rawMouse = useRef({ x: 0.5, y: 0.5 }); // normalised 0..1
  const smoothMouse = useRef({ x: 0.5, y: 0.5 });
  const raf = useRef(0);
  const { theme } = useTheme();

  const isDark = theme === 'dark' || (
    theme === 'auto' && typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  const init = useCallback((w: number, h: number) => {
    const count = Math.min(Math.floor((w * h) / 8000), 120);
    const arr: Star[] = [];
    for (let i = 0; i < count; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const depth = Math.random();
      arr.push({
        x, y, ox: x, oy: y,
        r: depth * 1.8 + 0.6,          // far stars small, near stars bigger
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.015 + 0.005,
        driftPhase: Math.random() * Math.PI * 2,
        driftSpeed: Math.random() * 0.002 + 0.0005,
        baseAlpha: depth * 0.35 + 0.15,  // near stars brighter
        depth,
      });
    }
    stars.current = arr;
  }, []);

  useEffect(() => {
    const c = cvs.current;
    if (!c) return;
    const ctx = c.getContext('2d', { alpha: true });
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const p = c.parentElement;
      if (!p) return;
      const w = p.clientWidth;
      const h = p.clientHeight;
      c.width = w * dpr;
      c.height = h * dpr;
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      init(w, h);
    };

    resize();
    window.addEventListener('resize', resize);

    const MAX_PARALLAX = 18;

    const frame = () => {
      const w = c.width / dpr;
      const h = c.height / dpr;
      ctx.clearRect(0, 0, w, h);

      // Smooth mouse for parallax
      const sm = smoothMouse.current;
      const rm = rawMouse.current;
      sm.x += (rm.x - sm.x) * 0.03;
      sm.y += (rm.y - sm.y) * 0.03;

      // Parallax offset from center (0.5, 0.5)
      const px = (sm.x - 0.5) * 2; // -1..1
      const py = (sm.y - 0.5) * 2;

      for (const s of stars.current) {
        s.twinklePhase += s.twinkleSpeed;
        s.driftPhase += s.driftSpeed;

        // Twinkle: smooth sine oscillation
        const twinkle = Math.sin(s.twinklePhase) * 0.5 + 0.5; // 0..1
        const alpha = s.baseAlpha * (0.4 + twinkle * 0.6);

        // Gentle drift
        const drift = Math.sin(s.driftPhase) * 0.3;
        const driftY = Math.cos(s.driftPhase * 0.7) * 0.3;

        // Parallax: deeper stars move less
        const parallax = s.depth * MAX_PARALLAX;
        const tx = s.ox + drift - px * parallax;
        const ty = s.oy + driftY - py * parallax;

        // Lerp
        s.x += (tx - s.x) * 0.04;
        s.y += (ty - s.y) * 0.04;

        // Draw star with soft glow
        const r = s.r;

        // Glow layer (larger, faint)
        if (r > 1 && alpha > 0.15) {
          const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 3);
          if (isDark) {
            grad.addColorStop(0, `rgba(180,200,255,${alpha * 0.25})`);
          } else {
            grad.addColorStop(0, `rgba(37,99,235,${alpha * 0.35})`);
          }
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.beginPath();
          ctx.arc(s.x, s.y, r * 3, 0, 6.283);
          ctx.fillStyle = grad;
          ctx.fill();
        }

        // Core
        ctx.beginPath();
        ctx.arc(s.x, s.y, r, 0, 6.283);
        if (isDark) {
          ctx.fillStyle = `rgba(210,220,255,${alpha})`;
        } else {
          ctx.fillStyle = `rgba(37,99,235,${alpha * 1.2})`;
        }
        ctx.fill();
      }

      raf.current = requestAnimationFrame(frame);
    };

    raf.current = requestAnimationFrame(frame);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf.current);
    };
  }, [init, isDark]);

  const onMove = useCallback((e: React.MouseEvent) => {
    const r = cvs.current?.getBoundingClientRect();
    if (!r) return;
    rawMouse.current = {
      x: (e.clientX - r.left) / r.width,
      y: (e.clientY - r.top) / r.height,
    };
  }, []);

  const onLeave = useCallback(() => {
    rawMouse.current = { x: 0.5, y: 0.5 };
  }, []);

  return (
    <canvas
      ref={cvs}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'auto',
      }}
    />
  );
};

export default AmbientDots;
