import { Float, Html, RoundedBox, Sparkles } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type ReactNode } from "react";
import type { Group } from "three";

import type {
  HotspotBlueprint,
  PathId,
  PlayableWorldV1,
  PropPlacement,
  RoomPalette,
} from "../model";
import { getActiveRoom, getPath, type PlayableWorldState } from "../simulation";

interface PlayableWorldSceneProps {
  world: PlayableWorldV1;
  state: PlayableWorldState;
  onSelectPath: (pathId: PathId) => void;
  onFocusHotspot: (hotspotId: string) => void;
  onGoPrevious: () => void;
  onGoNext: () => void;
  onReturnHub: () => void;
}

function AnimatedGroup({
  children,
  speed = 1,
  offset = 0,
}: {
  children: ReactNode;
  speed?: number;
  offset?: number;
}) {
  const ref = useRef<Group | null>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.y = Math.sin(clock.elapsedTime * speed + offset) * 0.04;
  });

  return <group ref={ref}>{children}</group>;
}

function BackdropLayers({ palette }: { palette: RoomPalette }) {
  return (
    <group position={[0, 0.35, -1.4]}>
      <RoundedBox args={[7.8, 2.8, 0.14]} radius={0.32} position={[0, 0.95, 0]}>
        <meshBasicMaterial color={palette.skyBottom} transparent opacity={0.18} />
      </RoundedBox>
      <RoundedBox args={[6.4, 2.2, 0.16]} radius={0.45} position={[0, 0.25, 0.18]}>
        <meshBasicMaterial color={palette.fog} transparent opacity={0.28} />
      </RoundedBox>
      <RoundedBox args={[4.9, 1.4, 0.16]} radius={0.52} position={[0, -0.28, 0.34]}>
        <meshBasicMaterial color={palette.highlight} transparent opacity={0.22} />
      </RoundedBox>
    </group>
  );
}

function GroundPlate({ palette }: { palette: RoomPalette }) {
  return (
    <group position={[0, -1.55, -0.35]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[5.1, 48]} />
        <meshStandardMaterial color={palette.ground} roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[1.4, 2.8, 48]} />
        <meshBasicMaterial color={palette.accent} transparent opacity={0.16} />
      </mesh>
    </group>
  );
}

function PropTotem({ prop }: { prop: PropPlacement }) {
  const materialProps = useMemo(
    () => ({
      color: prop.tint,
      roughness: 0.72,
      metalness: 0.08,
    }),
    [prop.tint],
  );

  return (
    <AnimatedGroup
      speed={prop.animation === "float" ? 1.2 : prop.animation === "pulse" ? 0.8 : 0}
      offset={prop.scale}
    >
      <group position={prop.position} rotation={[0, prop.rotationY, 0]} scale={prop.scale}>
        {renderPropGeometry(prop.kind, materialProps)}
      </group>
    </AnimatedGroup>
  );
}

function renderPropGeometry(
  kind: PropPlacement["kind"],
  materialProps: { color: string; roughness: number; metalness: number },
) {
  switch (kind) {
    case "bed":
      return (
        <>
          <RoundedBox args={[1.4, 0.28, 0.95]} radius={0.12} position={[0, 0, 0]}>
            <meshStandardMaterial {...materialProps} />
          </RoundedBox>
          <RoundedBox args={[0.44, 0.16, 0.22]} radius={0.1} position={[-0.3, 0.18, -0.18]}>
            <meshStandardMaterial color="#f3f5f8" roughness={0.95} />
          </RoundedBox>
          <RoundedBox args={[0.44, 0.16, 0.22]} radius={0.1} position={[0.22, 0.18, -0.18]}>
            <meshStandardMaterial color="#e7eff9" roughness={0.95} />
          </RoundedBox>
        </>
      );
    case "desk":
    case "table":
    case "dining-table":
      return (
        <>
          <RoundedBox args={[1.15, 0.14, 0.75]} radius={0.08} position={[0, 0.24, 0]}>
            <meshStandardMaterial {...materialProps} />
          </RoundedBox>
          {[-0.42, 0.42].map((x) => (
            <mesh key={x} position={[x, -0.06, -0.24]}>
              <cylinderGeometry args={[0.05, 0.05, 0.56, 10]} />
              <meshStandardMaterial {...materialProps} />
            </mesh>
          ))}
          {[-0.42, 0.42].map((x) => (
            <mesh key={`${x}-b`} position={[x, -0.06, 0.24]}>
              <cylinderGeometry args={[0.05, 0.05, 0.56, 10]} />
              <meshStandardMaterial {...materialProps} />
            </mesh>
          ))}
        </>
      );
    case "sofa":
      return (
        <>
          <RoundedBox args={[1.35, 0.42, 0.82]} radius={0.12} position={[0, 0, 0]}>
            <meshStandardMaterial {...materialProps} />
          </RoundedBox>
          <RoundedBox args={[1.35, 0.24, 0.22]} radius={0.12} position={[0, 0.26, -0.3]}>
            <meshStandardMaterial color="#eef4ff" roughness={0.92} />
          </RoundedBox>
        </>
      );
    case "bookshelf":
    case "wardrobe":
    case "door":
      return (
        <RoundedBox args={[0.8, 1.55, 0.36]} radius={0.08} position={[0, 0.65, 0]}>
          <meshStandardMaterial {...materialProps} />
        </RoundedBox>
      );
    case "plant":
      return (
        <>
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.2, 0.24, 0.28, 12]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          <mesh position={[0, 0.52, 0]}>
            <sphereGeometry args={[0.34, 18, 18]} />
            <meshStandardMaterial color="#9cd59e" roughness={0.88} />
          </mesh>
        </>
      );
    case "lamp":
      return (
        <>
          <mesh position={[0, 0.32, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.76, 10]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          <mesh position={[0, 0.84, 0]}>
            <sphereGeometry args={[0.18, 14, 14]} />
            <meshStandardMaterial color="#fff5cf" emissive="#ffe2a0" emissiveIntensity={0.7} />
          </mesh>
        </>
      );
    case "mirror":
    case "frame":
    case "window":
      return (
        <>
          <RoundedBox args={[0.7, 1.02, 0.08]} radius={0.12} position={[0, 0.46, 0]}>
            <meshStandardMaterial {...materialProps} />
          </RoundedBox>
          <RoundedBox args={[0.48, 0.76, 0.04]} radius={0.08} position={[0, 0.46, 0.05]}>
            <meshStandardMaterial color="#f4fbff" metalness={0.25} roughness={0.18} />
          </RoundedBox>
        </>
      );
    case "suitcase":
    case "notebook":
    case "music-player":
      return (
        <RoundedBox args={[0.68, 0.24, 0.42]} radius={0.08} position={[0, 0.06, 0]}>
          <meshStandardMaterial {...materialProps} />
        </RoundedBox>
      );
    case "chair":
      return (
        <>
          <RoundedBox args={[0.52, 0.12, 0.5]} radius={0.06} position={[0, 0.12, 0]}>
            <meshStandardMaterial {...materialProps} />
          </RoundedBox>
          <RoundedBox args={[0.52, 0.62, 0.12]} radius={0.06} position={[0, 0.44, -0.18]}>
            <meshStandardMaterial {...materialProps} />
          </RoundedBox>
        </>
      );
    case "altar":
      return (
        <>
          <RoundedBox args={[0.8, 0.54, 0.8]} radius={0.08} position={[0, 0.2, 0]}>
            <meshStandardMaterial {...materialProps} />
          </RoundedBox>
          <mesh position={[0, 0.7, 0]}>
            <sphereGeometry args={[0.14, 16, 16]} />
            <meshStandardMaterial color="#fff7df" emissive="#ffd28a" emissiveIntensity={0.9} />
          </mesh>
        </>
      );
    case "mug":
      return (
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.16, 12]} />
          <meshStandardMaterial {...materialProps} />
        </mesh>
      );
    case "laundry":
      return (
        <>
          <mesh position={[-0.16, 0.05, 0.03]}>
            <sphereGeometry args={[0.18, 12, 12]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          <mesh position={[0.12, 0.08, -0.05]}>
            <sphereGeometry args={[0.22, 12, 12]} />
            <meshStandardMaterial color="#dfe8f2" roughness={0.95} />
          </mesh>
        </>
      );
    default:
      return (
        <RoundedBox args={[0.72, 0.42, 0.52]} radius={0.08} position={[0, 0.15, 0]}>
          <meshStandardMaterial {...materialProps} />
        </RoundedBox>
      );
  }
}

function HotspotBeacon({ hotspot, onClick }: { hotspot: HotspotBlueprint; onClick: () => void }) {
  return (
    <Float speed={1.5} rotationIntensity={0.08} floatIntensity={0.24}>
      <group position={hotspot.position} onClick={onClick}>
        <mesh>
          <sphereGeometry args={[0.15, 18, 18]} />
          <meshStandardMaterial
            color={hotspot.accent}
            emissive={hotspot.accent}
            emissiveIntensity={1.1}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.16, 0]}>
          <ringGeometry args={[0.24, 0.34, 28]} />
          <meshBasicMaterial color={hotspot.accent} transparent opacity={0.65} />
        </mesh>
        <Html center position={[0, 0.34, 0]} transform distanceFactor={8}>
          <div className="pointer-events-none rounded-full border border-white/40 bg-white/78 px-2 py-1 text-[10px] font-medium text-sky-950 shadow-sm">
            {hotspot.label}
          </div>
        </Html>
      </group>
    </Float>
  );
}

function PortalMarker({
  label,
  title,
  accent,
  glow,
  position,
  onClick,
}: {
  label: string;
  title: string;
  accent: string;
  glow: string;
  position: [number, number, number];
  onClick: () => void;
}) {
  return (
    <Float speed={1.1} rotationIntensity={0.06} floatIntensity={0.12}>
      <group position={position} onClick={onClick}>
        <RoundedBox args={[1.25, 1.8, 0.18]} radius={0.32} position={[0, 0.18, 0]}>
          <meshStandardMaterial
            color={accent}
            transparent
            opacity={0.22}
            roughness={0.2}
            metalness={0.1}
          />
        </RoundedBox>
        <RoundedBox args={[0.72, 1.32, 0.08]} radius={0.24} position={[0, 0.18, 0.09]}>
          <meshStandardMaterial
            color={glow}
            emissive={glow}
            emissiveIntensity={0.75}
            transparent
            opacity={0.88}
          />
        </RoundedBox>
        <Html center position={[0, -1.1, 0]} transform distanceFactor={8}>
          <div className="pointer-events-none min-w-[112px] rounded-2xl border border-white/40 bg-white/76 px-3 py-2 text-center shadow-lg">
            <div className="text-[10px] uppercase tracking-[0.22em] text-sky-950/45">{label}</div>
            <div className="mt-1 text-sm font-semibold text-sky-950">{title}</div>
          </div>
        </Html>
      </group>
    </Float>
  );
}

function NavigationPortal({
  label,
  accent,
  position,
  onClick,
}: {
  label: string;
  accent: string;
  position: [number, number, number];
  onClick: () => void;
}) {
  return (
    <group position={position} onClick={onClick}>
      <RoundedBox args={[0.68, 0.9, 0.08]} radius={0.2}>
        <meshStandardMaterial color={accent} transparent opacity={0.28} />
      </RoundedBox>
      <Html center position={[0, -0.72, 0]} transform distanceFactor={8}>
        <div className="pointer-events-none rounded-full border border-white/40 bg-white/72 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-950/60 shadow-sm">
          {label}
        </div>
      </Html>
    </group>
  );
}

function HubStage({
  world,
  onSelectPath,
}: {
  world: PlayableWorldV1;
  onSelectPath: (pathId: PathId) => void;
}) {
  return (
    <group>
      <BackdropLayers palette={world.hub.palette} />
      <GroundPlate palette={world.hub.palette} />
      <Sparkles
        count={44}
        scale={[8, 4, 4]}
        size={2.1}
        speed={0.22}
        color={world.hub.palette.glow}
      />
      <RoundedBox args={[1.4, 0.38, 1.4]} radius={0.16} position={[0, -1.1, -0.1]}>
        <meshStandardMaterial color={world.hub.palette.prop} roughness={0.88} />
      </RoundedBox>
      {world.hub.portals.map((portal) => (
        <PortalMarker
          key={portal.pathId}
          label={portal.label}
          title={portal.title}
          accent={portal.accent}
          glow={portal.glow}
          position={portal.position}
          onClick={() => onSelectPath(portal.pathId)}
        />
      ))}
    </group>
  );
}

function RoomStage({
  world,
  state,
  onFocusHotspot,
  onGoPrevious,
  onGoNext,
  onReturnHub,
}: {
  world: PlayableWorldV1;
  state: PlayableWorldState;
  onFocusHotspot: (hotspotId: string) => void;
  onGoPrevious: () => void;
  onGoNext: () => void;
  onReturnHub: () => void;
}) {
  const room = getActiveRoom(world, state);
  const path = getPath(world, state.activePathId);

  if (!room || !path) {
    return null;
  }

  const isLastRoom = state.activeRoomIndex === path.rooms.length - 1;

  return (
    <group>
      <BackdropLayers palette={room.palette} />
      <GroundPlate palette={room.palette} />
      <Sparkles count={40} scale={[8, 4, 4]} size={2.3} speed={0.18} color={room.palette.glow} />

      {room.props.map((prop) => (
        <PropTotem key={prop.id} prop={prop} />
      ))}

      {room.hotspots.map((hotspot) => (
        <HotspotBeacon
          key={hotspot.id}
          hotspot={hotspot}
          onClick={() => onFocusHotspot(hotspot.id)}
        />
      ))}

      <NavigationPortal
        label={state.activeRoomIndex === 0 ? "Limiar" : "Anterior"}
        accent={room.palette.highlight}
        position={room.navigation.previous}
        onClick={onGoPrevious}
      />
      <NavigationPortal
        label={isLastRoom ? "Concluir" : "Seguir"}
        accent={room.palette.accent}
        position={room.navigation.next}
        onClick={onGoNext}
      />
      <NavigationPortal
        label="Voltar"
        accent={room.palette.glow}
        position={room.navigation.hub}
        onClick={onReturnHub}
      />
    </group>
  );
}

export function PlayableWorldScene({
  world,
  state,
  onSelectPath,
  onFocusHotspot,
  onGoPrevious,
  onGoNext,
  onReturnHub,
}: PlayableWorldSceneProps) {
  return (
    <>
      <ambientLight intensity={1.05} />
      <directionalLight position={[4, 5, 4]} intensity={1.35} color="#fff8ee" />
      <directionalLight position={[-3, 2, 2]} intensity={0.35} color="#d8efff" />

      {state.phase === "path" && state.activePathId ? (
        <RoomStage
          world={world}
          state={state}
          onFocusHotspot={onFocusHotspot}
          onGoPrevious={onGoPrevious}
          onGoNext={onGoNext}
          onReturnHub={onReturnHub}
        />
      ) : (
        <HubStage world={world} onSelectPath={onSelectPath} />
      )}
    </>
  );
}
