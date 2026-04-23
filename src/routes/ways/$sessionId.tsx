import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, LoaderCircle, TriangleAlert, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";

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
        <header className="flex items-center justify-between gap-3">
          <LiquidGlassButton to="/" icon={ArrowLeft} compact />
          <div className="glass-panel rounded-full px-4 py-2 text-sm text-sky-950/70">
            Seus caminhos
          </div>
        </header>

        {isLoading && (
          <section className="glass-panel rounded-[2rem] p-6">
            <div className="flex items-center gap-3 text-sky-950/75">
              <LoaderCircle className="h-5 w-5 animate-spin" />
              <span>Construindo seu mundo...</span>
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

        {way && !isLoading && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <div className="glass-panel inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-sky-950/72">
                <Sparkles className="h-4 w-4" />
                {way.kind === "legacy" ? "Mundo salvo" : "Mundo gerado"}
              </div>
            </div>

            <h1 className="app-heading px-1 text-2xl font-semibold text-sky-950 sm:text-3xl">
              Explore os dois lados do seu dilema.
            </h1>

            <DilemmaWorldView world={way.world} />

            <div className="flex justify-center pt-2">
              <Button
                variant="glass"
                className="rounded-full px-6 text-sky-950"
                onClick={() => navigate({ to: "/ways" })}
              >
                Ver todos os meus dilemas
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
