import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { PlayableWorldExperience } from "@/features/playable-world/ui/playable-world-experience";
import { isPlayableWorld } from "@/lib/journey-world";
import { getWayHistoryEntry, type WayHistoryEntry } from "@/lib/way-history";

export const Route = createFileRoute("/ways/$sessionId/world")({
  component: WorldExplorationPage,
});

function WorldExplorationPage() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<WayHistoryEntry | null>(null);

  useEffect(() => {
    const found = getWayHistoryEntry(sessionId);
    if (!found || !isPlayableWorld(found.world)) {
      void navigate({ to: "/ways/$sessionId", params: { sessionId } });
    } else {
      setEntry(found);
    }
  }, [sessionId, navigate]);

  if (!entry || !isPlayableWorld(entry.world)) {
    return null;
  }

  return (
    <div className="safe-screen relative overflow-hidden">
      <div className="absolute left-4 top-4 z-20">
        <motion.button
          type="button"
          aria-label="Voltar"
          onClick={() => void navigate({ to: "/ways/$sessionId", params: { sessionId } })}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/18 shadow-[0_14px_34px_rgba(24,74,116,0.14),inset_0_1px_0_rgba(255,255,255,0.48)] backdrop-blur-[18px]"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
        >
          <ArrowLeft size={18} strokeWidth={1.9} className="text-white" />
        </motion.button>
      </div>
      <PlayableWorldExperience
        world={entry.world}
        onBrowseWays={() => void navigate({ to: "/ways" })}
      />
    </div>
  );
}
