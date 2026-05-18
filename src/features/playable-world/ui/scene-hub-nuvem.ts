import * as THREE from "three";
import { PORTAL } from "../core/Constants.ts";
import type { PathId, PlayableWorldV1 } from "../model.ts";

export type PortalCallback = (pathId: PathId) => void;

export function createHubNuvemScene(world: PlayableWorldV1, onPortal: PortalCallback): THREE.Group {
  const group = new THREE.Group();
  const { palette, portals } = world.hub;

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 24),
    new THREE.MeshStandardMaterial({ color: palette.ground, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  group.add(ground);

  group.add(new THREE.AmbientLight(palette.skyTop, 1.4));
  const ptLight = new THREE.PointLight(palette.glow, 1.8, 20);
  ptLight.position.set(0, 6, 0);
  group.add(ptLight);

  for (let i = 0; i < 16; i++) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(Math.random() * 0.7 + 0.3, 6, 5),
      new THREE.MeshStandardMaterial({ color: palette.fog, transparent: true, opacity: 0.65 }),
    );
    mesh.position.set((Math.random() - 0.5) * 18, Math.random() * 2.5 + 0.8, (Math.random() - 0.5) * 18);
    group.add(mesh);
  }

  const paradoGroup = buildPortal(portals[0].label, portals[0].glow, portals[0].accent, PORTAL.PARADO_POSITION);
  paradoGroup.userData.pathId = "parado" satisfies PathId;
  group.add(paradoGroup);

  const mudancaGroup = buildPortal(portals[1].label, portals[1].glow, portals[1].accent, PORTAL.MUDANCA_POSITION);
  mudancaGroup.userData.pathId = "mudanca" satisfies PathId;
  group.add(mudancaGroup);

  group.userData.portals = [paradoGroup, mudancaGroup];
  group.userData.onPortal = onPortal;

  return group;
}

function buildPortal(
  label: string,
  glowColor: string,
  labelColor: string,
  pos: readonly [number, number, number],
): THREE.Group {
  const g = new THREE.Group();
  g.position.set(pos[0], pos[1], pos[2]);

  const arch = new THREE.Mesh(
    new THREE.TorusGeometry(0.85, 0.09, 8, 32, Math.PI),
    new THREE.MeshStandardMaterial({ color: glowColor, emissive: glowColor, emissiveIntensity: 0.7 }),
  );
  arch.rotation.z = -Math.PI / 2;
  arch.position.y = 0.85;
  g.add(arch);

  const door = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 2),
    new THREE.MeshStandardMaterial({ color: glowColor, transparent: true, opacity: 0.18, side: THREE.DoubleSide }),
  );
  door.position.y = 1;
  g.add(door);

  const glow = new THREE.PointLight(glowColor, 1.4, 4);
  glow.position.y = 1;
  g.add(glow);

  g.add(makeTextSprite(label, labelColor, 256, 56));

  return g;
}

function makeTextSprite(text: string, color: string, w: number, h: number): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = color;
  ctx.font = "bold 22px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(text, w / 2, h / 2 + 8, w - 12);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true }));
  sprite.scale.set(2, 0.45, 1);
  sprite.position.set(0, 2.35, 0);
  return sprite;
}
