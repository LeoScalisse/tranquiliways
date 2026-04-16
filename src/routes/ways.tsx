import { createFileRoute } from "@tanstack/react-router";
import { Cloud, Compass, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import StackedPanels from "@/components/ui/stacked-panels";
import { LiquidGlassButton } from "@/components/ui/liquid-glass-button";

export const Route = createFileRoute("/ways")({
  component: WaysPage,
});

function WaysPage() {
  return (
    <div className="safe-screen relative overflow-hidden">
      <div className="glass-orb left-[8%] top-[12%] h-28 w-28 opacity-55" />
      <div className="glass-orb bottom-[16%] right-[8%] h-36 w-36 opacity-60" />

      <div className="mx-auto flex min-h-[calc(100svh-2rem)] w-full max-w-5xl flex-col gap-6">
        <header className="flex items-center justify-between gap-3">
          <LiquidGlassButton to="/" icon={ArrowLeft} compact />
          <div className="glass-panel flex items-center gap-3 rounded-full px-4 py-2 text-sky-950/75">
            <Cloud className="h-4 w-4" />
            Meus Ways
          </div>
          <LiquidGlassButton to="/" icon={Compass} label="Novo foco" compact prominent />
        </header>

        <section className="grid flex-1 gap-5 md:grid-cols-[0.8fr_1.2fr] md:items-center">
          <div className="space-y-4">
            <motion.h1
              className="app-heading text-4xl font-semibold text-white sm:text-5xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              Explore seus caminhos com gesto, profundidade e calma.
            </motion.h1>
            <p className="max-w-md text-base leading-7 text-sky-950/72">
              A pilha responde ao toque e cria uma leitura espacial mais natural em celular, sem
              depender só de hover.
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="glass-panel rounded-full px-4 py-2 text-sm text-sky-950/70">
                Toque ou arraste
              </div>
              <div className="glass-panel rounded-full px-4 py-2 text-sm text-sky-950/70">
                Responsivo no tablet
              </div>
            </div>
          </div>

          <div className="glass-panel flex min-h-[24rem] items-center justify-center rounded-[2rem] p-4 sm:min-h-[28rem]">
            <div style={{ width: "min(100%, 540px)", height: "min(72vh, 520px)" }}>
              <StackedPanels />
            </div>
          </div>
        </section>

        <div className="pb-1 text-center">
          <p className="text-sm text-sky-950/58">Deslize ou mova o dedo para explorar seus Ways</p>
        </div>
      </div>
    </div>
  );
}
