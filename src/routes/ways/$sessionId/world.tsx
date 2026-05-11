import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { WorldExplorer } from "@/components/world-explorer";
import { isPlayableWorld } from "@/lib/journey-world";
import { getWayHistoryEntry } from "@/lib/way-history";

export const Route = createFileRoute("/ways/$sessionId/world")({
  component: WorldExplorationPage,
});

function WorldExplorationPage() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const entry = getWayHistoryEntry(sessionId);

  useEffect(() => {
    if (!entry || !isPlayableWorld(entry.world)) {
      void navigate({ to: "/ways/$sessionId", params: { sessionId } });
    }
  }, [entry, navigate, sessionId]);

  if (!entry || !isPlayableWorld(entry.world)) {
    return null;
  }

  return (
    <WorldExplorer
      world={entry.world}
      onClose={() => void navigate({ to: "/ways/$sessionId", params: { sessionId } })}
    />
  );
}
