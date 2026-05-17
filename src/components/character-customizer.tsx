import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { CharacterAvatar } from "./character-avatar.tsx";
import {
  useCharacterCustomization,
  type CharacterCustomization,
} from "@/hooks/use-character-customization.ts";
import { TRANSITION } from "@/features/playable-world/core/Constants.ts";

type AttrKey = keyof CharacterCustomization;

interface AttrDef {
  key: AttrKey;
  label: string;
  style: React.CSSProperties;
}

const ATTRS: AttrDef[] = [
  { key: "hairStyle",  label: "Cabelo",       style: { top: "6%",  left: "50%", transform: "translateX(-50%)" } },
  { key: "hairColor",  label: "Cor cabelo",   style: { top: "12%", right: "2%" } },
  { key: "eyeColor",   label: "Olhos",        style: { top: "26%", right: "2%" } },
  { key: "shirt",      label: "Roupa",        style: { top: "44%", right: "2%" } },
  { key: "shirtColor", label: "Cor roupa",    style: { top: "50%", left: "2%" } },
  { key: "pants",      label: "Calça",        style: { top: "65%", right: "2%" } },
  { key: "pantsColor", label: "Cor calça",    style: { top: "71%", left: "2%" } },
  { key: "shoes",      label: "Sapatos",      style: { bottom: "8%", left: "50%", transform: "translateX(-50%)" } },
  { key: "shoeColor",  label: "Cor sapatos",  style: { bottom: "3%", right: "2%" } },
];

interface Props { onClose: () => void }

export function CharacterCustomizer({ onClose }: Props) {
  const { customization, cycleOption } = useCharacterCustomization();
  const [active, setActive] = useState<AttrKey | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: TRANSITION.DURATION }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/92 backdrop-blur-xl"
    >
      <button
        onClick={onClose}
        aria-label="Fechar"
        className="absolute right-5 top-5 rounded-full bg-sky-100/80 p-2"
      >
        <X className="h-5 w-5 text-sky-900" />
      </button>

      <h2 className="mb-4 text-base font-semibold tracking-wide text-sky-950">
        Seu Personagem
      </h2>

      <div className="relative flex h-[65vh] w-full max-w-sm items-center justify-center">
        {ATTRS.map((attr) => (
          <button
            key={attr.key}
            onClick={() => setActive(active === attr.key ? null : attr.key)}
            style={{ position: "absolute", ...attr.style }}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              active === attr.key
                ? "border-blue-500 bg-blue-500 text-white"
                : "border-sky-200 bg-white/80 text-sky-700"
            }`}
          >
            {attr.label}
          </button>
        ))}

        <CharacterAvatar customization={customization} size={160} activeAttribute={active} />
      </div>

      <div className="mt-4 flex h-16 items-center gap-6">
        <AnimatePresence mode="wait">
          {active ? (
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-5"
            >
              <button
                onClick={() => cycleOption(active, -1)}
                className="rounded-full bg-sky-100 p-3"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-5 w-5 text-sky-900" />
              </button>
              <span className="min-w-[90px] text-center text-sm font-semibold text-sky-950">
                {customization[active]}
              </span>
              <button
                onClick={() => cycleOption(active, 1)}
                className="rounded-full bg-sky-100 p-3"
                aria-label="Próximo"
              >
                <ChevronRight className="h-5 w-5 text-sky-900" />
              </button>
            </motion.div>
          ) : (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm text-sky-950/50"
            >
              Toque num balloon para customizar
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
