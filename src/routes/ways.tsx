import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";

import { LiquidGlassButton } from "@/components/ui/liquid-glass-button";
import { useWays } from "@/hooks/use-ways";
import { getWorldCardMeta } from "@/lib/journey-world";

export const Route = createFileRoute("/ways")({
  component: WaysPage,
});

function cylinderTranslateZ(count: number) {
  const n = Math.max(count, 1);
  return Math.round(260 / Math.tan(Math.PI / n));
}

interface CylinderCardProps {
  way: ReturnType<typeof useWays>["ways"][number];
  index: number;
  count: number;
  translateZ: number;
  onClick: () => void;
}

function CylinderCard({ way, index, count, translateZ, onClick }: CylinderCardProps) {
  const card = getWorldCardMeta(way.world);

  return (
    <div
      className="tw-cylinder-item space-y-4 text-left"
      style={
        {
          "--quantity": count,
          "--index": index,
          "--translateZ": `${translateZ}px`,
          background: `linear-gradient(140deg, ${card.accentGradient[0]}cc, ${card.accentGradient[1]}cc)`,
          border: "1px solid rgba(255,255,255,0.5)",
          boxShadow: "0 16px 48px rgba(30,60,100,0.10)",
        } as React.CSSProperties
      }
      onClick={onClick}
    >
      <p className="text-xs font-medium uppercase tracking-widest text-sky-950/45">Dilema</p>
      <p className="text-base font-medium text-sky-950/85 leading-6 line-clamp-3">{way.rawInput}</p>

      <div className="flex gap-3">
        <div
          className="flex-1 rounded-[1.25rem] p-3 text-center text-xs"
          style={{
            background: `${card.leftPath.color}20`,
            border: `1px solid ${card.leftPath.color}30`,
          }}
        >
          <p className="font-medium text-sky-950/70">{card.leftPath.label}</p>
          <p className="mt-0.5 font-semibold" style={{ color: card.leftPath.color }}>
            {card.leftPath.title}
          </p>
        </div>
        <div
          className="flex-1 rounded-[1.25rem] p-3 text-center text-xs"
          style={{
            background: `${card.rightPath.color}20`,
            border: `1px solid ${card.rightPath.color}30`,
          }}
        >
          <p className="font-medium text-sky-950/70">{card.rightPath.label}</p>
          <p className="mt-0.5 font-semibold" style={{ color: card.rightPath.color }}>
            {card.rightPath.title}
          </p>
        </div>
      </div>

      <p className="text-xs text-sky-950/40">
        {new Date(way.createdAt).toLocaleDateString("pt-BR", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </p>
    </div>
  );
}

function WaysPage() {
  const { ways } = useWays();
  const navigate = useNavigate();
  const translateZ = useMemo(() => cylinderTranslateZ(ways.length), [ways.length]);

  return (
    <div className="safe-screen relative overflow-hidden">
      <div className="absolute left-4 top-4 z-10">
        <LiquidGlassButton to="/" icon={ArrowLeft} compact />
      </div>

      <div className="mx-auto flex min-h-[calc(100svh-2rem)] w-full max-w-3xl flex-col items-center justify-center gap-6 px-4 pt-20">
        <AnimatePresence mode="wait">
          {ways.length === 0 ? (
            <motion.div
              key="empty"
              className="flex flex-col items-center gap-5 text-center"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="glass-panel flex h-16 w-16 items-center justify-center rounded-full">
                <Sparkles className="h-7 w-7 text-sky-950/70" />
              </div>
              <p className="max-w-xs text-base text-sky-950/75">
                Voce ainda nao explorou nenhum dilema. Comece descrevendo uma decisao que esta te
                pesando.
              </p>
              <button
                onClick={() => navigate({ to: "/" })}
                className="glass-panel rounded-full px-5 py-2 text-sm font-medium text-sky-950/80 transition hover:scale-105"
              >
                Explorar meu primeiro dilema
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="cylinder"
              className="flex w-full flex-col items-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="tw-cylinder-scene">
                <div
                  className="tw-cylinder-wrapper"
                  style={{ "--quantity": ways.length } as React.CSSProperties}
                >
                  {ways.map((way, index) => (
                    <CylinderCard
                      key={way.id}
                      way={way}
                      index={index}
                      count={ways.length}
                      translateZ={translateZ}
                      onClick={() =>
                        navigate({
                          to: "/ways/$sessionId",
                          params: { sessionId: way.id },
                        })
                      }
                    />
                  ))}
                </div>
              </div>

              <p className="text-center text-xs text-sky-950/50">
                {ways.length} {ways.length === 1 ? "dilema explorado" : "dilemas explorados"}
              </p>
              <p className="text-center text-xs text-sky-950/35">
                Toque em qualquer card para abrir
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
