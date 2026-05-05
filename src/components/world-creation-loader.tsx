import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Sparkles } from "lucide-react";
import {
  HourglassLoader,
  SpinnerBlocksLoader,
  EarthLoader,
  LoadingTextLoader,
} from "@/components/ui/loading-animations";

const STAGES = [
  "Lendo o que você está vivendo...",
  "Identificando os dois caminhos...",
  "Construindo o primeiro mundo...",
  "Dando vida ao segundo caminho...",
  "Finalizando os detalhes...",
] as const;

const LOADERS = [HourglassLoader, SpinnerBlocksLoader, EarthLoader, LoadingTextLoader] as const;

const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  size: 3 + (i % 4),
  top: `${8 + ((i * 6.5) % 84)}%`,
  left: `${5 + ((i * 7.3) % 90)}%`,
  opacity: 0.08 + (i % 5) * 0.04,
  duration: 8 + (i % 6) * 2,
  delay: i * 0.9,
}));

interface WorldCreationLoaderProps {
  dilemma: string;
}

export function WorldCreationLoader({ dilemma }: WorldCreationLoaderProps) {
  const [stageIndex, setStageIndex] = useState(0);
  const shouldReduce = useReducedMotion();

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((prev) => {
        const next = prev + 1;
        if (next >= STAGES.length - 1) {
          clearInterval(interval);
          return STAGES.length - 1;
        }
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const LoaderComponent = LOADERS[stageIndex % LOADERS.length];

  return (
    <div
      className="safe-screen relative flex flex-col items-center justify-center overflow-hidden px-6"
      style={{ perspective: "1200px" }}
    >
      {/* Atmospheric particles — CSS-only, no JS loop */}
      {!shouldReduce &&
        PARTICLES.map((p) => (
          <span
            key={p.id}
            aria-hidden="true"
            style={{
              position: "absolute",
              width: p.size,
              height: p.size,
              top: p.top,
              left: p.left,
              borderRadius: "50%",
              background:
                p.id % 3 === 0
                  ? "rgba(180,210,255,1)"
                  : p.id % 3 === 1
                    ? "rgba(255,255,255,1)"
                    : "rgba(140,190,255,1)",
              opacity: p.opacity,
              animation: `particle-drift-${p.id % 3} ${p.duration}s ease-in-out ${p.delay}s infinite`,
              pointerEvents: "none",
            }}
          />
        ))}

      {/* Background glass orbs — keep existing ambient aesthetic */}
      <div
        className="glass-orb absolute left-[15%] top-[20%] h-48 w-48 opacity-60"
        style={{ animation: "content-breathe 3s ease-in-out infinite", willChange: "transform" }}
      />
      <div
        className="glass-orb absolute bottom-[25%] right-[10%] h-32 w-32 opacity-40"
        style={{ animation: "content-breathe 4s ease-in-out infinite 0.8s" }}
      />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-8">
        {/* Dilemma echo */}
        <motion.p
          className="line-clamp-3 text-center text-base italic leading-7 text-sky-950/55"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          "{dilemma}"
        </motion.p>

        {/* Cycling loader — swaps with each stage, enters/exits from depth */}
        <AnimatePresence mode="wait">
          <motion.div
            key={stageIndex % LOADERS.length}
            initial={shouldReduce ? { opacity: 0 } : { opacity: 0, scale: 0.88, z: -60 }}
            animate={shouldReduce ? { opacity: 1 } : { opacity: 1, scale: 1, z: 0 }}
            exit={shouldReduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, z: -40 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <LoaderComponent />
          </motion.div>
        </AnimatePresence>

        {/* Stage icon + message */}
        <div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{
              background: "rgba(90,127,165,0.15)",
              border: "1px solid rgba(90,127,165,0.3)",
            }}
          >
            <Sparkles
              className="h-5 w-5 text-sky-600/70"
              style={{ animation: "content-breathe 2s ease-in-out infinite" }}
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.p
              key={stageIndex}
              className="text-center text-base text-sky-950/75"
              initial={shouldReduce ? { opacity: 0 } : { opacity: 0, z: -120, scale: 0.92 }}
              animate={shouldReduce ? { opacity: 1 } : { opacity: 1, z: 0, scale: 1 }}
              exit={shouldReduce ? { opacity: 0 } : { opacity: 0, z: -80, scale: 0.9 }}
              transition={
                shouldReduce ? { duration: 0 } : { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
              }
              style={{ transformStyle: "preserve-3d" }}
            >
              {STAGES[stageIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-2">
          {STAGES.map((_, i) => (
            <motion.div
              key={i}
              className="rounded-full"
              animate={{
                width: i === stageIndex ? 20 : 6,
                background: i <= stageIndex ? "#5a7fa5" : "rgba(90,127,165,0.25)",
              }}
              style={{ height: 6, borderRadius: 9999 }}
              transition={
                shouldReduce ? { duration: 0 } : { duration: 0.4, ease: [0.23, 1, 0.32, 1] }
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
