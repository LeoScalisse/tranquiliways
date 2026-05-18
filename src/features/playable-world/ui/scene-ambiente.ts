import * as THREE from "three";
import type { RoomBlueprint } from "../model.ts";
import { PropFactory } from "../level/PropFactory.ts";

export type HubCaminhoCallback = () => void;

const LIGHTING_AMBIENT: Record<string, number> = {
  soft: 0.85, misty: 0.7, warm: 0.9, moonlit: 0.4,
};
const LIGHTING_DIR: Record<string, number> = {
  soft: 0.8, misty: 0.45, warm: 1.2, moonlit: 0.35,
};

export function createAmbienteScene(room: RoomBlueprint, onHubCaminho: HubCaminhoCallback): THREE.Group {
  const group = new THREE.Group();

  const baseColor = new THREE.Color(room.palette.ground);
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < 7; j++) {
      const tileColor = baseColor.clone();
      if ((i + j) % 2 === 0) tileColor.lerp(new THREE.Color(0xffffff), 0.06);
      const tile = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.MeshStandardMaterial({ color: tileColor, roughness: 0.88 }),
      );
      tile.rotation.x = -Math.PI / 2;
      tile.position.set(-6 + i * 2, 0, -6 + j * 2);
      tile.receiveShadow = true;
      group.add(tile);
    }
  }

  const ambientIntensity = LIGHTING_AMBIENT[room.lighting] ?? 0.85;
  const dirIntensity = LIGHTING_DIR[room.lighting] ?? 1.0;
  group.add(new THREE.HemisphereLight(room.palette.skyTop, room.palette.ground, ambientIntensity));
  const sun = new THREE.DirectionalLight(room.palette.glow, dirIntensity);
  sun.position.set(6, 10, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.normalBias = 0.1;
  sun.shadow.camera.left = -8;
  sun.shadow.camera.right = 8;
  sun.shadow.camera.top = 8;
  sun.shadow.camera.bottom = -8;
  sun.shadow.camera.updateProjectionMatrix();
  group.add(sun);

  room.props.forEach((prop) => {
    const propGroup = PropFactory.create(prop.kind, room.palette, prop.tint);
    propGroup.position.set(prop.position[0], 0, prop.position[2]);
    propGroup.rotation.y = prop.rotationY;
    propGroup.scale.setScalar(prop.scale);
    group.add(propGroup);
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
