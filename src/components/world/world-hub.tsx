import { X } from "lucide-react";
import { motion } from "motion/react";
import type { HubBlueprint, PathId } from "@/features/playable-world/model";

interface WorldHubProps {
  hub: HubBlueprint;
  onSelectPath: (pathId: PathId) => void;
  onClose: () => void;
}

export function WorldHub({ hub, onSelectPath, onClose }: WorldHubProps) {
  return (
    <div
      className="relative flex min-h-svh flex-col items-center justify-between overflow-hidden px-6 py-10"
      style={{
        background: `linear-gradient(180deg, ${hub.palette.skyTop} 0%, ${hub.palette.skyBottom} 55%, ${hub.palette.ground} 100%)`,
      }}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white/70 hover:bg-white/30"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Hub header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mt-6 text-center"
      >
        <h1 className="text-2xl font-semibold text-white drop-shadow-sm">{hub.title}</h1>
        <p className="mt-2 max-w-xs text-sm text-white/70">{hub.subtitle}</p>
      </motion.div>

      {/* Portal doors */}
      <div className="flex w-full max-w-sm flex-col gap-4">
        {hub.portals.map((portal, i) => (
          <motion.button
            key={portal.pathId}
            type="button"
            onClick={() => onSelectPath(portal.pathId)}
            initial={{ opacity: 0, x: i === 0 ? -24 : 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.15 + i * 0.1 }}
            className="relative overflow-hidden rounded-2xl border border-white/30 px-5 py-5 text-left shadow-lg backdrop-blur-sm"
            style={{
              background: `linear-gradient(135deg, ${portal.accent}30, ${portal.glow}20)`,
              boxShadow: `0 0 24px ${portal.accent}30`,
            }}
          >
            <div
              className="mb-2 h-1 rounded-full"
              style={{ background: `linear-gradient(90deg, ${portal.accent}, ${portal.glow})` }}
            />
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">{portal.label}</p>
            <h2 className="mt-1 text-lg font-semibold text-white">{portal.title}</h2>
            <p className="mt-1 text-xs text-white/50">Toque para explorar →</p>
          </motion.button>
        ))}
      </div>

      {/* Ground glow */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-32"
        style={{
          background: `radial-gradient(ellipse at 50% 100%, ${hub.palette.glow}60, transparent 70%)`,
        }}
      />
    </div>
  );
}
