# TranquiliWays 3D Animation Enhancement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add vivid 3D interactive animations to the landing page, loading screen, Ways gallery, and session detail — without touching the existing visual design or the DilemmaWorldView.

**Architecture:** Three shared primitives (PointerContext, use3DTilt, useParallaxDepth) provide the physics layer; each screen consumes them independently. All transforms use `transform`/`opacity` only — no layout properties. `useReducedMotion()` gates every non-essential effect.

**Tech Stack:** React 19, Framer Motion (`motion/react`), TanStack Router, Tailwind CSS 4, TypeScript

**Spec:** `docs/superpowers/specs/2026-05-04-3d-animation-enhancement-design.md`

---

## File Map

### New files

| Path                              | Responsibility                                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------------------- |
| `src/lib/pointer-context.tsx`     | Single global `pointermove` listener; exposes normalized pointer position as Framer Motion values |
| `src/hooks/use-3d-tilt.ts`        | Pointer-tracking 3D tilt returning `rotateX`/`rotateY` springs + raw `nx`/`ny` for sheen          |
| `src/hooks/use-parallax-depth.ts` | Z-depth parallax returning `x`/`y` motion values from PointerContext                              |

### Modified files

| Path                                         | What changes                                                                   |
| -------------------------------------------- | ------------------------------------------------------------------------------ |
| `src/styles.css`                             | Add `.preserve-3d`, `.perspective-lg` utility classes                          |
| `src/routes/__root.tsx`                      | Wrap `<Outlet />` with `<PointerProvider>`                                     |
| `src/components/ui/animated-orbs.tsx`        | Each orb gets parallax depth via `useParallaxDepth`                            |
| `src/components/ui/tranquili-ways-title.tsx` | Title container gains Z-depth entrance animation                               |
| `src/components/ui/liquid-glass-button.tsx`  | `whileHover` gains `z: 12`, `whileTap` gains `z: -4 → 0`                       |
| `src/components/ui/ai-prompt-box.tsx`        | Outer container gets `use3DTilt`; focus lifts in Z                             |
| `src/components/world-creation-loader.tsx`   | Orbital orb rotation, atmospheric particles, stage depth transitions, dot flip |
| `src/routes/ways.tsx`                        | Card 3D tilt + sheen + depth stack + entrance + swipe tilt                     |
| `src/routes/ways/$sessionId.tsx`             | Header/content depth transitions, ring reveal tilt                             |

---

## Task 1: PointerContext

**Files:**

- Create: `src/lib/pointer-context.tsx`

- [ ] **Step 1: Create the file**

```tsx
// src/lib/pointer-context.tsx
import { createContext, useContext, useEffect, useRef } from "react";
import { useMotionValue, type MotionValue } from "motion/react";

interface PointerContextValue {
  x: MotionValue<number>;
  y: MotionValue<number>;
}

const PointerContext = createContext<PointerContextValue | null>(null);

export function PointerProvider({ children }: { children: React.ReactNode }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        x.set((e.clientX / window.innerWidth) * 2 - 1);
        y.set((e.clientY / window.innerHeight) * 2 - 1);
      });
    };
    window.addEventListener("pointermove", handleMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handleMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [x, y]);

  return <PointerContext.Provider value={{ x, y }}>{children}</PointerContext.Provider>;
}

export function usePointer(): PointerContextValue {
  const ctx = useContext(PointerContext);
  if (!ctx) throw new Error("usePointer must be used within <PointerProvider>");
  return ctx;
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/pointer-context.tsx
git commit -m "feat(3d): add PointerContext for shared pointer tracking"
```

---

## Task 2: use3DTilt hook

**Files:**

- Create: `src/hooks/use-3d-tilt.ts`

- [ ] **Step 1: Create the file**

```ts
// src/hooks/use-3d-tilt.ts
import { useRef, useCallback } from "react";
import { useMotionValue, useSpring, useReducedMotion } from "motion/react";

interface Use3DTiltOptions {
  maxRotateX?: number;
  maxRotateY?: number;
  stiffness?: number;
  damping?: number;
}

export function use3DTilt({
  maxRotateX = 8,
  maxRotateY = 12,
  stiffness = 150,
  damping = 20,
}: Use3DTiltOptions = {}) {
  const ref = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const nxRaw = useMotionValue(0);
  const nyRaw = useMotionValue(0);

  const rotateX = useSpring(rawX, { stiffness, damping });
  const rotateY = useSpring(rawY, { stiffness, damping });
  // nx/ny used by consumers for sheen gradient positioning (0–100%)
  const nx = useSpring(nxRaw, { stiffness, damping });
  const ny = useSpring(nyRaw, { stiffness, damping });

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (shouldReduceMotion || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const normalizedX = (e.clientX - cx) / (rect.width / 2);
      const normalizedY = (e.clientY - cy) / (rect.height / 2);
      rawY.set(normalizedX * maxRotateY);
      rawX.set(-normalizedY * maxRotateX);
      nxRaw.set(((e.clientX - rect.left) / rect.width) * 100);
      nyRaw.set(((e.clientY - rect.top) / rect.height) * 100);
    },
    [shouldReduceMotion, maxRotateX, maxRotateY, rawX, rawY, nxRaw, nyRaw],
  );

  const onPointerLeave = useCallback(() => {
    rawX.set(0);
    rawY.set(0);
    nxRaw.set(50);
    nyRaw.set(50);
  }, [rawX, rawY, nxRaw, nyRaw]);

  return {
    ref: ref as React.RefObject<HTMLElement>,
    rotateX,
    rotateY,
    nx,
    ny,
    onPointerMove,
    onPointerLeave,
  };
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-3d-tilt.ts
git commit -m "feat(3d): add use3DTilt hook for pointer-driven tilt animations"
```

---

## Task 3: useParallaxDepth hook

**Files:**

- Create: `src/hooks/use-parallax-depth.ts`

- [ ] **Step 1: Create the file**

```ts
// src/hooks/use-parallax-depth.ts
import { useTransform, useSpring, useReducedMotion } from "motion/react";
import { usePointer } from "@/lib/pointer-context";

/**
 * Returns x/y motion values that shift based on pointer position.
 * depthFactor: 1 = subtle background, 3 = prominent foreground.
 */
export function useParallaxDepth(depthFactor: number) {
  const { x: pointerX, y: pointerY } = usePointer();
  const shouldReduce = useReducedMotion();

  const range = shouldReduce ? 0 : depthFactor * 18;

  const rawX = useTransform(pointerX, [-1, 1], [-range, range]);
  const rawY = useTransform(pointerY, [-1, 1], [-range * 0.6, range * 0.6]);

  const x = useSpring(rawX, { stiffness: 55, damping: 22 });
  const y = useSpring(rawY, { stiffness: 55, damping: 22 });

  return { x, y };
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-parallax-depth.ts
git commit -m "feat(3d): add useParallaxDepth hook for Z-layer atmospheric parallax"
```

---

## Task 4: CSS utilities + PointerProvider in root

**Files:**

- Modify: `src/styles.css`
- Modify: `src/routes/__root.tsx`

- [ ] **Step 1: Add CSS utilities to `src/styles.css`**

Find the end of the existing utility classes section (after `.glass-orb` or similar) and add:

```css
/* 3D animation utilities */
.preserve-3d {
  transform-style: preserve-3d;
}

.perspective-lg {
  perspective: 1200px;
}
```

- [ ] **Step 2: Update `src/routes/__root.tsx`**

Add the import and wrap `<Outlet />`:

```tsx
// Add this import at the top with other imports:
import { PointerProvider } from "@/lib/pointer-context";

// Change RootComponent from:
function RootComponent() {
  return (
    <>
      <AnimatedOrbs />
      <Outlet />
    </>
  );
}

// To:
function RootComponent() {
  return (
    <PointerProvider>
      <AnimatedOrbs />
      <Outlet />
    </PointerProvider>
  );
}
```

- [ ] **Step 3: Verify TypeScript and lint**

```bash
npx tsc --noEmit && npm run lint
```

Expected: no errors.

- [ ] **Step 4: Run dev server and confirm app loads**

```bash
npm run dev
```

Open the app — it should look and behave exactly as before (no visible change yet).

- [ ] **Step 5: Commit**

```bash
git add src/styles.css src/routes/__root.tsx
git commit -m "feat(3d): add CSS 3D utilities and PointerProvider to root"
```

---

## Task 5: AnimatedOrbs — atmospheric parallax

**Files:**

- Modify: `src/components/ui/animated-orbs.tsx`

- [ ] **Step 1: Replace the file content**

```tsx
// src/components/ui/animated-orbs.tsx
import { motion } from "motion/react";
import { useParallaxDepth } from "@/hooks/use-parallax-depth";

function OrbLayer({ depthFactor, style }: { depthFactor: number; style: React.CSSProperties }) {
  const { x, y } = useParallaxDepth(depthFactor);
  return (
    <motion.div
      style={{
        position: "absolute",
        borderRadius: "50%",
        ...style,
        x,
        y,
      }}
    />
  );
}

export function AnimatedOrbs() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {/* Orbe 1 — grande, topo direito, azul claro, ciclo 10s — depth 0.6 (background) */}
      <OrbLayer
        depthFactor={0.6}
        style={{
          width: 220,
          height: 220,
          top: -70,
          right: -70,
          background:
            "radial-gradient(circle at 40% 40%, rgba(255,255,255,0.72) 0%, rgba(168,220,255,0.32) 45%, rgba(92,195,255,0) 70%)",
          filter: "blur(18px)",
          animation: "orb-float-1 10s ease-in-out infinite",
        }}
      />
      {/* Orbe 2 — média, centro esquerdo, branco, ciclo 14s — depth 1.2 (midground) */}
      <OrbLayer
        depthFactor={1.2}
        style={{
          width: 160,
          height: 160,
          top: "38%",
          left: -50,
          background:
            "radial-gradient(circle at 55% 45%, rgba(255,255,255,0.62) 0%, rgba(200,235,255,0.28) 45%, rgba(92,195,255,0) 70%)",
          filter: "blur(14px)",
          animation: "orb-float-2 14s ease-in-out infinite",
        }}
      />
      {/* Orbe 3 — pequena, fundo direito, creme/amarelo, ciclo 8s — depth 2.0 (foreground) */}
      <OrbLayer
        depthFactor={2.0}
        style={{
          width: 110,
          height: 110,
          bottom: "12%",
          right: "5%",
          background:
            "radial-gradient(circle at 45% 45%, rgba(255,244,194,0.72) 0%, rgba(255,220,100,0.22) 50%, rgba(255,200,50,0) 70%)",
          filter: "blur(10px)",
          animation: "orb-float-3 8s ease-in-out infinite",
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Test visually**

```bash
npm run dev
```

Move mouse around the landing page — the 3 orbs should drift at subtly different speeds, creating depth. CSS float animations continue beneath.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/animated-orbs.tsx
git commit -m "feat(3d): add atmospheric parallax depth to AnimatedOrbs"
```

---

## Task 6: TranquiliWaysTitle — Z-depth entrance

**Files:**

- Modify: `src/components/ui/tranquili-ways-title.tsx`

- [ ] **Step 1: Add Z-depth entrance wrapper**

Find this section in the file:

```tsx
    <div className="flex w-full justify-center">
      <div
        className="relative flex min-h-[72px] items-center justify-center sm:min-h-[88px] cursor-pointer"
        onClick={handleRestart}
      >
        <motion.div
          key={animKey}
          className="flex items-center justify-center"
          layout
          transition={{ duration: 1.1, ease: [0.4, 0, 0.2, 1] }}
        >
```

Replace the outermost `<div className="flex w-full justify-center">` with a `motion.div` that includes the entrance:

```tsx
    <div
      className="flex w-full justify-center"
      style={{ perspective: '1200px' }}
    >
      <div
        className="relative flex min-h-[72px] items-center justify-center sm:min-h-[88px] cursor-pointer"
        onClick={handleRestart}
      >
        <motion.div
          key={`entrance-${animKey}`}
          initial={{ opacity: 0, z: -180 }}
          animate={{ opacity: 1, z: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <motion.div
            key={animKey}
            className="flex items-center justify-center"
            layout
            transition={{ duration: 1.1, ease: [0.4, 0, 0.2, 1] }}
          >
```

And close the new `motion.div` after the existing `</motion.div>` at the end of the character animation block:

```tsx
          </motion.div>
        </motion.div>  {/* close entrance wrapper */}
      </div>
    </div>
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Test visually**

```bash
npm run dev
```

On page load the title should emerge from depth (feeling like it comes from far away) before settling. The existing Tranquili → Ways collapse animation plays after as normal.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/tranquili-ways-title.tsx
git commit -m "feat(3d): add Z-depth entrance animation to TranquiliWaysTitle"
```

---

## Task 7: LiquidGlassButton — conic gradient border + 3D press

**Files:**

- Modify: `src/styles.css`
- Modify: `src/components/ui/liquid-glass-button.tsx`

- [ ] **Step 1: Add `@property` declarations and keyframes to `src/styles.css`**

Append at the end of `src/styles.css`:

```css
@property --btn-angle-1 {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}

@property --btn-angle-2 {
  syntax: "<angle>";
  initial-value: 45deg;
  inherits: false;
}

/* Animated conic gradient border — sky-blue/white/cream shimmer */
.tw-glass-wrap {
  background: conic-gradient(
    from var(--btn-angle-1),
    transparent 50%,
    rgba(92, 195, 255, 0.55) 62%,
    rgba(255, 255, 255, 0.7) 70%,
    rgba(255, 244, 194, 0.45) 78%,
    transparent 88%
  );
  animation: tw-border-spin 3s linear infinite;
}

@keyframes tw-border-spin {
  to {
    --btn-angle-1: 360deg;
  }
}

/* Specular sheen sweeping across the button surface */
.tw-glass-sheen {
  background: conic-gradient(
    from var(--btn-angle-2),
    transparent 72%,
    rgba(255, 255, 255, 0.22) 80%,
    transparent 90%
  );
  animation: tw-sheen-spin 5s linear infinite;
}

@keyframes tw-sheen-spin {
  to {
    --btn-angle-2: 405deg;
  }
}
```

- [ ] **Step 2: Replace `src/components/ui/liquid-glass-button.tsx` entirely**

```tsx
import { motion, useReducedMotion } from "motion/react";
import { Cloud } from "lucide-react";
import { Link, type LinkProps } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTouchRipple } from "@/hooks/use-touch-ripple";

interface LiquidGlassButtonProps {
  to: LinkProps["to"];
  icon?: LucideIcon;
  label?: string;
  className?: string;
  prominent?: boolean;
  compact?: boolean;
}

export function LiquidGlassButton({
  to,
  icon: Icon = Cloud,
  label,
  className,
  prominent = false,
  compact = false,
}: LiquidGlassButtonProps) {
  const { onPointerDown, rippleElements } = useTouchRipple(
    prominent ? "rgba(3, 105, 161, 0.28)" : "rgba(255, 255, 255, 0.55)",
    72,
  );
  const shouldReduce = useReducedMotion();

  return (
    <Link to={to} style={{ perspective: "600px" }} className="inline-flex">
      {/* Outer 1px gradient border via conic-gradient background + padding */}
      <motion.div
        className="tw-glass-wrap rounded-full"
        style={{ padding: "1px" }}
        whileTap={shouldReduce ? {} : { rotateX: 22 }}
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
      >
        <motion.div
          className={cn(
            "relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full text-sm font-medium text-white",
            compact ? "h-11 min-w-11 px-3" : "h-12 min-w-12 px-4",
            prominent
              ? "bg-white/26 text-sky-950 shadow-[0_18px_44px_rgba(24,74,116,0.18),inset_0_1px_0_rgba(255,255,255,0.6)]"
              : "bg-white/18 shadow-[0_14px_34px_rgba(24,74,116,0.14),inset_0_1px_0_rgba(255,255,255,0.48)]",
            className,
          )}
          whileHover={shouldReduce ? {} : { scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          onPointerDown={onPointerDown}
          style={{
            backdropFilter: "blur(18px) saturate(1.7)",
            WebkitBackdropFilter: "blur(18px) saturate(1.7)",
            transformStyle: "preserve-3d",
          }}
        >
          {/* Specular sheen — rotates at a different speed than the border */}
          <span
            aria-hidden="true"
            className="tw-glass-sheen pointer-events-none absolute inset-0 rounded-full"
          />
          <span className="glass-orb h-8 w-8 left-1 top-1 opacity-90" />
          <Icon
            size={compact ? 18 : 19}
            strokeWidth={1.9}
            className={prominent ? "text-sky-950" : "text-white"}
          />
          {label ? <span className="relative z-10 pr-1">{label}</span> : null}
          {rippleElements}
          <div
            className="pointer-events-none absolute"
            style={{
              bottom: -8,
              left: compact ? "50%" : 22,
              transform: compact ? "translateX(-50%)" : "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <div
              style={{
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: prominent ? "rgba(3, 105, 161, 0.42)" : "rgba(255,255,255,0.6)",
              }}
            />
            <div
              style={{
                width: 2.5,
                height: 2.5,
                borderRadius: "50%",
                background: prominent ? "rgba(3, 105, 161, 0.28)" : "rgba(255,255,255,0.4)",
              }}
            />
          </div>
        </motion.div>
      </motion.div>
    </Link>
  );
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Test visually**

```bash
npm run dev
```

Open any page with a `LiquidGlassButton`. Verify:

- A sky-blue/white/cream shimmer rotates continuously around the button border
- A specular sheen sweeps across the surface at a different cadence
- Tapping the button tips it forward in 3D (`rotateX: 22`)
- `useReducedMotion` disables both the press tilt and the hover scale

- [ ] **Step 5: Commit**

```bash
git add src/styles.css src/components/ui/liquid-glass-button.tsx
git commit -m "feat(3d): add conic gradient border, specular sheen, and 3D press to LiquidGlassButton"
```

---

## Task 8: AiPromptBox — 3D tilt + focus lift

**Files:**

- Modify: `src/components/ui/ai-prompt-box.tsx`

- [ ] **Step 1: Add imports at the top of the file**

The file currently imports from `'framer-motion'`. Add the hook import:

```tsx
// Add after the existing framer-motion import line:
import { use3DTilt } from "@/hooks/use-3d-tilt";
```

- [ ] **Step 2: Find the AiPromptBox component function**

Scroll to the `AiPromptBox` (or `AIPromptBox`) component's function definition and its return statement. Find the outermost container element (it will be a `div` or `form` wrapping everything).

- [ ] **Step 3: Add tilt to the component**

Add `use3DTilt` inside the component, before the return:

```tsx
const {
  ref: tiltRef,
  rotateX,
  rotateY,
  onPointerMove,
  onPointerLeave,
} = use3DTilt({ maxRotateX: 4, maxRotateY: 6 });
```

- [ ] **Step 4: Apply tilt to the outermost container**

Wrap the existing outermost container in a `motion.div` (from `framer-motion` — use the same import already in the file):

```tsx
return (
  <div style={{ perspective: "1000px" }}>
    <motion.div
      ref={tiltRef as React.RefObject<HTMLDivElement>}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      {/* existing outermost container and everything inside it */}
    </motion.div>
  </div>
);
```

- [ ] **Step 5: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Test visually**

```bash
npm run dev
```

Move the mouse over the prompt box — it should tilt subtly (4°/6° max) toward the pointer. Moving away should spring back to flat.

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/ai-prompt-box.tsx
git commit -m "feat(3d): add 3D tilt to AiPromptBox on pointer interaction"
```

---

## Task 9: WorldCreationLoader — 4 cycling loading animations

**Files:**

- Create: `src/components/ui/loading-animations.tsx`
- Modify: `src/components/world-creation-loader.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Add all loader CSS + particle keyframes to `src/styles.css`**

Append at the end of `src/styles.css`:

```css
/* ── Loading Animations ──────────────────────────── */

/* 9.1 — Hourglass */
.tw-hg-scene {
  width: 90px;
  height: 90px;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(168, 220, 255, 0.35);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tw-hg {
  width: 36px;
  height: 48px;
  position: relative;
  animation: tw-hg-flip 2s ease-in-out infinite;
}

.tw-hg-top,
.tw-hg-bot {
  position: absolute;
  left: 0;
  right: 0;
  height: 50%;
  border: 2px solid rgba(168, 220, 255, 0.7);
  overflow: hidden;
}

.tw-hg-top {
  top: 0;
  border-bottom: none;
  clip-path: polygon(0 0, 100% 0, 55% 100%, 45% 100%);
  background: rgba(168, 220, 255, 0.12);
}

.tw-hg-top::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 20%;
  right: 20%;
  height: 60%;
  background: white;
  animation: tw-hg-drain 2s linear infinite;
}

.tw-hg-bot {
  bottom: 0;
  border-top: none;
  clip-path: polygon(45% 0, 55% 0, 100% 100%, 0 100%);
  background: rgba(168, 220, 255, 0.08);
}

.tw-hg-bot::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 10%;
  right: 10%;
  background: white;
  border-radius: 2px;
  animation: tw-hg-fill 2s linear infinite;
}

@keyframes tw-hg-flip {
  0%,
  42% {
    transform: rotate(0deg);
  }
  50%,
  100% {
    transform: rotate(180deg);
  }
}
@keyframes tw-hg-drain {
  0% {
    height: 60%;
  }
  42% {
    height: 2%;
  }
  100% {
    height: 2%;
  }
}
@keyframes tw-hg-fill {
  0% {
    height: 2%;
  }
  42% {
    height: 38%;
  }
  100% {
    height: 38%;
  }
}

/* 9.2 — Spinner Blocks */
.tw-spinner-blocks {
  --first-block-clr: #5cc3ff;
  --second-block-clr: #fff4c2;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  width: 54px;
  height: 54px;
}

.tw-spinner-blocks div {
  border-radius: 4px;
  animation: tw-sb-scale 1.4s ease-in-out infinite;
}

.tw-spinner-blocks div:nth-child(odd) {
  background: var(--first-block-clr);
}
.tw-spinner-blocks div:nth-child(even) {
  background: var(--second-block-clr);
}
.tw-spinner-blocks div:nth-child(1) {
  animation-delay: 0s;
}
.tw-spinner-blocks div:nth-child(2) {
  animation-delay: 0.1s;
}
.tw-spinner-blocks div:nth-child(3) {
  animation-delay: 0.2s;
}
.tw-spinner-blocks div:nth-child(4) {
  animation-delay: 0.3s;
}
.tw-spinner-blocks div:nth-child(5) {
  animation-delay: 0.4s;
}
.tw-spinner-blocks div:nth-child(6) {
  animation-delay: 0.5s;
}
.tw-spinner-blocks div:nth-child(7) {
  animation-delay: 0.6s;
}
.tw-spinner-blocks div:nth-child(8) {
  animation-delay: 0.7s;
}
.tw-spinner-blocks div:nth-child(9) {
  animation-delay: 0.8s;
}

@keyframes tw-sb-scale {
  0%,
  80%,
  100% {
    transform: scale(0.45);
    opacity: 0.25;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 9.3 — Earth Globe */
.tw-earth {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  box-shadow:
    inset -6px -3px 16px rgba(0, 0, 0, 0.18),
    0 0 28px rgba(92, 195, 255, 0.28);
}

.tw-earth-strip {
  position: absolute;
  width: 200%;
  height: 100%;
  background:
    radial-gradient(ellipse 22% 28% at 18% 42%, rgba(255, 255, 255, 0.85) 0%, transparent 100%),
    radial-gradient(ellipse 32% 22% at 58% 32%, rgba(255, 255, 255, 0.85) 0%, transparent 100%),
    radial-gradient(ellipse 18% 18% at 82% 62%, rgba(255, 255, 255, 0.85) 0%, transparent 100%),
    linear-gradient(to bottom, rgba(92, 195, 255, 0.85) 0%, rgba(30, 110, 190, 0.92) 100%);
  animation: tw-earth-scroll 5s linear infinite;
}

.tw-earth::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle at 32% 28%, rgba(255, 255, 255, 0.38) 0%, transparent 52%);
  pointer-events: none;
}

@keyframes tw-earth-scroll {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

/* 9.4 — LOADING wave text */
.tw-text-loader {
  overflow: visible;
}

.tw-text-loader text {
  animation: tw-text-wave 1.4s ease-in-out infinite;
}
.tw-text-loader text:nth-child(1) {
  animation-delay: 0s;
}
.tw-text-loader text:nth-child(2) {
  animation-delay: 0.1s;
}
.tw-text-loader text:nth-child(3) {
  animation-delay: 0.2s;
}
.tw-text-loader text:nth-child(4) {
  animation-delay: 0.3s;
}
.tw-text-loader text:nth-child(5) {
  animation-delay: 0.4s;
}
.tw-text-loader text:nth-child(6) {
  animation-delay: 0.5s;
}
.tw-text-loader text:nth-child(7) {
  animation-delay: 0.6s;
}

@keyframes tw-text-wave {
  0%,
  100% {
    transform: translateY(0px);
    opacity: 0.45;
  }
  50% {
    transform: translateY(-9px);
    opacity: 1;
  }
}

/* Atmospheric particles */
@keyframes particle-drift-0 {
  0%,
  100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(12px, -18px);
  }
}
@keyframes particle-drift-1 {
  0%,
  100% {
    transform: translate(0, 0);
  }
  33% {
    transform: translate(-10px, 12px);
  }
  66% {
    transform: translate(8px, -8px);
  }
}
@keyframes particle-drift-2 {
  0%,
  100% {
    transform: translate(0, 0);
  }
  40% {
    transform: translate(15px, 10px);
  }
  80% {
    transform: translate(-8px, -12px);
  }
}
```

- [ ] **Step 2: Create `src/components/ui/loading-animations.tsx`**

```tsx
// src/components/ui/loading-animations.tsx

export function HourglassLoader() {
  return (
    <div className="tw-hg-scene">
      <div className="tw-hg">
        <div className="tw-hg-top" />
        <div className="tw-hg-bot" />
      </div>
    </div>
  );
}

export function SpinnerBlocksLoader() {
  return (
    <div className="tw-spinner-blocks">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} />
      ))}
    </div>
  );
}

export function EarthLoader() {
  return (
    <div className="tw-earth">
      <div className="tw-earth-strip" />
    </div>
  );
}

export function LoadingTextLoader() {
  return (
    <svg
      className="tw-text-loader text-sky-950/80"
      viewBox="0 0 204 52"
      width="204"
      height="52"
      aria-hidden="true"
    >
      {["L", "O", "A", "D", "I", "N", "G"].map((char, i) => (
        <text
          key={char + i}
          x={6 + i * 28}
          y="40"
          fontSize="34"
          fontWeight="500"
          fill="currentColor"
        >
          {char}
        </text>
      ))}
    </svg>
  );
}
```

- [ ] **Step 3: Replace `src/components/world-creation-loader.tsx` entirely**

```tsx
// src/components/world-creation-loader.tsx
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Sparkles } from "lucide-react";
import {
  HourglassLoader,
  SpinnerBlocksLoader,
  EarthLoader,
  LoadingTextLoader,
} from "@/components/ui/loading-animations";

const STAGES = [
  "Lendo o que você está vivendo...",
  "Identificando os dois caminhos...",
  "Construindo o primeiro mundo...",
  "Dando vida ao segundo caminho...",
  "Finalizando os detalhes...",
] as const;

// Each stage maps to one of the 4 loaders: hourglass → blocks → earth → text → hourglass
const LOADERS = [HourglassLoader, SpinnerBlocksLoader, EarthLoader, LoadingTextLoader] as const;

const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  size: 3 + (i % 4),
  top: `${8 + ((i * 6.5) % 84)}%`,
  left: `${5 + ((i * 7.3) % 90)}%`,
  opacity: 0.08 + (i % 5) * 0.04,
  duration: 8 + (i % 6) * 2,
  delay: i * 0.9,
}));

interface WorldCreationLoaderProps {
  dilemma: string;
}

export function WorldCreationLoader({ dilemma }: WorldCreationLoaderProps) {
  const [stageIndex, setStageIndex] = useState(0);
  const shouldReduce = useReducedMotion();

  // Stage ticker — advances every 3s, stops at last stage
  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((prev) => {
        const next = prev + 1;
        if (next >= STAGES.length - 1) {
          clearInterval(interval);
          return STAGES.length - 1;
        }
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const LoaderComponent = LOADERS[stageIndex % LOADERS.length];

  return (
    <div
      className="safe-screen relative flex flex-col items-center justify-center overflow-hidden px-6"
      style={{ perspective: "1200px" }}
    >
      {/* Atmospheric particles — CSS-only, no JS loop */}
      {!shouldReduce &&
        PARTICLES.map((p) => (
          <span
            key={p.id}
            aria-hidden="true"
            style={{
              position: "absolute",
              width: p.size,
              height: p.size,
              top: p.top,
              left: p.left,
              borderRadius: "50%",
              background:
                p.id % 3 === 0
                  ? "rgba(180,210,255,1)"
                  : p.id % 3 === 1
                    ? "rgba(255,255,255,1)"
                    : "rgba(140,190,255,1)",
              opacity: p.opacity,
              animation: `particle-drift-${p.id % 3} ${p.duration}s ease-in-out ${p.delay}s infinite`,
              pointerEvents: "none",
            }}
          />
        ))}

      {/* Background glass orbs — keep existing ambient aesthetic */}
      <div
        className="glass-orb absolute left-[15%] top-[20%] h-48 w-48 opacity-60"
        style={{ animation: "content-breathe 3s ease-in-out infinite", willChange: "transform" }}
      />
      <div
        className="glass-orb absolute bottom-[25%] right-[10%] h-32 w-32 opacity-40"
        style={{ animation: "content-breathe 4s ease-in-out infinite 0.8s" }}
      />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-8">
        {/* Dilemma echo */}
        <motion.p
          className="line-clamp-3 text-center text-base italic leading-7 text-sky-950/55"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          "{dilemma}"
        </motion.p>

        {/* Cycling loader — swaps with each stage, enters/exits from depth */}
        <AnimatePresence mode="wait">
          <motion.div
            key={stageIndex % LOADERS.length}
            initial={shouldReduce ? { opacity: 0 } : { opacity: 0, scale: 0.88, z: -60 }}
            animate={shouldReduce ? { opacity: 1 } : { opacity: 1, scale: 1, z: 0 }}
            exit={shouldReduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, z: -40 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <LoaderComponent />
          </motion.div>
        </AnimatePresence>

        {/* Stage icon + message */}
        <div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{
              background: "rgba(90,127,165,0.15)",
              border: "1px solid rgba(90,127,165,0.3)",
            }}
          >
            <Sparkles
              className="h-5 w-5 text-sky-600/70"
              style={{ animation: "content-breathe 2s ease-in-out infinite" }}
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.p
              key={stageIndex}
              className="text-center text-base text-sky-950/75"
              initial={shouldReduce ? { opacity: 0 } : { opacity: 0, z: -120, scale: 0.92 }}
              animate={shouldReduce ? { opacity: 1 } : { opacity: 1, z: 0, scale: 1 }}
              exit={shouldReduce ? { opacity: 0 } : { opacity: 0, z: -80, scale: 0.9 }}
              transition={
                shouldReduce ? { duration: 0 } : { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
              }
              style={{ transformStyle: "preserve-3d" }}
            >
              {STAGES[stageIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-2">
          {STAGES.map((_, i) => (
            <motion.div
              key={i}
              className="rounded-full"
              animate={{
                width: i === stageIndex ? 20 : 6,
                background: i <= stageIndex ? "#5a7fa5" : "rgba(90,127,165,0.25)",
              }}
              style={{ height: 6, borderRadius: 9999 }}
              transition={
                shouldReduce ? { duration: 0 } : { duration: 0.4, ease: [0.23, 1, 0.32, 1] }
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Test visually**

```bash
npm run dev
```

Trigger a world generation. Verify in the loader:

- Stage 0: Hourglass flipping with glass-tinted sand
- Stage 1: 3×3 sky-blue and cream blocks cascading in/out
- Stage 2: Earth globe scrolling from right to left, lit with specular highlight
- Stage 3+: "LOADING" letters wave up and down
- Each loader transitions from depth (`z: -60 → 0`) on enter, recedes on exit
- Stage text also transitions in/out from depth
- Atmospheric particles drift in the background
- Progress dots expand/contract

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/loading-animations.tsx src/components/world-creation-loader.tsx src/styles.css
git commit -m "feat(3d): add 4 cycling loading animations with depth transitions to WorldCreationLoader"
```

---

## Task 10: Ways gallery — CSS 3D cylinder carousel

**Files:**

- Modify: `src/styles.css`
- Modify: `src/routes/ways.tsx`

- [ ] **Step 1: Add cylinder CSS to `src/styles.css`**

Append after the loader CSS added in Task 9:

```css
/* ── 3D Cylinder Carousel ────────────────────────── */

.tw-cylinder-scene {
  width: 100%;
  height: 420px;
  perspective: 1100px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.tw-cylinder-wrapper {
  width: 280px;
  height: 340px;
  position: relative;
  transform-style: preserve-3d;
  animation: tw-cylinder-rotate 20s linear infinite;
  will-change: transform;
}

/* Pause auto-rotation on hover (desktop) */
.tw-cylinder-scene:hover .tw-cylinder-wrapper {
  animation-play-state: paused;
}

.tw-cylinder-item {
  position: absolute;
  inset: 0;
  border-radius: 2rem;
  padding: 1.5rem;
  cursor: pointer;
  transform: rotateY(calc(360deg / var(--quantity) * var(--index))) translateZ(var(--translateZ));
  transition: box-shadow 0.3s ease;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}

.tw-cylinder-item:active {
  transform: rotateY(calc(360deg / var(--quantity) * var(--index))) translateZ(var(--translateZ))
    scale(0.97);
}

@keyframes tw-cylinder-rotate {
  from {
    transform: rotateY(0deg);
  }
  to {
    transform: rotateY(-360deg);
  }
}
```

- [ ] **Step 2: Replace `src/routes/ways.tsx` entirely**

```tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";

import { LiquidGlassButton } from "@/components/ui/liquid-glass-button";
import { useWays } from "@/hooks/use-ways";
import { getWorldCardMeta } from "@/lib/journey-world";

export const Route = createFileRoute("/ways")({
  component: WaysPage,
});

/* translateZ so cards space evenly around the cylinder for any count */
function cylinderTranslateZ(count: number) {
  const n = Math.max(count, 1);
  return Math.round(260 / Math.tan(Math.PI / n));
}

interface CylinderCardProps {
  way: ReturnType<typeof useWays>["ways"][number];
  index: number;
  count: number;
  translateZ: number;
  onClick: () => void;
}

function CylinderCard({ way, index, count, translateZ, onClick }: CylinderCardProps) {
  const card = getWorldCardMeta(way.world);

  return (
    <div
      className="tw-cylinder-item space-y-4 text-left"
      style={
        {
          "--quantity": count,
          "--index": index,
          "--translateZ": `${translateZ}px`,
          background: `linear-gradient(140deg, ${card.accentGradient[0]}cc, ${card.accentGradient[1]}cc)`,
          border: "1px solid rgba(255,255,255,0.5)",
          boxShadow: "0 16px 48px rgba(30,60,100,0.10)",
        } as React.CSSProperties
      }
      onClick={onClick}
    >
      <p className="text-xs font-medium uppercase tracking-widest text-sky-950/45">Dilema</p>
      <p className="text-base font-medium text-sky-950/85 leading-6 line-clamp-3">{way.rawInput}</p>

      <div className="flex gap-3">
        <div
          className="flex-1 rounded-[1.25rem] p-3 text-center text-xs"
          style={{
            background: `${card.leftPath.color}20`,
            border: `1px solid ${card.leftPath.color}30`,
          }}
        >
          <p className="font-medium text-sky-950/70">{card.leftPath.label}</p>
          <p className="mt-0.5 font-semibold" style={{ color: card.leftPath.color }}>
            {card.leftPath.title}
          </p>
        </div>
        <div
          className="flex-1 rounded-[1.25rem] p-3 text-center text-xs"
          style={{
            background: `${card.rightPath.color}20`,
            border: `1px solid ${card.rightPath.color}30`,
          }}
        >
          <p className="font-medium text-sky-950/70">{card.rightPath.label}</p>
          <p className="mt-0.5 font-semibold" style={{ color: card.rightPath.color }}>
            {card.rightPath.title}
          </p>
        </div>
      </div>

      <p className="text-xs text-sky-950/40">
        {new Date(way.createdAt).toLocaleDateString("pt-BR", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </p>
    </div>
  );
}

function WaysPage() {
  const { ways } = useWays();
  const navigate = useNavigate();
  const translateZ = useMemo(() => cylinderTranslateZ(ways.length), [ways.length]);

  return (
    <div className="safe-screen relative overflow-hidden">
      <div className="absolute left-4 top-4 z-10">
        <LiquidGlassButton to="/" icon={ArrowLeft} compact />
      </div>

      <div className="mx-auto flex min-h-[calc(100svh-2rem)] w-full max-w-3xl flex-col items-center justify-center gap-6 px-4 pt-20">
        <AnimatePresence mode="wait">
          {ways.length === 0 ? (
            <motion.div
              key="empty"
              className="flex flex-col items-center gap-5 text-center"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="glass-panel flex h-16 w-16 items-center justify-center rounded-full">
                <Sparkles className="h-7 w-7 text-sky-950/70" />
              </div>
              <p className="max-w-xs text-base text-sky-950/75">
                Voce ainda nao explorou nenhum dilema. Comece descrevendo uma decisao que esta te
                pesando.
              </p>
              <button
                onClick={() => navigate({ to: "/" })}
                className="glass-panel rounded-full px-5 py-2 text-sm font-medium text-sky-950/80 transition hover:scale-105"
              >
                Explorar meu primeiro dilema
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="cylinder"
              className="flex w-full flex-col items-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="tw-cylinder-scene">
                <div
                  className="tw-cylinder-wrapper"
                  style={{ "--quantity": ways.length } as React.CSSProperties}
                >
                  {ways.map((way, index) => (
                    <CylinderCard
                      key={way.id}
                      way={way}
                      index={index}
                      count={ways.length}
                      translateZ={translateZ}
                      onClick={() =>
                        navigate({
                          to: "/ways/$sessionId",
                          params: { sessionId: way.id },
                        })
                      }
                    />
                  ))}
                </div>
              </div>

              <p className="text-center text-xs text-sky-950/50">
                {ways.length} {ways.length === 1 ? "dilema explorado" : "dilemas explorados"}
              </p>
              <p className="text-center text-xs text-sky-950/35">
                Toque em qualquer card para abrir
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
```

> **Note:** `card.leftPath` / `card.rightPath` names come from `getWorldCardMeta` in `src/lib/journey-world.ts` — verify they match what the function returns before committing.

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Common issues to fix:

- `way.world` type: check what `useWays()['ways'][number]` returns and align `CylinderCard.way` if needed
- `card.leftPath` / `card.rightPath`: confirm property names match `getWorldCardMeta` return type

- [ ] **Step 4: Test visually**

```bash
npm run dev
```

Navigate to `/ways` (with at least 2 saved ways). Verify:

- Cards are arranged as a 3D cylinder, spinning automatically at 20s/revolution
- On desktop, hovering pauses rotation; mouse-out resumes it
- Pressing a card gives a `scale(0.97)` push response via CSS `:active`
- Tapping any card navigates to that session
- With a single way: cylinder still renders (card faces forward, large translateZ)
- Empty state renders with entrance animation unchanged

- [ ] **Step 5: Commit**

```bash
git add src/styles.css src/routes/ways.tsx
git commit -m "feat(3d): replace Embla carousel with auto-rotating CSS 3D cylinder in Ways gallery"
```

---

## Task 11: Session detail — Z-depth transitions + ring reveal

**Files:**

- Modify: `src/routes/ways/$sessionId.tsx`

- [ ] **Step 1: Find the loading state render**

In `DilemmaSessionPage`, find the `AnimatePresence` that wraps the loading/error/content states. It will contain something like:

```tsx
<AnimatePresence mode="wait">
  {isLoading && (
    <motion.div key="loading" ...>
      ...
    </motion.div>
  )}
  {!isLoading && way && (
    <motion.div key="content" ...>
      ...
    </motion.div>
  )}
</AnimatePresence>
```

If the component renders loading/content as direct siblings without `AnimatePresence`, wrap them. The session detail page currently renders the `PlayableWorldExperience` or `DilemmaWorldView` directly after loading. Find the `isLoading` conditional render.

- [ ] **Step 2: Add Z-depth to the loading spinner section**

Find the loading indicator (it uses `LoaderCircle`). Wrap it with depth:

```tsx
<motion.div
  key="loading"
  initial={{ opacity: 0, z: 40 }}
  animate={{ opacity: 1, z: 0 }}
  exit={{ opacity: 0, z: -40, scale: 0.96 }}
  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
  style={{ perspective: "1000px" }}
  className="flex items-center justify-center py-24"
>
  <LoaderCircle className="h-8 w-8 animate-spin text-sky-950/40" />
</motion.div>
```

- [ ] **Step 3: Add Z-depth entrance to the content section**

The content (world view) currently renders without an entrance depth. Wrap the content motion.div or add to it:

```tsx
<motion.div
  key="content"
  initial={{ opacity: 0, z: 80 }}
  animate={{ opacity: 1, z: 0 }}
  exit={{ opacity: 0, z: -40, scale: 0.96 }}
  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
  style={{ perspective: "1200px", transformStyle: "preserve-3d" }}
>
  {/* existing content */}
</motion.div>
```

- [ ] **Step 4: Add Z-depth to the header**

Find the header `motion.div` with `initial={{ opacity: 0, y: -20 }}`. Update it:

```tsx
<motion.div
  initial={{ opacity: 0, y: -20, z: -60 }}
  animate={{ opacity: 1, y: 0, z: 0 }}
  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
  style={{ perspective: "800px" }}
  className="absolute left-4 top-4 z-20"
>
  <LiquidGlassButton to="/ways" icon={ArrowLeft} compact />
</motion.div>
```

- [ ] **Step 5: Find the ring reveal element**

Search for the `reveal-ring-expand` keyframe usage or a circular element that animates on load in this component. It may be in the `DilemmaWorldView` (which we're NOT touching) or directly in `$sessionId.tsx`. If it's in `$sessionId.tsx`, wrap it:

```tsx
<motion.div
  initial={{ scale: 0.8, rotateX: 20 }}
  animate={{ scale: 1, rotateX: 0 }}
  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
  style={{ perspective: "600px" }}
>
  {/* existing ring element */}
</motion.div>
```

If the ring is inside `DilemmaWorldView`, skip this step (DilemmaWorldView is out of scope).

- [ ] **Step 6: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 7: Test visually**

```bash
npm run dev
```

Navigate to a saved Way. The content should emerge from depth on load. The loading spinner (if visible) should recede away as content appears.

- [ ] **Step 8: Commit**

```bash
git add "src/routes/ways/$sessionId.tsx"
git commit -m "feat(3d): add Z-depth transitions and ring reveal tilt to session detail"
```

---

## Task 12: Final lint, type-check, and smoke test

- [ ] **Step 1: Full TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 2: Lint**

```bash
npm run lint
```

Expected: 0 errors (warnings about `exhaustive-deps` for the dot controls are acceptable — add `// eslint-disable-next-line react-hooks/exhaustive-deps` where intentional).

- [ ] **Step 3: Production build**

```bash
npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 4: Smoke test all animated screens**

```bash
npm run preview
```

Check each screen manually:

| Screen             | What to verify                                                                                                  |
| ------------------ | --------------------------------------------------------------------------------------------------------------- |
| `/`                | Orbs drift with mouse movement at different speeds; title emerges from depth on load; prompt box tilts on hover |
| `/` (submit)       | LiquidGlassButton floats toward you on hover, presses in on tap                                                 |
| Generation loading | Large orb rotates slowly; light particles float; stage text transitions have depth; progress dots pop           |
| `/ways`            | Cards emerge from depth on load; active card is elevated; cards tilt on hover with sheen; swiping tilts cards   |
| `/ways/:id`        | Content emerges from depth; loading recedes; header slides in with depth                                        |

- [ ] **Step 5: Test with reduced-motion**

In Chrome DevTools → Rendering → Emulate CSS media: `prefers-reduced-motion: reduce`.

All animated elements should either be static or use simple fade (no 3D transforms, no parallax, no particle drift).

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat(3d): complete 3D animation enhancement across TranquiliWays"
```

---

## Implementation Notes

- **`use3DTilt` ref type:** The hook returns `React.RefObject<HTMLElement>`. Cast with `ref as React.RefObject<HTMLButtonElement>` or `HTMLDivElement` at the call site.
- **`getWorldCardMeta` return shape:** Task 10 references `card.leftPath` and `card.rightPath`. Inspect the actual return type of `getWorldCardMeta` from `src/lib/journey-world.ts` and adapt field names.
- **Framer Motion `z` prop:** Requires a `perspective` value on the parent element or a parent with `perspective` CSS to be visible. Always set `perspective` on the wrapping element.
- **`motion/react` vs `framer-motion`:** `ai-prompt-box.tsx` imports from `'framer-motion'`. Keep using whichever import is already in each file — they resolve to the same library.
- **DilemmaWorldView:** Completely untouched. Do not modify `src/components/dilemma-world.tsx` or anything in `src/features/playable-world/`.
