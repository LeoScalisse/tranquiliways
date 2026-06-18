import type { PropKind } from "../model.ts";
import { ASSET_MANIFEST } from "./asset-manifest.generated.ts";

// Six anchor palettes from the art-direction spec
// (docs/superpowers/specs/2026-05-25-ways-art-direction.md). Empty palettes
// array on a descriptor means "compatible with any palette".
export type PaletteId =
  | "acolhimento"
  | "inercia"
  | "despertar"
  | "transformacao"
  | "incerteza"
  | "chama";

export type AssetDescriptor = {
  // Stable ID; matches the GLB filename without extension.
  id: string;
  // Fallback PropKind when the GLB is unavailable on this client.
  propKind: PropKind;
  // Empty array = compatible with any palette.
  palettes: readonly PaletteId[];
  tags: readonly string[];
  // Approximate bounding box in world units. Used later to validate layout
  // slot fit; ignored by PR 2 callers.
  boundingBox: { w: number; d: number; h: number };
  license: "CC0" | "CC-BY";
  source: string;
};

export const ASSET_REGISTRY: readonly AssetDescriptor[] = [
  {
    id: "kenney-chair",
    propKind: "chair",
    palettes: [],
    tags: ["wooden", "small", "dining"],
    boundingBox: { w: 0.6, d: 0.6, h: 1.0 },
    license: "CC0",
    source: "Kenney Furniture Kit",
  },
  {
    id: "kenney-table",
    propKind: "table",
    palettes: [],
    tags: ["wooden", "square"],
    boundingBox: { w: 1.0, d: 1.0, h: 0.8 },
    license: "CC0",
    source: "Kenney Furniture Kit",
  },
  {
    id: "kenney-plant",
    propKind: "plant",
    palettes: [],
    tags: ["potted", "green", "small"],
    boundingBox: { w: 0.5, d: 0.5, h: 0.8 },
    license: "CC0",
    source: "Kenney Furniture Kit",
  },
  {
    id: "kenney-bookshelf",
    propKind: "bookshelf",
    palettes: [],
    tags: ["wooden", "closed", "tall"],
    boundingBox: { w: 1.0, d: 0.4, h: 1.6 },
    license: "CC0",
    source: "Kenney Furniture Kit",
  },
  {
    id: "kenney-lamp",
    propKind: "lamp",
    palettes: [],
    tags: ["round", "table-top", "warm"],
    boundingBox: { w: 0.3, d: 0.3, h: 0.4 },
    license: "CC0",
    source: "Kenney Furniture Kit",
  },
] as const;

const BY_ID = new Map(ASSET_REGISTRY.map((a) => [a.id, a]));
const BY_KIND = new Map<PropKind, AssetDescriptor[]>();
for (const asset of ASSET_REGISTRY) {
  const list = BY_KIND.get(asset.propKind) ?? [];
  list.push(asset);
  BY_KIND.set(asset.propKind, list);
}

export function findAssetById(id: string): AssetDescriptor | null {
  return BY_ID.get(id) ?? null;
}

// Auto-resolves by PropKind. When multiple assets share the same kind, prefers
// the one whose palette list includes the requested palette (or any matches
// when the descriptor allows any). Falls back to the first registered.
export function findAssetByKind(kind: PropKind, palette?: PaletteId): AssetDescriptor | null {
  const candidates = BY_KIND.get(kind);
  if (!candidates || candidates.length === 0) return null;
  if (!palette) return candidates[0];
  const matching = candidates.find((a) => a.palettes.length === 0 || a.palettes.includes(palette));
  return matching ?? candidates[0];
}

// Resolves a descriptor ID to its served public URL. Returns null when the
// manifest doesn't have the ID (file missing on disk, prebuild not run, etc.)
// — the caller falls back to procedural rendering.
export function getAssetPath(id: string): string | null {
  return ASSET_MANIFEST[id] ?? null;
}
