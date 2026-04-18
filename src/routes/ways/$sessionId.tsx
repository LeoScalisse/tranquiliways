import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";

import { JourneyStatusCard } from "@/components/journey-status-card";
import { LiquidGlassButton } from "@/components/ui/liquid-glass-button";

export const Route = createFileRoute("/ways/$sessionId")({
  validateSearch: z.object({
    token: z.string().min(1),
  }),
  component: JourneyStatusPage,
});

function JourneyStatusPage() {
  const { sessionId } = Route.useParams();
  const { token } = Route.useSearch();

  return (
    <div className="safe-screen relative overflow-hidden">
      <div className="glass-orb right-[8%] top-[10%] h-28 w-28 opacity-55" />
      <div className="glass-orb bottom-[16%] left-[6%] h-40 w-40 opacity-45" />

      <div className="mx-auto flex min-h-[calc(100svh-2rem)] w-full max-w-6xl flex-col gap-6">
        <header className="flex items-center justify-between gap-3">
          <LiquidGlassButton to="/" icon={ArrowLeft} compact />
          <div className="glass-panel rounded-full px-4 py-2 text-sm text-sky-950/70">
            Jornada preparada
          </div>
        </header>

        <JourneyStatusCard sessionId={sessionId} launchToken={token} />
      </div>
    </div>
  );
}
