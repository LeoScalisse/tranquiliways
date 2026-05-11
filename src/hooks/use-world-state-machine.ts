// src/hooks/use-world-state-machine.ts
import { useCallback, useState } from "react";
import type { PathId } from "@/features/playable-world/model";

export type SkinTone = "light" | "medium" | "dark";

export interface CharacterConfig {
  skinTone: SkinTone;
  outfitColor: string;
}

const SKIN_COLORS: Record<SkinTone, string> = {
  light: "#fbbf24",
  medium: "#d97706",
  dark: "#92400e",
};

export function getSkinColor(tone: SkinTone): string {
  return SKIN_COLORS[tone];
}

type WorldScreen =
  | { type: "character-select" }
  | { type: "hub" }
  | { type: "path-corridor"; pathId: PathId }
  | { type: "ambiente-room"; pathId: PathId; roomIndex: number }
  | { type: "element-dialogue"; pathId: PathId; roomIndex: number; hotspotId: string };

const CHARACTER_STORAGE_KEY = "tranquili-character-config";

function loadCharacter(): CharacterConfig {
  try {
    const raw = localStorage.getItem(CHARACTER_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as CharacterConfig;
  } catch {
    // ignore
  }
  return { skinTone: "medium", outfitColor: "#3b82f6" };
}

function saveCharacter(config: CharacterConfig): void {
  localStorage.setItem(CHARACTER_STORAGE_KEY, JSON.stringify(config));
}

export interface WorldStateMachine {
  screen: WorldScreen;
  character: CharacterConfig;
  goToHub: () => void;
  goToPathCorridor: (pathId: PathId) => void;
  goToAmbienteRoom: (pathId: PathId, roomIndex: number) => void;
  openElementDialogue: (pathId: PathId, roomIndex: number, hotspotId: string) => void;
  closeElementDialogue: () => void;
  updateCharacter: (config: CharacterConfig) => void;
  confirmCharacter: () => void;
}

export function useWorldStateMachine(): WorldStateMachine {
  const [screen, setScreen] = useState<WorldScreen>(() => {
    const saved = localStorage.getItem(CHARACTER_STORAGE_KEY);
    return saved ? { type: "hub" } : { type: "character-select" };
  });
  const [character, setCharacter] = useState<CharacterConfig>(loadCharacter);

  const goToHub = useCallback(() => setScreen({ type: "hub" }), []);

  const goToPathCorridor = useCallback((pathId: PathId) => {
    setScreen({ type: "path-corridor", pathId });
  }, []);

  const goToAmbienteRoom = useCallback((pathId: PathId, roomIndex: number) => {
    setScreen({ type: "ambiente-room", pathId, roomIndex });
  }, []);

  const openElementDialogue = useCallback(
    (pathId: PathId, roomIndex: number, hotspotId: string) => {
      setScreen({ type: "element-dialogue", pathId, roomIndex, hotspotId });
    },
    [],
  );

  const closeElementDialogue = useCallback(() => {
    setScreen((current) => {
      if (current.type === "element-dialogue") {
        return { type: "ambiente-room", pathId: current.pathId, roomIndex: current.roomIndex };
      }
      return current;
    });
  }, []);

  const updateCharacter = useCallback((config: CharacterConfig) => {
    setCharacter(config);
  }, []);

  const confirmCharacter = useCallback(() => {
    setCharacter((current) => {
      saveCharacter(current);
      return current;
    });
    setScreen({ type: "hub" });
  }, []);

  return {
    screen,
    character,
    goToHub,
    goToPathCorridor,
    goToAmbienteRoom,
    openElementDialogue,
    closeElementDialogue,
    updateCharacter,
    confirmCharacter,
  };
}
