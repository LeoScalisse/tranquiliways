# TranquiliWays — 3D Animation Enhancement

**Date:** 2026-05-04
**Scope:** Add vivid 3D interactive animations throughout the app without changing the existing visual design.
**Excluded:** `DilemmaWorldView` — untouched.

---

## Guiding Principles

- Design stays identical. Only motion is added or deepened.
- All animations use `transform` and `opacity` exclusively — no layout properties (no width, height, top, left). GPU-accelerated, 60fps on Android.
- `useReducedMotion()` gates all non-essential motion. Users who opt out get instant transitions.
- Spring physics everywhere — `useSpring` with natural deceleration. No bounce or elastic easing.
- Exit animations are ~70% of enter duration.
- Perspective: `1200px` on containers. `transformStyle: preserve-3d` where layering is needed.

---

## Shared Infrastructure

### Hook: `use3DTilt`

**File:** `src/hooks/use-3d-tilt.ts`

Tracks pointer/touch position relative to a container and returns Framer Motion spring values for `rotateX` and `rotateY`.

```ts
interface Use3DTiltOptions {
  maxRotateX?: number; // default 8
  maxRotateY?: number; // default 12
  stiffness?: number; // default 150
  damping?: number; // default 20
}

// Returns: { rotateX, rotateY, onPointerMove, onPointerLeave, ref }
```

- Uses `useMotionValue` + `useSpring` for smooth deceleration
- Resets to `0, 0` on pointer leave with spring
- Disabled automatically when `useReducedMotion()` is true
- Attaches via `ref` to a container element to measure bounds

---

### Hook: `useParallaxDepth`

**File:** `src/hooks/use-parallax-depth.ts`

Takes a pointer position (or scroll progress) and a depth factor, returns `x` and `y` offset motion values.

```ts
// Usage: const { x, y } = useParallaxDepth(pointerX, pointerY, depthFactor)
// depthFactor 1 = slow (background), 3 = fast (foreground)
```

- Shared pointer tracking via a context at the app root level (`PointerContext`) to avoid duplicate event listeners
- Each layer passes its own `depthFactor` — typically 0.8 / 1.5 / 2.5 for back/mid/fore

---

### Context: `PointerContext`

**File:** `src/lib/pointer-context.tsx`

Single `pointermove` listener at the root level. Provides normalized pointer position (`-1 to 1` on each axis) as Framer Motion values. All parallax and tilt hooks consume this instead of adding their own listeners.

---

### CSS additions (no visual change)

In `src/styles.css`, add only:

```css
.preserve-3d {
  transform-style: preserve-3d;
}

.perspective-lg {
  perspective: 1200px;
}
```

---

## Screen 1 — Landing Page (`src/routes/index.tsx`)

### Animated Orbs (`src/components/ui/animated-orbs.tsx`)

Current: 3 orbs with CSS float keyframes.

Enhancement:

- Wrap each orb in `motion.div` with `x` and `y` driven by `useParallaxDepth` at depth factors `0.6`, `1.2`, `2.0` respectively.
- The result: orbs drift at different speeds as the user moves the pointer, creating an atmospheric 3D depth field.
- CSS keyframe float continues unchanged underneath — parallax offsets add on top.

### Title Entrance (`src/components/ui/tranquili-ways-title.tsx`)

Current: character-by-character reveal.

Enhancement:

- Wrap the title container in `motion.div` with initial `{ translateZ: -180, opacity: 0 }` → animate `{ translateZ: 0, opacity: 1 }`.
- Duration: 700ms, ease: `[0.16, 1, 0.3, 1]` (expo out). Fires once on mount.
- Requires `perspective: 1200px` on the parent.

### AI Prompt Box (`src/components/ui/ai-prompt-box.tsx`)

Current: static container with animated toggle buttons.

Enhancement:

- Apply `use3DTilt` to the prompt box outer container (maxRotateX: 4, maxRotateY: 6).
- On focus (textarea focused): `translateZ: 8px` spring forward + drop shadow deepens via `box-shadow` transition (only on focus, not continuous).
- On submit press: `scale: 0.97 → 1.0` pulse with spring (perceived depth press — `scaleZ` alone has no visual effect on a flat element).

### Submit / send button

Current: `LiquidGlassButton` with `whileHover`/`whileTap` scale.

Enhancement:

- Add `translateZ: 0 → 12px` on hover (button floats toward user).
- On tap: `translateZ: 12 → -4 → 0` compressed push-in then spring release.
- Ripple already exists via `useTouchRipple` — keep unchanged.

---

## Screen 2 — World Creation Loader (`src/components/world-creation-loader.tsx`)

### Central orb

Current: CSS `content-breathe` keyframe (scale pulse).

Enhancement:

- Add continuous slow Y-axis rotation (`rotateY: 0 → 360`) via `useAnimationControls` with infinite repeat, duration 12s, linear easing. Creates orbital/planetary feel.
- Layer a radial shadow beneath the orb (`translateY: 30px, scaleX: 1.5, opacity: 0.25`) that pulses in sync with the breathe — the shadow "breathes" with the orb.

### Stage text transitions

Current: `AnimatePresence` fade + slide Y.

Enhancement:

- Change exit to `{ opacity: 0, translateZ: -80, scale: 0.9 }` — text recedes into depth.
- Enter: `{ opacity: 0, translateZ: -120, scale: 0.92 }` → `{ opacity: 1, translateZ: 0, scale: 1 }`.
- Duration 400ms, ease expo-out. Feels like content emerging from inside the orb.

### Atmospheric particles

New addition — pure CSS, no JS:

- Add 14 absolutely-positioned `span` elements inside the loader container via React (`Array.from({ length: 14 })`).
- Each: 3–6px white/blue dot, `border-radius: 50%`, `opacity: 0.08–0.3`, animated with CSS keyframes at random `translateX/Y/Z` paths and `8–20s` durations.
- Rendered only when loader is active, cleaned up when unmounted.
- Gives the space a "floating in atmosphere" feel without WebGL cost.

### Progress dots

Current: scale expand/shrink on active stage.

Enhancement:

- Active dot: add `rotateX: 0 → 180 → 0` flip (half-turn) when it becomes active, duration 350ms.
- Use `useEffect` watching the active stage index to trigger the flip animation via `useAnimationControls`.

---

## Screen 3 — Ways Gallery (`src/routes/ways.tsx`)

### Carousel cards

Current: `motion.div` with `whileHover={{ y: -4 }}`, `whileTap={{ scale: 0.98 }}`.

Enhancement:

- Replace `whileHover` with `use3DTilt` (maxRotateX: 8, maxRotateY: 12).
- Add a `light-sheen` pseudo-element overlay: `radial-gradient` that follows the pointer position inside the card, creating a specular highlight effect. Implemented as an absolutely-positioned `motion.div` inside each card, with `background` updated via `useMotionTemplate`.
- Active (center) card: `translateZ: 24px` spring forward. Adjacent cards: `translateZ: -16px` recede. This creates a depth stack in the carousel.

### Card entrance sequence

Current: cards render without entrance animation.

Enhancement:

- Wrap each card in `motion.div` with `initial={{ opacity: 0, translateZ: -80 }}` and `animate={{ opacity: 1, translateZ: 0 }}`.
- Stagger: `delay: index * 0.07s`.
- Only fires on first render (not on re-renders from carousel scroll).

### Carousel swipe

Current: Embla carousel handles drag.

Enhancement:

- No change to Embla drag/scroll logic — Embla remains sole controller of position state.
- Subscribe to Embla's `scroll` event to read scroll velocity. Apply `rotateY` to all visible cards proportional to velocity (fast scroll → more tilt, settled → 0). Uses a `useMotionValue` + `useSpring` for smooth return. No Framer Motion drag overlay (would conflict with Embla's touch handling).

---

## Screen 4 — Session Detail (`src/routes/ways/$sessionId.tsx`)

### Header entrance

Current: `motion.div` with `initial={{ opacity: 0, y: -20 }}`.

Enhancement:

- Change to `initial={{ opacity: 0, translateZ: -60, y: -20 }}` → `animate={{ opacity: 1, translateZ: 0, y: 0 }}`.
- Parent needs `perspective: 1200px`.

### Loading → content transition (`AnimatePresence`)

Current: loading state fades out, content fades in.

Enhancement:

- Content enter: `initial={{ opacity: 0, translateZ: 80 }}` → `animate={{ opacity: 1, translateZ: 0 }}`. Content emerges from depth toward user.
- Loading exit: `exit={{ opacity: 0, translateZ: -40, scale: 0.96 }}`. Loading recedes away.
- Duration 500ms, expo-out.

### Ring reveal animation

Current: CSS keyframe `reveal-ring-expand` (scale + opacity).

Enhancement:

- Keep CSS keyframe, add a Framer Motion `motion.div` wrapper with `initial={{ scale: 0.8, rotateX: 20 }}` → `animate={{ scale: 1, rotateX: 0 }}`. Duration 600ms. Gives the ring a sense of tilting upright from a flat angle — like a portal opening toward the user.

---

## Out of Scope

- `src/components/dilemma-world.tsx` — untouched, no changes.
- `src/features/playable-world/` — untouched.
- All colors, typography, spacing, layout — no changes.
- New routes or data flows — none.

---

## Performance Constraints

- No new heavy dependencies. All effects via existing `motion/react`.
- `will-change: transform` added only to the carousel cards and the central loader orb.
- Atmospheric particles use CSS animations only (no JS animation loop).
- `PointerContext` uses a single passive `pointermove` listener with `requestAnimationFrame` throttle.
- Test target: 60fps on mid-range Android (e.g., Samsung Galaxy A series).

---

## File Map

| New file                          | Purpose                         |
| --------------------------------- | ------------------------------- |
| `src/hooks/use-3d-tilt.ts`        | Pointer-tracking 3D tilt hook   |
| `src/hooks/use-parallax-depth.ts` | Z-depth parallax hook           |
| `src/lib/pointer-context.tsx`     | Global pointer position context |

| Modified file                                | What changes                            |
| -------------------------------------------- | --------------------------------------- |
| `src/components/ui/animated-orbs.tsx`        | Add parallax depth layers               |
| `src/components/ui/tranquili-ways-title.tsx` | Z-depth entrance                        |
| `src/components/ui/ai-prompt-box.tsx`        | 3D tilt + focus lift                    |
| `src/components/ui/liquid-glass-button.tsx`  | Z-axis hover/press                      |
| `src/components/world-creation-loader.tsx`   | Orbital orb, stage depth, particles     |
| `src/routes/ways.tsx`                        | Card tilt, sheen, depth stack, entrance |
| `src/routes/ways/$sessionId.tsx`             | Header/content/ring 3D transitions      |
| `src/routes/__root.tsx`                      | Wrap with `PointerContext` provider     |
| `src/styles.css`                             | Add `.preserve-3d`, `.perspective-lg`   |