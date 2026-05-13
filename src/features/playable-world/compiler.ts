import {
  type AmbientFxPreset,
  type ClimatePreset,
  type ColorHint,
  type HotspotBlueprint,
  type PathBlueprint,
  type PathId,
  type PlayableWorldV1,
  type PropKind,
  type PropPlacement,
  type RoomBlueprint,
  type RoomId,
  type RoomIntent,
  type RoomPalette,
  type RoomLayout,
  type SlotName,
  type Vec3,
  type WorldIntent,
} from "./model.ts";

const ROOM_LABELS: Record<RoomId, string> = {
  quarto: "Quarto",
  sala: "Sala",
  trabalho: "Trabalho",
  familia: "Familia",
  jardim: "Jardim",
  cozinha: "Cozinha",
  academia: "Academia",
  varanda: "Varanda",
  cafe: "Café",
  biblioteca: "Biblioteca",
  carro: "Carro",
  escola: "Escola",
  escritorio: "Escritório",
  hospital: "Hospital",
  praia: "Praia",
};

const BASE_PALETTES: Record<ColorHint, RoomPalette> = {
  mist: {
    skyTop: "#d8e8f1",
    skyBottom: "#aabecf",
    fog: "#e9f2f8",
    ground: "#8ca0b2",
    accent: "#7a9fc4",
    glow: "#f6fbff",
    prop: "#63788a",
    highlight: "#c7dbef",
  },
  ember: {
    skyTop: "#f0b178",
    skyBottom: "#9e4c46",
    fog: "#f8dcc2",
    ground: "#7a4d47",
    accent: "#ff8f57",
    glow: "#ffe2b5",
    prop: "#80524a",
    highlight: "#ffd0a8",
  },
  aqua: {
    skyTop: "#83d6e5",
    skyBottom: "#2f7894",
    fog: "#d8f3f7",
    ground: "#3a6174",
    accent: "#61d5d1",
    glow: "#f4ffff",
    prop: "#43687c",
    highlight: "#aef7f4",
  },
  gold: {
    skyTop: "#f4df91",
    skyBottom: "#ce8f53",
    fog: "#fff2c8",
    ground: "#8f6f4d",
    accent: "#f2bd63",
    glow: "#fff7df",
    prop: "#80644a",
    highlight: "#ffe4a6",
  },
  rose: {
    skyTop: "#edc0c8",
    skyBottom: "#93546c",
    fog: "#fdebf0",
    ground: "#7d5a68",
    accent: "#ef8aa5",
    glow: "#fff6f8",
    prop: "#755564",
    highlight: "#ffd2df",
  },
  sage: {
    skyTop: "#bfdcc7",
    skyBottom: "#63856d",
    fog: "#edf7ef",
    ground: "#617666",
    accent: "#9dc291",
    glow: "#f7fff7",
    prop: "#596d5c",
    highlight: "#d5eccc",
  },
  slate: {
    skyTop: "#b8c4d3",
    skyBottom: "#536277",
    fog: "#edf2f9",
    ground: "#4c5f72",
    accent: "#8ba3c2",
    glow: "#f7fbff",
    prop: "#546779",
    highlight: "#d3deeb",
  },
  violet: {
    skyTop: "#ceb8e2",
    skyBottom: "#68528f",
    fog: "#f4edfb",
    ground: "#5e5777",
    accent: "#b18fff",
    glow: "#fdf9ff",
    prop: "#5e5676",
    highlight: "#dfcdfd",
  },
};

const CLIMATE_OFFSETS: Record<
  ClimatePreset,
  Partial<RoomPalette> & { lighting: RoomBlueprint["lighting"]; ambientFx: AmbientFxPreset[] }
> = {
  dawn: {
    skyTop: "#f1d5b0",
    skyBottom: "#89b9d8",
    glow: "#fff4dd",
    lighting: "soft",
    ambientFx: ["dust", "fireflies"],
  },
  overcast: {
    skyTop: "#c4d0db",
    skyBottom: "#7c90a6",
    fog: "#eff5fa",
    lighting: "misty",
    ambientFx: ["dust", "rain-lines"],
  },
  mist: {
    skyTop: "#dde6ec",
    skyBottom: "#91a7b9",
    fog: "#f8fbff",
    lighting: "misty",
    ambientFx: ["mist", "dust"],
  },
  golden: {
    skyTop: "#f6df9b",
    skyBottom: "#cf8c58",
    glow: "#fff1c3",
    lighting: "warm",
    ambientFx: ["dust", "embers"],
  },
  night: {
    skyTop: "#263052",
    skyBottom: "#46527c",
    fog: "#bcc7ef",
    glow: "#eef1ff",
    lighting: "moonlit",
    ambientFx: ["mist", "fireflies"],
  },
};

const LAYOUT_SLOTS: Record<RoomLayout, Record<SlotName, Vec3>> = {
  sanctuary: {
    "left-foreground": [-2.25, -1.05, 0.42],
    "right-foreground": [2.25, -1.05, 0.42],
    centerpiece: [0, -0.45, 0.18],
    "left-mid": [-1.65, -0.48, 0.08],
    "right-mid": [1.65, -0.48, 0.08],
    "rear-left": [-2.3, 0.4, -0.12],
    "rear-right": [2.3, 0.4, -0.12],
    portal: [0, 0.2, -0.42],
  },
  corridor: {
    "left-foreground": [-2.05, -1.0, 0.32],
    "right-foreground": [2.05, -1.0, 0.32],
    centerpiece: [0, -0.65, 0.1],
    "left-mid": [-1.2, -0.2, 0.05],
    "right-mid": [1.2, -0.2, 0.05],
    "rear-left": [-1.9, 0.55, -0.16],
    "rear-right": [1.9, 0.55, -0.16],
    portal: [0, 0.62, -0.36],
  },
  atelier: {
    "left-foreground": [-2.15, -1.12, 0.36],
    "right-foreground": [2.15, -1.12, 0.36],
    centerpiece: [0, -0.2, 0.2],
    "left-mid": [-1.55, 0.05, 0.08],
    "right-mid": [1.55, -0.1, 0.08],
    "rear-left": [-2.15, 0.68, -0.14],
    "rear-right": [2.15, 0.68, -0.14],
    portal: [0, 0.35, -0.34],
  },
  crossroads: {
    "left-foreground": [-2.45, -0.92, 0.34],
    "right-foreground": [2.45, -0.92, 0.34],
    centerpiece: [0, -0.42, 0.12],
    "left-mid": [-1.9, 0.25, 0.05],
    "right-mid": [1.9, 0.25, 0.05],
    "rear-left": [-2.55, 0.9, -0.18],
    "rear-right": [2.55, 0.9, -0.18],
    portal: [0, 0.9, -0.4],
  },
};

const NAVIGATION_BY_LAYOUT: Record<RoomLayout, RoomBlueprint["navigation"]> = {
  sanctuary: {
    previous: [-3.25, -0.15, 0.04],
    next: [3.25, -0.15, 0.04],
    hub: [0, -1.28, 0.28],
  },
  corridor: {
    previous: [-3.1, 0.3, -0.12],
    next: [3.1, 0.3, -0.12],
    hub: [0, -1.24, 0.24],
  },
  atelier: {
    previous: [-3.15, -0.02, 0.02],
    next: [3.15, -0.02, 0.02],
    hub: [0, -1.3, 0.28],
  },
  crossroads: {
    previous: [-3.45, 0.12, -0.08],
    next: [3.45, 0.12, -0.08],
    hub: [0, -1.16, 0.26],
  },
};

const PROP_SLOT_ORDER: SlotName[] = [
  "centerpiece",
  "left-mid",
  "right-mid",
  "left-foreground",
  "right-foreground",
];

const HOTSPOT_SLOT_ORDER: SlotName[] = ["rear-left", "portal", "rear-right"];

const ROOM_CLIMATE_BY_INDEX: ClimatePreset[] = ["mist", "overcast", "golden", "night"];

function normalizeTextId(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
}

function hashString(input: string) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mixHex(left: string, right: string, amount: number) {
  const clamp = Math.max(0, Math.min(1, amount));
  const parse = (hex: string) => {
    const normalized = hex.replace("#", "");
    const value =
      normalized.length === 3
        ? normalized
            .split("")
            .map((char) => char + char)
            .join("")
        : normalized;
    return {
      r: Number.parseInt(value.slice(0, 2), 16),
      g: Number.parseInt(value.slice(2, 4), 16),
      b: Number.parseInt(value.slice(4, 6), 16),
    };
  };

  const a = parse(left);
  const b = parse(right);
  const toHex = (value: number) => Math.round(value).toString(16).padStart(2, "0");

  return `#${toHex(a.r + (b.r - a.r) * clamp)}${toHex(a.g + (b.g - a.g) * clamp)}${toHex(a.b + (b.b - a.b) * clamp)}`;
}

function rotateColorHint(hint: ColorHint, offset: number): ColorHint {
  const hints = Object.keys(BASE_PALETTES) as ColorHint[];
  const index = hints.indexOf(hint);
  return hints[(index + offset + hints.length) % hints.length] ?? hint;
}

function paletteForHint(hint: ColorHint, climate: ClimatePreset): RoomPalette {
  const base = BASE_PALETTES[hint];
  const offset = CLIMATE_OFFSETS[climate];

  return {
    skyTop: offset.skyTop ?? base.skyTop,
    skyBottom: offset.skyBottom ?? base.skyBottom,
    fog: offset.fog ?? base.fog,
    ground: offset.ground ?? base.ground,
    accent: base.accent,
    glow: offset.glow ?? base.glow,
    prop: base.prop,
    highlight: base.highlight,
  };
}

function roomClimate(intentRoom: RoomIntent, roomIndex: number) {
  return intentRoom.climate ?? ROOM_CLIMATE_BY_INDEX[roomIndex] ?? "mist";
}

function roomLighting(climate: ClimatePreset): RoomBlueprint["lighting"] {
  return CLIMATE_OFFSETS[climate].lighting;
}

function roomAmbientFx(climate: ClimatePreset) {
  return CLIMATE_OFFSETS[climate].ambientFx;
}

function propAnimation(kind: PropKind): PropPlacement["animation"] {
  if (kind === "plant" || kind === "lamp" || kind === "music-player") {
    return "float";
  }

  if (kind === "mirror" || kind === "altar" || kind === "notebook") {
    return "pulse";
  }

  return "still";
}

function createPropPlacement(
  roomLayout: RoomLayout,
  kind: PropKind,
  roomId: RoomId,
  roomSeed: number,
  slot: SlotName,
  index: number,
  palette: RoomPalette,
): PropPlacement {
  const [x, y, z] = LAYOUT_SLOTS[roomLayout][slot];
  const scale = 0.88 + ((roomSeed + index * 13) % 18) / 100;
  const rotationY = (((roomSeed >> (index % 5)) % 16) - 8) * 0.05;

  return {
    id: `${roomId}-${kind}-${index}`,
    kind,
    slot,
    position: [x, y, z + index * 0.01],
    rotationY,
    scale,
    tint: mixHex(palette.prop, palette.highlight, (index % 4) / 4),
    animation: propAnimation(kind),
  };
}

function createHotspotBlueprint(
  roomLayout: RoomLayout,
  roomId: RoomId,
  roomSeed: number,
  palette: RoomPalette,
  hotspot: RoomIntent["hotspots"][number],
  index: number,
): HotspotBlueprint {
  const slot = HOTSPOT_SLOT_ORDER[index % HOTSPOT_SLOT_ORDER.length];
  const [x, y, z] = LAYOUT_SLOTS[roomLayout][slot];

  return {
    id: `${roomId}-hotspot-${normalizeTextId(hotspot.label)}-${index}`,
    kind: hotspot.kind,
    label: hotspot.label,
    prompt: hotspot.prompt,
    insight: hotspot.insight,
    slot,
    position: [x, y + 0.22 + index * 0.05, z + 0.06],
    accent: mixHex(palette.accent, palette.highlight, 0.4 + index * 0.15),
    pulse: 1 + ((roomSeed + index * 19) % 5) * 0.12,
  };
}

function createRoomBlueprint(
  intentRoom: RoomIntent,
  pathId: PathId,
  roomIndex: number,
  roomSeed: number,
  pathPalette: RoomPalette,
): RoomBlueprint {
  const climate = roomClimate(intentRoom, roomIndex);
  const palette = paletteForHint(
    rotateColorHint(pathId === "parado" ? "slate" : "gold", roomIndex),
    climate,
  );
  const mergedPalette: RoomPalette = {
    skyTop: mixHex(pathPalette.skyTop, palette.skyTop, 0.55),
    skyBottom: mixHex(pathPalette.skyBottom, palette.skyBottom, 0.55),
    fog: mixHex(pathPalette.fog, palette.fog, 0.45),
    ground: mixHex(pathPalette.ground, palette.ground, 0.5),
    accent: mixHex(pathPalette.accent, palette.accent, 0.4),
    glow: mixHex(pathPalette.glow, palette.glow, 0.4),
    prop: mixHex(pathPalette.prop, palette.prop, 0.4),
    highlight: mixHex(pathPalette.highlight, palette.highlight, 0.4),
  };

  const props = intentRoom.propStory.map((kind, index) =>
    createPropPlacement(
      intentRoom.layout,
      kind,
      intentRoom.id,
      roomSeed,
      PROP_SLOT_ORDER[index % PROP_SLOT_ORDER.length],
      index,
      mergedPalette,
    ),
  );

  const hotspots = intentRoom.hotspots.map((hotspot, index) =>
    createHotspotBlueprint(
      intentRoom.layout,
      intentRoom.id,
      roomSeed,
      mergedPalette,
      hotspot,
      index,
    ),
  );

  return {
    id: intentRoom.id,
    label: ROOM_LABELS[intentRoom.id],
    title: intentRoom.title,
    summary: intentRoom.summary,
    mood: intentRoom.mood,
    layout: intentRoom.layout,
    climate,
    lighting: roomLighting(climate),
    palette: mergedPalette,
    ambientFx: roomAmbientFx(climate),
    props,
    hotspots,
    navigation: NAVIGATION_BY_LAYOUT[intentRoom.layout],
  };
}

function createPathBlueprint(
  intent: WorldIntent["paths"][number],
  worldSeed: number,
): PathBlueprint {
  const palette = paletteForHint(intent.colorHint, intent.id === "parado" ? "mist" : "golden");
  const rooms = intent.rooms.map((roomIntent, roomIndex) =>
    createRoomBlueprint(
      roomIntent,
      intent.id,
      roomIndex,
      hashString(`${worldSeed}:${intent.id}:${roomIntent.id}:${roomIntent.title}`),
      palette,
    ),
  ) as PathBlueprint["rooms"];

  return {
    id: intent.id,
    label: intent.label,
    title: intent.title,
    summary: intent.summary,
    closureLine: intent.closureLine,
    colorHint: intent.colorHint,
    palette,
    rooms,
  };
}

function createCardMeta(
  intent: WorldIntent,
  paths: PlayableWorldV1["paths"],
): PlayableWorldV1["card"] {
  return {
    badge: intent.card.badge,
    title: intent.card.title,
    subtitle: intent.card.subtitle,
    accentGradient: [paths[0].palette.skyTop, paths[1].palette.skyTop],
    leftPath: {
      label: paths[0].label,
      title: paths[0].title,
      color: paths[0].palette.accent,
    },
    rightPath: {
      label: paths[1].label,
      title: paths[1].title,
      color: paths[1].palette.accent,
    },
    ...(intent.card.cardImageQuery ? { cardImageQuery: intent.card.cardImageQuery } : {}),
  };
}

function createHub(intent: WorldIntent, paths: PlayableWorldV1["paths"]): PlayableWorldV1["hub"] {
  const hubPalette: RoomPalette = {
    skyTop: mixHex(paths[0].palette.skyTop, paths[1].palette.skyTop, 0.5),
    skyBottom: mixHex(paths[0].palette.skyBottom, paths[1].palette.skyBottom, 0.5),
    fog: mixHex(paths[0].palette.fog, paths[1].palette.fog, 0.5),
    ground: mixHex(paths[0].palette.ground, paths[1].palette.ground, 0.5),
    accent: mixHex(paths[0].palette.accent, paths[1].palette.accent, 0.5),
    glow: mixHex(paths[0].palette.glow, paths[1].palette.glow, 0.5),
    prop: mixHex(paths[0].palette.prop, paths[1].palette.prop, 0.5),
    highlight: mixHex(paths[0].palette.highlight, paths[1].palette.highlight, 0.5),
  };

  return {
    title: intent.hub.title,
    subtitle: intent.hub.subtitle,
    climate: "mist",
    palette: hubPalette,
    ambientFx: ["dust", "fireflies"],
    portals: [
      {
        pathId: "parado",
        label: paths[0].label,
        title: paths[0].title,
        position: [-2.7, -0.28, 0],
        accent: paths[0].palette.accent,
        glow: paths[0].palette.glow,
      },
      {
        pathId: "mudanca",
        label: paths[1].label,
        title: paths[1].title,
        position: [2.7, -0.28, 0],
        accent: paths[1].palette.accent,
        glow: paths[1].palette.glow,
      },
    ],
  };
}

export function deriveWorldSeed(dilema: string, intent: WorldIntent) {
  return hashString(
    `${dilema}:${intent.card.title}:${intent.paths[0].title}:${intent.paths[1].title}`,
  );
}

export function compileWorldIntent(input: {
  id: string;
  dilema: string;
  geradoEm: string;
  intent: WorldIntent;
}): PlayableWorldV1 {
  const worldSeed = deriveWorldSeed(input.dilema, input.intent);
  const paths = input.intent.paths.map((path) =>
    createPathBlueprint(path, worldSeed),
  ) as PlayableWorldV1["paths"];

  return {
    version: "playable-v1",
    id: input.id,
    dilema: input.dilema,
    geradoEm: input.geradoEm,
    worldSeed,
    theme: input.intent.theme,
    dilemmaType: input.intent.dilemmaType,
    cameraPreset: input.intent.cameraPreset,
    reflectionPrompt: input.intent.reflectionPrompt,
    card: createCardMeta(input.intent, paths),
    hub: createHub(input.intent, paths),
    paths,
  };
}
