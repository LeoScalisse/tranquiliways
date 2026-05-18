import * as THREE from "three";
import { useEffect, useRef, useState } from "react";
import { GameState, type Scene } from "../core/GameState.ts";
import { CAMERA, CHARACTER, PORTAL } from "../core/Constants.ts";
import type { PathId, PlayableWorldV1 } from "../model.ts";
import { useDirectionalInput, type DirectionalInput } from "@/hooks/use-directional-input.ts";
import { useCharacterCustomization } from "@/hooks/use-character-customization.ts";
import { DirectionalPad } from "./directional-pad.tsx";
import { createHubNuvemScene, type PortalCallback } from "./scene-hub-nuvem.ts";
import { createHubCaminhoScene } from "./scene-hub-caminho.ts";
import { createAmbienteScene } from "./scene-ambiente.ts";
import { loadCharacterWithAnimations, applyMeshColor } from "../level/AssetLoader.ts";

interface Props {
  world: PlayableWorldV1;
  onBrowseWays?: () => void;
}

export function IsometricWorld({ world, onBrowseWays }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<DirectionalInput>({ dx: 0, dy: 0 });
  const realMeshRef = useRef<THREE.Object3D | null>(null);
  const [scene, setScene] = useState<Scene>({ type: "hub-nuvem" });
  const { customization } = useCharacterCustomization();

  useDirectionalInput(inputRef);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    GameState.reset();

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(new THREE.Color(world.hub.palette.fog));

    const frustum = CAMERA.FRUSTUM_SIZE;
    function makeCamera(w: number, h: number) {
      const a = w / h;
      const cam = new THREE.OrthographicCamera(-frustum * a, frustum * a, frustum, -frustum, CAMERA.NEAR, CAMERA.FAR);
      cam.position.set(CAMERA.POSITION[0], CAMERA.POSITION[1], CAMERA.POSITION[2]);
      cam.lookAt(0, 0, 0);
      return cam;
    }
    let camera = makeCamera(canvas.clientWidth, canvas.clientHeight);
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

    const scene3d = new THREE.Scene();
    scene3d.fog = new THREE.Fog(0xf0f4f8, 10, 22);

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
    let mixer: THREE.AnimationMixer | null = null;
    let walkAction: THREE.AnimationAction | null = null;

    function loadScene(s: Scene) {
      if (activeGroup) scene3d.remove(activeGroup);
      const activeMesh = realMeshRef.current ?? charMesh;
      activeMesh.position.set(0, 0.45, 0);

      if (s.type === "hub-nuvem") {
        scene3d.fog = new THREE.Fog(new THREE.Color(world.hub.palette.fog), 12, 26);
        renderer.setClearColor(new THREE.Color(world.hub.palette.fog));
        activeGroup = createHubNuvemScene(world, (pathId: PathId) => {
          const next: Scene = { type: "hub-caminho", path: pathId };
          GameState.setScene(next);
          setScene(next);
          loadScene(next);
        });
      } else if (s.type === "hub-caminho") {
        const path = world.paths.find((p) => p.id === s.path)!;
        const fogColor = new THREE.Color(path.palette.skyBottom);
        scene3d.fog = new THREE.Fog(fogColor, 10, 22);
        renderer.setClearColor(fogColor);
        activeGroup = createHubCaminhoScene(
          path,
          (index: number) => {
            const next: Scene = { type: "ambiente", path: s.path, index };
            GameState.setScene(next);
            setScene(next);
            loadScene(next);
          },
          () => {
            const next: Scene = { type: "hub-nuvem" };
            GameState.setScene(next);
            setScene(next);
            loadScene(next);
          },
        );
      } else {
        const path = world.paths.find((p) => p.id === s.path)!;
        const room = path.rooms[s.index];
        const roomFogColor = new THREE.Color(room.palette.skyBottom);
        scene3d.fog = new THREE.Fog(roomFogColor, 8, 18);
        renderer.setClearColor(roomFogColor);
        activeGroup = createAmbienteScene(room, () => {
          const next: Scene = { type: "hub-caminho", path: s.path };
          GameState.setScene(next);
          setScene(next);
          loadScene(next);
        });
      }

      if (activeGroup) scene3d.add(activeGroup);
    }

    loadScene({ type: "hub-nuvem" });

    // Load Meshy AI character (graceful — placeholder box stays if GLB absent)
    loadCharacterWithAnimations(CHARACTER.MODEL_PATH, CHARACTER.WALK_ANIM_PATH)
      .then(({ mesh, mixer: m, walkAction: w }) => {
        mesh.scale.setScalar(CHARACTER.SCALE);
        mesh.rotation.y = CHARACTER.ROTATION_OFFSET;
        mesh.position.copy(charMesh.position);
        scene3d.remove(charMesh);
        scene3d.add(mesh);
        realMeshRef.current = mesh;
        mixer = m;
        walkAction = w;
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

      // Animation
      mixer?.update(delta);
      if (walkAction) {
        const target = dx !== 0 || dy !== 0 ? 1 : 0;
        walkAction.setEffectiveWeight(
          THREE.MathUtils.lerp(walkAction.getEffectiveWeight(), target, delta * 8),
        );
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
              (activeGroup.userData.onAmbiente as (i: number) => void)(d.userData.roomIndex as number);
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
