import { AnimatePresence } from "motion/react";
import type { PlayableWorldV1 } from "@/features/playable-world/model";
import { useWorldStateMachine } from "@/hooks/use-world-state-machine";
import { AmbienteRoom } from "@/components/world/ambiente-room";
import { CharacterSelect } from "@/components/world/character-select";
import { ElementDialogue } from "@/components/world/element-dialogue";
import { PathCorridor } from "@/components/world/path-corridor";
import { WorldHub } from "@/components/world/world-hub";

interface WorldExplorerProps {
  world: PlayableWorldV1;
  onClose: () => void;
}

export function WorldExplorer({ world, onClose }: WorldExplorerProps) {
  const sm = useWorldStateMachine();
  const { screen } = sm;

  if (screen.type === "character-select") {
    return (
      <CharacterSelect
        initial={sm.character}
        onConfirm={(config) => {
          sm.updateCharacter(config);
          sm.confirmCharacter();
        }}
      />
    );
  }

  if (screen.type === "hub") {
    return (
      <WorldHub
        hub={world.hub}
        onSelectPath={(pathId) => sm.goToPathCorridor(pathId)}
        onClose={onClose}
      />
    );
  }

  if (screen.type === "path-corridor") {
    const path = world.paths.find((p) => p.id === screen.pathId);
    if (!path) return null;
    return (
      <PathCorridor
        path={path}
        onSelectRoom={(roomIndex) => sm.goToAmbienteRoom(screen.pathId, roomIndex)}
        onBackToHub={sm.goToHub}
      />
    );
  }

  if (screen.type === "ambiente-room" || screen.type === "element-dialogue") {
    const pathId = screen.pathId;
    const roomIndex = screen.roomIndex;
    const path = world.paths.find((p) => p.id === pathId);
    if (!path) return null;
    const room = path.rooms[roomIndex];
    if (!room) return null;

    const focusedHotspot =
      screen.type === "element-dialogue"
        ? (room.hotspots.find((h) => h.id === screen.hotspotId) ?? null)
        : null;

    return (
      <div className="relative">
        <AmbienteRoom
          room={room}
          path={path}
          roomIndex={roomIndex}
          totalRooms={path.rooms.length}
          character={sm.character}
          onHotspotTap={(hotspotId) => sm.openElementDialogue(pathId, roomIndex, hotspotId)}
          onBack={() => sm.goToPathCorridor(pathId)}
        />
        <AnimatePresence>
          {focusedHotspot ? (
            <ElementDialogue hotspot={focusedHotspot} onClose={sm.closeElementDialogue} />
          ) : null}
        </AnimatePresence>
      </div>
    );
  }

  return null;
}
