import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { HotspotBlueprint } from "@/features/playable-world/model";

const REVEAL_INTERVAL_MS = 30;

interface ElementDialogueProps {
  hotspot: HotspotBlueprint;
  onClose: () => void;
}

export function ElementDialogue({ hotspot, onClose }: ElementDialogueProps) {
  const [revealed, setRevealed] = useState(0);
  const isComplete = revealed >= hotspot.insight.length;

  useEffect(() => {
    setRevealed(0);
    const id = setInterval(() => {
      setRevealed((prev) => {
        if (prev >= hotspot.insight.length) {
          clearInterval(id);
          return prev;
        }
        return prev + 1;
      });
    }, REVEAL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [hotspot.id, hotspot.insight.length]);

  function handleTap() {
    if (!isComplete) {
      setRevealed(hotspot.insight.length);
      return;
    }
    onClose();
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-x-0 bottom-0 z-50"
        onClick={handleTap}
      >
        <div
          className="border-t border-white/20 bg-sky-950/92 px-6 pb-10 pt-5 backdrop-blur-xl"
          style={{ minHeight: 160 }}
        >
          <div className="mb-3 flex items-center justify-between">
            <p
              className="text-xs font-semibold uppercase tracking-[0.22em]"
              style={{ color: hotspot.accent }}
            >
              {hotspot.label}
            </p>
            <p className="text-xs text-white/35">
              {isComplete ? "Toque para fechar" : "Toque para avançar"}
            </p>
          </div>
          <p className="mb-2 text-sm text-white/60">{hotspot.prompt}</p>
          <p className="text-base leading-7 text-white">
            {hotspot.insight.slice(0, revealed)}
            {!isComplete && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="ml-0.5 inline-block h-4 w-0.5 bg-white align-middle"
              />
            )}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
