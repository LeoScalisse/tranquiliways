import { useRef, useCallback } from "react";
import { useMotionValue, useSpring, useReducedMotion } from "motion/react";

interface Use3DTiltOptions {
  maxRotateX?: number;
  maxRotateY?: number;
  stiffness?: number;
  damping?: number;
}

export function use3DTilt({
  maxRotateX = 8,
  maxRotateY = 12,
  stiffness = 150,
  damping = 20,
}: Use3DTiltOptions = {}) {
  const ref = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const nxRaw = useMotionValue(0);
  const nyRaw = useMotionValue(0);

  const rotateX = useSpring(rawX, { stiffness, damping });
  const rotateY = useSpring(rawY, { stiffness, damping });
  const nx = useSpring(nxRaw, { stiffness, damping });
  const ny = useSpring(nyRaw, { stiffness, damping });

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (shouldReduceMotion || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const normalizedX = (e.clientX - cx) / (rect.width / 2);
      const normalizedY = (e.clientY - cy) / (rect.height / 2);
      rawY.set(normalizedX * maxRotateY);
      rawX.set(-normalizedY * maxRotateX);
      nxRaw.set(((e.clientX - rect.left) / rect.width) * 100);
      nyRaw.set(((e.clientY - rect.top) / rect.height) * 100);
    },
    [shouldReduceMotion, maxRotateX, maxRotateY, rawX, rawY, nxRaw, nyRaw],
  );

  const onPointerLeave = useCallback(() => {
    rawX.set(0);
    rawY.set(0);
    nxRaw.set(50);
    nyRaw.set(50);
  }, [rawX, rawY, nxRaw, nyRaw]);

  return {
    ref: ref as React.RefObject<HTMLElement>,
    rotateX,
    rotateY,
    nx,
    ny,
    onPointerMove,
    onPointerLeave,
  };
}
