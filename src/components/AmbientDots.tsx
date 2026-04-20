import { useRef, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * AmbientDots — dual-mode canvas animation:
 *  • Dark theme  : prominent galaxy starfield — bright twinkling stars with glow halos
 *                  and mouse parallax depth layers.
 *  • Light theme : Matrix-style digital rain using QA tool names instead of
 *                  Japanese katakana characters, in a soft green palette.
 */

// ─── QA tool names used in Matrix rain ────────────────────────────────────────
const QA_TOOLS = [
  'UUID', 'Base64', 'JWT', 'JSON', 'OTP', 'Hash', 'Lorem',
  'REST', 'WebSocket', 'gRPC', 'QR', 'SQL', 'HTML', 'Regex',
  'Kanban', 'Playwright', 'Sequence', 'CI/CD', 'Password', 'Color',
  'Timestamp', 'Dummy Data', 'Encryption', 'XPath', 'Markdown',
  'JIRA', 'GitHub PR', 'HTPasswd', 'Kobean', 'Agent',
];

// ─── Dark theme: Star ─────────────────────────────────────────────────────────
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
  depth: number;       // 0 = far, 1 = near
  colorIdx: number;    // index into star color palette
}

// ─── Light theme: Matrix column drop ──────────────────────────────────────────
interface MatrixDrop {
  x: number;          // column x position
  y: number;          // current head y (in cells)
  speed: number;      // cells per frame (fractional)
  labelIdx: number;   // which QA tool label to show
  alpha: number;      // base opacity
  length: number;     // trail length in cells
}

const STAR_COLORS = [
  [210, 220, 255],   // blue-white
  [255, 240, 200],   // warm yellow
  [200, 240, 255],   // cyan
  [255, 200, 220],   // rose
  [220, 255, 210],   // soft green
];

export const AmbientDots: React.FC = () => {
  const cvs = useRef<HTMLCanvasElement>(null);

  // Dark mode state
  const stars = useRef<Star[]>([]);
  const rawMouse = useRef({ x: 0.5, y: 0.5 });
  const smoothMouse = useRef({ x: 0.5, y: 0.5 });

  // Light mode state
  const drops = useRef<MatrixDrop[]>([]);

  const raf = useRef(0);
  const { theme } = useTheme();

  const isDark = theme === 'dark' || (
    theme === 'auto' && typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  // ── Dark mode initialiser ──────────────────────────────────────────────────
  const initStars = useCallback((w: number, h: number) => {
    const count = Math.min(Math.floor((w * h) / 5000), 200);
    const arr: Star[] = [];
    for (let i = 0; i < count; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const depth = Math.random();
      arr.push({
        x, y, ox: x, oy: y,
        r: depth * 2.2 + 0.8,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        driftPhase: Math.random() * Math.PI * 2,
        driftSpeed: Math.random() * 0.002 + 0.0005,
        baseAlpha: depth * 0.5 + 0.25,
        depth,
        colorIdx: Math.floor(Math.random() * STAR_COLORS.length),
      });
    }
    stars.current = arr;
  }, []);

  // ── Light mode initialiser ─────────────────────────────────────────────────
  const initDrops = useCallback((w: number, h: number) => {
    const FONT_SIZE = 13;
    const cols = Math.floor(w / FONT_SIZE / 2); // space columns out
    const arr: MatrixDrop[] = [];
    for (let i = 0; i < cols; i++) {
      arr.push({
        x: i * FONT_SIZE * 2 + FONT_SIZE,
        y: (Math.random() * h) / FONT_SIZE,
        speed: Math.random() * 0.4 + 0.15,
        labelIdx: Math.floor(Math.random() * QA_TOOLS.length),
        alpha: Math.random() * 0.4 + 0.25,
        length: Math.floor(Math.random() * 8) + 4,
      });
    }
    drops.current = arr;
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
      initStars(w, h);
      initDrops(w, h);
    };

    resize();
    window.addEventListener('resize', resize);

    const MAX_PARALLAX = 24;
    const FONT_SIZE = 13;

    const frame = () => {
      const w = c.width / dpr;
      const h = c.height / dpr;
      ctx.clearRect(0, 0, w, h);

      if (isDark) {
        // ── Galaxy starfield ────────────────────────────────────────────────
        const sm = smoothMouse.current;
        const rm = rawMouse.current;
        sm.x += (rm.x - sm.x) * 0.03;
        sm.y += (rm.y - sm.y) * 0.03;
        const px = (sm.x - 0.5) * 2;
        const py = (sm.y - 0.5) * 2;

        for (const s of stars.current) {
          s.twinklePhase += s.twinkleSpeed;
          s.driftPhase += s.driftSpeed;

          const twinkle = Math.sin(s.twinklePhase) * 0.5 + 0.5;
          const alpha = s.baseAlpha * (0.35 + twinkle * 0.65);

          const drift  = Math.sin(s.driftPhase) * 0.4;
          const driftY = Math.cos(s.driftPhase * 0.7) * 0.4;
          const parallax = s.depth * MAX_PARALLAX;
          const tx = s.ox + drift - px * parallax;
          const ty = s.oy + driftY - py * parallax;
          s.x += (tx - s.x) * 0.04;
          s.y += (ty - s.y) * 0.04;

          const [cr, cg, cb] = STAR_COLORS[s.colorIdx];
          const r = s.r;

          // Outer halo
          if (r > 1) {
            const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 4.5);
            grad.addColorStop(0, `rgba(${cr},${cg},${cb},${alpha * 0.45})`);
            grad.addColorStop(0.5, `rgba(${cr},${cg},${cb},${alpha * 0.12})`);
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.beginPath();
            ctx.arc(s.x, s.y, r * 4.5, 0, 6.283);
            ctx.fillStyle = grad;
            ctx.fill();
          }

          // Inner glow ring
          if (r > 1.2) {
            const grad2 = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 2);
            grad2.addColorStop(0, `rgba(${cr},${cg},${cb},${alpha * 0.7})`);
            grad2.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
            ctx.beginPath();
            ctx.arc(s.x, s.y, r * 2, 0, 6.283);
            ctx.fillStyle = grad2;
            ctx.fill();
          }

          // Bright core
          ctx.beginPath();
          ctx.arc(s.x, s.y, r, 0, 6.283);
          ctx.fillStyle = `rgba(${cr},${cg},${cb},${Math.min(alpha * 1.3, 1)})`;
          ctx.fill();

          // Specular highlight on larger stars
          if (r > 1.8) {
            ctx.beginPath();
            ctx.arc(s.x - r * 0.25, s.y - r * 0.25, r * 0.35, 0, 6.283);
            ctx.fillStyle = `rgba(255,255,255,${alpha * 0.6})`;
            ctx.fill();
          }
        }

      } else {
        // ── Matrix digital rain ─────────────────────────────────────────────
        ctx.font = `bold ${FONT_SIZE}px 'Courier New', monospace`;
        ctx.textAlign = 'center';

        for (const d of drops.current) {
          const label = QA_TOOLS[d.labelIdx];

          // Fading trail
          for (let i = d.length; i > 0; i--) {
            const trailY = (d.y - i) * FONT_SIZE;
            if (trailY < 0) continue;
            const fade = (1 - i / d.length) * d.alpha * 0.55;
            ctx.fillStyle = `rgba(22,163,74,${fade})`;
            ctx.fillText(label, d.x, trailY);
          }

          // Head character — bright green flash
          const headY = d.y * FONT_SIZE;
          if (headY >= 0 && headY <= h + FONT_SIZE) {
            ctx.fillStyle = `rgba(134,239,172,${d.alpha})`;
            ctx.shadowColor = 'rgba(34,197,94,0.9)';
            ctx.shadowBlur = 8;
            ctx.fillText(label, d.x, headY);
            ctx.shadowBlur = 0;
          }

          // Advance drop
          d.y += d.speed;
          if (d.y * FONT_SIZE > h + d.length * FONT_SIZE) {
            // Reset to top with a new tool label
            d.y = -d.length - Math.random() * 20;
            d.labelIdx = Math.floor(Math.random() * QA_TOOLS.length);
            d.speed = Math.random() * 0.4 + 0.15;
            d.alpha = Math.random() * 0.4 + 0.25;
            d.length = Math.floor(Math.random() * 8) + 4;
          }
        }
      }

      raf.current = requestAnimationFrame(frame);
    };

    raf.current = requestAnimationFrame(frame);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf.current);
    };
  }, [initStars, initDrops, isDark]);

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
      data-testid="ambient-dots-canvas"
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
