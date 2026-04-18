import { useCallback, useEffect, useState } from "react";
import { interpretWay, type InterpretedWay } from "@/lib/interpret-way";

const STORAGE_KEY = "tranquili.ways.v1";

function load(): InterpretedWay[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as InterpretedWay[];
  } catch {
    return [];
  }
}

function save(ways: InterpretedWay[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ways));
  } catch {
    // ignore quota
  }
}

export function useWays() {
  const [ways, setWays] = useState<InterpretedWay[]>([]);

  useEffect(() => {
    setWays(load());
  }, []);

  const addWay = useCallback((prompt: string) => {
    const way = interpretWay(prompt);
    setWays((prev) => {
      const next = [way, ...prev];
      save(next);
      return next;
    });
    return way;
  }, []);

  const clearWays = useCallback(() => {
    setWays([]);
    save([]);
  }, []);

  return { ways, addWay, clearWays };
}
