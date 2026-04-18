import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { LiquidGlassButton } from "@/components/ui/liquid-glass-button";
import { WayCard } from "@/components/ui/way-card";
import { useWays } from "@/hooks/use-ways";
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
              Você ainda não tem ways. Volte e diga como quer se sentir hoje.
            </p>
            <button
              onClick={() => navigate({ to: "/" })}
              className="glass-panel rounded-full px-5 py-2 text-sm font-medium text-sky-950/80 transition hover:scale-105"
            >
              Criar meu primeiro way
            </button>
          </div>
        ) : (
          <>
            <div className="w-full overflow-hidden" ref={emblaRef}>
              <div className="flex">
                {ways.map((way) => (
                  <div
                    key={way.id}
                    className="flex min-w-0 shrink-0 grow-0 basis-full items-center justify-center px-4 py-6"
                  >
                    <WayCard
                      title={way.title}
                      location={way.location}
                      date={way.date}
                      temperature={way.temperature}
                      forecast={way.forecast}
                      palette={way.palette}
                      weather={way.weather}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => emblaApi?.scrollPrev()}
                disabled={selected === 0}
                className="glass-panel flex h-10 w-10 items-center justify-center rounded-full text-sky-950/80 transition disabled:opacity-40"
                aria-label="Way anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2">
                {ways.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => emblaApi?.scrollTo(i)}
                    className={cn(
                      "h-2 rounded-full transition-all",
                      i === selected ? "w-6 bg-sky-950/70" : "w-2 bg-sky-950/30",
                    )}
                    aria-label={`Ir para way ${i + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={() => emblaApi?.scrollNext()}
                disabled={selected === ways.length - 1}
                className="glass-panel flex h-10 w-10 items-center justify-center rounded-full text-sky-950/80 transition disabled:opacity-40"
                aria-label="Próximo way"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <p className="text-center text-xs text-sky-950/60">
              {selected + 1} de {ways.length} · {ways[selected]?.prompt}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
