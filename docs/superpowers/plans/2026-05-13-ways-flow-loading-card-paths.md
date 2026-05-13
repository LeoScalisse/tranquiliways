# Ways Flow: Real Loading + Card Path Buttons + Detail View — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make loading stages wait for real work, redirect to `/ways` after generation, replace card subtitle with two stacked path buttons, and open a full-screen transition modal when a path is chosen.

**Architecture:** Four isolated changes in four files. No changes to data models or AI generation logic. A `sleep()` helper wraps post-API stages with minimum visual durations. Path buttons in `WayLandscapeCard` call `onChoosePath("parado" | "mudanca")`. The modal in `ways.tsx` delays 1500 ms then navigates to `/ways/$sessionId/world?path=...`. `PlayableWorldExperience` accepts `initialPathId` to pre-select a path.

**Tech Stack:** React 19, TanStack Router (file-based), Framer Motion (`motion/react`), `npx tsx` for running tests (Node.js + `node:assert/strict`, no JSDOM).

---

## File Map

| File | Change |
| ---- | ------ |
| `src/routes/index.tsx` | Add `sleep()` helper; wrap `receiving`/`saving`/`opening` stages; change final `navigate` to `/ways` |
| `src/components/way-landscape-card.tsx` | Add `onChoosePath: (path: PathId) => void` prop; replace subtitle div with two stacked path buttons |
| `src/routes/ways.tsx` | Add `selectedEntry` state; pass `onChoosePath` to cards; render `AnimatePresence` modal with auto-navigation |
| `src/routes/ways/$sessionId/world.tsx` | Add `validateSearch` for `path` param; pass `initialPathId` to `PlayableWorldExperience` |
| `src/features/playable-world/ui/playable-world-experience.tsx` | Add `initialPathId?: PathId` prop; pre-select path in `useState` initializer |
| `src/lib/__tests__/sleep.test.ts` | New — unit test for `sleep()` helper |

---

## Task 1: `sleep` helper + real loading stage timing

**Files:**

- Modify: `src/routes/index.tsx`
- Create: `src/lib/__tests__/sleep.test.ts`

The `sleep` utility resolves after `ms` milliseconds. It is declared module-level in `index.tsx` (not exported — it's route-local).

- [ ] **Step 1: Write failing test**

Create `src/lib/__tests__/sleep.test.ts`:

```ts
import assert from "node:assert/strict";

async function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function run(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

await run("sleep resolves after at least ms milliseconds", async () => {
  const start = Date.now();
  await sleep(80);
  const elapsed = Date.now() - start;
  assert.ok(elapsed >= 75, `Expected >= 75 ms, got ${elapsed} ms`);
});

await run("sleep resolves close to ms (not wildly late)", async () => {
  const start = Date.now();
  await sleep(80);
  const elapsed = Date.now() - start;
  assert.ok(elapsed < 300, `Expected < 300 ms, got ${elapsed} ms`);
});
```

- [ ] **Step 2: Run test — expect PASS** (the test imports its own `sleep`, so it runs independently)

```bash
npx tsx src/lib/__tests__/sleep.test.ts
```

Expected:
```
PASS sleep resolves after at least ms milliseconds
PASS sleep resolves close to ms (not wildly late)
```

- [ ] **Step 3: Add `sleep` to `index.tsx` and rewrite `handleSend`**

Open `src/routes/index.tsx`. Add the helper above the `Index` component:

```ts
function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
```

Replace the `try` block inside `handleSend` with:

```ts
try {
  setCreationStage("generating");
  const result = await createJourneySession({ rawInput, inputMode: "text" });

  setCreationStage("receiving");
  await sleep(600);

  if ("guardrail" in result) {
    setFeedback(result.mensagem);
    return;
  }

  setCreationStage("saving");
  saveWaySession(result);
  await sleep(500);

  setCreationStage("opening");
  await sleep(700);

  await navigate({ to: "/ways" });
} catch (error) {
  setFeedback(
    error instanceof Error
      ? error.message
      : "Nao foi possivel gerar seu mundo agora. Tente novamente em instantes.",
  );
} finally {
  setIsSubmitting(false);
}
```

> Note: the old code had `navigate({ to: "/ways/$sessionId", params: { sessionId: result.id } })` — this is replaced by `navigate({ to: "/ways" })`.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors related to `index.tsx`.

- [ ] **Step 5: Commit**

```bash
git add src/routes/index.tsx src/lib/__tests__/sleep.test.ts
git commit -m "feat(loading): real stage timing + redirect to /ways after generation"
```

---

## Task 2: Path buttons in `WayLandscapeCard`

**Files:**

- Modify: `src/components/way-landscape-card.tsx`

No test file — the component uses inline styles and no external state; manual verification via dev server is used (noted in Step 4).

- [ ] **Step 1: Add `onChoosePath` prop and import `PathId`**

Open `src/components/way-landscape-card.tsx`.

At the top of the file, add the import for `PathId`:

```ts
import type { PathId } from "@/features/playable-world/model";
```

Change the `Props` interface from:

```ts
interface Props {
  way: WayHistoryEntry;
  onDelete: () => void;
}
```

to:

```ts
interface Props {
  way: WayHistoryEntry;
  onDelete: () => void;
  onChoosePath: (path: PathId) => void;
}
```

Update the function signature:

```ts
export function WayLandscapeCard({ way, onDelete, onChoosePath }: Props) {
```

- [ ] **Step 2: Replace subtitle div with two stacked path buttons**

Find this block in `WayLandscapeCard` (around line 157–169):

```tsx
{/* ── card-subtitle: dilema em texto ── */}
<div
  style={{
    fontSize: "10px",
    fontWeight: 400,
    color: "var(--font-color-sub)",
    lineHeight: 1.45,
    flex: 1,
    overflow: "hidden",
  }}
>
  {subtitle}
</div>
```

Replace it entirely with:

```tsx
{/* ── card-paths: botões dos dois caminhos ── */}
<div
  style={{
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    flex: 1,
    justifyContent: "center",
  }}
>
  <button
    onClick={(e) => {
      e.stopPropagation();
      onChoosePath("parado");
    }}
    onPointerDown={(e) => e.stopPropagation()}
    style={{
      display: "block",
      width: "100%",
      padding: "6px 8px",
      borderRadius: "4px",
      border: `1.5px solid ${card.leftPath.color}8c`,
      background: `${card.leftPath.color}26`,
      cursor: "pointer",
      textAlign: "center",
      color: card.leftPath.color,
    }}
  >
    <div style={{ fontSize: "9px", fontWeight: 600, lineHeight: 1.3 }}>
      {card.leftPath.label}
    </div>
    <div style={{ fontSize: "8px", fontWeight: 400, lineHeight: 1.3, opacity: 0.8 }}>
      {card.leftPath.title}
    </div>
  </button>

  <button
    onClick={(e) => {
      e.stopPropagation();
      onChoosePath("mudanca");
    }}
    onPointerDown={(e) => e.stopPropagation()}
    style={{
      display: "block",
      width: "100%",
      padding: "6px 8px",
      borderRadius: "4px",
      border: `1.5px solid ${card.rightPath.color}8c`,
      background: `${card.rightPath.color}26`,
      cursor: "pointer",
      textAlign: "center",
      color: card.rightPath.color,
    }}
  >
    <div style={{ fontSize: "9px", fontWeight: 600, lineHeight: 1.3 }}>
      {card.rightPath.label}
    </div>
    <div style={{ fontSize: "8px", fontWeight: 400, lineHeight: 1.3, opacity: 0.8 }}>
      {card.rightPath.title}
    </div>
  </button>
</div>
```

Also remove the now-unused `subtitle` variable declared earlier in the function body:

```ts
// Remove this line:
const subtitle = rawText.length > 52 ? rawText.slice(0, 52) + "…" : rawText;
```

And remove `rawText` if it's no longer used:

```ts
// Remove this line too if rawText is only used for subtitle:
const rawText = way.rawInput.trim();
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors. If `rawText` or `subtitle` are flagged as unused, remove them.

- [ ] **Step 4: Manual verification**

Start dev server:

```bash
npm run dev
```

Navigate to `/ways`. Each card should now show two colored buttons in the body where the dilemma text used to appear. The title at the top should remain. Clicking a button should not navigate anywhere yet (the `onChoosePath` prop isn't wired in `ways.tsx` until Task 3).

- [ ] **Step 5: Commit**

```bash
git add src/components/way-landscape-card.tsx
git commit -m "feat(card): replace subtitle with two stacked path buttons"
```

---

## Task 3: Path entry modal in `ways.tsx`

**Files:**

- Modify: `src/routes/ways.tsx`

- [ ] **Step 1: Add imports**

Open `src/routes/ways.tsx`. Add to the existing imports:

```ts
import { useEffect } from "react";
import { getWorldCardMeta } from "@/lib/journey-world";
import type { WayHistoryEntry } from "@/lib/way-history";
import type { PathId } from "@/features/playable-world/model";
```

`AnimatePresence` and `motion` are already imported. `useState` is already imported. `useNavigate` is already imported.

- [ ] **Step 2: Add `selectedEntry` state in `WaysPage`**

Inside `function WaysPage()`, after the existing state declarations, add:

```ts
const [selectedEntry, setSelectedEntry] = useState<{
  way: WayHistoryEntry;
  path: PathId;
} | null>(null);
```

- [ ] **Step 3: Wire `onChoosePath` into the carousel**

In the `renderItem` prop of `CircularGallery`, change:

```tsx
<WayLandscapeCard way={way} onDelete={() => setWayToDelete(way)} />
```

to:

```tsx
<WayLandscapeCard
  way={way}
  onDelete={() => setWayToDelete(way)}
  onChoosePath={(path) => setSelectedEntry({ way, path })}
/>
```

- [ ] **Step 4: Add `PathEntryModal` component**

Add this component **outside** `WaysPage`, at the bottom of `src/routes/ways.tsx`:

```tsx
function PathEntryModal({
  entry,
  onNavigate,
}: {
  entry: { way: WayHistoryEntry; path: PathId };
  onNavigate: () => void;
}) {
  const card = getWorldCardMeta(entry.way.world);
  const pathMeta = entry.path === "parado" ? card.leftPath : card.rightPath;

  useEffect(() => {
    const timer = setTimeout(onNavigate, 1500);
    return () => clearTimeout(timer);
  }, [onNavigate]);

  return (
    <motion.div
      key="path-entry-modal"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        background: `linear-gradient(135deg, ${pathMeta.color}33, ${pathMeta.color}88)`,
      }}
    >
      <p
        style={{
          fontSize: "24px",
          fontWeight: 700,
          color: "#1e293b",
          textAlign: "center",
          padding: "0 24px",
        }}
      >
        {pathMeta.label}
      </p>
      <p
        style={{
          fontSize: "14px",
          color: "#1e293b99",
          textAlign: "center",
          padding: "0 32px",
        }}
      >
        {pathMeta.title}
      </p>
      <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#1e293b",
            }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 0.9, delay: i * 0.3, repeat: Infinity }}
          />
        ))}
      </div>
      <p style={{ fontSize: "13px", color: "#1e293b80", marginTop: "4px" }}>
        Entrando no mundo...
      </p>
    </motion.div>
  );
}
```

- [ ] **Step 5: Render modal with `AnimatePresence` inside `WaysPage`**

At the very end of the returned JSX in `WaysPage` (before the closing `</div>` of the root), add:

```tsx
<AnimatePresence>
  {selectedEntry ? (
    <PathEntryModal
      key="path-modal"
      entry={selectedEntry}
      onNavigate={() => {
        void navigate({
          to: "/ways/$sessionId/world",
          params: { sessionId: selectedEntry.way.id },
          search: { path: selectedEntry.path },
        });
      }}
    />
  ) : null}
</AnimatePresence>
```

- [ ] **Step 6: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors. TanStack Router will flag `search: { path: selectedEntry.path }` as unknown until Task 4 adds `validateSearch` to the world route — if it errors, note it and proceed to Task 4 immediately, then come back to run this check again.

- [ ] **Step 7: Manual verification**

With dev server running (`npm run dev`), navigate to `/ways`. Click a path button on any card. A full-screen overlay should appear with the path name, title, animated dots, and "Entrando no mundo..." text. After 1.5 s it should try to navigate to `/ways/$sessionId/world`.

- [ ] **Step 8: Commit**

```bash
git add src/routes/ways.tsx
git commit -m "feat(ways): path entry modal with 1.5s auto-navigation to world"
```

---

## Task 4: World route search param + `PlayableWorldExperience` `initialPathId`

**Files:**

- Modify: `src/routes/ways/$sessionId/world.tsx`
- Modify: `src/features/playable-world/ui/playable-world-experience.tsx`

- [ ] **Step 1: Add `validateSearch` to the world route**

Open `src/routes/ways/$sessionId/world.tsx`. Change the route definition from:

```ts
export const Route = createFileRoute("/ways/$sessionId/world")({
  component: WorldExplorationPage,
});
```

to:

```ts
export const Route = createFileRoute("/ways/$sessionId/world")({
  validateSearch: (search: Record<string, unknown>) => ({
    path:
      search.path === "parado" || search.path === "mudanca"
        ? (search.path as "parado" | "mudanca")
        : undefined,
  }),
  component: WorldExplorationPage,
});
```

- [ ] **Step 2: Read `path` search param in `WorldExplorationPage`**

Inside `function WorldExplorationPage()`, after the existing `const { sessionId } = Route.useParams();` line, add:

```ts
const { path: initialPathId } = Route.useSearch();
```

- [ ] **Step 3: Pass `initialPathId` to `PlayableWorldExperience`**

Change the `<PlayableWorldExperience ... />` JSX from:

```tsx
<PlayableWorldExperience
  world={entry.world}
  onBrowseWays={() => void navigate({ to: "/ways" })}
/>
```

to:

```tsx
<PlayableWorldExperience
  world={entry.world}
  initialPathId={initialPathId}
  onBrowseWays={() => void navigate({ to: "/ways" })}
/>
```

- [ ] **Step 4: Add `initialPathId` prop to `PlayableWorldExperience`**

Open `src/features/playable-world/ui/playable-world-experience.tsx`.

`PathId` is already imported at line 23:
```ts
import type { PathId, PlayableWorldV1, RoomPalette } from "../model";
```

`enterPath` is already imported at line 9 in the simulation imports.

Change the props interface from:

```ts
interface PlayableWorldExperienceProps {
  world: PlayableWorldV1;
  onBrowseWays?: () => void;
}
```

to:

```ts
interface PlayableWorldExperienceProps {
  world: PlayableWorldV1;
  onBrowseWays?: () => void;
  initialPathId?: PathId;
}
```

Update the component signature:

```ts
export function PlayableWorldExperience({ world, onBrowseWays, initialPathId }: PlayableWorldExperienceProps) {
```

Change the `useState` initializer from:

```ts
const [state, setState] = useState<PlayableWorldState>(() => createPlayableWorldState());
```

to:

```ts
const [state, setState] = useState<PlayableWorldState>(() => {
  const base = createPlayableWorldState();
  if (initialPathId) return enterPath(world, base, initialPathId);
  return base;
});
```

- [ ] **Step 5: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors across all modified files.

- [ ] **Step 6: Run existing simulation tests**

```bash
npx tsx src/features/playable-world/__tests__/simulation.test.ts
```

Expected: all PASS.

- [ ] **Step 7: Manual end-to-end verification**

With `npm run dev`:

1. Go to `/` and submit a dilemma. Watch loading stages — `generating` waits for real API response, then `receiving` (0.6 s), `saving` (0.5 s), `opening` (0.7 s) each advance visibly.
2. After `opening`, lands on `/ways` (not `/ways/$sessionId`).
3. The new card shows two colored stacked buttons with path label + title (not the dilemma text).
4. Click a path button — full-screen gradient modal appears with path name, animated dots, "Entrando no mundo..." for ~1.5 s.
5. Auto-navigates to `/ways/$sessionId/world` — the world opens with the chosen path pre-selected (in "path" phase, not "hub" phase).
6. The back button in the world returns to `/ways`.

- [ ] **Step 8: Commit**

```bash
git add src/routes/ways/"$sessionId"/world.tsx src/features/playable-world/ui/playable-world-experience.tsx
git commit -m "feat(world): pre-select path via search param on world entry"
```

---

## Self-Review

**Spec coverage:**

| Spec requirement | Task |
| ---------------- | ---- |
| `receiving` min 600 ms | Task 1 |
| `saving` min 500 ms | Task 1 |
| `opening` min 700 ms | Task 1 |
| Navigate to `/ways` after generation | Task 1 |
| Card subtitle → two stacked buttons (Option A) | Task 2 |
| Button labels from `leftPath.label` / `rightPath.label` | Task 2 |
| Button sub-labels from `leftPath.title` / `rightPath.title` | Task 2 |
| Stop propagation on button clicks | Task 2 |
| `onChoosePath` prop on `WayLandscapeCard` | Task 2 + 3 |
| `selectedEntry` state in `/ways` | Task 3 |
| Full-screen gradient modal | Task 3 |
| 1500 ms auto-navigation | Task 3 |
| Navigate to `/ways/$sessionId/world?path=...` | Task 3 |
| `validateSearch` for `path` param in world route | Task 4 |
| `initialPathId` prop on `PlayableWorldExperience` | Task 4 |
| `enterPath` called on mount when `initialPathId` present | Task 4 |

All requirements covered. No gaps.

**Placeholder scan:** No TBD, TODO, or vague steps — all code shown explicitly.

**Type consistency:**

- `PathId` used consistently across all tasks (`"parado" | "mudanca"`).
- `onChoosePath: (path: PathId) => void` defined in Task 2, consumed in Task 3.
- `initialPathId?: PathId` defined in Task 4, passed from world route in same task.
- `selectedEntry.path` is `PathId`, passed as `search: { path: selectedEntry.path }` — matches `validateSearch` output type.
