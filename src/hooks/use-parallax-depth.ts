import { useTransform, useSpring, useReducedMotion } from "motion/react";
import { usePointer } from "@/lib/pointer-context";

/**
 * Returns x/y motion values that shift based on pointer position.
 * depthFactor: 1 = subtle background, 3 = prominent foreground.
 */
export function useParallaxDepth(depthFactor: number) {
  const { x: pointerX, y: pointerY } = usePointer();
  const shouldReduce = useReducedMotion();

  const range = shouldReduce ? 0 : depthFactor * 18;

  const rawX = useTransform(pointerX, [-1, 1], [-range, range]);
  const rawY = useTransform(pointerY, [-1, 1], [-range * 0.6, range * 0.6]);

  const x = useSpring(rawX, { stiffness: 55, damping: 22 });
  const y = useSpring(rawY, { stiffness: 55, damping: 22 });

  return { x, y };
}
