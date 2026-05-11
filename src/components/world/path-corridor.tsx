import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import type { PathBlueprint } from "@/features/playable-world/model";

interface PathCorridorProps {
  path: PathBlueprint;
  onSelectRoom: (roomIndex: number) => void;
  onBackToHub: () => void;
}

export function PathCorridor({ path, onSelectRoom, onBackToHub }: PathCorridorProps) {
  return (
    <div
      className="relative flex min-h-svh flex-col overflow-hidden px-6 py-10"
      style={{
        background: `linear-gradient(180deg, ${path.palette.skyTop} 0%, ${path.palette.skyBottom} 60%, ${path.palette.ground} 100%)`,
      }}
    >
      <motion.button
        type="button"
        onClick={onBackToHub}
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-6 flex w-fit items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm text-white/80 hover:bg-white/30"
      >
        <ArrowLeft className="h-4 w-4" />
        Limiar
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-6"
      >
        <p className="text-xs uppercase tracking-[0.2em] text-white/50">{path.label}</p>
        <h1 className="mt-1 text-2xl font-semibold text-white">{path.title}</h1>
      </motion.div>

      <div className="flex flex-col gap-3">
        {path.rooms.map((room, index) => (
          <motion.button
            key={room.id}
            type="button"
            onClick={() => onSelectRoom(index)}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.08 * index }}
            className="rounded-2xl border border-white/25 px-5 py-4 text-left backdrop-blur-sm transition hover:-translate-y-0.5"
            style={{
              background: `linear-gradient(135deg, ${path.palette.accent}20, ${path.palette.glow}15)`,
            }}
          >
            <p className="text-xs uppercase tracking-[0.2em] text-white/45">{room.label}</p>
            <h2 className="mt-1 text-base font-semibold text-white">{room.title}</h2>
            <p className="mt-1 text-xs text-white/55">{room.mood}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
