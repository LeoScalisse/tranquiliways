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
