import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, LoaderCircle, TriangleAlert, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { motion, AnimatePresence } from "motion/react";

import { DilemmaWorldView } from "@/components/dilemma-world";
import { LiquidGlassButton } from "@/components/ui/liquid-glass-button";
import { Button } from "@/components/ui/button";
import { getJourneySession } from "@/lib/journey-api";
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

function DilemmaSessionPage() {
  const { sessionId } = Route.useParams();
  const { token } = Route.useSearch();
  const navigate = useNavigate();

  const [way, setWay] = useState<WayHistoryEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    return () => { active = false; };
  }, [sessionId, token]);

  return (
    <div className="safe-screen relative overflow-hidden">
      <div className="glass-orb right-[8%] top-[10%] h-28 w-28 opacity-55" />
      <div className="glass-orb bottom-[16%] left-[6%] h-40 w-40 opacity-45" />

      <div className="mx-auto flex min-h-[calc(100svh-2rem)] w-full max-w-3xl flex-col gap-5 px-4 pt-4 pb-8">
        <motion.header
          className="flex items-center justify-between gap-3"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
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
                    <Button variant="glassProminent" onClick={() => window.location.reload()} className="rounded-full px-5">
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
          {way && !isLoading && (
            <>
              {/* Rings de reveal — explodem uma vez ao aparecer */}
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
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", duration: 0.5, bounce: 0.12, delay: 0.3 }}
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
      </div>
    </div>
  );
}
