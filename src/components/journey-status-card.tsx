import { useEffect, useState } from "react";
import { ArrowRight, LoaderCircle, Sparkles, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getJourneySession } from "@/lib/journey-api";
import type { JourneySession } from "@/lib/journey-session";
import { getUnityLauncherState, launchUnitySession } from "@/lib/unity-launcher";

interface JourneyStatusCardProps {
  sessionId: string;
  launchToken: string;
}

export function JourneyStatusCard({
  sessionId,
  launchToken,
}: JourneyStatusCardProps) {
  const [session, setSession] = useState<JourneySession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLaunching, setIsLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [launchFeedback, setLaunchFeedback] = useState<string | null>(null);

  const launcherState = getUnityLauncherState();

  useEffect(() => {
    let active = true;

    async function loadSession() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getJourneySession({
          id: sessionId,
          launchToken,
        });

        if (!active) {
          return;
        }

        setSession(result);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Nao foi possivel preparar sua jornada.",
        );
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
  }, [launchToken, sessionId]);

  function handleRetry() {
    window.location.reload();
  }

  async function handleLaunch() {
    if (!session) {
      return;
    }

    setLaunchFeedback(null);
    setIsLaunching(true);

    const result = await launchUnitySession({
      id: session.id,
      launchToken: session.launchToken,
    });

    if (!result.canLaunch) {
      setLaunchFeedback(result.reason);
      setIsLaunching(false);
      return;
    }

    window.setTimeout(() => {
      setIsLaunching(false);
    }, 1200);
  }

  if (isLoading) {
    return (
      <section className="glass-panel rounded-[2rem] p-6">
        <div className="flex items-center gap-3 text-sky-950/75">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          <span>Seu TranquiliWay esta sendo preparado...</span>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="glass-panel rounded-[2rem] p-6">
        <div className="flex items-start gap-3 rounded-[1.5rem] border border-amber-200/70 bg-white/72 p-5 text-sky-950/75">
          <TriangleAlert className="mt-0.5 h-5 w-5 text-amber-500" />
          <div className="space-y-4">
            <div>
              <h2 className="app-heading text-2xl font-semibold">A chama nao estabilizou ainda.</h2>
              <p className="mt-2 max-w-xl text-sm leading-6">{error}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="glassProminent" onClick={handleRetry} className="rounded-full px-5">
                Tentar de novo
              </Button>
              <Button asChild variant="glass" className="rounded-full px-5 text-sky-950">
                <a href="/">Voltar ao inicio</a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <section className="glass-panel rounded-[2rem] p-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="glass-panel inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-sky-950/72">
          <Sparkles className="h-4 w-4" />
          Sessao pronta
        </div>
        <div className="glass-panel rounded-full px-4 py-2 text-sm text-sky-950/58">
          Status: {session.status}
        </div>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <div>
            <h1 className="app-heading text-3xl font-semibold text-sky-950 sm:text-4xl">
              Seu TranquiliWay esta aceso.
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-sky-950/72">
              A sessao foi criada, o launch token foi forjado e o proximo passo e atravessar para
              o hub 3D no Unity.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-white/35 bg-white/72 p-5">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-950/50">
              Chama inicial
            </p>
            <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-sky-950/82">
              {session.rawInput}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[1.5rem] border border-white/35 bg-white/72 p-5 text-sm text-sky-950/72">
            <div className="flex items-center justify-between gap-3">
              <span className="uppercase tracking-[0.22em] text-sky-950/46">Detalhes</span>
              <span className="rounded-full bg-sky-100/90 px-3 py-1 text-xs font-medium text-sky-900">
                {session.inputMode === "voice" ? "Voz" : "Texto"}
              </span>
            </div>
            <dl className="mt-4 space-y-3">
              <div>
                <dt className="text-sky-950/45">Session ID</dt>
                <dd className="mt-1 font-mono text-xs text-sky-950/82">{session.id}</dd>
              </div>
              <div>
                <dt className="text-sky-950/45">Criada em</dt>
                <dd className="mt-1 text-sm text-sky-950/82">
                  {new Date(session.createdAt).toLocaleString("pt-BR")}
                </dd>
              </div>
              <div>
                <dt className="text-sky-950/45">Launcher</dt>
                <dd className="mt-1 text-sm text-sky-950/82">
                  {launcherState.canLaunch
                    ? "Pronto para abrir o Unity no Android."
                    : launcherState.reason}
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              type="button"
              variant="glassProminent"
              size="lg"
              onClick={() => {
                void handleLaunch();
              }}
              disabled={!launcherState.canLaunch || isLaunching}
              className="rounded-full px-6"
            >
              {isLaunching ? <LoaderCircle className="animate-spin" /> : <ArrowRight />}
              {isLaunching ? "Abrindo..." : "Abrir no Unity"}
            </Button>

            <Button asChild variant="glass" size="lg" className="rounded-full px-6 text-sky-950">
              <a href="/ways">Ver Minhas TranquiliWays</a>
            </Button>
          </div>

          {launchFeedback ? (
            <div className="rounded-[1.25rem] border border-sky-200/70 bg-sky-50/80 px-4 py-3 text-sm text-sky-950/72">
              {launchFeedback}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
