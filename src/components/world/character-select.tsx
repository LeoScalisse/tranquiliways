import { useState } from "react";
import { motion } from "motion/react";
import { PixelCharacter } from "./pixel-character";
import type { CharacterConfig, SkinTone } from "@/hooks/use-world-state-machine";

const SKIN_OPTIONS: { tone: SkinTone; label: string }[] = [
  { tone: "light", label: "Clara" },
  { tone: "medium", label: "Média" },
  { tone: "dark", label: "Escura" },
];

const OUTFIT_OPTIONS = [
  "#3b82f6",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
];

interface CharacterSelectProps {
  initial: CharacterConfig;
  onConfirm: (config: CharacterConfig) => void;
}

export function CharacterSelect({ initial, onConfirm }: CharacterSelectProps) {
  const [config, setConfig] = useState<CharacterConfig>(initial);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 bg-sky-950/95 px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <p className="text-xs uppercase tracking-[0.24em] text-sky-300/60">Antes de explorar</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Quem vai entrar nesse mundo?</h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex justify-center"
      >
        <PixelCharacter config={config} size={80} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="w-full max-w-xs space-y-6"
      >
        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-sky-300/60">Tom de pele</p>
          <div className="flex gap-3">
            {SKIN_OPTIONS.map(({ tone, label }) => (
              <button
                key={tone}
                type="button"
                onClick={() => setConfig((c) => ({ ...c, skinTone: tone }))}
                className={`flex-1 rounded-xl py-2 text-sm transition ${
                  config.skinTone === tone
                    ? "bg-white/20 text-white ring-2 ring-white/40"
                    : "bg-white/8 text-sky-200/60 hover:bg-white/12"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-sky-300/60">Cor da roupa</p>
          <div className="flex gap-2">
            {OUTFIT_OPTIONS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setConfig((c) => ({ ...c, outfitColor: color }))}
                className={`h-9 w-9 rounded-full transition ${
                  config.outfitColor === color ? "ring-2 ring-white ring-offset-2 ring-offset-sky-950" : ""
                }`}
                style={{ background: color }}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onConfirm(config)}
          className="w-full rounded-full bg-white/90 py-3 text-sm font-semibold text-sky-950 transition hover:bg-white"
        >
          Entrar no mundo
        </button>
      </motion.div>
    </div>
  );
}
