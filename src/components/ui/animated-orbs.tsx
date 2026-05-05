import { motion } from "motion/react";
import { useParallaxDepth } from "@/hooks/use-parallax-depth";

function OrbLayer({ depthFactor, style }: { depthFactor: number; style: React.CSSProperties }) {
  const { x, y } = useParallaxDepth(depthFactor);
  return (
    <motion.div
      style={{
        position: "absolute",
        borderRadius: "50%",
        ...style,
        x,
        y,
      }}
    />
  );
}

export function AnimatedOrbs() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {/* Orbe 1 — grande, topo direito, azul claro, ciclo 10s — depth 0.6 (background) */}
      <OrbLayer
        depthFactor={0.6}
        style={{
          width: 220,
          height: 220,
          top: -70,
          right: -70,
          background:
            "radial-gradient(circle at 40% 40%, rgba(255,255,255,0.72) 0%, rgba(168,220,255,0.32) 45%, rgba(92,195,255,0) 70%)",
          filter: "blur(18px)",
          animation: "orb-float-1 10s ease-in-out infinite",
        }}
      />
      {/* Orbe 2 — média, centro esquerdo, branco, ciclo 14s — depth 1.2 (midground) */}
      <OrbLayer
        depthFactor={1.2}
        style={{
          width: 160,
          height: 160,
          top: "38%",
          left: -50,
          background:
            "radial-gradient(circle at 55% 45%, rgba(255,255,255,0.62) 0%, rgba(200,235,255,0.28) 45%, rgba(92,195,255,0) 70%)",
          filter: "blur(14px)",
          animation: "orb-float-2 14s ease-in-out infinite",
        }}
      />
      {/* Orbe 3 — pequena, fundo direito, creme/amarelo, ciclo 8s — depth 2.0 (foreground) */}
      <OrbLayer
        depthFactor={2.0}
        style={{
          width: 110,
          height: 110,
          bottom: "12%",
          right: "5%",
          background:
            "radial-gradient(circle at 45% 45%, rgba(255,244,194,0.72) 0%, rgba(255,220,100,0.22) 50%, rgba(255,200,50,0) 70%)",
          filter: "blur(10px)",
          animation: "orb-float-3 8s ease-in-out infinite",
        }}
      />
    </div>
  );
}
