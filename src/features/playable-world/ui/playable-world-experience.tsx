import { IsometricWorld } from "./isometric-world.tsx";
import type { PathId, PlayableWorldV1 } from "../model.ts";

interface PlayableWorldExperienceProps {
  world: PlayableWorldV1;
  onBrowseWays?: () => void;
  initialPathId?: PathId;
}

export function PlayableWorldExperience({ world, onBrowseWays }: PlayableWorldExperienceProps) {
  return (
    <section
      className="relative overflow-hidden rounded-[2.25rem] border border-white/35 shadow-[0_28px_72px_rgba(15,48,78,0.18)]"
      style={{ minHeight: "calc(100svh - 2rem)" }}
    >
      <IsometricWorld world={world} onBrowseWays={onBrowseWays} />
    </section>
  );
}
