# Ways Flow: Real Loading + Card Path Buttons + Detail View

**Date:** 2026-05-13
**Status:** Approved

## Problem

Three issues in the current generation → carousel flow:

1. Loading stages `receiving`, `saving`, and `opening` complete in < 1 ms each — the animation plays but no real time passes per stage.
2. After generation, the user is sent to `/ways/$sessionId` (the detail page). The intended destination is `/ways` (the carousel).
3. `WayLandscapeCard` shows raw dilemma text as a subtitle. The card should instead show two clickable path buttons (one per caminho) so the user can choose which future to explore.

## Solution Overview

Four targeted changes, none touching the AI generation logic or the world data model:

1. Add minimum visual durations to post-API loading stages.
2. Change post-generation navigation target from `/ways/$sessionId` to `/ways`.
3. Replace the subtitle section in `WayLandscapeCard` with two stacked path buttons (Option A layout).
4. Path button click opens a full-screen modal on `/ways` that transitions to `/world`.

---

## Section 1: Loading Stage Timing

### Mechanism

Add a `minDelay<T>(work: () => Promise<T>, ms: number): Promise<T>` helper in `src/lib/` (or inline in the route). It runs `work()` and awaits `Promise.all([work(), sleep(ms)])`, returning the work result after both resolve.

### Stage timings

| Stage      | Real work                          | Minimum visual                     |
| ---------- | ---------------------------------- | ---------------------------------- |
| `preparing`  | input validation                 | none (< 50 ms, already instant)    |
| `generating` | API call (Gemini)                | unlimited — waits for real response|
| `receiving`  | parse & validate result shape    | 600 ms                             |
| `saving`     | `saveWaySession()` to localStorage | 500 ms                           |
| `opening`    | atmospheric pause before navigate | 700 ms                            |

Total overhead beyond API time: ~1.8 s. Each stage feels like real work, not padding.

### Implementation site

`src/routes/index.tsx` — `handleSend()` function. No changes to `WorldCreationLoader` are needed; it already renders correctly for each stage.

---

## Section 2: Post-generation Navigation

Change the final `navigate` call in `handleSend()`:

```ts
// Before
navigate({ to: "/ways/$sessionId", params: { sessionId: result.id } })

// After
navigate({ to: "/ways" })
```

`useWays()` in `/ways` reads from localStorage, so the newly generated Way is already present when the carousel mounts.

---

## Section 3: Card Path Buttons (Option A — Stacked)

### Card body change

In `WayLandscapeCard`, the subtitle `<div>` (currently showing truncated `way.rawInput`) is replaced with two full-width stacked buttons.

**Button anatomy (per path):**

- Full width (`width: 100%`)
- Padding: `6px 8px`
- Border-radius: `4px`
- Background: path color at 15% opacity
- Border: `1.5px solid` path color at 55% opacity
- Label: `card.leftPath.label` / `card.rightPath.label` — 9px bold
- Sub-label: `card.leftPath.title` / `card.rightPath.title` — 8px normal, same color, below label

**Data source:** `getWorldCardMeta(way.world)` already returns `leftPath.{ label, title, color }` and `rightPath.{ label, title, color }` — no changes to `journey-world.ts` needed.

### New prop

```ts
interface Props {
  way: WayHistoryEntry;
  onDelete: () => void;
  onChoosePath: (path: 'left' | 'right') => void; // new
}
```

Button clicks call `onChoosePath('left')` or `onChoosePath('right')` and stop event propagation (so the card's parent click-to-navigate doesn't fire).

---

## Section 4: Detail View Modal → World

### State in `/ways` route

```ts
const [selectedEntry, setSelectedEntry] = useState<{
  way: WayHistoryEntry;
  path: 'left' | 'right';
} | null>(null);
```

When `onChoosePath` is called from a card, set this state.

### Modal content

Full-screen overlay rendered via `AnimatePresence` + `motion.div` (Framer Motion):

- **Background:** gradient from the chosen path's color (e.g. `linear-gradient(135deg, {color}33, {color}88)`)
- **Path name:** `card.leftPath.label` or `card.rightPath.label` — large, centered
- **Path tone:** `card.leftPath.title` or `card.rightPath.title` — smaller, muted
- **Loading indicator:** animated dots or one of the existing `LoadingAnimations` components
- **Copy:** "Entrando no mundo..." (static, below the indicator)

### Auto-navigation

After a 1500 ms delay (via `useEffect`), navigate to:

```text
/ways/{way.id}/world?path={left|right}
```

The route `src/routes/ways/$sessionId/world.tsx` renders `PlayableWorldExperience`. It reads `sessionId` from URL params. A `path` search param (`left` | `right`) will be added so `PlayableWorldExperience` can pre-select the correct caminho on mount.

### Modal animation

- Enter: `opacity 0→1`, `scale 0.96→1`, duration 300 ms, ease out
- Exit: not needed (navigation replaces the page)

---

## Files Changed

| File                                        | Change                                                                                      |
| ------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `src/routes/index.tsx`                      | Add `minDelay` helper; wrap `receiving`, `saving`, `opening` stages; change navigate target |
| `src/components/way-landscape-card.tsx`     | Replace subtitle div with two stacked path buttons; add `onChoosePath` prop                 |
| `src/routes/ways.tsx`                       | Add `selectedEntry` state; pass `onChoosePath` to cards; render modal overlay               |
| `src/routes/ways/$sessionId/world.tsx`      | Add `path` search param reader; pass chosen path to `PlayableWorldExperience`               |

## Out of Scope

- Changes to AI generation logic or prompt
- Changes to `DilemmaWorld` / `PlayableWorldV1` data model
- Audio or haptics on path selection
- Persistence of chosen path across sessions
