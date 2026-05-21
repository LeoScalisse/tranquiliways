# Isometric World Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace button-based navigation in TranquiliWays with a 2.5D isometric Three.js world where the user explores Hub Nuvem → Hub Caminho → Ambientes using D-pad (mobile) or WASD/arrows (desktop), with a customizable character.

**Architecture:** Three layers — (1) data model: extend `PlayableWorldV1`/`PathBlueprint` in `model.ts` with `hubDescription` per path and update the Gemini prompt in `generation.ts`; (2) React shell: `IsometricWorld` wraps a vanilla Three.js canvas, `DirectionalPad` overlays it, custom hooks wire directional input and character customization to localStorage; (3) Three.js core: EventBus/GameState/Constants pattern for module communication, World Labs Gaussian Splat scenes for environments (via SparkJS 2.0), Meshy AI for the character GLB.

**Tech Stack:** `three@^0.184.0` (already installed), `@sparkjsdev/spark@^2.0.0` (to install), `motion/react` AnimatePresence (already installed), World Labs Marble API (requires `WORLDLABS_API_KEY`), Meshy AI (requires `MESHY_API_KEY`), `localStorage` for character customization. Tests use `node:assert/strict` matching existing project convention.

---

## File Structure

```
New files:
  src/features/playable-world/core/EventBus.ts
  src/features/playable-world/core/GameState.ts
  src/features/playable-world/core/Constants.ts
  src/features/playable-world/level/AssetLoader.ts
  src/features/playable-world/level/WorldLoader.ts
  src/features/playable-world/ui/isometric-world.tsx
  src/features/playable-world/ui/directional-pad.tsx
  src/features/playable-world/ui/scene-hub-nuvem.ts
  src/features/playable-world/ui/scene-hub-caminho.ts
  src/features/playable-world/ui/scene-ambiente.ts
  src/components/character-customizer.tsx
  src/components/character-avatar.tsx
  src/hooks/use-character-customization.ts
  src/hooks/use-directional-input.ts
  src/features/playable-world/__tests__/model-v2.test.ts

Modified files:
  src/features/playable-world/model.ts        — add hubDescription to PathIntent/PathBlueprint + Zod schemas
  src/features/playable-world/generation.ts   — add hubDescription to Gemini prompt + JSON schema example
  src/features/playable-world/compiler.ts     — pass hubDescription from PathIntent → PathBlueprint
  src/features/playable-world/ui/playable-world-experience.tsx — replace R3F canvas with IsometricWorld
  src/routes/index.tsx                        — add character pill button (top-right)
```

---

## Phase 1 — Data Model Foundation

### Task 1: Add hubDescription to PathIntent + PathBlueprint

**Files:**
- Modify: `src/features/playable-world/model.ts`
- Create: `src/features/playable-world/__tests__/model-v2.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/features/playable-world/__tests__/model-v2.test.ts
import assert from "node:assert/strict";
import { WorldIntentSchema, PlayableWorldV1Schema } from "../model.ts";

// Minimal valid WorldIntent with hubDescription on both paths
const intentWithHub = {
  version: "world-intent-v1",
  theme: "career",
  dilemmaType: "tradeoff",
  cameraPreset: "isometric-calm",
  card: { badge: "T", title: "T", subtitle: "S" },
  hub: { title: "H", subtitle: "S" },
  reflectionPrompt: "O que ficou vivo em você?",
  paths: [
    {
      id: "parado",
      label: "Ficar",
      title: "Mesa vazia",
      summary: "A rotina sem mudança.",
      colorHint: "mist",
      closureLine: "Seguro, mas vazio.",
      hubDescription: "Escritório familiar com luz amarelada e papéis empilhados — o peso da rotina.",
      rooms: [
        {
          id: "quarto",
          title: "Quarto",
          summary: "Manhã pesada.",
          mood: "inércia",
          layout: "sanctuary",
          climate: "dawn",
          propStory: ["bed", "lamp", "plant"],
          hotspots: [
            { kind: "memory", label: "Alarme", prompt: "O que você adia?", insight: "O adiamento tem custo." },
            { kind: "choice", label: "Escolha", prompt: "E se fosse diferente?", insight: "Cada manhã é uma decisão." },
          ],
        },
        {
          id: "sala",
          title: "Sala",
          summary: "TV ligada.",
          mood: "anestesia",
          layout: "corridor",
          climate: "overcast",
          propStory: ["sofa", "lamp", "mug"],
          hotspots: [
            { kind: "body", label: "Corpo", prompt: "Como está seu corpo?", insight: "O corpo guarda o que a mente nega." },
            { kind: "relationship", label: "Distância", prompt: "Quem você evita?", insight: "Isolamento protege e aprisiona." },
          ],
        },
      ],
    },
    {
      id: "mudanca",
      label: "Mudar",
      title: "Primeiro dia",
      summary: "O novo e o incerto.",
      colorHint: "ember",
      closureLine: "Assustador e vivo.",
      hubDescription: "Novo espaço desconhecido com luz diferente — a antessala do possível.",
      rooms: [
        {
          id: "trabalho",
          title: "Trabalho",
          summary: "Novo cargo, novo risco.",
          mood: "antecipação",
          layout: "crossroads",
          climate: "golden",
          propStory: ["desk", "notebook", "plant"],
          hotspots: [
            { kind: "work", label: "Competência", prompt: "O que você sabe fazer?", insight: "Competência constrói confiança." },
            { kind: "future", label: "Futuro", prompt: "Onde você quer estar?", insight: "Clareza de destino guia o caminho." },
          ],
        },
        {
          id: "familia",
          title: "Família",
          summary: "Orgulho partilhado.",
          mood: "conexão",
          layout: "sanctuary",
          climate: "golden",
          propStory: ["table", "chair", "lamp"],
          hotspots: [
            { kind: "relationship", label: "Apoio", prompt: "Quem te apoia?", insight: "Apoio real muda o que é possível." },
            { kind: "support", label: "Vulnerabilidade", prompt: "O que você ainda não disse?", insight: "Honestidade cria conexão." },
          ],
        },
      ],
    },
  ],
};

const result = WorldIntentSchema.safeParse(intentWithHub);
assert.ok(result.success, `WorldIntentSchema should accept hubDescription: ${JSON.stringify(result.error?.issues)}`);
assert.equal(result.data?.paths[0].hubDescription, "Escritório familiar com luz amarelada e papéis empilhados — o peso da rotina.");
assert.equal(result.data?.paths[1].hubDescription, "Novo espaço desconhecido com luz diferente — a antessala do possível.");
console.log("✓ WorldIntentSchema accepts hubDescription on paths");
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
node --experimental-strip-types src/features/playable-world/__tests__/model-v2.test.ts
```

Expected: AssertionError — `hubDescription` not yet in schema.

- [ ] **Step 3: Add hubDescription to PathIntent interface** (around line 130 in model.ts)

```ts
export interface PathIntent {
  id: PathId;
  label: string;
  title: string;
  summary: string;
  colorHint: ColorHint;
  closureLine: string;
  hubDescription?: string; // describes the thematic antechamber for this path's hub scene
}
```

- [ ] **Step 4: Add hubDescription to PathBlueprint interface** (around line 214 in model.ts)

```ts
export interface PathBlueprint {
  id: PathId;
  label: string;
  title: string;
  summary: string;
  closureLine: string;
  colorHint: ColorHint;
  palette: RoomPalette;
  hubDescription?: string; // passed through from PathIntent; used by IsometricWorld for hub scene
  rooms: RoomBlueprint[];
}
```

- [ ] **Step 5: Add hubDescription to BasePathIntentSchema** (inside WorldIntentSchema, around line 305)

Find `const BasePathIntentSchema = z.object({` and add:

```ts
const BasePathIntentSchema = z.object({
  label: shortText,
  title: shortText,
  summary: mediumText,
  colorHint: z.enum(COLOR_HINTS),
  closureLine: shortText,
  hubDescription: z.string().trim().max(220).optional(), // NOVO
});
```

- [ ] **Step 6: Add hubDescription to PathBlueprintSchema** (around line 402)

```ts
const PathBlueprintSchema = z.object({
  id: z.enum(PATH_IDS),
  label: shortText,
  title: shortText,
  summary: mediumText,
  closureLine: shortText,
  colorHint: z.enum(COLOR_HINTS),
  palette: RoomPaletteSchema,
  hubDescription: z.string().optional(), // NOVO
  rooms: RoomBlueprintArraySchema,
});
```

- [ ] **Step 7: Run test — expect PASS**

```bash
node --experimental-strip-types src/features/playable-world/__tests__/model-v2.test.ts
```

Expected: `✓ WorldIntentSchema accepts hubDescription on paths`

- [ ] **Step 8: Commit**

```bash
git add src/features/playable-world/model.ts src/features/playable-world/__tests__/model-v2.test.ts
git commit -m "feat(model): add optional hubDescription to PathIntent and PathBlueprint"
```

---

### Task 2: Update Gemini prompt to request hubDescription

**Files:**
- Modify: `src/features/playable-world/generation.ts`

- [ ] **Step 1: Add hubDescription to CONTRATO section in buildPlayableWorldPrompt**

Find the CONTRATO block (around line 155) and add this rule:

```
- cada path DEVE ter um campo "hubDescription": string de 1-2 linhas descrevendo o ambiente físico e emocional da antessala desse caminho (ex: "escritório familiar com papéis velhos e luz amarelada — o peso da rotina cotidiana"; "espaço desconhecido cheio de luz nova — a antessala do possível")
```

- [ ] **Step 2: Add hubDescription to the JSON schema example in buildPlayableWorldPrompt**

Find the `"paths": [` block in the return string and add `"hubDescription"` to each path object:

```json
{
  "id": "parado",
  "label": "<nome humano do caminho>",
  "title": "<titulo poetico curto>",
  "summary": "<resumo concreto>",
  "colorHint": "mist" | "ember" | ...,
  "closureLine": "<frase curta>",
  "hubDescription": "<descricao da antessala desse caminho, 1-2 linhas concretas>",
  "rooms": [...]
}
```

- [ ] **Step 3: Verify prompt contains hubDescription**

```bash
node --experimental-strip-types -e "
import { buildPlayableWorldPrompt } from './src/features/playable-world/generation.ts';
const p = buildPlayableWorldPrompt('Devo mudar de emprego?', []);
console.log(p.includes('hubDescription') ? '✓ prompt has hubDescription' : '✗ MISSING');
"
```

Expected: `✓ prompt has hubDescription`

- [ ] **Step 4: Commit**

```bash
git add src/features/playable-world/generation.ts
git commit -m "feat(generation): add hubDescription to Gemini world prompt"
```

---

### Task 3: Pass hubDescription through compiler

**Files:**
- Modify: `src/features/playable-world/compiler.ts`

- [ ] **Step 1: Find the function that builds PathBlueprint from PathIntent**

Search for where `PathBlueprint` is assembled. Look for a function like `compilePathBlueprint` or similar:

```bash
grep -n "PathBlueprint\|pathBlueprint\|palette.*rooms" src/features/playable-world/compiler.ts | head -20
```

- [ ] **Step 2: Add hubDescription to the PathBlueprint return object**

In the function that returns a `PathBlueprint`, add:

```ts
return {
  id: intent.id,
  label: intent.label,
  title: intent.title,
  summary: intent.summary,
  closureLine: intent.closureLine,
  colorHint: intent.colorHint,
  palette: compiledPalette,
  hubDescription: intent.hubDescription, // NOVO — pass through from intent
  rooms: compiledRooms,
};
```

- [ ] **Step 3: Verify compiler test still passes**

```bash
node --experimental-strip-types src/features/playable-world/__tests__/compiler.test.ts
```

Expected: all existing assertions pass.

- [ ] **Step 4: Commit**

```bash
git add src/features/playable-world/compiler.ts
git commit -m "feat(compiler): pass hubDescription from PathIntent through to PathBlueprint"
```

---

## Phase 2 — Input Controls

### Task 4: use-directional-input hook

**Files:**
- Create: `src/hooks/use-directional-input.ts`

- [ ] **Step 1: Create the hook**

```ts
// src/hooks/use-directional-input.ts
import { useEffect, type RefObject } from "react";

export type DirectionalInput = { dx: number; dy: number };

export function useDirectionalInput(inputRef: RefObject<DirectionalInput>): void {
  useEffect(() => {
    const keys = new Set<string>();

    function computeDelta(): DirectionalInput {
      let dx = 0;
      let dy = 0;
      if (keys.has("ArrowLeft") || keys.has("a") || keys.has("A")) dx = -1;
      if (keys.has("ArrowRight") || keys.has("d") || keys.has("D")) dx = 1;
      if (keys.has("ArrowUp") || keys.has("w") || keys.has("W")) dy = 1;
      if (keys.has("ArrowDown") || keys.has("s") || keys.has("S")) dy = -1;
      return { dx, dy };
    }

    function onKeyDown(e: KeyboardEvent) {
      keys.add(e.key);
      const d = computeDelta();
      if (inputRef.current) { inputRef.current.dx = d.dx; inputRef.current.dy = d.dy; }
    }

    function onKeyUp(e: KeyboardEvent) {
      keys.delete(e.key);
      const d = computeDelta();
      if (inputRef.current) { inputRef.current.dx = d.dx; inputRef.current.dy = d.dy; }
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [inputRef]);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/use-directional-input.ts
git commit -m "feat(hooks): add use-directional-input for unified WASD/arrow input"
```

---

### Task 5: Install @sparkjsdev/spark

- [ ] **Step 1: Install**

```bash
npm install @sparkjsdev/spark@^2.0.0
```

- [ ] **Step 2: Verify**

```bash
node -e "import('@sparkjsdev/spark').then(m => console.log('SparkJS OK:', typeof m.SparkRenderer, typeof m.SplatMesh))"
```

Expected: `SparkJS OK: function function`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add @sparkjsdev/spark@^2.0.0 for Gaussian Splat rendering"
```

---

## Phase 3 — Three.js Core Infrastructure

### Task 6: EventBus

**Files:**
- Create: `src/features/playable-world/core/EventBus.ts`

- [ ] **Step 1: Create EventBus**

```ts
// src/features/playable-world/core/EventBus.ts
type Handler<T = unknown> = (data: T) => void;

class EventBusClass {
  private listeners = new Map<string, Set<Handler>>();

  on<T>(event: string, handler: Handler<T>): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler as Handler);
    return () => this.listeners.get(event)?.delete(handler as Handler);
  }

  once<T>(event: string, handler: Handler<T>): void {
    const wrap = (data: T) => { handler(data); this.listeners.get(event)?.delete(wrap as Handler); };
    this.on(event, wrap);
  }

  emit<T>(event: string, data: T): void {
    this.listeners.get(event)?.forEach((h) => h(data));
  }

  clear(): void { this.listeners.clear(); }
}

export const EventBus = new EventBusClass();

export const EVENTS = {
  SCENE_ENTER: "scene:enter",
  PORTAL_TRIGGER: "portal:trigger",
  CHARACTER_MOVE: "character:move",
} as const;
```

- [ ] **Step 2: Commit**

```bash
git add src/features/playable-world/core/EventBus.ts
git commit -m "feat(world): add EventBus singleton for inter-module communication"
```

---

### Task 7: GameState (includes Scene type)

**Files:**
- Create: `src/features/playable-world/core/GameState.ts`

- [ ] **Step 1: Create GameState**

```ts
// src/features/playable-world/core/GameState.ts
import type { PathId } from "../model.ts";

export type Scene =
  | { type: "hub-nuvem" }
  | { type: "hub-caminho"; path: PathId }
  | { type: "ambiente"; path: PathId; index: number };

interface State {
  currentScene: Scene;
  visitedScenes: Set<string>;
}

class GameStateClass {
  private state: State = {
    currentScene: { type: "hub-nuvem" },
    visitedScenes: new Set(),
  };

  get currentScene(): Scene { return this.state.currentScene; }

  setScene(scene: Scene): void {
    this.state.currentScene = scene;
    this.state.visitedScenes.add(JSON.stringify(scene));
  }

  hasVisited(scene: Scene): boolean {
    return this.state.visitedScenes.has(JSON.stringify(scene));
  }

  reset(): void {
    this.state = { currentScene: { type: "hub-nuvem" }, visitedScenes: new Set() };
  }
}

export const GameState = new GameStateClass();
```

- [ ] **Step 2: Commit**

```bash
git add src/features/playable-world/core/GameState.ts
git commit -m "feat(world): add GameState singleton with Scene type and visited tracking"
```

---

### Task 8: Constants

**Files:**
- Create: `src/features/playable-world/core/Constants.ts`

- [ ] **Step 1: Create Constants**

```ts
// src/features/playable-world/core/Constants.ts
export const CAMERA = {
  FRUSTUM_SIZE: 10,
  NEAR: 0.1,
  FAR: 100,
  POSITION: [15, 15, 15] as const,
} as const;

export const CHARACTER = {
  MOVE_SPEED: 4,
  SCALE: 0.8,
  ROTATION_OFFSET: Math.PI, // Meshy models typically face -Z; rotate to face movement
  MODEL_PATH: "assets/models/character.glb",
  WALK_ANIM_PATH: "assets/models/character-walk.glb",
} as const;

export const PORTAL = {
  PARADO_POSITION: [-2.5, 0, 0] as const,
  MUDANCA_POSITION: [2.5, 0, 0] as const,
  TRIGGER_RADIUS: 1.5,
  GLOW_PARADO: "#3b82f6",    // blue
  GLOW_MUDANCA: "#f59e0b",   // gold
} as const;

export const DPAD = {
  HIDE_DELAY_MS: 5000,
  OPACITY_ACTIVE: 0.4,
  SIZE_PX: 130,
} as const;

export const TRANSITION = {
  DURATION: 0.4,
  EASE: [0.16, 1, 0.3, 1] as const,
} as const;

export const WORLD_LABS = {
  DESKTOP_TIER: "500k",
  MOBILE_TIER: "100k",
  WORLDS_BASE: "assets/worlds/",
} as const;
```

- [ ] **Step 2: Commit**

```bash
git add src/features/playable-world/core/Constants.ts
git commit -m "feat(world): add Constants — zero magic numbers in Three.js code"
```

---

## Phase 4 — Character Customization

### Task 9: use-character-customization hook

**Files:**
- Create: `src/hooks/use-character-customization.ts`

- [ ] **Step 1: Create hook**

```ts
// src/hooks/use-character-customization.ts
import { useState } from "react";

export const SKIN_COLORS   = ["#f5c5a3", "#d4a07a", "#a0674a", "#8d5524", "#5c2f0a"] as const;
export const HAIR_STYLES   = ["curto", "medio", "longo", "cacheado"] as const;
export const HAIR_COLORS   = ["#1a0a00", "#8b4513", "#d4a800", "#ff6b6b", "#6b6bff"] as const;
export const EYE_COLORS    = ["#3d2b1f", "#3b7a57", "#4a90d9", "#888888"] as const;
export const SHIRTS        = ["basica", "camisa", "moletom"] as const;
export const SHIRT_COLORS  = ["#ffffff", "#4a90d9", "#e74c3c", "#2ecc71", "#333333"] as const;
export const PANTS         = ["calca", "bermuda", "saia"] as const;
export const PANTS_COLORS  = ["#2c3e50", "#4a90d9", "#e74c3c", "#ffffff", "#333333"] as const;
export const SHOES         = ["tenis", "sapato", "bota"] as const;
export const SHOE_COLORS   = ["#ffffff", "#333333", "#8b4513", "#e74c3c"] as const;

export type CharacterCustomization = {
  skinColor: string;
  hairStyle: string;
  hairColor: string;
  eyeColor: string;
  shirt: string;
  shirtColor: string;
  pants: string;
  pantsColor: string;
  shoes: string;
  shoeColor: string;
};

const STORAGE_KEY = "tranquili_character_v1";

const DEFAULT: CharacterCustomization = {
  skinColor:  SKIN_COLORS[0],
  hairStyle:  HAIR_STYLES[0],
  hairColor:  HAIR_COLORS[0],
  eyeColor:   EYE_COLORS[0],
  shirt:      SHIRTS[0],
  shirtColor: SHIRT_COLORS[0],
  pants:      PANTS[0],
  pantsColor: PANTS_COLORS[0],
  shoes:      SHOES[0],
  shoeColor:  SHOE_COLORS[0],
};

function load(): CharacterCustomization {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    return raw ? { ...DEFAULT, ...(JSON.parse(raw) as Partial<CharacterCustomization>) } : { ...DEFAULT };
  } catch { return { ...DEFAULT }; }
}

export const CHARACTER_OPTIONS = {
  skinColor:  SKIN_COLORS,
  hairStyle:  HAIR_STYLES,
  hairColor:  HAIR_COLORS,
  eyeColor:   EYE_COLORS,
  shirt:      SHIRTS,
  shirtColor: SHIRT_COLORS,
  pants:      PANTS,
  pantsColor: PANTS_COLORS,
  shoes:      SHOES,
  shoeColor:  SHOE_COLORS,
} as const satisfies Record<keyof CharacterCustomization, readonly string[]>;

export function useCharacterCustomization() {
  const [customization, setCustomization] = useState<CharacterCustomization>(load);

  function update(patch: Partial<CharacterCustomization>) {
    setCustomization((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function cycleOption(key: keyof CharacterCustomization, direction: -1 | 1) {
    const opts = CHARACTER_OPTIONS[key] as readonly string[];
    const idx = opts.indexOf(customization[key]);
    update({ [key]: opts[(idx + direction + opts.length) % opts.length] });
  }

  return { customization, update, cycleOption };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/use-character-customization.ts
git commit -m "feat(hooks): add use-character-customization with localStorage persistence"
```

---

### Task 10: CharacterAvatar component

**Files:**
- Create: `src/components/character-avatar.tsx`

- [ ] **Step 1: Create SVG avatar**

```tsx
// src/components/character-avatar.tsx
import type { CharacterCustomization } from "@/hooks/use-character-customization.ts";

interface Props {
  customization: CharacterCustomization;
  size?: number;
  activeAttribute?: keyof CharacterCustomization | null;
}

function highlight(attr: keyof CharacterCustomization | null, ...keys: string[]) {
  return attr && keys.includes(attr) ? "#3b82f6" : "none";
}

export function CharacterAvatar({ customization, size = 200, activeAttribute = null }: Props) {
  return (
    <svg
      width={size}
      height={size * 1.6}
      viewBox="0 0 100 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Hair back */}
      <ellipse cx="50" cy="28" rx="21" ry="17" fill={customization.hairColor}
        stroke={highlight(activeAttribute, "hairStyle", "hairColor")} strokeWidth="2" />
      {/* Head */}
      <ellipse cx="50" cy="37" rx="17" ry="19" fill={customization.skinColor} />
      {/* Eyes */}
      <ellipse cx="44" cy="34" rx="2.5" ry="2.5" fill={customization.eyeColor}
        stroke={highlight(activeAttribute, "eyeColor")} strokeWidth="1.5" />
      <ellipse cx="56" cy="34" rx="2.5" ry="2.5" fill={customization.eyeColor}
        stroke={highlight(activeAttribute, "eyeColor")} strokeWidth="1.5" />
      {/* Neck */}
      <rect x="45" y="53" width="10" height="7" fill={customization.skinColor} />
      {/* Shirt / torso */}
      <rect x="32" y="58" width="36" height="34" rx="7" fill={customization.shirtColor}
        stroke={highlight(activeAttribute, "shirt", "shirtColor")} strokeWidth="2" />
      {/* Arms */}
      <rect x="18" y="60" width="14" height="28" rx="6" fill={customization.shirtColor}
        stroke={highlight(activeAttribute, "shirt", "shirtColor")} strokeWidth="1.5" />
      <rect x="68" y="60" width="14" height="28" rx="6" fill={customization.shirtColor}
        stroke={highlight(activeAttribute, "shirt", "shirtColor")} strokeWidth="1.5" />
      {/* Hands */}
      <ellipse cx="25" cy="91" rx="5" ry="5" fill={customization.skinColor} />
      <ellipse cx="75" cy="91" rx="5" ry="5" fill={customization.skinColor} />
      {/* Pants left */}
      <rect x="32" y="90" width="16" height="42" rx="5" fill={customization.pantsColor}
        stroke={highlight(activeAttribute, "pants", "pantsColor")} strokeWidth="2" />
      {/* Pants right */}
      <rect x="52" y="90" width="16" height="42" rx="5" fill={customization.pantsColor}
        stroke={highlight(activeAttribute, "pants", "pantsColor")} strokeWidth="2" />
      {/* Shoes */}
      <ellipse cx="40" cy="134" rx="11" ry="6" fill={customization.shoeColor}
        stroke={highlight(activeAttribute, "shoes", "shoeColor")} strokeWidth="2" />
      <ellipse cx="60" cy="134" rx="11" ry="6" fill={customization.shoeColor}
        stroke={highlight(activeAttribute, "shoes", "shoeColor")} strokeWidth="2" />
    </svg>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/character-avatar.tsx
git commit -m "feat(ui): add CharacterAvatar SVG component with highlight support"
```

---

### Task 11: CharacterCustomizer modal

**Files:**
- Create: `src/components/character-customizer.tsx`

- [ ] **Step 1: Create modal**

```tsx
// src/components/character-customizer.tsx
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { CharacterAvatar } from "./character-avatar.tsx";
import {
  useCharacterCustomization,
  type CharacterCustomization,
} from "@/hooks/use-character-customization.ts";
import { TRANSITION } from "@/features/playable-world/core/Constants.ts";

type AttrKey = keyof CharacterCustomization;

interface AttrDef {
  key: AttrKey;
  label: string;
  style: React.CSSProperties;
}

const ATTRS: AttrDef[] = [
  { key: "hairStyle",  label: "Cabelo",       style: { top: "6%",  left: "50%", transform: "translateX(-50%)" } },
  { key: "hairColor",  label: "Cor cabelo",   style: { top: "12%", right: "2%" } },
  { key: "eyeColor",   label: "Olhos",        style: { top: "26%", right: "2%" } },
  { key: "shirt",      label: "Roupa",        style: { top: "44%", right: "2%" } },
  { key: "shirtColor", label: "Cor roupa",    style: { top: "50%", left: "2%" } },
  { key: "pants",      label: "Calça",        style: { top: "65%", right: "2%" } },
  { key: "pantsColor", label: "Cor calça",    style: { top: "71%", left: "2%" } },
  { key: "shoes",      label: "Sapatos",      style: { bottom: "8%", left: "50%", transform: "translateX(-50%)" } },
  { key: "shoeColor",  label: "Cor sapatos",  style: { bottom: "3%", right: "2%" } },
];

interface Props { onClose: () => void }

export function CharacterCustomizer({ onClose }: Props) {
  const { customization, cycleOption } = useCharacterCustomization();
  const [active, setActive] = useState<AttrKey | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: TRANSITION.DURATION }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/92 backdrop-blur-xl"
    >
      <button
        onClick={onClose}
        aria-label="Fechar"
        className="absolute right-5 top-5 rounded-full bg-sky-100/80 p-2"
      >
        <X className="h-5 w-5 text-sky-900" />
      </button>

      <h2 className="mb-4 text-base font-semibold tracking-wide text-sky-950">
        Seu Personagem
      </h2>

      <div className="relative flex h-[65vh] w-full max-w-sm items-center justify-center">
        {/* Balloon buttons */}
        {ATTRS.map((attr) => (
          <button
            key={attr.key}
            onClick={() => setActive(active === attr.key ? null : attr.key)}
            style={{ position: "absolute", ...attr.style }}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              active === attr.key
                ? "border-blue-500 bg-blue-500 text-white"
                : "border-sky-200 bg-white/80 text-sky-700"
            }`}
          >
            {attr.label}
          </button>
        ))}

        {/* Avatar */}
        <CharacterAvatar customization={customization} size={160} activeAttribute={active} />
      </div>

      {/* ◀ value ▶ controls */}
      <div className="mt-4 flex h-16 items-center gap-6">
        <AnimatePresence mode="wait">
          {active ? (
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-5"
            >
              <button
                onClick={() => cycleOption(active, -1)}
                className="rounded-full bg-sky-100 p-3"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-5 w-5 text-sky-900" />
              </button>
              <span className="min-w-[90px] text-center text-sm font-semibold text-sky-950">
                {customization[active]}
              </span>
              <button
                onClick={() => cycleOption(active, 1)}
                className="rounded-full bg-sky-100 p-3"
                aria-label="Próximo"
              >
                <ChevronRight className="h-5 w-5 text-sky-900" />
              </button>
            </motion.div>
          ) : (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm text-sky-950/50"
            >
              Toque num balloon para customizar
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/character-customizer.tsx
git commit -m "feat(ui): add CharacterCustomizer modal with balloon UI and ◀▶ cycle"
```

---

### Task 12: Add character pill button to home screen

**Files:**
- Modify: `src/routes/index.tsx`

- [ ] **Step 1: Check LiquidGlassButton props**

```bash
grep -n "interface\|type.*Props\|onClick\|to " src/components/ui/liquid-glass-button.tsx | head -20
```

If `LiquidGlassButton` only accepts `to` (link prop), use a plain button styled like the existing one. If it accepts `onClick`, use it directly.

- [ ] **Step 2: Add state + import**

At top of the `Index` function, add:

```tsx
const [showCustomizer, setShowCustomizer] = useState(false);
```

Add import:

```tsx
import { AnimatePresence } from "motion/react";
import { CharacterCustomizer } from "@/components/character-customizer.tsx";
```

- [ ] **Step 3: Add pill button top-right (mirroring Ways button top-left)**

Inside the `return` (the non-loading return), after the existing Ways button div:

```tsx
<div className="absolute right-4 top-4 z-10">
  <button
    type="button"
    onClick={() => setShowCustomizer(true)}
    className="glass-panel inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-sky-950/72 transition hover:bg-white/80"
  >
    Personagem
  </button>
</div>
```

- [ ] **Step 4: Add CharacterCustomizer at end of return**

```tsx
<AnimatePresence>
  {showCustomizer && (
    <CharacterCustomizer onClose={() => setShowCustomizer(false)} />
  )}
</AnimatePresence>
```

- [ ] **Step 5: Run dev + visual check**

```bash
npm run dev
```

Open browser. Verify: (a) pill button top-right, (b) clicking opens customizer modal, (c) balloons work, (d) ◀▶ cycle changes colors on avatar, (e) close button works, (f) reopening modal shows saved state (localStorage).

- [ ] **Step 6: Commit**

```bash
git add src/routes/index.tsx
git commit -m "feat(ui): add character customizer pill button to home screen"
```

---

## Phase 5 — Three.js Scenes

### Task 13: DirectionalPad component

**Files:**
- Create: `src/features/playable-world/ui/directional-pad.tsx`

- [ ] **Step 1: Create D-pad**

```tsx
// src/features/playable-world/ui/directional-pad.tsx
import { useEffect, useRef, type RefObject } from "react";
import { DPAD } from "../core/Constants.ts";
import type { DirectionalInput } from "@/hooks/use-directional-input.ts";

interface Props { inputRef: RefObject<DirectionalInput> }

type Dir = "up" | "down" | "left" | "right";

function dirToInput(dir: Dir): DirectionalInput {
  switch (dir) {
    case "up":    return { dx: 0, dy: 1 };
    case "down":  return { dx: 0, dy: -1 };
    case "left":  return { dx: -1, dy: 0 };
    case "right": return { dx: 1, dy: 0 };
  }
}

export function DirectionalPad({ inputRef }: Props) {
  const padRef = useRef<HTMLDivElement>(null);
  const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchingRef = useRef(false);

  function showPad() {
    const el = padRef.current;
    if (!el) return;
    el.style.opacity = String(DPAD.OPACITY_ACTIVE);
    if (hideRef.current) clearTimeout(hideRef.current);
    hideRef.current = setTimeout(() => {
      if (!touchingRef.current && padRef.current) {
        padRef.current.style.opacity = "0";
      }
    }, DPAD.HIDE_DELAY_MS);
  }

  useEffect(() => {
    // Show d-pad on any screen touch
    document.addEventListener("touchstart", showPad, { passive: true });
    return () => document.removeEventListener("touchstart", showPad);
  }, []);

  function onPressStart(dir: Dir) {
    touchingRef.current = true;
    showPad();
    const d = dirToInput(dir);
    if (inputRef.current) { inputRef.current.dx = d.dx; inputRef.current.dy = d.dy; }
  }

  function onPressEnd() {
    touchingRef.current = false;
    if (inputRef.current) { inputRef.current.dx = 0; inputRef.current.dy = 0; }
    showPad();
  }

  const btnClass = "select-none bg-white/50 active:bg-white/80 backdrop-blur-sm rounded-lg touch-none";
  const w = DPAD.SIZE_PX;

  return (
    <div
      ref={padRef}
      className="pointer-events-auto absolute bottom-8 left-8 transition-opacity duration-[600ms]"
      style={{ opacity: 0, width: w, height: w }}
    >
      {/* + shape: three 1/3 rows, three 1/3 cols */}
      <div className="grid h-full w-full" style={{ gridTemplate: "repeat(3,1fr) / repeat(3,1fr)" }}>
        {/* Row 1 */}
        <div />
        <button
          aria-label="Cima"
          className={btnClass}
          onTouchStart={() => onPressStart("up")}
          onTouchEnd={onPressEnd}
          onMouseDown={() => onPressStart("up")}
          onMouseUp={onPressEnd}
        />
        <div />
        {/* Row 2 */}
        <button
          aria-label="Esquerda"
          className={btnClass}
          onTouchStart={() => onPressStart("left")}
          onTouchEnd={onPressEnd}
          onMouseDown={() => onPressStart("left")}
          onMouseUp={onPressEnd}
        />
        <div className="bg-white/20 rounded-sm" /> {/* center */}
        <button
          aria-label="Direita"
          className={btnClass}
          onTouchStart={() => onPressStart("right")}
          onTouchEnd={onPressEnd}
          onMouseDown={() => onPressStart("right")}
          onMouseUp={onPressEnd}
        />
        {/* Row 3 */}
        <div />
        <button
          aria-label="Baixo"
          className={btnClass}
          onTouchStart={() => onPressStart("down")}
          onTouchEnd={onPressEnd}
          onMouseDown={() => onPressStart("down")}
          onMouseUp={onPressEnd}
        />
        <div />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/playable-world/ui/directional-pad.tsx
git commit -m "feat(world): add DirectionalPad — Tranquili+ cross shape, auto-hide 5s"
```

---

### Task 14: SceneHubNuvem — ethereal white Three.js scene

**Files:**
- Create: `src/features/playable-world/ui/scene-hub-nuvem.ts`

- [ ] **Step 1: Create scene**

```ts
// src/features/playable-world/ui/scene-hub-nuvem.ts
import * as THREE from "three";
import { PORTAL } from "../core/Constants.ts";
import type { PathId, PlayableWorldV1 } from "../model.ts";

export type PortalCallback = (pathId: PathId) => void;

export function createHubNuvemScene(world: PlayableWorldV1, onPortal: PortalCallback): THREE.Group {
  const group = new THREE.Group();

  // Ground
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 24),
    new THREE.MeshStandardMaterial({ color: "#f8fafc", roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  group.add(ground);

  // Lighting — bright, ethereal
  group.add(new THREE.AmbientLight(0xffffff, 1.4));
  const ptLight = new THREE.PointLight(0xdde8ff, 1.8, 20);
  ptLight.position.set(0, 6, 0);
  group.add(ptLight);

  // Cloud puffs
  for (let i = 0; i < 16; i++) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(Math.random() * 0.7 + 0.3, 6, 5),
      new THREE.MeshStandardMaterial({ color: "#ffffff", transparent: true, opacity: 0.65 }),
    );
    mesh.position.set((Math.random() - 0.5) * 18, Math.random() * 2.5 + 0.8, (Math.random() - 0.5) * 18);
    group.add(mesh);
  }

  // Portal parado (blue)
  const paradoGroup = buildPortal(
    world.paths[0].label,
    PORTAL.GLOW_PARADO,
    PORTAL.PARADO_POSITION,
  );
  paradoGroup.userData.pathId = "parado" satisfies PathId;
  group.add(paradoGroup);

  // Portal mudanca (gold)
  const mudancaGroup = buildPortal(
    world.paths[1].label,
    PORTAL.GLOW_MUDANCA,
    PORTAL.MUDANCA_POSITION,
  );
  mudancaGroup.userData.pathId = "mudanca" satisfies PathId;
  group.add(mudancaGroup);

  group.userData.portals = [paradoGroup, mudancaGroup];
  group.userData.onPortal = onPortal;

  return group;
}

function buildPortal(
  label: string,
  color: string,
  pos: readonly [number, number, number],
): THREE.Group {
  const g = new THREE.Group();
  g.position.set(pos[0], pos[1], pos[2]);

  // Arch (half torus)
  const arch = new THREE.Mesh(
    new THREE.TorusGeometry(0.85, 0.09, 8, 32, Math.PI),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.7 }),
  );
  arch.rotation.z = -Math.PI / 2;
  arch.position.y = 0.85;
  g.add(arch);

  // Door fill
  const door = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 2),
    new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.18, side: THREE.DoubleSide }),
  );
  door.position.y = 1;
  g.add(door);

  // Glow point
  const glow = new THREE.PointLight(color, 1.4, 4);
  glow.position.y = 1;
  g.add(glow);

  // Label sprite
  g.add(makeTextSprite(label, color, 256, 56, pos[0] < 0 ? 0 : Math.PI));

  return g;
}

function makeTextSprite(text: string, color: string, w: number, h: number, _rotY = 0): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = color;
  ctx.font = "bold 22px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(text, w / 2, h / 2 + 8, w - 12);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true }));
  sprite.scale.set(2, 0.45, 1);
  sprite.position.set(0, 2.35, 0);
  return sprite;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/playable-world/ui/scene-hub-nuvem.ts
git commit -m "feat(world): add SceneHubNuvem — ethereal white Three.js scene with two portals"
```

---

### Task 15: SceneHubCaminho — themed antechamber scene

**Files:**
- Create: `src/features/playable-world/ui/scene-hub-caminho.ts`

- [ ] **Step 1: Create scene**

```ts
// src/features/playable-world/ui/scene-hub-caminho.ts
import * as THREE from "three";
import type { PathBlueprint } from "../model.ts";

export type AmbienteCallback = (index: number) => void;
export type HubNuvemCallback = () => void;

export function createHubCaminhoScene(
  path: PathBlueprint,
  onAmbiente: AmbienteCallback,
  onHubNuvem: HubNuvemCallback,
): THREE.Group {
  const group = new THREE.Group();

  // Ground
  group.add(createGround(path.palette.ground));

  // Lights
  group.add(new THREE.AmbientLight(path.palette.skyTop, 0.9));
  const dir = new THREE.DirectionalLight(path.palette.glow, 1.1);
  dir.position.set(5, 10, 5);
  group.add(dir);

  // Hub description text (billboard)
  if (path.hubDescription) {
    group.add(makeTextSprite(path.hubDescription, path.palette.accent, 400, 80, 3.5));
  } else {
    group.add(makeTextSprite(path.title, path.palette.highlight, 300, 56, 3.5));
  }

  // Ambiente doors — fan arrangement
  const doors: THREE.Group[] = [];
  const angles = fanAngles(path.rooms.length);
  path.rooms.forEach((room, i) => {
    const door = buildDoor(room.title, path.palette.accent, path.palette.highlight, angles[i], 3.2);
    door.userData.roomIndex = i;
    doors.push(door);
    group.add(door);
  });

  // Return door (back to Hub Nuvem)
  const returnDoor = buildDoor("← Limiar", "#94a3b8", "#e2e8f0", 0, 4.5);
  returnDoor.userData.isReturn = true;
  group.add(returnDoor);

  group.userData.doors = doors;
  group.userData.returnDoor = returnDoor;
  group.userData.onAmbiente = onAmbiente;
  group.userData.onHubNuvem = onHubNuvem;

  return group;
}

function createGround(color: string): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color, roughness: 0.85 }),
  );
  m.rotation.x = -Math.PI / 2;
  return m;
}

function buildDoor(label: string, color: string, textColor: string, angle: number, radius: number): THREE.Group {
  const g = new THREE.Group();
  g.position.set(Math.sin(angle) * radius, 0, -Math.cos(angle) * radius);
  g.rotation.y = angle;

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 2.2, 0.1),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.25 }),
  );
  frame.position.y = 1.1;
  g.add(frame);

  g.add(makeTextSprite(label, textColor, 256, 56, 2.6));
  return g;
}

function fanAngles(count: number): number[] {
  if (count === 1) return [Math.PI];
  const span = (Math.PI * 2) / 3; // 120° spread
  return Array.from({ length: count }, (_, i) => Math.PI - span / 2 + (span / (count - 1)) * i);
}

function makeTextSprite(text: string, color: string, w: number, h: number, y: number): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = color;
  ctx.font = "18px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(text, w / 2, h / 2 + 6, w - 16);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true }));
  sprite.scale.set(w / 64, h / 64, 1);
  sprite.position.y = y;
  return sprite;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/playable-world/ui/scene-hub-caminho.ts
git commit -m "feat(world): add SceneHubCaminho — themed antechamber with ambiente doors"
```

---

### Task 16: SceneAmbiente — room scene

**Files:**
- Create: `src/features/playable-world/ui/scene-ambiente.ts`

- [ ] **Step 1: Create scene**

```ts
// src/features/playable-world/ui/scene-ambiente.ts
import * as THREE from "three";
import type { RoomBlueprint } from "../model.ts";

export type HubCaminhoCallback = () => void;

export function createAmbienteScene(room: RoomBlueprint, onHubCaminho: HubCaminhoCallback): THREE.Group {
  const group = new THREE.Group();

  // Ground
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 14),
    new THREE.MeshStandardMaterial({ color: room.palette.ground, roughness: 0.88 }),
  );
  ground.rotation.x = -Math.PI / 2;
  group.add(ground);

  // Lights
  group.add(new THREE.AmbientLight(room.palette.skyTop, 0.85));
  const dir = new THREE.DirectionalLight(room.palette.glow, 1.0);
  dir.position.set(5, 10, 5);
  group.add(dir);

  // Prop placeholder cubes (replaced by Meshy props later)
  room.props.forEach((prop) => {
    const h = 0.4 + Math.random() * 0.4;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, h, 0.35),
      new THREE.MeshStandardMaterial({ color: prop.tint || room.palette.prop }),
    );
    mesh.position.set(prop.position[0], h / 2, prop.position[2]);
    group.add(mesh);
  });

  // Room title + summary billboard
  group.add(makeTextSprite(room.title,   room.palette.highlight, 256, 48, 3.8));
  group.add(makeTextSprite(room.summary, room.palette.accent,    360, 72, 3.2));

  // Return door (back to hub caminho)
  const returnDoor = new THREE.Group();
  returnDoor.position.set(0, 0, 5);
  returnDoor.userData.isReturn = true;
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 2.2, 0.1),
    new THREE.MeshStandardMaterial({ color: room.palette.skyTop, transparent: true, opacity: 0.55 }),
  );
  frame.position.y = 1.1;
  returnDoor.add(frame);
  returnDoor.add(makeTextSprite("← Caminho", room.palette.highlight, 220, 48, 2.6));
  group.add(returnDoor);

  group.userData.returnDoor = returnDoor;
  group.userData.onHubCaminho = onHubCaminho;

  return group;
}

function makeTextSprite(text: string, color: string, w: number, h: number, y: number): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = color;
  ctx.font = "16px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(text, w / 2, h / 2 + 6, w - 16);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true }));
  sprite.scale.set(w / 64, h / 64, 1);
  sprite.position.y = y;
  return sprite;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/playable-world/ui/scene-ambiente.ts
git commit -m "feat(world): add SceneAmbiente — room scene with prop placeholders and return door"
```

---

### Task 17: IsometricWorld component — scene state machine + Three.js loop

**Files:**
- Create: `src/features/playable-world/ui/isometric-world.tsx`

- [ ] **Step 1: Create component**

```tsx
// src/features/playable-world/ui/isometric-world.tsx
import * as THREE from "three";
import { useEffect, useRef, useState } from "react";
import { GameState, type Scene } from "../core/GameState.ts";
import { CAMERA, CHARACTER, PORTAL } from "../core/Constants.ts";
import type { PathId, PlayableWorldV1 } from "../model.ts";
import { useDirectionalInput, type DirectionalInput } from "@/hooks/use-directional-input.ts";
import { DirectionalPad } from "./directional-pad.tsx";
import { createHubNuvemScene, type PortalCallback } from "./scene-hub-nuvem.ts";
import { createHubCaminhoScene } from "./scene-hub-caminho.ts";
import { createAmbienteScene } from "./scene-ambiente.ts";

interface Props {
  world: PlayableWorldV1;
  onBrowseWays?: () => void;
}

export function IsometricWorld({ world, onBrowseWays }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<DirectionalInput>({ dx: 0, dy: 0 });
  const [scene, setScene] = useState<Scene>({ type: "hub-nuvem" });

  useDirectionalInput(inputRef);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    GameState.reset();

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0xf0f4f8);

    // Camera — isometric orthographic
    const frustum = CAMERA.FRUSTUM_SIZE;
    function makeCamera(w: number, h: number) {
      const a = w / h;
      const cam = new THREE.OrthographicCamera(-frustum * a, frustum * a, frustum, -frustum, CAMERA.NEAR, CAMERA.FAR);
      cam.position.set(CAMERA.POSITION[0], CAMERA.POSITION[1], CAMERA.POSITION[2]);
      cam.lookAt(0, 0, 0);
      return cam;
    }
    let camera = makeCamera(canvas.clientWidth, canvas.clientHeight);
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

    // Scene
    const scene3d = new THREE.Scene();
    scene3d.fog = new THREE.Fog(0xf0f4f8, 10, 22);

    // Character — placeholder box (replaced in Task 24 by Meshy GLB)
    const charMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.9, 0.38),
      new THREE.MeshStandardMaterial({ color: "#f5c5a3" }),
    );
    charMesh.position.set(0, 0.45, 0);
    scene3d.add(charMesh);

    const clock = new THREE.Clock();
    const TRIGGER = PORTAL.TRIGGER_RADIUS;

    let activeGroup: THREE.Group | null = null;

    // ---- Scene loader ----
    function loadScene(s: Scene) {
      if (activeGroup) scene3d.remove(activeGroup);
      charMesh.position.set(0, 0.45, 0);

      if (s.type === "hub-nuvem") {
        scene3d.fog = new THREE.Fog(0xf0f4f8, 12, 26);
        activeGroup = createHubNuvemScene(world, (pathId: PathId) => {
          const next: Scene = { type: "hub-caminho", path: pathId };
          GameState.setScene(next);
          setScene(next);
          loadScene(next);
        });
      } else if (s.type === "hub-caminho") {
        const path = world.paths.find((p) => p.id === s.path)!;
        const fogColor = new THREE.Color(path.palette.skyBottom);
        scene3d.fog = new THREE.Fog(fogColor, 10, 22);
        activeGroup = createHubCaminhoScene(
          path,
          (index: number) => {
            const next: Scene = { type: "ambiente", path: s.path, index };
            GameState.setScene(next);
            setScene(next);
            loadScene(next);
          },
          () => {
            const next: Scene = { type: "hub-nuvem" };
            GameState.setScene(next);
            setScene(next);
            loadScene(next);
          },
        );
      } else {
        const path = world.paths.find((p) => p.id === s.path)!;
        const room = path.rooms[s.index];
        scene3d.fog = new THREE.Fog(new THREE.Color(room.palette.skyBottom), 8, 18);
        activeGroup = createAmbienteScene(room, () => {
          const next: Scene = { type: "hub-caminho", path: s.path };
          GameState.setScene(next);
          setScene(next);
          loadScene(next);
        });
      }

      if (activeGroup) scene3d.add(activeGroup);
    }

    loadScene({ type: "hub-nuvem" });

    // ---- Animation loop ----
    renderer.setAnimationLoop(() => {
      const delta = Math.min(clock.getDelta(), 0.1);
      const { dx, dy } = inputRef.current;

      // Move character (isometric axes: screen-right = world NE, screen-up = world NW)
      if (dx !== 0 || dy !== 0) {
        const speed = CHARACTER.MOVE_SPEED * delta;
        const wx = (dx - dy) * 0.7071;
        const wz = (-dx - dy) * 0.7071;
        charMesh.position.x = Math.max(-7, Math.min(7, charMesh.position.x + wx * speed));
        charMesh.position.z = Math.max(-7, Math.min(7, charMesh.position.z + wz * speed));
        charMesh.rotation.y = Math.atan2(wx, wz);
      }

      // Portal collision
      if (activeGroup) {
        const portals = activeGroup.userData.portals as THREE.Group[] | undefined;
        if (portals) {
          for (const p of portals) {
            if (charMesh.position.distanceTo(p.position) < TRIGGER) {
              (activeGroup.userData.onPortal as PortalCallback)(p.userData.pathId as PathId);
              break;
            }
          }
        }

        const doors = activeGroup.userData.doors as THREE.Group[] | undefined;
        if (doors) {
          for (const d of doors) {
            if (charMesh.position.distanceTo(d.position) < TRIGGER) {
              (activeGroup.userData.onAmbiente as (i: number) => void)(d.userData.roomIndex as number);
              break;
            }
          }
        }

        const returnDoor = activeGroup.userData.returnDoor as THREE.Group | undefined;
        if (returnDoor && charMesh.position.distanceTo(returnDoor.position) < TRIGGER) {
          const onHN = activeGroup.userData.onHubNuvem as (() => void) | undefined;
          const onHC = activeGroup.userData.onHubCaminho as (() => void) | undefined;
          onHN?.();
          onHC?.();
        }
      }

      renderer.render(scene3d, camera);
    });

    // ---- Resize ----
    const ro = new ResizeObserver(() => {
      if (!canvas) return;
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
      camera = makeCamera(canvas.clientWidth, canvas.clientHeight);
    });
    ro.observe(canvas);

    return () => {
      renderer.setAnimationLoop(null);
      renderer.dispose();
      ro.disconnect();
    };
  }, [world]);

  const sceneLabel = scene.type === "hub-nuvem"
    ? "Limiar das escolhas"
    : scene.type === "hub-caminho"
    ? `${scene.path === "parado" ? "Ficar" : "Mudar"} — antessala`
    : `Ambiente ${scene.type === "ambiente" ? scene.index + 1 : ""}`;

  return (
    <div className="relative h-full w-full overflow-hidden">
      <canvas ref={canvasRef} className="h-full w-full" />

      {/* Scene label top-left */}
      <div className="pointer-events-none absolute left-4 top-4 z-10">
        <div className="rounded-full bg-white/55 px-4 py-2 text-xs uppercase tracking-[0.2em] text-sky-950/65 backdrop-blur-sm">
          {sceneLabel}
        </div>
      </div>

      {/* D-pad overlay */}
      <DirectionalPad inputRef={inputRef} />

      {/* Browse ways */}
      {onBrowseWays && (
        <button
          type="button"
          onClick={onBrowseWays}
          className="pointer-events-auto absolute bottom-8 right-6 rounded-full bg-white/55 px-4 py-2 text-xs text-sky-950/65 backdrop-blur-sm"
        >
          Meus dilemas
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/playable-world/ui/isometric-world.tsx
git commit -m "feat(world): add IsometricWorld — Three.js scene state machine with D-pad navigation"
```

---

### Task 18: Update PlayableWorldExperience to use IsometricWorld

**Files:**
- Modify: `src/features/playable-world/ui/playable-world-experience.tsx`

- [ ] **Step 1: Wrap existing code in a comment block as backup**

Keep all existing code as a comment at top of file (easy rollback). Then replace the export:

```tsx
// src/features/playable-world/ui/playable-world-experience.tsx
import { IsometricWorld } from "./isometric-world.tsx";
import type { PathId, PlayableWorldV1 } from "../model.ts";

interface PlayableWorldExperienceProps {
  world: PlayableWorldV1;
  onBrowseWays?: () => void;
  initialPathId?: PathId;
}

export function PlayableWorldExperience({ world, onBrowseWays }: PlayableWorldExperienceProps) {
  return (
    <section
      className="relative overflow-hidden rounded-[2.25rem] border border-white/35 shadow-[0_28px_72px_rgba(15,48,78,0.18)]"
      style={{ minHeight: "calc(100svh - 2rem)" }}
    >
      <IsometricWorld world={world} onBrowseWays={onBrowseWays} />
    </section>
  );
}
```

- [ ] **Step 2: Run dev and test the world**

```bash
npm run dev
```

Open a session URL (`/ways/:id`). Verify:
- Three.js canvas renders (no black screen, no console errors)
- Hub Nuvem shows white/ethereal scene with two portals
- WASD moves the character box
- Walking into a portal transitions to Hub Caminho
- Hub Caminho shows themed scene with doors
- Walking into a door transitions to an Ambiente
- Return doors work backwards
- D-pad appears on touch (mobile emulation in devtools), hides after 5s

- [ ] **Step 3: Build check**

```bash
npm run build
```

Expected: no TypeScript errors, build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/features/playable-world/ui/playable-world-experience.tsx
git commit -m "feat(world): replace button navigation with IsometricWorld Three.js experience"
```

---

## Phase 6 — World Labs Environments (requires WORLDLABS_API_KEY)

> These tasks require an external API. Generation takes 3-8 minutes per world. Do them after Phase 5 is working with placeholder geometry.

### Task 19: Generate environments with World Labs

**Files:**
- Creates: `public/assets/worlds/hub-parado*.spz`, `hub-parado-collider.glb`, etc.

- [ ] **Step 1: Set API key**

```bash
# Add to .env
echo "WORLDLABS_API_KEY=your-key-here" >> .env
```

- [ ] **Step 2: Check worldlabs-generate.mjs script exists**

```bash
ls scripts/worldlabs-generate.mjs
```

If missing, install it from the worldlabs skill: invoke `worldlabs` skill to get the script.

- [ ] **Step 3: Generate Hub Parado**

```bash
node scripts/worldlabs-generate.mjs \
  --mode text \
  --prompt "isometric 2.5D antechamber for a life dilemma game, path of staying still, familiar office with old papers, warm yellow light, low-poly game aesthetic" \
  --output public/assets/worlds/ \
  --slug hub-parado
```

Wait ~3-8 minutes. Verify files exist: `public/assets/worlds/hub-parado-500k.spz`, `hub-parado-collider.glb`.

- [ ] **Step 4: Generate Hub Mudanca**

```bash
node scripts/worldlabs-generate.mjs \
  --mode text \
  --prompt "isometric 2.5D antechamber for a life dilemma game, path of change, unknown bright new space, cool fresh light, low-poly game aesthetic" \
  --output public/assets/worlds/ \
  --slug hub-mudanca
```

- [ ] **Step 5: Generate Ambientes (parado-0, parado-1, mudanca-0, mudanca-1)**

Repeat for each `visualDescription` / `summary` from the world's rooms. Example for first parado room:

```bash
node scripts/worldlabs-generate.mjs \
  --mode text \
  --prompt "isometric 2.5D game room, <room.summary from the world>, low-poly contemplative aesthetic" \
  --output public/assets/worlds/ \
  --slug ambiente-parado-0
```

- [ ] **Step 6: Commit generated assets**

```bash
git add public/assets/worlds/
git commit -m "assets(worlds): add World Labs Gaussian Splat environments for hub + ambientes"
```

---

### Task 20: WorldLoader.ts — load Gaussian Splat scenes

**Files:**
- Create: `src/features/playable-world/level/WorldLoader.ts`

- [ ] **Step 1: Create WorldLoader**

```ts
// src/features/playable-world/level/WorldLoader.ts
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { SparkRenderer, SplatMesh } from "@sparkjsdev/spark";
import { WORLD_LABS } from "../core/Constants.ts";

const gltfLoader = new GLTFLoader();
const splatCache = new Map<string, SplatMesh>();
const colliderCache = new Map<string, THREE.Object3D>();
let sparkInitialized = false;

function ensureSpark(scene: THREE.Scene, renderer: THREE.WebGLRenderer): void {
  if (sparkInitialized) return;
  const spark = new SparkRenderer({ renderer, sortRadial: true, enableLod: true, lodSplatScale: 1.0 });
  spark.userData.isSpark = true;
  scene.add(spark);
  sparkInitialized = true;
}

export async function loadSplatScene(
  slug: string,
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  mobile = false,
): Promise<{ splat: SplatMesh; collider: THREE.Object3D }> {
  ensureSpark(scene, renderer);
  const tier = mobile ? WORLD_LABS.MOBILE_TIER : WORLD_LABS.DESKTOP_TIER;
  const splatPath = `${WORLD_LABS.WORLDS_BASE}${slug}-${tier}.spz`;
  const colliderPath = `${WORLD_LABS.WORLDS_BASE}${slug}-collider.glb`;

  const [splat, collider] = await Promise.all([
    loadSplat(slug, splatPath, scene),
    loadCollider(slug, colliderPath, scene),
  ]);

  return { splat, collider };
}

async function loadSplat(slug: string, path: string, scene: THREE.Scene): Promise<SplatMesh> {
  if (splatCache.has(slug)) return splatCache.get(slug)!;
  const splat = new SplatMesh({ url: path });
  splat.rotation.x = Math.PI; // World Labs Y-flip
  scene.add(splat);
  if (splat.initialized) await splat.initialized;
  splatCache.set(slug, splat);
  return splat;
}

async function loadCollider(slug: string, path: string, scene: THREE.Scene): Promise<THREE.Object3D> {
  if (colliderCache.has(slug)) return colliderCache.get(slug)!;
  const gltf = await gltfLoader.loadAsync(path);
  const collider = gltf.scene;
  collider.visible = false;
  collider.rotation.x = Math.PI; // Y-flip to match splat
  collider.traverse((c) => {
    if ("isMesh" in c && c.isMesh) {
      (c as THREE.Mesh).material = new THREE.MeshBasicMaterial({ visible: false });
    }
  });
  collider.updateMatrixWorld(true);
  scene.add(collider);
  colliderCache.set(slug, collider);
  return collider;
}

export function getGroundY(collider: THREE.Object3D, x: number, z: number, fallback = 0): number {
  const rc = new THREE.Raycaster(new THREE.Vector3(x, 50, z), new THREE.Vector3(0, -1, 0));
  const hits = rc.intersectObject(collider, true);
  return hits.length > 0 ? hits[0].point.y : fallback;
}

export function clearWorldLoaderCache(): void {
  splatCache.clear();
  colliderCache.clear();
  sparkInitialized = false;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/playable-world/level/WorldLoader.ts
git commit -m "feat(world): add WorldLoader — SparkJS Gaussian Splat + collider loading"
```

---

### Task 21: Connect splat scenes to IsometricWorld

**Files:**
- Modify: `src/features/playable-world/ui/isometric-world.tsx`

- [ ] **Step 1: Import WorldLoader and load splats after placeholder scenes**

In the `useEffect` of `IsometricWorld`, after `loadScene({ type: "hub-nuvem" })`, add background splat loading:

```tsx
import { loadSplatScene } from "../level/WorldLoader.ts";

// After loadScene({ type: "hub-nuvem" }):
const isMobile = window.innerWidth < 768;

// Pre-load hub environments in background
loadSplatScene("hub-parado",  scene3d, renderer, isMobile).catch(() => {/* no splat yet */});
loadSplatScene("hub-mudanca", scene3d, renderer, isMobile).catch(() => {/* no splat yet */});
```

Note: The Gaussian Splats render as overlaid environments. For full integration (character walking inside splat), the character must be positioned using `getGroundY()` from the collider. This is done by updating the animation loop:

```ts
import { getGroundY } from "../level/WorldLoader.ts";

// Inside renderer.setAnimationLoop, after moving charMesh:
// Snap Y to collider ground if collider is loaded
const collider = activeGroup?.userData.collider as THREE.Object3D | undefined;
if (collider) {
  charMesh.position.y = getGroundY(collider, charMesh.position.x, charMesh.position.z, 0.45) + 0.45;
}
```

- [ ] **Step 2: Test splat loading**

```bash
npm run dev
```

Open a world session. Open browser Network tab. Verify `.spz` files load when entering hub-caminho scenes.

- [ ] **Step 3: Commit**

```bash
git add src/features/playable-world/ui/isometric-world.tsx
git commit -m "feat(world): integrate World Labs Gaussian Splat loading for hub environments"
```

---

## Phase 7 — Meshy AI Character (requires MESHY_API_KEY)

> These tasks require Meshy AI API key and take ~10-20 minutes for generation + rigging.

### Task 22: Generate character with Meshy AI

**Files:**
- Creates: `public/assets/models/character.glb`, `character-walk.glb`, `character-run.glb`

- [ ] **Step 1: Set API key**

```bash
echo "MESHY_API_KEY=your-key-here" >> .env
```

- [ ] **Step 2: Check meshy-generate.mjs script exists**

```bash
ls scripts/meshy-generate.mjs
```

If missing, invoke the `meshyai` skill to get the script.

- [ ] **Step 3: Generate character**

```bash
node scripts/meshy-generate.mjs \
  --mode text-to-3d \
  --prompt "androgynous low-poly humanoid character, full body, neutral t-pose, casual warm clothing, game character, clean topology" \
  --pbr --polycount 8000 \
  --output public/assets/models/ \
  --slug character
```

Wait for completion (~5-10 min). Note the `refineTaskId` from the output.

- [ ] **Step 4: Rig the character**

```bash
node scripts/meshy-generate.mjs \
  --mode rig \
  --task-id <refineTaskId from above> \
  --height 1.7 \
  --output public/assets/models/ \
  --slug character
```

Wait for completion (~5-10 min). Verify files: `public/assets/models/character.glb`, `character-walk.glb`.

- [ ] **Step 5: Verify GLB loads**

```bash
node -e "
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const l = new GLTFLoader();
l.load('public/assets/models/character.glb', (g) => {
  console.log('clips:', g.animations.map(a => a.name));
  console.log('meshes:', g.scene.children.length);
});
"
```

Expected: prints clip names and mesh count.

- [ ] **Step 6: Commit**

```bash
git add public/assets/models/
git commit -m "assets(character): add Meshy AI generated character with walk animation"
```

---

### Task 23: AssetLoader — load rigged GLB with SkeletonUtils

**Files:**
- Create: `src/features/playable-world/level/AssetLoader.ts`

- [ ] **Step 1: Create AssetLoader**

```ts
// src/features/playable-world/level/AssetLoader.ts
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { SkeletonUtils } from "three/addons/utils/SkeletonUtils.js";

const loader = new GLTFLoader();
const modelCache = new Map<string, THREE.Object3D>();
const clipCache = new Map<string, THREE.AnimationClip[]>();

export async function loadModel(path: string): Promise<THREE.Object3D> {
  if (!modelCache.has(path)) {
    const gltf = await loader.loadAsync(path);
    modelCache.set(path, gltf.scene);
  }
  return SkeletonUtils.clone(modelCache.get(path)!);
}

export async function loadClips(path: string): Promise<THREE.AnimationClip[]> {
  if (!clipCache.has(path)) {
    const gltf = await loader.loadAsync(path);
    clipCache.set(path, gltf.animations);
  }
  return clipCache.get(path)!;
}

export async function loadCharacterWithAnimations(
  modelPath: string,
  walkPath: string,
): Promise<{
  mesh: THREE.Object3D;
  mixer: THREE.AnimationMixer;
  walkAction: THREE.AnimationAction;
}> {
  const [mesh, walkClips] = await Promise.all([loadModel(modelPath), loadClips(walkPath)]);

  mesh.traverse((c) => {
    if ("isMesh" in c && c.isMesh) {
      (c as THREE.Mesh).castShadow = false;
      (c as THREE.Mesh).receiveShadow = false;
    }
  });

  const mixer = new THREE.AnimationMixer(mesh);
  const walkClip = THREE.AnimationClip.findByName(walkClips, walkClips[0]?.name ?? "");
  const walkAction = mixer.clipAction(walkClip);
  walkAction.play();
  walkAction.setEffectiveWeight(0); // starts idle

  return { mesh, mixer, walkAction };
}

export function applyMeshColor(root: THREE.Object3D, namePart: string, hex: string): void {
  const color = new THREE.Color(hex);
  root.traverse((c) => {
    if ("isMesh" in c && c.isMesh && c.name.toLowerCase().includes(namePart.toLowerCase())) {
      const mat = (c as THREE.Mesh).material;
      if (Array.isArray(mat)) {
        mat.forEach((m) => { if ("color" in m) (m as THREE.MeshStandardMaterial).color.set(color); });
      } else if ("color" in mat) {
        (mat as THREE.MeshStandardMaterial).color.set(color);
      }
    }
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/playable-world/level/AssetLoader.ts
git commit -m "feat(world): add AssetLoader — GLB loading with SkeletonUtils.clone for animated models"
```

---

### Task 24: Character renders in IsometricWorld

**Files:**
- Modify: `src/features/playable-world/ui/isometric-world.tsx`

- [ ] **Step 1: Import AssetLoader and add character loading**

At top of `isometric-world.tsx` add:

```tsx
import { loadCharacterWithAnimations, applyMeshColor } from "../level/AssetLoader.ts";
import { useCharacterCustomization } from "@/hooks/use-character-customization.ts";
```

Inside `IsometricWorld` component, add:

```tsx
const { customization } = useCharacterCustomization();
```

In the `useEffect`, after creating the placeholder `charMesh`, add:

```tsx
let realMesh: THREE.Object3D | null = null;
let mixer: THREE.AnimationMixer | null = null;
let walkAction: THREE.AnimationAction | null = null;

loadCharacterWithAnimations(CHARACTER.MODEL_PATH, CHARACTER.WALK_ANIM_PATH)
  .then(({ mesh, mixer: m, walkAction: w }) => {
    mesh.scale.setScalar(CHARACTER.SCALE);
    mesh.rotation.y = CHARACTER.ROTATION_OFFSET;
    mesh.position.copy(charMesh.position);
    scene3d.remove(charMesh);
    scene3d.add(mesh);
    realMesh = mesh;
    mixer = m;
    walkAction = w;
    // Apply saved customization
    applyMeshColor(mesh, "head", customization.skinColor);
    applyMeshColor(mesh, "hair", customization.hairColor);
    applyMeshColor(mesh, "shirt", customization.shirtColor);
    applyMeshColor(mesh, "pants", customization.pantsColor);
    applyMeshColor(mesh, "shoe", customization.shoeColor);
  })
  .catch(() => { /* character GLB not yet available — placeholder stays */ });
```

In the animation loop, add:

```tsx
// Update mixer
mixer?.update(delta);

// Fade walk in/out based on movement
const isMoving = inputRef.current.dx !== 0 || inputRef.current.dy !== 0;
if (walkAction) {
  const targetWeight = isMoving ? 1 : 0;
  walkAction.setEffectiveWeight(
    THREE.MathUtils.lerp(walkAction.getEffectiveWeight(), targetWeight, delta * 8),
  );
}

// Use real mesh position for collision if loaded
const activeMesh = realMesh ?? charMesh;
```

Replace all `charMesh.position` references in the collision section with `activeMesh.position`.

- [ ] **Step 2: Apply customization when it changes**

Since `customization` is outside the `useEffect`, sync color changes with a separate `useEffect`:

```tsx
useEffect(() => {
  // This runs whenever customization changes; applies colors to the loaded 3D mesh.
  // The realMesh ref is accessed via a module-level ref rather than closure.
  // (If realMesh is not loaded yet, applyMeshColor is a no-op — mesh not in scene.)
}, [customization]);
```

> Note: To properly link `realMesh` across effects, elevate it to a `useRef<THREE.Object3D | null>(null)` at component level, and set it from inside the main useEffect.

- [ ] **Step 3: Run dev + visual check**

```bash
npm run dev
```

Verify:
- Character GLB appears in all scenes instead of placeholder box
- Walk animation plays when moving, stops when still
- Customization colors update on the 3D character

- [ ] **Step 4: Build check**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/features/playable-world/ui/isometric-world.tsx
git commit -m "feat(world): integrate Meshy AI character GLB with walk animation and customization colors"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Covered by task |
|---|---|
| Hub Nuvem — ethereal white, two glowing portals | Task 14 |
| Hub Caminho — AI-generated (World Labs), themed | Tasks 19–21 |
| Ambientes 2–5 per path, AI decides count | Tasks 1–3 (model already supports 2–5 rooms) |
| D-pad + shape (Tranquili+ brand), 40% opacity, hide 5s | Task 13 |
| Desktop WASD/arrows, no visual D-pad | Task 4 |
| use-directional-input hook unifying both inputs | Task 4 |
| hubDescription per path (AI prompt) | Tasks 1–3 |
| hubNuvem portal labels (generated by AI) | Uses `path.label` from existing WorldIntent |
| Character customization — balloon UI, ◀▶ cycle | Tasks 10–11 |
| Character customization — localStorage persistence | Task 9 |
| Pill button on home screen (top-right) | Task 12 |
| Scene state machine (hub-nuvem / hub-caminho / ambiente) | Task 7, 17 |
| Bidirectional navigation (back doors) | Tasks 15, 16, 17 |
| Three.js WebGLRenderer antialias:false | Task 17 |
| renderer.setAnimationLoop() | Task 17 |
| EventBus/GameState/Constants architecture | Tasks 6–8 |
| SparkJS 2.0 SparkRenderer + SplatMesh | Tasks 5, 20 |
| Meshy AI character — generate, rig, animate | Tasks 22–24 |
| SkeletonUtils.clone for animated models | Task 23 |
| MeshStandardMaterial.color per body part | Task 24 |
| Character appears in all scenes | Task 24 |
| Pixel ratio cap Math.min(dpr, 2) | Task 17 |
| Delta cap Math.min(delta, 0.1) | Task 17 |

**Gaps fixed:**
- `hubNuvem.portaParado.label` / `portaMudanca.label` — derived from existing `path.label` (already in `PlayableWorldV1`). No separate AI field needed.
- `skinColor` customization on character — added to Task 24.
- Scene transitions with AnimatePresence — the scene label overlay uses React state; the Three.js scene swap is instant. Full AnimatePresence fade overlay can be added as polish after MVP.

**Type consistency check:**
- `Scene` type defined in `GameState.ts` — imported by `IsometricWorld`, consistent throughout.
- `DirectionalInput` defined in `use-directional-input.ts` — used as `RefObject<DirectionalInput>` in both hook and `DirectionalPad`.
- `PortalCallback` defined in `scene-hub-nuvem.ts` — `(pathId: PathId) => void`, matches usage in `IsometricWorld`.
- `AmbienteCallback` in `scene-hub-caminho.ts` — `(index: number) => void`, matches `IsometricWorld`.
- `HubCaminhoCallback` in `scene-ambiente.ts` — `() => void`, matches `IsometricWorld`.

---

**Plan complete and saved to `docs/superpowers/plans/2026-05-17-isometric-world-navigation.md`.**

**Two execution options:**

**1. Subagent-Driven (recommended)** — fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — execute tasks in this session using `superpowers:executing-plans`

**Which approach?**
