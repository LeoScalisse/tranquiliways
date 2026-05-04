import { Canvas } from "@react-three/fiber";
import { ArrowLeft, ArrowRight, Compass, Home, PenLine, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

import { PlayableWorldScene } from "../runtime/playable-world-scene";
import {
  completeReflection,
  createPlayableWorldState,
  enterPath,
  focusHotspot,
  getActiveRoom,
  getExplorationProgress,
  getFocusedHotspot,
  getPath,
  goToNextRoom,
  goToPreviousRoom,
  hasVisitedAllRooms,
  returnToHub,
  updateReflectionNote,
  type PlayableWorldState,
} from "../simulation";
import type { PathId, PlayableWorldV1, RoomPalette } from "../model";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface PlayableWorldExperienceProps {
  world: PlayableWorldV1;
  onBrowseWays?: () => void;
}

function shellBackground(palette: RoomPalette) {
  return {
    background: `
      radial-gradient(circle at 20% 18%, ${palette.glow}aa 0%, transparent 34%),
      radial-gradient(circle at 82% 14%, ${palette.highlight}66 0%, transparent 24%),
      linear-gradient(180deg, ${palette.skyTop} 0%, ${palette.skyBottom} 48%, ${palette.fog} 72%, ${palette.ground} 100%)
    `,
  };
}

export function PlayableWorldExperience({ world, onBrowseWays }: PlayableWorldExperienceProps) {
  const [state, setState] = useState<PlayableWorldState>(() => createPlayableWorldState());
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const activePath = getPath(world, state.activePathId);
  const activeRoom = getActiveRoom(world, state);
  const focusedHotspot = getFocusedHotspot(world, state);
  const progress = getExplorationProgress(world, state);
  const finishedExploration = hasVisitedAllRooms(world, state);

  const palette = useMemo(() => {
    if (state.phase === "path" && activeRoom) {
      return activeRoom.palette;
    }
    return world.hub.palette;
  }, [activeRoom, state.phase, world.hub.palette]);

  function handleSelectPath(pathId: PathId) {
    setState((current) => enterPath(world, current, pathId));
  }

  function handleFocusHotspot(hotspotId: string) {
    setState((current) => focusHotspot(world, current, hotspotId));
  }

  function handleGoPrevious() {
    setState((current) => goToPreviousRoom(world, current));
  }

  function handleGoNext() {
    setState((current) => goToNextRoom(world, current));
  }

  function handleReturnHub() {
    setState((current) => returnToHub(world, current));
  }

  function handleCompleteReflection() {
    setState((current) => completeReflection(current));
  }

  return (
    <section
      className="relative overflow-hidden rounded-[2.25rem] border border-white/35 shadow-[0_28px_72px_rgba(15,48,78,0.18)]"
      style={shellBackground(palette)}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(255,255,255,0.18),transparent_52%)]" />

      <div className="relative min-h-[calc(100svh-2rem)]">
        <div className="absolute inset-0">
          {isClient ? (
            <Canvas
              orthographic
              camera={{ position: [0, 0, 10], zoom: 108 }}
              gl={{ alpha: true, antialias: true }}
              dpr={[1, 1.5]}
            >
              <PlayableWorldScene
                world={world}
                state={state}
                onSelectPath={handleSelectPath}
                onFocusHotspot={handleFocusHotspot}
                onGoPrevious={handleGoPrevious}
                onGoNext={handleGoNext}
                onReturnHub={handleReturnHub}
              />
            </Canvas>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-sky-950/70">
              Preparando o mundo jogavel...
            </div>
          )}
        </div>

        <div className="pointer-events-none relative z-10 flex min-h-[calc(100svh-2rem)] flex-col justify-between p-5 pt-20 sm:p-6 sm:pt-24">
          <div className="pointer-events-auto flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="glass-panel inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs uppercase tracking-[0.22em] text-sky-950/62">
                <Sparkles className="h-3.5 w-3.5" />
                {world.card.badge}
              </div>
              <div className="glass-panel inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs text-sky-950/62">
                <Compass className="h-3.5 w-3.5" />
                {Math.round(progress.ratio * 100)}% explorado
              </div>
            </div>

            <div className="max-w-xl rounded-[1.75rem] border border-white/38 bg-white/54 px-5 py-4 shadow-[0_18px_40px_rgba(15,48,78,0.12)] backdrop-blur-xl">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-sky-950/40">
                {state.phase === "path" && activeRoom ? activeRoom.label : "Limiar"}
              </p>
              <h1 className="mt-2 app-heading text-2xl font-semibold text-sky-950 sm:text-3xl">
                {state.phase === "path" && activePath ? activePath.title : world.hub.title}
              </h1>
              <p className="mt-2 text-sm leading-6 text-sky-950/72 sm:text-base">
                {state.phase === "path" && activeRoom ? activeRoom.summary : world.hub.subtitle}
              </p>
              {state.phase === "path" && activePath ? (
                <p className="mt-3 text-xs uppercase tracking-[0.2em] text-sky-950/46">
                  {activePath.label} · sala {state.activeRoomIndex + 1} de {activePath.rooms.length}
                </p>
              ) : null}
            </div>

            <AnimatePresence>
              {focusedHotspot ? (
                <motion.div
                  key={focusedHotspot.id}
                  initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: 8, filter: "blur(6px)" }}
                  transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
                  className="max-w-md rounded-[1.5rem] border border-white/42 bg-white/74 px-5 py-4 shadow-[0_18px_36px_rgba(15,48,78,0.14)] backdrop-blur-xl"
                >
                  <p className="text-xs font-medium uppercase tracking-[0.24em] text-sky-950/42">
                    {focusedHotspot.label}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-sky-950">{focusedHotspot.prompt}</p>
                  <p className="mt-2 text-sm leading-6 text-sky-950/70">{focusedHotspot.insight}</p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="pointer-events-auto flex flex-col gap-4">
            {state.phase === "hub" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {world.paths.map((path) => (
                  <button
                    key={path.id}
                    type="button"
                    onClick={() => handleSelectPath(path.id)}
                    className="rounded-[1.5rem] border border-white/42 bg-white/64 p-4 text-left shadow-[0_16px_36px_rgba(15,48,78,0.12)] backdrop-blur-xl transition hover:-translate-y-0.5"
                  >
                    <div
                      className="mb-3 h-2 rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${path.palette.skyTop}, ${path.palette.accent})`,
                      }}
                    />
                    <p className="text-xs uppercase tracking-[0.22em] text-sky-950/42">
                      {path.label}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-sky-950">{path.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-sky-950/68">{path.summary}</p>
                  </button>
                ))}
              </div>
            ) : null}

            {state.phase === "path" && activePath ? (
              <div className="flex flex-wrap gap-3 rounded-[1.75rem] border border-white/38 bg-white/58 p-4 shadow-[0_18px_40px_rgba(15,48,78,0.12)] backdrop-blur-xl">
                <Button
                  variant="glass"
                  className="rounded-full px-5 text-sky-950"
                  onClick={handleGoPrevious}
                >
                  <ArrowLeft className="h-4 w-4" />
                  {state.activeRoomIndex === 0 ? "Limiar" : "Anterior"}
                </Button>
                <Button
                  variant="glass"
                  className="rounded-full px-5 text-sky-950"
                  onClick={handleReturnHub}
                >
                  <Home className="h-4 w-4" />
                  Voltar ao limiar
                </Button>
                <Button
                  variant="glassProminent"
                  className="rounded-full px-5"
                  onClick={handleGoNext}
                >
                  {state.activeRoomIndex === activePath.rooms.length - 1
                    ? "Concluir caminho"
                    : "Seguir"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ) : null}

            {state.phase === "reflection" ? (
              <div className="rounded-[1.9rem] border border-white/42 bg-white/74 p-5 shadow-[0_22px_48px_rgba(15,48,78,0.16)] backdrop-blur-xl">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.24em] text-sky-950/42">
                  <PenLine className="h-3.5 w-3.5" />
                  Reflexao final
                </div>
                <h2 className="mt-3 app-heading text-2xl font-semibold text-sky-950">
                  O que ficou vivo em voce?
                </h2>
                <p className="mt-2 text-sm leading-6 text-sky-950/72">{world.reflectionPrompt}</p>
                <Textarea
                  value={state.reflectionNote}
                  onChange={(event) =>
                    setState((current) => updateReflectionNote(current, event.target.value))
                  }
                  placeholder="Escreva o que esses dois mundos fizeram voce perceber."
                  className="mt-4 min-h-[132px] rounded-[1.4rem] border-white/45 bg-white/76 px-4 py-3 text-base text-sky-950 placeholder:text-sky-950/34"
                />
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button
                    variant="glass"
                    className="rounded-full px-5 text-sky-950"
                    onClick={() => setState(createPlayableWorldState())}
                  >
                    Explorar de novo
                  </Button>
                  <Button
                    variant="glassProminent"
                    className="rounded-full px-5"
                    onClick={handleCompleteReflection}
                    disabled={state.reflectionNote.trim().length === 0}
                  >
                    Fechar a travessia
                  </Button>
                </div>
              </div>
            ) : null}

            {state.phase === "complete" ? (
              <div className="rounded-[1.9rem] border border-white/42 bg-white/76 p-5 shadow-[0_22px_48px_rgba(15,48,78,0.16)] backdrop-blur-xl">
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-sky-950/42">
                  Jornada concluida
                </p>
                <h2 className="mt-3 app-heading text-2xl font-semibold text-sky-950">
                  O mundo voltou para o presente.
                </h2>
                <p className="mt-2 text-sm leading-6 text-sky-950/72">
                  Sua nota ficou registrada nesta sessao enquanto voce decide o que merece virar
                  acao real.
                </p>
                <div className="mt-4 rounded-[1.3rem] border border-sky-100/80 bg-sky-50/72 px-4 py-3 text-sm leading-6 text-sky-950/76">
                  {state.reflectionNote}
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button
                    variant="glass"
                    className="rounded-full px-5 text-sky-950"
                    onClick={() => setState(createPlayableWorldState())}
                  >
                    Revisitar o limiar
                  </Button>
                  {onBrowseWays ? (
                    <Button
                      variant="glassProminent"
                      className="rounded-full px-5"
                      onClick={onBrowseWays}
                    >
                      Ver meus dilemas
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}

            {state.phase === "hub" && finishedExploration ? (
              <div className="rounded-[1.5rem] border border-white/40 bg-white/66 px-4 py-3 text-sm leading-6 text-sky-950/72 shadow-[0_16px_34px_rgba(15,48,78,0.12)] backdrop-blur-xl">
                Voce percorreu os dois caminhos. Toque no portal que quiser revisitar ou use a
                reflexao final quando ela aparecer.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
