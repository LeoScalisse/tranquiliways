import * as THREE from "three";
import type { RoomBlueprint } from "../model.ts";

export type HubCaminhoCallback = () => void;

const LIGHTING_AMBIENT: Record<string, number> = {
  soft: 0.85, misty: 0.7, warm: 0.9, moonlit: 0.4,
};
const LIGHTING_DIR: Record<string, number> = {
  soft: 0.8, misty: 0.45, warm: 1.2, moonlit: 0.35,
};

export function createAmbienteScene(room: RoomBlueprint, onHubCaminho: HubCaminhoCallback): THREE.Group {
  const group = new THREE.Group();

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 14),
    new THREE.MeshStandardMaterial({ color: room.palette.ground, roughness: 0.88 }),
  );
  ground.rotation.x = -Math.PI / 2;
  group.add(ground);

  const ambientIntensity = LIGHTING_AMBIENT[room.lighting] ?? 0.85;
  const dirIntensity = LIGHTING_DIR[room.lighting] ?? 1.0;
  group.add(new THREE.AmbientLight(room.palette.skyTop, ambientIntensity));
  const dir = new THREE.DirectionalLight(room.palette.glow, dirIntensity);
  dir.position.set(5, 10, 5);
  group.add(dir);

  room.props.forEach((prop) => {
    const h = 0.4 + Math.random() * 0.4;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, h, 0.35),
      new THREE.MeshStandardMaterial({ color: prop.tint ?? room.palette.prop }),
    );
    mesh.position.set(prop.position[0], h / 2, prop.position[2]);
    group.add(mesh);
  });

  group.add(makeTextSprite(room.title,   room.palette.highlight, 256, 48, 3.8));
  group.add(makeTextSprite(room.summary, room.palette.accent,    360, 72, 3.2));

  const returnDoor = new THREE.Group();
  returnDoor.position.set(0, 0, 5);
  returnDoor.userData.isReturn = true;
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 2.2, 0.1),
    new THREE.MeshStandardMaterial({ color: room.palette.skyTop, transparent: true, opacity: 0.55 }),
  );
  frame.position.y = 1.1;
  returnDoor.add(frame);
  returnDoor.add(makeTextSprite("← Caminho", room.palette.highlight, 220, 48, 2.6));
  group.add(returnDoor);

  group.userData.returnDoor = returnDoor;
  group.userData.onHubCaminho = onHubCaminho;

  return group;
}

function makeTextSprite(text: string, color: string, w: number, h: number, y: number): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = color;
  ctx.font = "16px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(text, w / 2, h / 2 + 6, w - 16);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true }));
  sprite.scale.set(w / 64, h / 64, 1);
  sprite.position.y = y;
  return sprite;
}
