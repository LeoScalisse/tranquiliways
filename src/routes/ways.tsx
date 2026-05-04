import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { motion } from "motion/react";

import { LiquidGlassButton } from "@/components/ui/liquid-glass-button";
import { useWays } from "@/hooks/use-ways";
import { getWorldCardMeta } from "@/lib/journey-world";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ways")({
  component: WaysPage,
});

function WaysPage() {
  const { ways } = useWays();
  const navigate = useNavigate();
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    loop: false,
    containScroll: "trimSnaps",
  });
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  return (
    <div className="safe-screen relative overflow-hidden">
      <div className="absolute left-4 top-4 z-10">
        <LiquidGlassButton to="/" icon={ArrowLeft} compact />
      </div>

      <div className="mx-auto flex min-h-[calc(100svh-2rem)] w-full max-w-3xl flex-col items-center justify-center gap-8 px-4 pt-20">
        {ways.length === 0 ? (
          <div className="flex flex-col items-center gap-5 text-center">
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
          </div>
        ) : (
          <>
            <div className="w-full overflow-hidden" ref={emblaRef}>
              <div className="flex">
                {ways.map((way, index) => {
                  const card = getWorldCardMeta(way.world);

                  return (
                    <motion.div
                      key={way.id}
                      className="flex min-w-0 shrink-0 grow-0 basis-full items-center justify-center px-4 py-6"
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.45,
                        ease: [0.23, 1, 0.32, 1],
                        delay: index * 0.05,
                      }}
                    >
                      <motion.button
                        type="button"
                        className="w-full max-w-sm rounded-[2rem] p-6 space-y-4 text-left"
                        style={{
                          background: `linear-gradient(140deg, ${card.accentGradient[0]}cc, ${card.accentGradient[1]}cc)`,
                          border: "1px solid rgba(255,255,255,0.5)",
                          boxShadow: "0 16px 48px rgba(30,60,100,0.10)",
                        }}
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                        onClick={() =>
                          navigate({
                            to: "/ways/$sessionId",
                            params: { sessionId: way.id },
                          })
                        }
                      >
                        <p className="text-xs font-medium uppercase tracking-widest text-sky-950/45">
                          Dilema
                        </p>
                        <p className="text-base font-medium text-sky-950/85 leading-6 line-clamp-3">
                          {way.rawInput}
                        </p>

                        <div className="flex gap-3">
                          <div
                            className="flex-1 rounded-[1.25rem] p-3 text-center text-xs"
                            style={{
                              background: `${card.leftPath.color}20`,
                              border: `1px solid ${card.leftPath.color}30`,
                            }}
                          >
                            <p className="font-medium text-sky-950/70">{card.leftPath.label}</p>
                            <p
                              className="mt-0.5 font-semibold"
                              style={{ color: card.leftPath.color }}
                            >
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
                            <p
                              className="mt-0.5 font-semibold"
                              style={{ color: card.rightPath.color }}
                            >
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
                      </motion.button>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => emblaApi?.scrollPrev()}
                disabled={selected === 0}
                className="glass-panel flex h-10 w-10 items-center justify-center rounded-full text-sky-950/80 transition disabled:opacity-40"
                aria-label="Dilema anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2">
                {ways.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => emblaApi?.scrollTo(index)}
                    className={cn(
                      "h-2 rounded-full transition-all",
                      index === selected ? "w-6 bg-sky-950/70" : "w-2 bg-sky-950/30",
                    )}
                    aria-label={`Ir para dilema ${index + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={() => emblaApi?.scrollNext()}
                disabled={selected === ways.length - 1}
                className="glass-panel flex h-10 w-10 items-center justify-center rounded-full text-sky-950/80 transition disabled:opacity-40"
                aria-label="Próximo dilema"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <p className="text-center text-xs text-sky-950/60">
              {selected + 1} de {ways.length}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
