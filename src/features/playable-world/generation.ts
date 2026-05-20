import { z } from "zod";

import {
  CAMERA_PRESETS,
  CLIMATE_PRESETS,
  COLOR_HINTS,
  DILEMMA_THEMES,
  DILEMMA_TYPES,
  HOTSPOT_KINDS,
  PATH_IDS,
  PROP_KINDS,
  ROOM_IDS,
  ROOM_LAYOUTS,
  WorldIntentSchema,
  type ClimatePreset,
  type ColorHint,
  type DilemmaTheme,
  type HotspotKind,
  type PlayableDilemmaType,
  type PropKind,
  type RoomId,
  type RoomLayout,
  type WorldIntent,
} from "./model.ts";

export const GeminiPlayableGuardrailSchema = z.object({
  guardrail: z.literal(true),
});

function list(values: readonly string[]) {
  return values.map((value) => `"${value}"`).join(", ");
}

const PROP_KIND_SET = new Set<string>(PROP_KINDS);
const ROOM_ID_SET = new Set<string>(ROOM_IDS);

// Default fallbacks used when Gemini invents a token outside the enum.
// Picked to be visually neutral so a misclassification doesn't ruin the scene.
const PROP_KIND_FALLBACK: PropKind = "notebook";
const ROOM_ID_FALLBACK: RoomId = "trabalho";

const PROP_KIND_ALIASES: Record<string, PropKind> = {
  // tech / office
  computer: "notebook",
  laptop: "notebook",
  monitor: "desk",
  screen: "desk",
  keyboard: "desk",
  mouse: "desk",
  phone: "notebook",
  smartphone: "notebook",
  cellphone: "notebook",
  calendar: "notebook",
  papers: "notebook",
  documents: "notebook",
  tv: "frame",
  television: "frame",
  radio: "music-player",
  speaker: "music-player",
  // art / creative
  easel: "desk",
  canvas: "frame",
  "paint-brushes": "notebook",
  paintbrushes: "notebook",
  brushes: "notebook",
  palette: "notebook",
  sculpture: "altar",
  statue: "altar",
  // music
  guitar: "music-player",
  piano: "table",
  microphone: "music-player",
  // health / exercise
  treadmill: "desk",
  weights: "altar",
  dumbbell: "altar",
  dumbbells: "altar",
  yoga: "laundry",
  "yoga-mat": "laundry",
  mat: "laundry",
  medicine: "mug",
  pills: "mug",
  // travel
  passport: "notebook",
  map: "frame",
  backpack: "suitcase",
  luggage: "suitcase",
  // kitchen
  stove: "table",
  fridge: "wardrobe",
  refrigerator: "wardrobe",
  oven: "table",
  pan: "mug",
  pot: "mug",
  // bath
  shower: "wardrobe",
  bathtub: "bed",
  toilet: "chair",
  // generic fallbacks
  book: "bookshelf",
  books: "bookshelf",
  shelf: "bookshelf",
  shelves: "bookshelf",
  curtain: "window",
  curtains: "window",
  rug: "laundry",
  carpet: "laundry",
  pillow: "bed",
  pillows: "bed",
  blanket: "laundry",
  clock: "frame",
  vase: "altar",
  painting: "frame",
  poster: "frame",
  photo: "frame",
  photograph: "frame",
};

const ROOM_ID_ALIASES: Record<string, RoomId> = {
  // english synonyms
  bedroom: "quarto",
  room: "quarto",
  "living-room": "sala",
  livingroom: "sala",
  "family-room": "familia",
  family: "familia",
  workspace: "trabalho",
  work: "trabalho",
  office: "escritorio",
  studio: "trabalho",
  atelier: "trabalho", // also a ROOM_LAYOUT, but Gemini frequently uses it as room id
  garden: "jardim",
  kitchen: "cozinha",
  gym: "academia",
  fitness: "academia",
  balcony: "varanda",
  porch: "varanda",
  coffee: "cafe",
  coffeeshop: "cafe",
  "coffee-shop": "cafe",
  library: "biblioteca",
  car: "carro",
  vehicle: "carro",
  school: "escola",
  classroom: "escola",
  hospital: "hospital",
  clinic: "hospital",
  beach: "praia",
  // portuguese variants
  cama: "quarto",
  estar: "sala",
  cozinha: "cozinha",
  escritorio: "escritorio",
};

function normalizeToken(value: string) {
  return value.trim().toLowerCase().replace(/[\s_]+/g, "-");
}

function normalizePropKind(value: unknown): PropKind {
  if (typeof value !== "string") {
    return PROP_KIND_FALLBACK;
  }

  const token = normalizeToken(value);

  if (PROP_KIND_SET.has(token)) {
    return token as PropKind;
  }

  return PROP_KIND_ALIASES[token] ?? PROP_KIND_FALLBACK;
}

function normalizeRoomId(value: unknown): RoomId | unknown {
  if (typeof value !== "string") {
    return value;
  }

  const token = normalizeToken(value);

  if (ROOM_ID_SET.has(token)) {
    return token as RoomId;
  }

  return ROOM_ID_ALIASES[token] ?? ROOM_ID_FALLBACK;
}

const HOTSPOT_KIND_SET = new Set<string>(HOTSPOT_KINDS);
const HOTSPOT_KIND_FALLBACK: HotspotKind = "future";

const HOTSPOT_KIND_ALIASES: Record<string, HotspotKind> = {
  // money / career
  finance: "future",
  money: "future",
  wealth: "future",
  career: "work",
  job: "work",
  // health / body
  health: "body",
  wellness: "body",
  fitness: "body",
  emotion: "body",
  emotional: "body",
  feeling: "body",
  // spiritual / practice
  spiritual: "ritual",
  spirituality: "ritual",
  practice: "ritual",
  meditation: "ritual",
  // social
  friendship: "relationship",
  love: "relationship",
  family: "support",
  community: "support",
  // purpose
  purpose: "calling",
  passion: "calling",
  vocation: "calling",
  meaning: "calling",
  // decision
  decision: "choice",
  // time
  past: "memory",
  history: "memory",
};

function normalizeHotspotKind(value: unknown): HotspotKind | unknown {
  if (typeof value !== "string") {
    return value;
  }

  const token = normalizeToken(value);

  if (HOTSPOT_KIND_SET.has(token)) {
    return token as HotspotKind;
  }

  return HOTSPOT_KIND_ALIASES[token] ?? HOTSPOT_KIND_FALLBACK;
}

// Truncate text fields when Gemini overshoots the schema's character caps.
// shortText = 80, mediumText = 180, longText = 320. Trims first because Zod's
// schema also .trim()s before checking length; without this, leading whitespace
// would inflate the count.
function truncate(value: unknown, max: number): string | unknown {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();

  if (trimmed.length <= max) {
    return trimmed;
  }

  return trimmed.slice(0, max - 1).trimEnd() + "…";
}

// Remaining enum normalizers. Same shape: known token passes through;
// alias is mapped; unknown falls back to a sensible default so the world
// generation doesn't fail validation on a creative Gemini token.

const ROOM_LAYOUT_SET = new Set<string>(ROOM_LAYOUTS);
const ROOM_LAYOUT_FALLBACK: RoomLayout = "sanctuary";
const ROOM_LAYOUT_ALIASES: Record<string, RoomLayout> = {
  open: "crossroads",
  studio: "atelier",
  workshop: "atelier",
  pathway: "corridor",
  hallway: "corridor",
  hall: "corridor",
  refuge: "sanctuary",
  haven: "sanctuary",
  crossroad: "crossroads",
  junction: "crossroads",
};

function normalizeRoomLayout(value: unknown): RoomLayout | unknown {
  if (typeof value !== "string") return value;
  const token = normalizeToken(value);
  if (ROOM_LAYOUT_SET.has(token)) return token as RoomLayout;
  return ROOM_LAYOUT_ALIASES[token] ?? ROOM_LAYOUT_FALLBACK;
}

const CLIMATE_SET = new Set<string>(CLIMATE_PRESETS);
const CLIMATE_FALLBACK: ClimatePreset = "overcast";
const CLIMATE_ALIASES: Record<string, ClimatePreset> = {
  sunny: "golden",
  sunlight: "golden",
  bright: "golden",
  warm: "golden",
  cloudy: "overcast",
  grey: "overcast",
  gray: "overcast",
  rainy: "mist",
  foggy: "mist",
  morning: "dawn",
  sunrise: "dawn",
  evening: "night",
  dusk: "night",
  dark: "night",
  midnight: "night",
};

function normalizeClimate(value: unknown): ClimatePreset | unknown {
  if (typeof value !== "string") return value;
  const token = normalizeToken(value);
  if (CLIMATE_SET.has(token)) return token as ClimatePreset;
  return CLIMATE_ALIASES[token] ?? CLIMATE_FALLBACK;
}

const COLOR_HINT_SET = new Set<string>(COLOR_HINTS);
const COLOR_HINT_FALLBACK: ColorHint = "slate";
const COLOR_HINT_ALIASES: Record<string, ColorHint> = {
  blue: "aqua",
  cyan: "aqua",
  teal: "aqua",
  yellow: "gold",
  amber: "gold",
  orange: "ember",
  red: "ember",
  fire: "ember",
  pink: "rose",
  green: "sage",
  emerald: "sage",
  purple: "violet",
  indigo: "violet",
  grey: "slate",
  gray: "slate",
  silver: "slate",
  white: "mist",
  fog: "mist",
};

function normalizeColorHint(value: unknown): ColorHint | unknown {
  if (typeof value !== "string") return value;
  const token = normalizeToken(value);
  if (COLOR_HINT_SET.has(token)) return token as ColorHint;
  return COLOR_HINT_ALIASES[token] ?? COLOR_HINT_FALLBACK;
}

const THEME_SET = new Set<string>(DILEMMA_THEMES);
const THEME_FALLBACK: DilemmaTheme = "general";
const THEME_ALIASES: Record<string, DilemmaTheme> = {
  job: "career",
  work: "career",
  profession: "career",
  love: "relationship",
  romance: "relationship",
  family: "relationship",
  friendship: "relationship",
  meaning: "purpose",
  vocation: "purpose",
  calling: "purpose",
  money: "finance",
  wealth: "finance",
  budget: "finance",
  wellness: "health",
  body: "health",
  mental: "health",
};

function normalizeTheme(value: unknown): DilemmaTheme | unknown {
  if (typeof value !== "string") return value;
  const token = normalizeToken(value);
  if (THEME_SET.has(token)) return token as DilemmaTheme;
  return THEME_ALIASES[token] ?? THEME_FALLBACK;
}

const DILEMMA_TYPE_SET = new Set<string>(DILEMMA_TYPES);
const DILEMMA_TYPE_FALLBACK: PlayableDilemmaType = "tradeoff";
const DILEMMA_TYPE_ALIASES: Record<string, PlayableDilemmaType> = {
  "trade-off": "tradeoff",
  exchange: "tradeoff",
  fear: "avoidance",
  avoidant: "avoidance",
  identity: "values",
  ethics: "values",
  morality: "values",
};

function normalizeDilemmaType(value: unknown): PlayableDilemmaType | unknown {
  if (typeof value !== "string") return value;
  const token = normalizeToken(value);
  if (DILEMMA_TYPE_SET.has(token)) return token as PlayableDilemmaType;
  return DILEMMA_TYPE_ALIASES[token] ?? DILEMMA_TYPE_FALLBACK;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function unwrapWorldIntentCandidate(value: unknown): unknown {
  if (!isRecord(value)) {
    return value;
  }

  if (value.version === "world-intent-v1") {
    return value;
  }

  const wrappedCandidate =
    value.worldIntent ?? value.intent ?? value.world ?? value.blueprint ?? value.data;

  return wrappedCandidate ?? value;
}

function normalizeWorldIntentCandidate(value: unknown): unknown {
  const candidate = unwrapWorldIntentCandidate(value);

  if (!isRecord(candidate)) {
    return candidate;
  }

  const out: Record<string, unknown> = { ...candidate };

  if (candidate.theme !== undefined) out.theme = normalizeTheme(candidate.theme);
  if (candidate.dilemmaType !== undefined) {
    out.dilemmaType = normalizeDilemmaType(candidate.dilemmaType);
  }
  if (candidate.reflectionPrompt !== undefined) {
    out.reflectionPrompt = truncate(candidate.reflectionPrompt, 320);
  }
  if (isRecord(candidate.card)) {
    out.card = {
      ...candidate.card,
      badge: truncate(candidate.card.badge, 80),
      title: truncate(candidate.card.title, 80),
      subtitle: truncate(candidate.card.subtitle, 180),
    };
  }
  if (isRecord(candidate.hub)) {
    out.hub = {
      ...candidate.hub,
      title: truncate(candidate.hub.title, 80),
      subtitle: truncate(candidate.hub.subtitle, 180),
    };
  }

  if (!Array.isArray(candidate.paths)) {
    return out;
  }

  out.paths = candidate.paths.map((path) => {
    if (!isRecord(path)) return path;

    const normalizedPath: Record<string, unknown> = {
      ...path,
      label: truncate(path.label, 80),
      title: truncate(path.title, 80),
      summary: truncate(path.summary, 180),
      closureLine: truncate(path.closureLine, 80),
    };
    if (path.colorHint !== undefined) {
      normalizedPath.colorHint = normalizeColorHint(path.colorHint);
    }
    if (path.hubDescription !== undefined) {
      normalizedPath.hubDescription = truncate(path.hubDescription, 220);
    }

    if (!Array.isArray(path.rooms)) {
      return normalizedPath;
    }

    normalizedPath.rooms = path.rooms.map((room) => {
      if (!isRecord(room)) return room;

      const normalizedRoom: Record<string, unknown> = {
        ...room,
        title: truncate(room.title, 80),
        summary: truncate(room.summary, 180),
        mood: truncate(room.mood, 80),
      };
      if (room.id !== undefined) normalizedRoom.id = normalizeRoomId(room.id);
      if (room.layout !== undefined) normalizedRoom.layout = normalizeRoomLayout(room.layout);
      if (room.climate !== undefined) normalizedRoom.climate = normalizeClimate(room.climate);
      if (Array.isArray(room.propStory)) {
        normalizedRoom.propStory = room.propStory.map(normalizePropKind);
      }
      if (Array.isArray(room.hotspots)) {
        normalizedRoom.hotspots = room.hotspots.map((hotspot) => {
          if (!isRecord(hotspot)) return hotspot;
          return {
            ...hotspot,
            kind: normalizeHotspotKind(hotspot.kind),
            label: truncate(hotspot.label, 80),
            prompt: truncate(hotspot.prompt, 80),
            insight: truncate(hotspot.insight, 180),
          };
        });
      }
      return normalizedRoom;
    });

    return normalizedPath;
  });

  return out;
}

export function buildPlayableWorldPrompt(
  dilema: string,
  answers: { question: string; answer: string }[],
): string {
  const answersText =
    answers.length > 0
      ? `\nCONTEXTO ADICIONAL:\n${answers.map((item) => `- ${item.question}\n  ${item.answer}`).join("\n")}`
      : "";

  return `Voce e o motor semantico do TranquiliWays. Sua funcao e devolver um blueprint JSON valido \
para um mundo 2.5D contemplativo, touch-first e emocionalmente seguro.${answersText}

DILEMA: "${dilema}"

PASSO 1 - GUARDRAIL:
Se houver crise emocional grave, autolesao, suicidio ou risco psicologico agudo, retorne APENAS:
{ "guardrail": true }

PASSO 2 - OBJETIVO:
Crie um WorldIntent estruturado para dois caminhos contrastantes. O runtime local montara um mundo unico a partir desse blueprint.

PASSO 3 - REGRAS CRITICAS:
- Nunca devolva markdown.
- Nunca invente chaves fora do schema.
- Use APENAS os enums permitidos.
- O tom deve ser acolhedor, honesto e plausivel.
- Nao decida pelo usuario.
- Nao crie fantasia escapista nem promessa milagrosa.
- Cada sala precisa sugerir um estado emocional atraves de espaco, objetos e atmosfera.
- Os hotspots devem convidar a inspecao e gerar insight curto.

ENUMS PERMITIDOS:
- theme: ${list(DILEMMA_THEMES)}
- dilemmaType: ${list(DILEMMA_TYPES)}
- cameraPreset: ${list(CAMERA_PRESETS)}
- path ids: ${list(PATH_IDS)}
- room ids: ${list(ROOM_IDS)}
- colorHint: ${list(COLOR_HINTS)}
- layout: ${list(ROOM_LAYOUTS)}
- climate: ${list(CLIMATE_PRESETS)}
- propStory items: ${list(PROP_KINDS)}
- hotspot kind: ${list(HOTSPOT_KINDS)}

CONTRATO:
- paths deve ter exatamente 2 itens: primeiro id "parado", segundo id "mudanca"
- cada path deve ter entre 2 e 5 rooms
- escolha os room ids mais adequados ao contexto do dilema
- os ids "quarto", "sala", "trabalho" e "familia" tem preferencia para dilemas genericos
- nunca repita o mesmo room id dentro do mesmo path
- os dois paths podem ter numeros e tipos de rooms diferentes se fizer sentido narrativo
- cada room precisa de 3 a 5 props
- cada room precisa de 2 ou 3 hotspots
- label e title curtos
- summary e insight concretos, sem abstracao vazia
- cada path DEVE ter um campo "hubDescription": string de 1-2 linhas descrevendo o ambiente físico e emocional da antessala desse caminho (ex: "escritório familiar com papéis velhos e luz amarelada — o peso da rotina cotidiana"; "espaço desconhecido cheio de luz nova — a antessala do possível")

RETORNE APENAS JSON VALIDO NESTE SHAPE:
{
  "version": "world-intent-v1",
  "theme": "career" | "relationship" | "purpose" | "finance" | "health" | "general",
  "dilemmaType": "tradeoff" | "avoidance" | "values",
  "cameraPreset": "isometric-calm",
  "card": {
    "badge": "<curto>",
    "title": "<curto>",
    "subtitle": "<curto e concreto>",
    "cardImageQuery": "<3 to 5 English keywords describing the emotional scene, used for image search>"
  },
  "hub": {
    "title": "<curto>",
    "subtitle": "<curto e concreto>"
  },
  "reflectionPrompt": "<ate 320 chars>",
  "paths": [
    {
      "id": "parado",
      "label": "<nome humano do caminho>",
      "title": "<titulo poetico curto>",
      "summary": "<resumo concreto do custo ou textura desse caminho>",
      "colorHint": "mist" | "ember" | "aqua" | "gold" | "rose" | "sage" | "slate" | "violet",
      "closureLine": "<frase curta>",
      "hubDescription": "<descricao da antessala desse caminho, 1-2 linhas concretas>",
      "rooms": [
        {
          "id": "<room id do pool permitido>",
          "title": "<curto>",
          "summary": "<cena concreta>",
          "mood": "<curto>",
          "layout": "sanctuary" | "corridor" | "atelier" | "crossroads",
          "climate": "dawn" | "overcast" | "mist" | "golden" | "night",
          "propStory": ["<prop>", "<prop>", "<prop>"],
          "hotspots": [
            {
              "kind": "memory" | "choice" | "body" | "relationship" | "work" | "calling" | "support" | "ritual" | "future",
              "label": "<curto>",
              "prompt": "<curto>",
              "insight": "<concreto>"
            }
          ]
        },
        { "...": "2 a 5 rooms por path, ids escolhidos pelo contexto" }
      ]
    },
    {
      "id": "mudanca",
      "label": "<nome humano do caminho>",
      "title": "<titulo poetico curto>",
      "summary": "<resumo concreto do custo ou textura desse caminho>",
      "colorHint": "mist" | "ember" | "aqua" | "gold" | "rose" | "sage" | "slate" | "violet",
      "closureLine": "<frase curta>",
      "hubDescription": "<descricao da antessala desse caminho, 1-2 linhas concretas>",
      "rooms": [{ "...": "2 a 5 rooms por path, ids escolhidos pelo contexto" }]
    }
  ]
}`;
}

export function parsePlayableWorldIntent(raw: string): WorldIntent | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    const result = WorldIntentSchema.safeParse(normalizeWorldIntentCandidate(parsed));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
