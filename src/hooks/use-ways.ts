import { useCallback, useEffect, useState } from "react";
import type { DilemmaWorld } from "@/lib/interpret-dilemma";

export interface SavedWay {
  id: string;
  dilema: string;
  world: DilemmaWorld;
  savedAt: number;
}

const STORAGE_KEY = "tranquili.ways.v2";

function load(): SavedWay[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedWay[];
  } catch {
    return [];
  }
}

function save(ways: SavedWay[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ways));
  } catch {
    // ignore quota
  }
}

export function useWays() {
  const [ways, setWays] = useState<SavedWay[]>([]);

  useEffect(() => {
    setWays(load());
  }, []);

  const addWay = useCallback((dilema: string, world: DilemmaWorld) => {
    const entry: SavedWay = {
      id: world.id,
      dilema,
      world,
      savedAt: Date.now(),
    };
    setWays((prev) => {
      const next = [entry, ...prev];
      save(next);
      return next;
    });
    return entry;
  }, []);

  const clearWays = useCallback(() => {
    setWays([]);
    save([]);
  }, []);

  return { ways, addWay, clearWays };
}
