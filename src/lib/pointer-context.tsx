import { createContext, useContext, useEffect, useRef } from "react";
import { useMotionValue, type MotionValue } from "motion/react";

interface PointerContextValue {
  x: MotionValue<number>;
  y: MotionValue<number>;
}

const PointerContext = createContext<PointerContextValue | null>(null);

export function PointerProvider({ children }: { children: React.ReactNode }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        x.set((e.clientX / window.innerWidth) * 2 - 1);
        y.set((e.clientY / window.innerHeight) * 2 - 1);
      });
    };
    window.addEventListener("pointermove", handleMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handleMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [x, y]);

  return <PointerContext.Provider value={{ x, y }}>{children}</PointerContext.Provider>;
}

export function usePointer(): PointerContextValue {
  const ctx = useContext(PointerContext);
  if (!ctx) throw new Error("usePointer must be used within <PointerProvider>");
  return ctx;
}
