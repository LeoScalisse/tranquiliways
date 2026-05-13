import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CircularGallery } from "@/components/ui/circular-gallery";
import { WayLandscapeCard } from "@/components/way-landscape-card";
import { LiquidGlassButton } from "@/components/ui/liquid-glass-button";
import { useWays } from "@/hooks/use-ways";

export const Route = createFileRoute("/ways")({
  component: WaysPage,
});

function WaysPage() {
  const { ways, removeWay } = useWays();
  const navigate = useNavigate();
  const [wayToDelete, setWayToDelete] = useState<(typeof ways)[number] | null>(null);

  function handleConfirmDelete() {
    if (!wayToDelete) return;
    removeWay(wayToDelete.id);
    setWayToDelete(null);
  }

  return (
    <div className="safe-screen relative overflow-hidden">
      <div className="absolute left-4 top-4 z-10">
        <LiquidGlassButton to="/" icon={ArrowLeft} compact />
      </div>

      <div className="mx-auto flex min-h-[calc(100svh-2rem)] w-full max-w-3xl flex-col items-center justify-center gap-4 px-4 pt-20">
        <AnimatePresence mode="wait">
          {ways.length === 0 ? (
            <motion.div
              key="empty"
              className="flex flex-col items-center gap-5 text-center"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="glass-panel flex h-16 w-16 items-center justify-center rounded-full">
                <Sparkles className="h-7 w-7 text-sky-950/70" />
              </div>
              <p className="max-w-xs text-base text-sky-950/75">
                Você ainda não explorou nenhum dilema. Comece descrevendo uma decisão que está te
                pesando.
              </p>
              <button
                onClick={() => navigate({ to: "/" })}
                className="glass-panel rounded-full px-5 py-2 text-sm font-medium text-sky-950/80 transition hover:scale-105"
              >
                Explorar meu primeiro dilema
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="carousel"
              className="flex w-full flex-col items-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="w-full" style={{ height: "480px" }}>
                <CircularGallery
                  items={ways}
                  cardWidth={160}
                  cardHeight={220}
                  tiltX={-12}
                  className="w-full h-full"
                  renderItem={(way) => (
                    <div
                      style={{ width: "100%", height: "100%", cursor: "pointer" }}
                      onClick={() =>
                        navigate({
                          to: "/ways/$sessionId",
                          params: { sessionId: way.id },
                        })
                      }
                    >
                      <WayLandscapeCard way={way} onDelete={() => setWayToDelete(way)} />
                    </div>
                  )}
                />
              </div>

              <p className="text-center text-xs text-sky-950/50">
                {ways.length} {ways.length === 1 ? "dilema explorado" : "dilemas explorados"}
              </p>
              <p className="text-center text-xs text-sky-950/35">
                Toque num card para abrir · × para remover
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AlertDialog
        open={wayToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setWayToDelete(null);
        }}
      >
        <AlertDialogContent className="max-w-md rounded-[1.75rem] border border-white/35 bg-white/92 p-6 text-sky-950 shadow-[0_24px_70px_rgba(19,55,86,0.2)]">
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle className="text-xl font-semibold text-sky-950">
              Excluir esta way?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-6 text-sky-950/68">
              {wayToDelete
                ? `Você vai remover este dilema do histórico deste dispositivo: "${wayToDelete.rawInput}".`
                : "Você vai remover esta way do histórico deste dispositivo."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 sm:justify-end">
            <AlertDialogCancel className="mt-0 rounded-full border-white/45 bg-white/70 text-sky-950 hover:bg-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-rose-500 px-5 text-white hover:bg-rose-600"
              onClick={handleConfirmDelete}
            >
              Excluir way
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
