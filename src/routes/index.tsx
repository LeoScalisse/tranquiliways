import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Waves, HeartHandshake } from "lucide-react";
import { motion } from "motion/react";
import { PromptInputBox } from "@/components/ui/ai-prompt-box";
import { TranquiliWaysTitle } from "@/components/ui/tranquili-ways-title";
import { LiquidGlassButton } from "@/components/ui/liquid-glass-button";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [interacting, setInteracting] = useState(false);

  return (
    <div className="safe-screen relative overflow-hidden">
      <div className="glass-orb right-[8%] top-[8%] h-28 w-28 opacity-60" />
      <div className="glass-orb bottom-[18%] left-[3%] h-32 w-32 opacity-50" />

      <div className="mx-auto flex min-h-[calc(100svh-2rem)] w-full max-w-5xl flex-col justify-between gap-6 md:gap-8">
        <header className="flex items-center justify-between gap-3">
          <div className="glass-panel inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-sky-950/80">
            <Waves className="h-4 w-4" />
            Jornada calma para iOS e Android
          </div>
          <LiquidGlassButton to="/ways" icon={Sparkles} label="Abrir Ways" prominent />
        </header>

        <main className="grid flex-1 items-center gap-6 md:grid-cols-[1.1fr_0.9fr] md:gap-8">
          <section className="space-y-5">
            <div className="space-y-3">
              <p className="app-heading text-sm font-semibold uppercase tracking-[0.24em] text-sky-950/60">
                Espaço sensível, leve e portátil
              </p>
              <TranquiliWaysTitle shimmerActive={!interacting} />
              <p className="max-w-xl text-base leading-7 text-sky-950/72 sm:text-lg">
                Escreva, anexe, pense e organize suas ideias em uma interface feita para caber bem
                na mão e continuar elegante no tablet.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {[
                "Botões em estilo Liquid Glass",
                "Interface touch-first",
                "Base pronta para shell híbrido",
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

          <motion.section
            className="glass-panel rounded-[2rem] p-3 sm:p-4"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <div className="mb-4 flex items-center justify-between gap-3 px-2 py-1">
              <div>
                <p className="text-sm font-semibold text-sky-950/75">Capturar agora</p>
                <p className="text-xs text-sky-950/55">Mensagem, imagem ou pensamento guiado</p>
              </div>
              <div className="glass-panel rounded-full px-3 py-2 text-sky-950/70">
                <HeartHandshake className="h-4 w-4" />
              </div>
            </div>

            <div
              onFocusCapture={() => setInteracting(true)}
              onBlurCapture={() => setInteracting(false)}
            >
              <PromptInputBox
                placeholder="Como você quer se sentir hoje?"
                className="rounded-[1.75rem] border-white/30 bg-white/75 shadow-[0_18px_44px_rgba(30,76,112,0.12)]"
                onSend={(message, files) => {
                  console.log("Message:", message);
                  console.log("Files:", files);
                }}
              />
            </div>
          </motion.section>
        </main>

        <footer className="flex flex-col gap-3 pb-1 text-sm text-sky-950/60 sm:flex-row sm:items-center sm:justify-between">
          <p>Experiência responsiva com área segura, navegação leve e foco em toque.</p>
          <div className="flex items-center gap-2">
            <span className="glass-panel rounded-full px-3 py-1.5">Android</span>
            <span className="glass-panel rounded-full px-3 py-1.5">iOS</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
