import * as THREE from "three";
import { useEffect, useRef, useState } from "react";
import { GameState, type Scene } from "../core/GameState.ts";
import { CAMERA, CHARACTER, FOG, PORTAL } from "../core/Constants.ts";
import type { PathId, PlayableWorldV1 } from "../model.ts";
import { useDirectionalInput, type DirectionalInput } from "@/hooks/use-directional-input.ts";
import { useCharacterCustomization } from "@/hooks/use-character-customization.ts";
import { DirectionalPad } from "./directional-pad.tsx";
import { createHubNuvemScene, type PortalCallback } from "./scene-hub-nuvem.ts";
import { createHubCaminhoScene } from "./scene-hub-caminho.ts";
import { createAmbienteScene } from "./scene-ambiente.ts";
import { loadCharacter, applyMeshColor, preloadAssets } from "../level/AssetLoader.ts";
import { disposeGroup } from "../level/disposeGroup.ts";
import { findAssetByKind, getAssetPath } from "../level/AssetRegistry.ts";

interface Props {
  world: PlayableWorldV1;
  onBrowseWays?: () => void;
}

export function IsometricWorld({ world, onBrowseWays }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<DirectionalInput>({ dx: 0, dy: 0 });
  const realMeshRef = useRef<THREE.Object3D | null>(null);
  const [scene, setScene] = useState<Scene>({ type: "hub-nuvem" });
  const [transitioning, setTransitioning] = useState(false);
  const { customization } = useCharacterCustomization();

  useDirectionalInput(inputRef);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    GameState.reset();

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(new THREE.Color(world.hub.palette.fog));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;

    const frustum = CAMERA.FRUSTUM_SIZE;
    function makeCamera(w: number, h: number) {
      const a = w / h;
      const cam = new THREE.OrthographicCamera(
        -frustum * a,
        frustum * a,
        frustum,
        -frustum,
        CAMERA.NEAR,
        CAMERA.FAR,
      );
      cam.position.set(CAMERA.POSITION[0], CAMERA.POSITION[1], CAMERA.POSITION[2]);
      cam.lookAt(0, 0, 0);
      return cam;
    }
    let camera = makeCamera(canvas.clientWidth, canvas.clientHeight);
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

    const scene3d = new THREE.Scene();
    scene3d.fog = new THREE.Fog(0xf0f4f8, FOG.NEAR, FOG.FAR);

    // Placeholder character box — replaced by Meshy GLB once loaded
    const charMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.9, 0.38),
      new THREE.MeshStandardMaterial({ color: "#f5c5a3" }),
    );
    charMesh.position.set(0, 0.45, 0);
    scene3d.add(charMesh);

    const clock = new THREE.Clock();
    const TRIGGER = PORTAL.TRIGGER_RADIUS;

    let activeGroup: THREE.Group | null = null;
    let loadingScene = false;

    // Collects the public URLs of every GLB the new scene will reach for via
    // the registry's PropKind auto-resolution. Empty list = nothing to fetch,
    // every prop falls back to procedural.
    function getRequiredAssetPathsFor(s: Scene): string[] {
      if (s.type !== "ambiente") return [];
      const path = world.paths.find((p) => p.id === s.path);
      const room = path?.rooms[s.index];
      if (!room) return [];
      const paths = new Set<string>();
      for (const prop of room.props) {
        const descriptor = findAssetByKind(prop.kind);
        if (!descriptor) continue;
        const filePath = getAssetPath(descriptor.id);
        if (filePath) paths.add(filePath);
      }
      return [...paths];
    }

    function buildSceneFor(s: Scene): THREE.Group {
      if (s.type === "hub-nuvem") {
        scene3d.fog = new THREE.Fog(new THREE.Color(world.hub.palette.fog), FOG.NEAR, FOG.FAR);
        renderer.setClearColor(new THREE.Color(world.hub.palette.fog));
        return createHubNuvemScene(world, (pathId: PathId) => {
          const next: Scene = { type: "hub-caminho", path: pathId };
          GameState.setScene(next);
          setScene(next);
          void loadScene(next);
        });
      }
      if (s.type === "hub-caminho") {
        const path = world.paths.find((p) => p.id === s.path)!;
        const fogColor = new THREE.Color(path.palette.skyBottom);
        scene3d.fog = new THREE.Fog(fogColor, FOG.NEAR, FOG.FAR);
        renderer.setClearColor(fogColor);
        return createHubCaminhoScene(
          path,
          (index: number) => {
            const next: Scene = { type: "ambiente", path: s.path, index };
            GameState.setScene(next);
            setScene(next);
            void loadScene(next);
          },
          () => {
            const next: Scene = { type: "hub-nuvem" };
            GameState.setScene(next);
            setScene(next);
            void loadScene(next);
          },
        );
      }
      const path = world.paths.find((p) => p.id === s.path)!;
      const room = path.rooms[s.index];
      const roomFogColor = new THREE.Color(room.palette.skyBottom);
      scene3d.fog = new THREE.Fog(roomFogColor, FOG.NEAR, FOG.FAR);
      renderer.setClearColor(roomFogColor);
      return createAmbienteScene(room, () => {
        const next: Scene = { type: "hub-caminho", path: s.path };
        GameState.setScene(next);
        setScene(next);
        void loadScene(next);
      });
    }

    async function loadScene(s: Scene): Promise<void> {
      // Concurrent guards: if the user double-taps a portal we ignore the
      // second trigger until the first transition settles.
      if (loadingScene) return;
      loadingScene = true;
      setTransitioning(true);
      try {
        await preloadAssets(getRequiredAssetPathsFor(s));

        const newGroup = buildSceneFor(s);
        const oldGroup = activeGroup;
        activeGroup = newGroup;
        scene3d.add(newGroup);
        if (oldGroup) {
          scene3d.remove(oldGroup);
          disposeGroup(oldGroup);
        }

        const activeMesh = realMeshRef.current ?? charMesh;
        activeMesh.position.set(0, 0.45, 0);
      } finally {
        loadingScene = false;
        setTransitioning(false);
      }
    }

    void loadScene({ type: "hub-nuvem" });

    // Load the character GLB (graceful — placeholder box stays if GLB absent).
    // Static model only; walk/idle animations will be rebuilt separately.
    loadCharacter(CHARACTER.MODEL_PATH)
      .then((mesh) => {
        mesh.scale.setScalar(CHARACTER.SCALE);
        mesh.rotation.y = CHARACTER.ROTATION_OFFSET;
        mesh.position.copy(charMesh.position);
        scene3d.remove(charMesh);
        scene3d.add(mesh);
        realMeshRef.current = mesh;
        applyMeshColor(mesh, "head", customization.skinColor);
        applyMeshColor(mesh, "hair", customization.hairColor);
        applyMeshColor(mesh, "shirt", customization.shirtColor);
        applyMeshColor(mesh, "pants", customization.pantsColor);
        applyMeshColor(mesh, "shoe", customization.shoeColor);
      })
      .catch(() => undefined);

    renderer.setAnimationLoop(() => {
      const delta = Math.min(clock.getDelta(), 0.1);
      const { dx, dy } = inputRef.current;
      const activeMesh = realMeshRef.current ?? charMesh;

      if (dx !== 0 || dy !== 0) {
        const speed = CHARACTER.MOVE_SPEED * delta;
        const wx = (dx - dy) * 0.7071;
        const wz = (-dx - dy) * 0.7071;
        activeMesh.position.x = Math.max(-7, Math.min(7, activeMesh.position.x + wx * speed));
        activeMesh.position.z = Math.max(-7, Math.min(7, activeMesh.position.z + wz * speed));
        activeMesh.rotation.y = Math.atan2(wx, wz);
      }

      // Collision
      if (activeGroup) {
        const portals = activeGroup.userData.portals as THREE.Group[] | undefined;
        if (portals) {
          for (const p of portals) {
            if (activeMesh.position.distanceTo(p.position) < TRIGGER) {
              (activeGroup.userData.onPortal as PortalCallback)(p.userData.pathId as PathId);
              break;
            }
          }
        }

        const doors = activeGroup.userData.doors as THREE.Group[] | undefined;
        if (doors) {
          for (const d of doors) {
            if (activeMesh.position.distanceTo(d.position) < TRIGGER) {
              (activeGroup.userData.onAmbiente as (i: number) => void)(
                d.userData.roomIndex as number,
              );
              break;
            }
          }
        }

        const returnDoor = activeGroup.userData.returnDoor as THREE.Group | undefined;
        if (returnDoor && activeMesh.position.distanceTo(returnDoor.position) < TRIGGER) {
          const onHN = activeGroup.userData.onHubNuvem as (() => void) | undefined;
          const onHC = activeGroup.userData.onHubCaminho as (() => void) | undefined;
          onHN?.();
          onHC?.();
        }
      }

      renderer.render(scene3d, camera);
    });

    const ro = new ResizeObserver(() => {
      if (!canvas) return;
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
      camera = makeCamera(canvas.clientWidth, canvas.clientHeight);
    });
    ro.observe(canvas);

    return () => {
      renderer.setAnimationLoop(null);
      renderer.dispose();
      ro.disconnect();
      realMeshRef.current = null;
    };
  }, [world]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync customization colors whenever they change
  useEffect(() => {
    const mesh = realMeshRef.current;
    if (!mesh) return;
    applyMeshColor(mesh, "head", customization.skinColor);
    applyMeshColor(mesh, "hair", customization.hairColor);
    applyMeshColor(mesh, "shirt", customization.shirtColor);
    applyMeshColor(mesh, "pants", customization.pantsColor);
    applyMeshColor(mesh, "shoe", customization.shoeColor);
  }, [customization]);

  const sceneLabel =
    scene.type === "hub-nuvem"
      ? "Limiar das escolhas"
      : scene.type === "hub-caminho"
        ? `${scene.path === "parado" ? "Ficar" : "Mudar"} — antessala`
        : `Ambiente ${scene.index + 1}`;

  return (
    <div className="relative h-full w-full overflow-hidden">
      <canvas ref={canvasRef} className="h-full w-full" />

      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 z-20 bg-white transition-opacity duration-300 ease-out ${
          transitioning ? "opacity-20" : "opacity-0"
        }`}
      />

      <div className="pointer-events-none absolute left-4 top-4 z-10">
        <div className="rounded-full bg-white/55 px-4 py-2 text-xs uppercase tracking-[0.2em] text-sky-950/65 backdrop-blur-sm">
          {sceneLabel}
        </div>
      </div>

      <DirectionalPad inputRef={inputRef} />

      {onBrowseWays && (
        <button
          type="button"
          onClick={onBrowseWays}
          className="pointer-events-auto absolute bottom-8 right-6 rounded-full bg-white/55 px-4 py-2 text-xs text-sky-950/65 backdrop-blur-sm"
        >
          Meus dilemas
        </button>
      )}
    </div>
  );
}
