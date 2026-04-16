import React, { useRef, useCallback } from "react";
import { motion, useSpring, useTransform } from "motion/react";
import { Cloud } from "lucide-react";
import { Link } from "@tanstack/react-router";

const PANEL_COUNT = 12;
const WAVE_SPRING = { stiffness: 160, damping: 22, mass: 0.6 };
const Z_SPREAD = 8;
const SIGMA = 2.8;

const GRADIENT_OVERLAYS = [
  "linear-gradient(135deg, rgba(92,195,255,0.4) 0%, rgba(255,255,255,0.3) 100%)",
  "linear-gradient(135deg, rgba(92,195,255,0.3) 0%, rgba(200,230,255,0.4) 100%)",
  "linear-gradient(135deg, rgba(150,215,255,0.35) 0%, rgba(92,195,255,0.3) 100%)",
  "linear-gradient(135deg, rgba(92,195,255,0.45) 0%, rgba(180,225,255,0.3) 100%)",
  "linear-gradient(135deg, rgba(120,205,255,0.3) 0%, rgba(92,195,255,0.4) 100%)",
  "linear-gradient(135deg, rgba(92,195,255,0.35) 0%, rgba(220,240,255,0.35) 100%)",
  "linear-gradient(135deg, rgba(92,195,255,0.4) 0%, rgba(160,220,255,0.3) 100%)",
  "linear-gradient(135deg, rgba(140,210,255,0.35) 0%, rgba(92,195,255,0.4) 100%)",
  "linear-gradient(135deg, rgba(92,195,255,0.3) 0%, rgba(190,230,255,0.35) 100%)",
  "linear-gradient(135deg, rgba(92,195,255,0.45) 0%, rgba(170,225,255,0.3) 100%)",
  "linear-gradient(135deg, rgba(110,200,255,0.35) 0%, rgba(92,195,255,0.4) 100%)",
  "linear-gradient(135deg, rgba(92,195,255,0.4) 0%, rgba(210,235,255,0.35) 100%)",
];

function MiniPanel({
  index,
  total,
  waveY,
}: {
  index: number;
  total: number;
  waveY: ReturnType<typeof useSpring>;
}) {
  const t = index / (total - 1);
  const baseZ = (index - (total - 1)) * Z_SPREAD;
  const w = 16 + t * 10;
  const h = 22 + t * 14;
  const opacity = 0.2 + t * 0.8;
  const gradient = GRADIENT_OVERLAYS[index % GRADIENT_OVERLAYS.length];

  return (
    <motion.div
      style={{
        position: "absolute",
        width: w,
        height: h,
        borderRadius: 4,
        overflow: "hidden",
        y: waveY,
        zIndex: index,
        translateZ: baseZ,
        opacity,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: gradient,
          borderRadius: 4,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          border: "1px solid rgba(255,255,255,0.3)",
          borderRadius: 4,
        }}
      />
    </motion.div>
  );
}

export function LiquidGlassButton() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = React.useState(false);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const waveYSprings = Array.from({ length: PANEL_COUNT }, () => useSpring(0, WAVE_SPRING));

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cy = (e.clientY - rect.top) / rect.height;
      const cursorPos = cy * (PANEL_COUNT - 1);

      waveYSprings.forEach((spring, i) => {
        const dist = Math.abs(i - cursorPos);
        const influence = Math.exp(-(dist * dist) / (2 * SIGMA * SIGMA));
        spring.set(-influence * 6);
      });
    },
    [waveYSprings]
  );

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    waveYSprings.forEach((s) => s.set(0));
  }, [waveYSprings]);

  return (
    <Link to="/ways">
      <motion.div
        ref={containerRef}
        className="relative w-12 h-12 rounded-full cursor-pointer flex items-center justify-center overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.08) 100%)",
          backdropFilter: "blur(16px) saturate(1.8)",
          WebkitBackdropFilter: "blur(16px) saturate(1.8)",
          border: "1px solid rgba(255,255,255,0.35)",
          boxShadow: "0 4px 24px rgba(92,195,255,0.15), inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.05)",
        }}
      >
        {/* Stacked panels background effect */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ perspective: 200, transformStyle: "preserve-3d" }}
        >
          {Array.from({ length: PANEL_COUNT }).map((_, i) => (
            <MiniPanel
              key={i}
              index={i}
              total={PANEL_COUNT}
              waveY={waveYSprings[i]}
            />
          ))}
        </div>

        {/* Glass overlay */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.1) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Cloud icon */}
        <Cloud
          className="relative z-10"
          size={22}
          strokeWidth={1.8}
          style={{
            color: "rgba(255,255,255,0.9)",
            filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.15))",
          }}
        />
      </motion.div>
    </Link>
  );
}
