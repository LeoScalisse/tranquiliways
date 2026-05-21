import { useEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";

interface CircularGalleryProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  cardWidth?: number;
  cardHeight?: number;
  /** Override the auto-calculated radius (px) */
  radius?: number;
  /** Degrees added per ~60fps frame at normal speed (n≥3 only) */
  autoRotateSpeed?: number;
  /** Degrees added per ~60fps frame when hovered (n≥3 only) */
  hoverRotateSpeed?: number;
  /** rotateX tilt applied to the whole scene (negative = top tilts away) */
  tiltX?: number;
  className?: string;
  style?: CSSProperties;
}

const MAX_CARD_TILT = 12;

// Scene rotation angle for a given frame counter — its meaning differs by n:
//   n≥3  → tick IS the cumulative degrees of rotation
//   n=2  → pendulum −45 − 45·sin(t) sweeps −90°↔0°, both cards always visible
//   n≤1  → gentle ±7° rock so the lone card feels alive
function computeSceneRotation(tick: number, n: number): number {
  if (n >= 3) return tick;
  if (n === 2) return -45 - 45 * Math.sin(tick * 0.004);
  return Math.sin(tick * 0.006) * 7;
}

// Per-card 3D tilt that follows pointer/touch position with lerp smoothing.
// Uses direct DOM manipulation (no state) to stay off the React render cycle.
function CardTiltWrapper({ children }: { children: ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);
  const target = useRef({ rx: 0, ry: 0 });
  const current = useRef({ rx: 0, ry: 0 });

  function step() {
    const c = current.current;
    const t = target.current;
    c.rx += (t.rx - c.rx) * 0.14;
    c.ry += (t.ry - c.ry) * 0.14;
    if (innerRef.current) {
      innerRef.current.style.transform = `perspective(600px) rotateX(${c.rx.toFixed(2)}deg) rotateY(${c.ry.toFixed(2)}deg)`;
    }
    if (Math.hypot(t.rx - c.rx, t.ry - c.ry) > 0.04) {
      animRef.current = requestAnimationFrame(step);
    } else {
      animRef.current = null;
    }
  }

  function kick() {
    if (!animRef.current) animRef.current = requestAnimationFrame(step);
  }

  function onMove(clientX: number, clientY: number) {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    target.current = {
      rx: -((clientY - rect.top - rect.height / 2) / (rect.height / 2)) * MAX_CARD_TILT,
      ry: ((clientX - rect.left - rect.width / 2) / (rect.width / 2)) * MAX_CARD_TILT,
    };
    kick();
  }

  function onLeave() {
    target.current = { rx: 0, ry: 0 };
    kick();
  }

  useEffect(() => () => { if (animRef.current) cancelAnimationFrame(animRef.current); }, []);

  return (
    <div
      ref={wrapperRef}
      style={{ width: "100%", height: "100%" }}
      onPointerMove={(e) => onMove(e.clientX, e.clientY)}
      onPointerLeave={onLeave}
    >
      <div
        ref={innerRef}
        style={{ width: "100%", height: "100%", willChange: "transform" }}
      >
        {children}
      </div>
    </div>
  );
}

export function CircularGallery<T>({
  items,
  renderItem,
  cardWidth = 300,
  cardHeight = 400,
  radius: radiusProp,
  autoRotateSpeed = 360 / 30 / 60,
  hoverRotateSpeed = 360 / 80 / 60,
  tiltX = 0,
  className,
  style,
}: CircularGalleryProps<T>) {
  const isHoveredRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  // Rotation lives in a ref — never state. The RAF loop mutates the DOM
  // directly (same pattern as CardTiltWrapper) so the heavy landscape cards
  // are NOT re-rendered by React 60×/second.
  const tickRef = useRef(0);
  const sceneRef = useRef<HTMLDivElement>(null);
  const cardRefsRef = useRef<(HTMLDivElement | null)[]>([]);
  // Keep latest config in a ref so the RAF closure never goes stale
  const configRef = useRef({ n: items.length, autoRotateSpeed, hoverRotateSpeed, tiltX });
  configRef.current = { n: items.length, autoRotateSpeed, hoverRotateSpeed, tiltX };

  // Touch swipe state for carousel navigation
  const swipeVelocityRef = useRef(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  // Flag to suppress accidental card clicks immediately after a swipe
  const justSwipedRef = useRef(false);

  const n = items.length;

  // ── Geometry ─────────────────────────────────────────────────────────────
  // n=1 : single card at center (no angle, no translateZ)
  // n=2 : two cards at 90° from each other, smaller radius
  // n≥3 : evenly distributed full circle
  const anglePerItem = n <= 1 ? 0 : n === 2 ? 90 : 360 / n;
  const radius =
    radiusProp ??
    (n <= 1
      ? 0
      : n === 2
      ? 200
      : Math.max(250, (cardWidth + 24) / (2 * Math.sin(Math.PI / n))));

  // First-paint rotation; the RAF takes over and mutates the DOM from here.
  // Computed from the live tick so a re-render (e.g. items changed) never
  // snaps the scene back to 0.
  const initialRotation = computeSceneRotation(tickRef.current, n);

  useEffect(() => {
    const animate = () => {
      const cfg = configRef.current;
      const swipe = swipeVelocityRef.current;
      swipeVelocityRef.current *= 0.88; // momentum damping
      tickRef.current +=
        cfg.n >= 3
          ? (isHoveredRef.current ? cfg.hoverRotateSpeed : cfg.autoRotateSpeed) + swipe
          : 1;

      const rotation = computeSceneRotation(tickRef.current, cfg.n);
      if (sceneRef.current) {
        sceneRef.current.style.transform = `rotateX(${cfg.tiltX}deg) rotateY(${rotation}deg)`;
      }

      const anglePer = cfg.n <= 1 ? 0 : cfg.n === 2 ? 90 : 360 / cfg.n;
      const cards = cardRefsRef.current;
      for (let i = 0; i < cards.length; i++) {
        const el = cards[i];
        if (!el) continue;
        const rel = ((((i * anglePer + rotation) % 360) + 360) % 360);
        const norm = rel > 180 ? 360 - rel : rel;
        el.style.opacity = String(Math.max(0.35, 1 - (norm / 180) * 0.65));
      }

      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []); // runs once; reads live values from configRef

  // ── Touch swipe handlers ─────────────────────────────────────────────────
  // pan-y lets the browser handle vertical page scroll while JS handles
  // horizontal swipes for carousel navigation — no preventDefault needed.
  function onTouchStart(e: React.TouchEvent) {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!touchStartRef.current || n < 3) return;
    const dx = e.touches[0].clientX - touchStartRef.current.x;
    const dy = e.touches[0].clientY - touchStartRef.current.y;
    // Only treat as horizontal swipe when clearly more horizontal than vertical
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
      justSwipedRef.current = true;
      // Cap velocity to avoid a single fast swipe sending the carousel flying
      swipeVelocityRef.current = Math.max(-10, Math.min(10, -dx * 0.3));
      // Consume the delta so the next move frame is relative
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }

  function onTouchEnd() {
    touchStartRef.current = null;
    // Allow momentum to fade, then re-enable card clicks
    setTimeout(() => {
      justSwipedRef.current = false;
    }, 300);
  }

  return (
    <div
      className={className}
      style={{ perspective: "1000px", touchAction: "pan-y", ...style }}
      onMouseEnter={() => { isHoveredRef.current = true; }}
      onMouseLeave={() => { isHoveredRef.current = false; }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        ref={sceneRef}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          transformStyle: "preserve-3d",
          transform: `rotateX(${tiltX}deg) rotateY(${initialRotation}deg)`,
          willChange: "transform",
        }}
        // Capture-phase handler: intercept clicks before they reach card content
        // so a swipe gesture never accidentally triggers navigation.
        onClickCapture={(e) => {
          if (justSwipedRef.current) {
            e.stopPropagation();
            justSwipedRef.current = false;
          }
        }}
      >
        {items.map((item, i) => {
          const itemAngle = i * anglePerItem;
          const rel = ((itemAngle + initialRotation) % 360 + 360) % 360;
          const norm = rel > 180 ? 360 - rel : rel;
          const opacity = Math.max(0.35, 1 - (norm / 180) * 0.65);

          return (
            <div
              key={i}
              ref={(el) => {
                cardRefsRef.current[i] = el;
              }}
              style={{
                position: "absolute",
                width: `${cardWidth}px`,
                height: `${cardHeight}px`,
                left: "50%",
                top: "50%",
                marginLeft: `-${cardWidth / 2}px`,
                marginTop: `-${cardHeight / 2}px`,
                transform: `rotateY(${itemAngle}deg) translateZ(${radius}px)`,
                opacity,
              }}
            >
              <CardTiltWrapper>
                {renderItem(item, i)}
              </CardTiltWrapper>
            </div>
          );
        })}
      </div>
    </div>
  );
}
