import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import type React from "react";

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export function useTouchRipple(color = "rgba(255, 255, 255, 0.55)", size = 80) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const idRef = useRef(0);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = idRef.current++;
    setRipples((prev) => [...prev, { id, x, y }]);
  }, []);

  const rippleElements = (
    <AnimatePresence>
      {ripples.map((r) => (
        <motion.span
          key={r.id}
          initial={{ width: 6, height: 6, opacity: 0.9 }}
          animate={{ width: size, height: size, opacity: 0 }}
          exit={{}}
          transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
          onAnimationComplete={() => setRipples((prev) => prev.filter((item) => item.id !== r.id))}
          style={{
            position: "absolute",
            left: r.x,
            top: r.y,
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            border: `1.5px solid ${color}`,
            pointerEvents: "none",
            zIndex: 10,
          }}
        />
      ))}
    </AnimatePresence>
  );

  return { onPointerDown, rippleElements };
}
