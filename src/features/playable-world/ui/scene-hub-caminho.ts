import * as THREE from "three";
import type { PathBlueprint } from "../model.ts";

export type AmbienteCallback = (index: number) => void;
export type HubNuvemCallback = () => void;

export function createHubCaminhoScene(
  path: PathBlueprint,
  onAmbiente: AmbienteCallback,
  onHubNuvem: HubNuvemCallback,
): THREE.Group {
  const group = new THREE.Group();

  group.add(createGround(path.palette.ground));

  group.add(new THREE.AmbientLight(path.palette.skyTop, 0.9));
  const dir = new THREE.DirectionalLight(path.palette.glow, 1.1);
  dir.position.set(5, 10, 5);
  group.add(dir);

  if (path.hubDescription) {
    group.add(makeTextSprite(path.hubDescription, path.palette.accent, 400, 80, 3.5));
  } else {
    group.add(makeTextSprite(path.title, path.palette.highlight, 300, 56, 3.5));
  }

  const doors: THREE.Group[] = [];
  const angles = fanAngles(path.rooms.length);
  path.rooms.forEach((room, i) => {
    const door = buildDoor(room.title, path.palette.accent, path.palette.highlight, angles[i], 3.2);
    door.userData.roomIndex = i;
    doors.push(door);
    group.add(door);
  });

  const returnDoor = buildDoor("← Limiar", "#94a3b8", "#e2e8f0", 0, 4.5);
  returnDoor.userData.isReturn = true;
  group.add(returnDoor);

  group.userData.doors = doors;
  group.userData.returnDoor = returnDoor;
  group.userData.onAmbiente = onAmbiente;
  group.userData.onHubNuvem = onHubNuvem;

  return group;
}

function createGround(color: string): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color, roughness: 0.85 }),
  );
  m.rotation.x = -Math.PI / 2;
  return m;
}

function buildDoor(label: string, color: string, textColor: string, angle: number, radius: number): THREE.Group {
  const g = new THREE.Group();
  g.position.set(Math.sin(angle) * radius, 0, -Math.cos(angle) * radius);
  g.rotation.y = angle;

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 2.2, 0.1),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.25 }),
  );
  frame.position.y = 1.1;
  g.add(frame);

  g.add(makeTextSprite(label, textColor, 256, 56, 2.6));
  return g;
}

function fanAngles(count: number): number[] {
  if (count === 1) return [Math.PI];
  const span = (Math.PI * 2) / 3;
  return Array.from({ length: count }, (_, i) => Math.PI - span / 2 + (span / (count - 1)) * i);
}

function makeTextSprite(text: string, color: string, w: number, h: number, y: number): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = color;
  ctx.font = "18px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(text, w / 2, h / 2 + 6, w - 16);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true }));
  sprite.scale.set(w / 64, h / 64, 1);
  sprite.position.y = y;
  return sprite;
}
