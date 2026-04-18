import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Waves } from "lucide-react";

import { JourneyForgeCard } from "@/components/journey-forge-card";
import { LiquidGlassButton } from "@/components/ui/liquid-glass-button";
import { TranquiliWaysTitle } from "@/components/ui/tranquili-ways-title";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="safe-screen relative overflow-hidden">
      <div className="glass-orb right-[10%] top-[8%] h-28 w-28 opacity-60" />
      <div className="glass-orb bottom-[10%] left-[3%] h-36 w-36 opacity-55" />
      <div className="glass-orb left-[14%] top-[14%] h-16 w-16 opacity-45" />

      <div className="mx-auto flex min-h-[calc(100svh-2rem)] w-full max-w-6xl flex-col justify-between gap-8">
        <header className="flex items-center justify-between gap-3">
          <div className="glass-panel inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-sky-950/80">
            <Waves className="h-4 w-4" />
            Primeira Chama em forja
          </div>
          <LiquidGlassButton to="/ways" icon={Sparkles} label="Minhas TranquiliWays" prominent />
        </header>

        <main className="grid flex-1 items-start gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="space-y-6 pt-3">
            <div className="space-y-3">
              <p className="app-heading text-sm font-semibold uppercase tracking-[0.24em] text-sky-950/60">
                Tranquili+ para a travessia inicial
              </p>
              <TranquiliWaysTitle shimmerActive />
              <p className="max-w-xl text-base leading-7 text-sky-950/72 sm:text-lg">
                O primeiro loop esta aqui: voce escreve ou fala, o app forja uma sessao e abre o
                caminho para um ambiente 3D simples, calmo e vivo no Android.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {[
                "Texto ou voz on-device",
                "Sessao pronta para deep link",
                "Fase 1 focada em Android + Unity",
              ].map((item) => (
                <div
                  key={item}
                  className="glass-panel rounded-full px-4 py-2 text-sm text-sky-950/70"
                >
                  {item}
                </div>
              ))}
            </div>
          </section>

          <JourneyForgeCard />
        </main>

        <footer className="flex flex-col gap-3 pb-1 text-sm text-sky-950/60 sm:flex-row sm:items-center sm:justify-between">
          <p>Fase 1 focada em validar input, sessao compartilhada e abertura confiavel no Unity.</p>
          <div className="flex items-center gap-2">
            <span className="glass-panel rounded-full px-3 py-1.5">Android</span>
            <span className="glass-panel rounded-full px-3 py-1.5">Unity app</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
