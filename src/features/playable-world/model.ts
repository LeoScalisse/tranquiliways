import { z } from "zod";

export const PATH_IDS = ["parado", "mudanca"] as const;
export const ROOM_IDS = [
  "quarto", "sala", "trabalho", "familia",
  "jardim", "cozinha", "academia", "varanda",
  "cafe", "biblioteca", "carro", "escola",
  "escritorio", "hospital", "praia",
] as const;
export const CAMERA_PRESETS = ["isometric-calm"] as const;
export const CLIMATE_PRESETS = ["dawn", "overcast", "mist", "golden", "night"] as const;
export const LIGHTING_PRESETS = ["soft", "misty", "warm", "moonlit"] as const;
export const COLOR_HINTS = [
  "mist",
  "ember",
  "aqua",
  "gold",
  "rose",
  "sage",
  "slate",
  "violet",
] as const;
export const ROOM_LAYOUTS = ["sanctuary", "corridor", "atelier", "crossroads"] as const;
export const HOTSPOT_KINDS = [
  "memory",
  "choice",
  "body",
  "relationship",
  "work",
  "calling",
  "support",
  "ritual",
  "future",
] as const;
export const PROP_KINDS = [
  "bed",
  "desk",
  "sofa",
  "table",
  "bookshelf",
  "plant",
  "lamp",
  "mirror",
  "suitcase",
  "notebook",
  "frame",
  "window",
  "chair",
  "wardrobe",
  "altar",
  "mug",
  "laundry",
  "music-player",
  "dining-table",
  "door",
] as const;
export const SLOT_NAMES = [
  "left-foreground",
  "right-foreground",
  "centerpiece",
  "left-mid",
  "right-mid",
  "rear-left",
  "rear-right",
  "portal",
] as const;
export const AMBIENT_FX_PRESETS = ["dust", "fireflies", "mist", "embers", "rain-lines"] as const;
export const DILEMMA_THEMES = [
  "career",
  "relationship",
  "purpose",
  "finance",
  "health",
  "general",
] as const;
export const DILEMMA_TYPES = ["tradeoff", "avoidance", "values"] as const;

export type PathId = (typeof PATH_IDS)[number];
export type RoomId = (typeof ROOM_IDS)[number];
export type CameraPreset = (typeof CAMERA_PRESETS)[number];
export type ClimatePreset = (typeof CLIMATE_PRESETS)[number];
export type LightingPreset = (typeof LIGHTING_PRESETS)[number];
export type ColorHint = (typeof COLOR_HINTS)[number];
export type RoomLayout = (typeof ROOM_LAYOUTS)[number];
export type HotspotKind = (typeof HOTSPOT_KINDS)[number];
export type PropKind = (typeof PROP_KINDS)[number];
export type SlotName = (typeof SLOT_NAMES)[number];
export type AmbientFxPreset = (typeof AMBIENT_FX_PRESETS)[number];
export type DilemmaTheme = (typeof DILEMMA_THEMES)[number];
export type PlayableDilemmaType = (typeof DILEMMA_TYPES)[number];

export type Vec3 = [number, number, number];

export interface WorldCardMeta {
  badge: string;
  title: string;
  subtitle: string;
  accentGradient: [string, string];
  leftPath: {
    label: string;
    title: string;
    color: string;
  };
  rightPath: {
    label: string;
    title: string;
    color: string;
  };
  cardImageQuery?: string;
}

export interface HotspotIntent {
  kind: HotspotKind;
  label: string;
  prompt: string;
  insight: string;
}

export interface RoomIntent {
  id: RoomId;
  title: string;
  summary: string;
  mood: string;
  layout: RoomLayout;
  climate: ClimatePreset;
  propStory: PropKind[];
  hotspots: HotspotIntent[];
}

export interface PathIntent {
  id: PathId;
  label: string;
  title: string;
  summary: string;
  colorHint: ColorHint;
  closureLine: string;
  rooms: RoomIntent[];
}

export interface WorldIntent {
  version: "world-intent-v1";
  theme: DilemmaTheme;
  dilemmaType: PlayableDilemmaType;
  cameraPreset: CameraPreset;
  card: {
    badge: string;
    title: string;
    subtitle: string;
    cardImageQuery?: string;
  };
  hub: {
    title: string;
    subtitle: string;
  };
  reflectionPrompt: string;
  paths: [PathIntent, PathIntent];
}

export interface RoomPalette {
  skyTop: string;
  skyBottom: string;
  fog: string;
  ground: string;
  accent: string;
  glow: string;
  prop: string;
  highlight: string;
}

export interface PropPlacement {
  id: string;
  kind: PropKind;
  slot: SlotName;
  position: Vec3;
  rotationY: number;
  scale: number;
  tint: string;
  animation: "still" | "float" | "pulse";
}

export interface HotspotBlueprint {
  id: string;
  kind: HotspotKind;
  label: string;
  prompt: string;
  insight: string;
  slot: SlotName;
  position: Vec3;
  accent: string;
  pulse: number;
}

export interface NavigationAnchors {
  previous: Vec3;
  next: Vec3;
  hub: Vec3;
}

export interface RoomBlueprint {
  id: RoomId;
  label: string;
  title: string;
  summary: string;
  mood: string;
  layout: RoomLayout;
  climate: ClimatePreset;
  lighting: LightingPreset;
  palette: RoomPalette;
  ambientFx: AmbientFxPreset[];
  props: PropPlacement[];
  hotspots: HotspotBlueprint[];
  navigation: NavigationAnchors;
}

export interface PathBlueprint {
  id: PathId;
  label: string;
  title: string;
  summary: string;
  closureLine: string;
  colorHint: ColorHint;
  palette: RoomPalette;
  rooms: RoomBlueprint[];
}

export interface HubPortalBlueprint {
  pathId: PathId;
  label: string;
  title: string;
  position: Vec3;
  accent: string;
  glow: string;
}

export interface HubBlueprint {
  title: string;
  subtitle: string;
  climate: ClimatePreset;
  palette: RoomPalette;
  ambientFx: AmbientFxPreset[];
  portals: [HubPortalBlueprint, HubPortalBlueprint];
}

export interface PlayableWorldV1 {
  version: "playable-v1";
  id: string;
  dilema: string;
  geradoEm: string;
  worldSeed: number;
  theme: DilemmaTheme;
  dilemmaType: PlayableDilemmaType;
  cameraPreset: CameraPreset;
  reflectionPrompt: string;
  card: WorldCardMeta;
  hub: HubBlueprint;
  paths: [PathBlueprint, PathBlueprint];
}

const shortText = z.string().trim().min(1).max(80);
const mediumText = z.string().trim().min(1).max(180);
const longText = z.string().trim().min(1).max(320);
const dilemmaText = z.string().trim().min(1).max(1200);
const Vec3Schema = z.tuple([z.number(), z.number(), z.number()]);

export const WorldCardMetaSchema = z.object({
  badge: shortText,
  title: shortText,
  subtitle: mediumText,
  accentGradient: z.tuple([z.string(), z.string()]),
  leftPath: z.object({
    label: shortText,
    title: shortText,
    color: z.string(),
  }),
  rightPath: z.object({
    label: shortText,
    title: shortText,
    color: z.string(),
  }),
  cardImageQuery: z.string().optional(),
});

export const HotspotIntentSchema = z.object({
  kind: z.enum(HOTSPOT_KINDS),
  label: shortText,
  prompt: shortText,
  insight: mediumText,
});

const BaseRoomIntentSchema = z.object({
  title: shortText,
  summary: mediumText,
  mood: shortText,
  layout: z.enum(ROOM_LAYOUTS),
  climate: z.enum(CLIMATE_PRESETS),
  propStory: z.array(z.enum(PROP_KINDS)).min(3).max(5),
  hotspots: z.array(HotspotIntentSchema).min(2).max(3),
});

export const RoomIntentArraySchema = z
  .array(BaseRoomIntentSchema.extend({ id: z.enum(ROOM_IDS) }))
  .min(2)
  .max(5);

const BasePathIntentSchema = z.object({
  label: shortText,
  title: shortText,
  summary: mediumText,
  colorHint: z.enum(COLOR_HINTS),
  closureLine: shortText,
});

export const WorldIntentSchema = z.object({
  version: z.literal("world-intent-v1"),
  theme: z.enum(DILEMMA_THEMES),
  dilemmaType: z.enum(DILEMMA_TYPES),
  cameraPreset: z.literal("isometric-calm"),
  card: z.object({
    badge: shortText,
    title: shortText,
    subtitle: mediumText,
    cardImageQuery: z.string().optional(),
  }),
  hub: z.object({
    title: shortText,
    subtitle: mediumText,
  }),
  reflectionPrompt: longText,
  paths: z.tuple([
    BasePathIntentSchema.extend({
      id: z.literal("parado"),
      rooms: RoomIntentArraySchema,
    }),
    BasePathIntentSchema.extend({
      id: z.literal("mudanca"),
      rooms: RoomIntentArraySchema,
    }),
  ]),
});

const RoomPaletteSchema = z.object({
  skyTop: z.string(),
  skyBottom: z.string(),
  fog: z.string(),
  ground: z.string(),
  accent: z.string(),
  glow: z.string(),
  prop: z.string(),
  highlight: z.string(),
});

const PropPlacementSchema = z.object({
  id: shortText,
  kind: z.enum(PROP_KINDS),
  slot: z.enum(SLOT_NAMES),
  position: Vec3Schema,
  rotationY: z.number(),
  scale: z.number(),
  tint: z.string(),
  animation: z.enum(["still", "float", "pulse"]),
});

const HotspotBlueprintSchema = z.object({
  id: shortText,
  kind: z.enum(HOTSPOT_KINDS),
  label: shortText,
  prompt: shortText,
  insight: mediumText,
  slot: z.enum(SLOT_NAMES),
  position: Vec3Schema,
  accent: z.string(),
  pulse: z.number(),
});

const NavigationAnchorsSchema = z.object({
  previous: Vec3Schema,
  next: Vec3Schema,
  hub: Vec3Schema,
});

const RoomBlueprintSchema = z.object({
  id: z.enum(ROOM_IDS),
  label: shortText,
  title: shortText,
  summary: mediumText,
  mood: shortText,
  layout: z.enum(ROOM_LAYOUTS),
  climate: z.enum(CLIMATE_PRESETS),
  lighting: z.enum(LIGHTING_PRESETS),
  palette: RoomPaletteSchema,
  ambientFx: z.array(z.enum(AMBIENT_FX_PRESETS)).min(1),
  props: z.array(PropPlacementSchema).min(3),
  hotspots: z.array(HotspotBlueprintSchema).min(2),
  navigation: NavigationAnchorsSchema,
});

const RoomBlueprintArraySchema = z
  .array(RoomBlueprintSchema.extend({ id: z.enum(ROOM_IDS) }))
  .min(2)
  .max(5);

const PathBlueprintSchema = z.object({
  id: z.enum(PATH_IDS),
  label: shortText,
  title: shortText,
  summary: mediumText,
  closureLine: shortText,
  colorHint: z.enum(COLOR_HINTS),
  palette: RoomPaletteSchema,
  rooms: RoomBlueprintArraySchema,
});

const HubPortalBlueprintSchema = z.object({
  pathId: z.enum(PATH_IDS),
  label: shortText,
  title: shortText,
  position: Vec3Schema,
  accent: z.string(),
  glow: z.string(),
});

const HubBlueprintSchema = z.object({
  title: shortText,
  subtitle: mediumText,
  climate: z.enum(CLIMATE_PRESETS),
  palette: RoomPaletteSchema,
  ambientFx: z.array(z.enum(AMBIENT_FX_PRESETS)).min(1),
  portals: z.tuple([
    HubPortalBlueprintSchema.extend({ pathId: z.literal("parado") }),
    HubPortalBlueprintSchema.extend({ pathId: z.literal("mudanca") }),
  ]),
});

export const PlayableWorldV1Schema = z.object({
  version: z.literal("playable-v1"),
  id: shortText,
  dilema: dilemmaText,
  geradoEm: z.string(),
  worldSeed: z.number().int(),
  theme: z.enum(DILEMMA_THEMES),
  dilemmaType: z.enum(DILEMMA_TYPES),
  cameraPreset: z.enum(CAMERA_PRESETS),
  reflectionPrompt: longText,
  card: WorldCardMetaSchema,
  hub: HubBlueprintSchema,
  paths: z.tuple([
    PathBlueprintSchema.extend({ id: z.literal("parado") }),
    PathBlueprintSchema.extend({ id: z.literal("mudanca") }),
  ]),
});
