import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Sparkles } from "lucide-react";

const STAGES = [
  "Lendo o que você está vivendo...",
  "Identificando os dois caminhos...",
  "Construindo o primeiro mundo...",
  "Dando vida ao segundo caminho...",
  "Finalizando os detalhes...",
] as const;

interface WorldCreationLoaderProps {
  dilemma: string;
}

export function WorldCreationLoader({ dilemma }: WorldCreationLoaderProps) {
  const [stageIndex, setStageIndex] = useState(0);
  const shouldReduce = useReducedMotion();

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((prev) => {
        const next = Math.min(prev + 1, STAGES.length - 1);
        if (next === STAGES.length - 1) clearInterval(interval);
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="safe-screen relative flex flex-col items-center justify-center overflow-hidden px-6">
      {/* Orb grande — fundo */}
      <div
        className="glass-orb absolute left-[15%] top-[20%] h-48 w-48 opacity-60"
        style={{ animation: "content-breathe 3s ease-in-out infinite" }}
      />
      {/* Orb pequeno — foreground offset */}
      <div
        className="glass-orb absolute bottom-[25%] right-[10%] h-32 w-32 opacity-40"
        style={{ animation: "content-breathe 4s ease-in-out infinite 0.8s" }}
      />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-8">
        {/* Dilema ecoado */}
        <motion.p
          className="line-clamp-3 text-center text-base italic leading-7 text-sky-950/55"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          "{dilemma}"
        </motion.p>

        {/* Ícone + mensagem do estágio */}
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
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={shouldReduce ? { duration: 0 } : { duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            >
              {STAGES[stageIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Dots de progresso — dot ativo se alarga em pill */}
        <div className="flex items-center gap-2">
          {STAGES.map((_, i) => (
            <motion.div
              key={i}
              className="h-1.5 rounded-full"
              animate={{
                width: i === stageIndex ? 20 : 6,
                background:
                  i <= stageIndex ? "#5a7fa5" : "rgba(90,127,165,0.25)",
              }}
              transition={shouldReduce ? { duration: 0 } : { duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
