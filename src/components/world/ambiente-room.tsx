import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import type { PathBlueprint, PropKind, RoomBlueprint } from "@/features/playable-world/model";
import type { CharacterConfig } from "@/hooks/use-world-state-machine";
import { PixelCharacter } from "./pixel-character";

const PROP_EMOJI: Record<PropKind, string> = {
  bed: "🛏",
  desk: "🖥",
  sofa: "🛋",
  table: "🪑",
  bookshelf: "📚",
  plant: "🌱",
  lamp: "💡",
  mirror: "🪞",
  suitcase: "🧳",
  notebook: "📓",
  frame: "🖼",
  window: "🪟",
  chair: "🪑",
  wardrobe: "🚪",
  altar: "🕯",
  mug: "☕",
  laundry: "👕",
  "music-player": "🎵",
  "dining-table": "🍽",
  door: "🚪",
};

interface AmbienteRoomProps {
  room: RoomBlueprint;
  path: PathBlueprint;
  roomIndex: number;
  totalRooms: number;
  character: CharacterConfig;
  onHotspotTap: (hotspotId: string) => void;
  onBack: () => void;
}

export function AmbienteRoom({
  room,
  path,
  roomIndex,
  totalRooms,
  character,
  onHotspotTap,
  onBack,
}: AmbienteRoomProps) {
  return (
    <div
      className="relative flex min-h-svh flex-col overflow-hidden"
      style={{ perspective: "800px" }}
    >
      {/* Back layer — sky with rotateX for depth */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${room.palette.skyTop} 0%, ${room.palette.skyBottom} 60%, ${room.palette.fog} 100%)`,
          transform: "perspective(800px) rotateX(8deg) scale(1.08)",
          transformOrigin: "bottom",
        }}
      />

      {/* Mid layer — props */}
      <div
        className="pointer-events-none absolute inset-0 flex items-end justify-around pb-32"
        style={{
          transform: "perspective(800px) rotateX(4deg) translateZ(20px)",
          transformOrigin: "bottom",
        }}
      >
        {room.props.slice(0, 5).map((prop, i) => (
          <span
            key={prop.id}
            style={{
              fontSize: 28 + (i % 2) * 8,
              opacity: 0.65 + (i % 3) * 0.1,
              filter: `drop-shadow(0 4px 8px ${room.palette.accent}40)`,
            }}
          >
            {PROP_EMOJI[prop.kind]}
          </span>
        ))}
      </div>

      {/* Ground */}
      <div
        className="absolute bottom-0 left-0 right-0 h-28"
        style={{
          background: `linear-gradient(180deg, ${room.palette.ground}80, ${room.palette.ground})`,
        }}
      />

      {/* UI layer */}
      <div className="relative z-10 flex min-h-svh flex-col justify-between p-5">
        {/* Top nav */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 rounded-full bg-black/25 px-4 py-2 text-sm text-white/80 backdrop-blur-sm hover:bg-black/35"
          >
            <ArrowLeft className="h-4 w-4" />
            {path.label}
          </button>
          <div className="rounded-full bg-black/25 px-3 py-1.5 text-xs text-white/60 backdrop-blur-sm">
            {roomIndex + 1} / {totalRooms}
          </div>
        </div>

        {/* Room info + character + hotspots */}
        <div>
          <div className="mb-4 rounded-2xl border border-white/20 bg-white/15 px-4 py-3 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">{room.label}</p>
            <h1 className="mt-1 text-lg font-semibold text-white">{room.title}</h1>
            <p className="mt-1 text-sm text-white/65">{room.summary}</p>
          </div>

          <div className="flex items-end justify-between">
            <div className="flex items-end gap-4 pb-2">
              <PixelCharacter config={character} size={56} />
            </div>
            <div className="flex flex-col gap-2">
              {room.hotspots.map((hotspot) => (
                <motion.button
                  key={hotspot.id}
                  type="button"
                  onClick={() => onHotspotTap(hotspot.id)}
                  animate={{ y: [0, -4, 0] }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: hotspot.pulse * 0.3,
                  }}
                  className="rounded-xl border border-white/30 px-3 py-2 text-left text-xs backdrop-blur-sm transition hover:bg-white/20"
                  style={{
                    background: `${hotspot.accent}25`,
                    color: "white",
                    boxShadow: `0 0 12px ${hotspot.accent}40`,
                  }}
                >
                  {hotspot.label} ✦
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
