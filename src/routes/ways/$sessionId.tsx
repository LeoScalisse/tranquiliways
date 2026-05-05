import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, LoaderCircle, TriangleAlert, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { motion, AnimatePresence } from "motion/react";

import { DilemmaWorldView } from "@/components/dilemma-world";
import { PlayableWorldExperience } from "@/features/playable-world/ui/playable-world-experience";
import { LiquidGlassButton } from "@/components/ui/liquid-glass-button";
import { Button } from "@/components/ui/button";
import { getJourneySession } from "@/lib/journey-api";
import type { JourneyGenerationWarning } from "@/lib/journey-session";
import { isLegacyDilemmaWorld, isPlayableWorld } from "@/lib/journey-world";
import {
  getWayHistoryEntry,
  saveJourneySessionHistory,
  type WayHistoryEntry,
} from "@/lib/way-history";

export const Route = createFileRoute("/ways/$sessionId")({
  validateSearch: z.object({
    token: z.string().min(1).optional(),
  }),
  component: DilemmaSessionPage,
});

const FALLBACK_NOTICE_BY_WARNING: Record<JourneyGenerationWarning, string> = {
  groq_quota_exhausted:
    "A IA da Groq estava no limite neste momento, entao este mundo foi forjado em modo local para nao interromper sua jornada.",
  groq_unavailable:
    "A IA da Groq nao ficou disponivel neste momento, entao este mundo foi forjado em modo local para nao interromper sua jornada.",
  groq_invalid_response:
    "A IA da Groq respondeu de forma inconsistente neste momento, entao este mundo foi forjado em modo local para nao interromper sua jornada.",
};

function getFallbackNotice(entry: WayHistoryEntry | null) {
  if (!entry || entry.generationSource !== "fallback") {
    return null;
  }

  if (!entry.generationWarning) {
    return "Este mundo foi forjado em modo local para manter sua jornada em movimento.";
  }

  return FALLBACK_NOTICE_BY_WARNING[entry.generationWarning];
}

function DilemmaSessionPage() {
  const { sessionId } = Route.useParams();
  const { token } = Route.useSearch();
  const navigate = useNavigate();

  const [way, setWay] = useState<WayHistoryEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fallbackNotice = getFallbackNotice(way);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      setIsLoading(true);
      setError(null);

      const localWay = getWayHistoryEntry(sessionId);

      if (localWay) {
        if (active) {
          setWay(localWay);
          setIsLoading(false);
        }
        return;
      }

      if (!token) {
        if (active) {
          setWay(null);
          setError("Esse TranquiliWay nao esta salvo neste dispositivo.");
          setIsLoading(false);
        }
        return;
      }

      try {
        const result = await getJourneySession({ id: sessionId, launchToken: token });
        if (active) {
          setWay(saveJourneySessionHistory(result));
        }
      } catch (err) {
        if (active) {
          setWay(null);
          setError(err instanceof Error ? err.message : "Nao foi possivel carregar esta sessao.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadSession();
    return () => {
      active = false;
    };
  }, [sessionId, token]);

  if (way && !isLoading && isPlayableWorld(way.world)) {
    return (
      <div className="safe-screen relative overflow-hidden">
        <div className="absolute left-4 top-4 z-20">
          <LiquidGlassButton to="/ways" icon={ArrowLeft} compact />
        </div>

        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 pt-16 sm:px-6">
          {fallbackNotice ? (
            <section className="glass-panel rounded-[1.5rem] border border-white/35 px-4 py-3 text-sm leading-6 text-sky-950/78">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/55 px-3 py-1 text-xs uppercase tracking-[0.2em] text-sky-950/55">
                <Sparkles className="h-3.5 w-3.5" />
                Modo local
              </div>
              <p className="mt-3 max-w-3xl">{fallbackNotice}</p>
            </section>
          ) : null}
          <PlayableWorldExperience
            world={way.world}
            onBrowseWays={() => navigate({ to: "/ways" })}
          />
        </div>
      </div>
    );
  }

  const shouldRenderLegacyWorld = way && !isLoading && isLegacyDilemmaWorld(way.world);

  return (
    <div className="safe-screen relative overflow-hidden">
      <div className="glass-orb right-[8%] top-[10%] h-28 w-28 opacity-55" />
      <div className="glass-orb bottom-[16%] left-[6%] h-40 w-40 opacity-45" />

      <div
        className="mx-auto flex min-h-[calc(100svh-2rem)] w-full max-w-3xl flex-col gap-5 px-4 pt-4 pb-8"
        style={{ perspective: "1000px" }}
      >
        <motion.header
          className="flex items-center justify-between gap-3"
          initial={{ opacity: 0, y: -20, z: -60 }}
          animate={{ opacity: 1, y: 0, z: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ perspective: "800px" }}
        >
          <LiquidGlassButton to="/" icon={ArrowLeft} compact />
          <div className="glass-panel rounded-full px-4 py-2 text-sm text-sky-950/70">
            Seus caminhos
          </div>
        </motion.header>

        {isLoading && (
          <section className="glass-panel rounded-[2rem] p-6">
            <div className="flex items-center gap-3 text-sky-950/75">
              <div className="relative flex h-5 w-5 items-center justify-center">
                <div
                  className="absolute inset-0 rounded-full bg-sky-400/30"
                  style={{ animation: "content-breathe 1.4s ease-in-out infinite" }}
                />
                <LoaderCircle className="relative z-10 h-5 w-5 animate-spin" />
              </div>
              <span style={{ animation: "content-breathe 2s ease-in-out infinite" }}>
                Construindo seu mundo...
              </span>
            </div>
          </section>
        )}

        {error && (
          <section className="glass-panel rounded-[2rem] p-6">
            <div className="flex items-start gap-3 rounded-[1.5rem] border border-amber-200/70 bg-white/72 p-5 text-sky-950/75">
              <TriangleAlert className="mt-0.5 h-5 w-5 text-amber-500" />
              <div className="space-y-4">
                <div>
                  <h2 className="app-heading text-2xl font-semibold">Mundo nao encontrado.</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6">{error}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {token ? (
                    <Button
                      variant="glassProminent"
                      onClick={() => window.location.reload()}
                      className="rounded-full px-5"
                    >
                      Tentar de novo
                    </Button>
                  ) : null}
                  <Button asChild variant="glass" className="rounded-full px-5 text-sky-950">
                    <a href="/ways">Voltar para minhas ways</a>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        )}

        <AnimatePresence>
          {way && !isLoading && isLegacyDilemmaWorld(way.world) && (
            <>
              {/* Rings de reveal — explodem uma vez ao aparecer */}
              <motion.div
                initial={{ scale: 0.8, rotateX: 20 }}
                animate={{ scale: 1, rotateX: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                style={{ perspective: "600px" }}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none fixed inset-0 flex items-center justify-center"
                  style={{ zIndex: 50 }}
                >
                  {([0, 200, 400] as const).map((delay) => (
                    <div
                      key={delay}
                      className="absolute rounded-full border border-sky-300/40"
                      style={{
                        animation: `reveal-ring-expand 900ms var(--ease-out-strong) ${delay}ms both`,
                      }}
                    />
                  ))}
                </div>
              </motion.div>

              <motion.div
                className="flex flex-wrap items-center gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1], delay: 0.15 }}
              >
                <div className="glass-panel inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-sky-950/72">
                  <Sparkles className="h-4 w-4" />
                  {way.kind === "legacy" ? "Mundo salvo" : "Mundo gerado"}
                </div>
              </motion.div>

              <motion.h1
                className="app-heading px-1 text-2xl font-semibold text-sky-950 sm:text-3xl"
                initial={{ opacity: 0, filter: "blur(8px)", y: 6 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1], delay: 0.15 }}
              >
                Explore os dois lados do seu dilema.
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, scale: 0.97, z: 80 }}
                animate={{ opacity: 1, scale: 1, z: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                style={{ perspective: "1200px", transformStyle: "preserve-3d" }}
              >
                <DilemmaWorldView world={way.world} />
              </motion.div>

              <motion.div
                className="flex justify-center pt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1], delay: 0.9 }}
              >
                <Button
                  variant="glass"
                  className="rounded-full px-6 text-sky-950"
                  onClick={() => navigate({ to: "/ways" })}
                >
                  Ver todos os meus dilemas
                </Button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {way && !isLoading && !shouldRenderLegacyWorld && !isPlayableWorld(way.world) ? (
          <section className="glass-panel rounded-[2rem] p-6">
            <div className="flex items-start gap-3 rounded-[1.5rem] border border-amber-200/70 bg-white/72 p-5 text-sky-950/75">
              <TriangleAlert className="mt-0.5 h-5 w-5 text-amber-500" />
              <div className="space-y-4">
                <div>
                  <h2 className="app-heading text-2xl font-semibold">Sessao inconsistente.</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6">
                    O mundo foi salvo, mas esse formato nao conseguiu ser reconhecido na abertura.
                    Tente gerar novamente para reconstruir a sessao com o renderer atual.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="glassProminent"
                    onClick={() => navigate({ to: "/" })}
                    className="rounded-full px-5"
                  >
                    Gerar de novo
                  </Button>
                  <Button
                    variant="glass"
                    className="rounded-full px-5 text-sky-950"
                    onClick={() => navigate({ to: "/ways" })}
                  >
                    Ver minhas ways
                  </Button>
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
