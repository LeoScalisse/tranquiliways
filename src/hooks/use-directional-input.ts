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
