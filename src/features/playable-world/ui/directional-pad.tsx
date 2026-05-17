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
        <div className="bg-white/20 rounded-sm" />
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
