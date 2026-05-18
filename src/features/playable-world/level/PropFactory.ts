import * as THREE from "three";
import type { RoomPalette } from "../model.ts";

type MatOpts = {
  transparent?: boolean;
  opacity?: number;
  metalness?: number;
  roughness?: number;
  emissive?: THREE.ColorRepresentation;
  emissiveIntensity?: number;
};

function mat(color: THREE.ColorRepresentation, opts?: MatOpts): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    transparent: opts?.transparent ?? false,
    opacity: opts?.opacity ?? 1,
    metalness: opts?.metalness ?? 0,
    roughness: opts?.roughness ?? 0.85,
    ...(opts?.emissive !== undefined
      ? { emissive: opts.emissive, emissiveIntensity: opts.emissiveIntensity ?? 0.5 }
      : {}),
  });
}

function box(w: number, h: number, d: number, color: THREE.ColorRepresentation, opts?: MatOpts): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, opts));
  m.castShadow = true;
  return m;
}

function sphere(r: number, color: THREE.ColorRepresentation, opts?: MatOpts): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 7, 6), mat(color, opts));
  m.castShadow = true;
  return m;
}

function cyl(rt: number, rb: number, h: number, color: THREE.ColorRepresentation): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 8), mat(color));
  m.castShadow = true;
  return m;
}

function add(g: THREE.Group, obj: THREE.Object3D, x: number, y: number, z: number, ry = 0): void {
  obj.position.set(x, y, z);
  if (ry !== 0) obj.rotation.y = ry;
  g.add(obj);
}

function makeBed(p: THREE.ColorRepresentation, a: THREE.ColorRepresentation): THREE.Group {
  const g = new THREE.Group();
  add(g, box(1.4, 0.25, 0.8, p), 0, 0.125, 0);
  add(g, box(1.4, 0.5, 0.08, a), 0, 0.5, -0.4);
  add(g, box(0.4, 0.15, 0.35, a), -0.3, 0.325, 0.1);
  add(g, box(0.4, 0.15, 0.35, a), 0.3, 0.325, 0.1);
  return g;
}

function makeDesk(p: THREE.ColorRepresentation, a: THREE.ColorRepresentation): THREE.Group {
  const g = new THREE.Group();
  for (const [x, z] of [[-0.4, -0.2], [0.4, -0.2], [-0.4, 0.2], [0.4, 0.2]] as [number, number][]) {
    add(g, box(0.06, 0.65, 0.06, a), x, 0.325, z);
  }
  add(g, box(0.9, 0.07, 0.5, p), 0, 0.685, 0);
  return g;
}

function makeSofa(p: THREE.ColorRepresentation, a: THREE.ColorRepresentation): THREE.Group {
  const g = new THREE.Group();
  add(g, box(1.0, 0.2, 0.45, p), 0, 0.1, 0);
  add(g, box(1.0, 0.45, 0.12, a), 0, 0.425, -0.165);
  add(g, box(0.12, 0.3, 0.45, a), -0.56, 0.15, 0);
  add(g, box(0.12, 0.3, 0.45, a), 0.56, 0.15, 0);
  return g;
}

function makeTable(p: THREE.ColorRepresentation, a: THREE.ColorRepresentation): THREE.Group {
  const g = new THREE.Group();
  for (const [x, z] of [[-0.35, -0.35], [0.35, -0.35], [-0.35, 0.35], [0.35, 0.35]] as [number, number][]) {
    add(g, box(0.06, 0.55, 0.06, a), x, 0.275, z);
  }
  add(g, box(0.8, 0.07, 0.8, p), 0, 0.585, 0);
  return g;
}

function makeBookshelf(p: THREE.ColorRepresentation, a: THREE.ColorRepresentation): THREE.Group {
  const g = new THREE.Group();
  add(g, box(0.06, 1.4, 0.3, p), -0.43, 0.7, 0);
  add(g, box(0.06, 1.4, 0.3, p), 0.43, 0.7, 0);
  add(g, box(0.86, 0.06, 0.3, p), 0, 0.03, 0);
  add(g, box(0.86, 0.06, 0.3, p), 0, 1.37, 0);
  for (const y of [0.45, 0.9]) {
    add(g, box(0.86, 0.06, 0.3, a), 0, y, 0);
  }
  return g;
}

function makePlant(p: THREE.ColorRepresentation, a: THREE.ColorRepresentation): THREE.Group {
  const g = new THREE.Group();
  add(g, box(0.25, 0.28, 0.25, a), 0, 0.14, 0);
  add(g, sphere(0.3, p), 0, 0.58, 0);
  return g;
}

function makeLamp(p: THREE.ColorRepresentation, a: THREE.ColorRepresentation, glow: string): THREE.Group {
  const g = new THREE.Group();
  add(g, box(0.07, 1.4, 0.07, a), 0, 0.7, 0);
  add(g, box(0.25, 0.2, 0.25, p), 0, 1.5, 0);
  const light = new THREE.PointLight(glow, 1.2, 3.5);
  light.position.set(0, 1.55, 0);
  g.add(light);
  return g;
}

function makeMirror(p: THREE.ColorRepresentation): THREE.Group {
  const g = new THREE.Group();
  add(g, box(0.1, 1.2, 0.8, p), 0, 0.6, 0);
  add(g, box(0.02, 0.9, 0.6, 0x8899aa, { metalness: 0.8, roughness: 0.1 }), 0.06, 0.6, 0);
  return g;
}

function makeSuitcase(p: THREE.ColorRepresentation, a: THREE.ColorRepresentation): THREE.Group {
  const g = new THREE.Group();
  add(g, box(0.8, 0.5, 0.35, p), 0, 0.25, 0);
  add(g, box(0.4, 0.06, 0.06, a), 0, 0.53, 0);
  return g;
}

function makeNotebook(p: THREE.ColorRepresentation, a: THREE.ColorRepresentation): THREE.Group {
  const g = new THREE.Group();
  add(g, box(0.35, 0.04, 0.25, p), -0.04, 0.02, 0);
  const top = box(0.35, 0.04, 0.25, a);
  top.rotation.x = -Math.PI / 8;
  top.position.set(-0.04, 0.07, -0.04);
  g.add(top);
  return g;
}

function makeFrame(p: THREE.ColorRepresentation, a: THREE.ColorRepresentation): THREE.Group {
  const g = new THREE.Group();
  add(g, box(0.7, 0.7, 0.08, p), 0, 0.35, 0);
  add(g, box(0.5, 0.5, 0.04, a), 0, 0.35, 0.03);
  return g;
}

function makeWindow(p: THREE.ColorRepresentation, fog: string): THREE.Group {
  const g = new THREE.Group();
  add(g, box(0.1, 1.4, 1.0, p), 0, 0.7, 0);
  add(g, box(0.02, 1.1, 0.7, fog, { transparent: true, opacity: 0.3 }), 0.06, 0.7, 0);
  return g;
}

function makeChair(p: THREE.ColorRepresentation, a: THREE.ColorRepresentation): THREE.Group {
  const g = new THREE.Group();
  for (const [x, z] of [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]] as [number, number][]) {
    add(g, box(0.06, 0.35, 0.06, a), x, 0.175, z);
  }
  add(g, box(0.4, 0.07, 0.4, p), 0, 0.385, 0);
  add(g, box(0.4, 0.5, 0.06, a), 0, 0.67, -0.17);
  return g;
}

function makeWardrobe(p: THREE.ColorRepresentation, a: THREE.ColorRepresentation): THREE.Group {
  const g = new THREE.Group();
  add(g, box(1.0, 1.8, 0.5, p), 0, 0.9, 0);
  add(g, box(0.45, 1.6, 0.04, a), -0.25, 0.9, 0.27);
  add(g, box(0.45, 1.6, 0.04, a), 0.25, 0.9, 0.27);
  add(g, box(0.04, 0.12, 0.04, 0x999999), -0.07, 0.9, 0.3);
  add(g, box(0.04, 0.12, 0.04, 0x999999), 0.07, 0.9, 0.3);
  return g;
}

function makeAltar(p: THREE.ColorRepresentation, a: THREE.ColorRepresentation, glow: string): THREE.Group {
  const g = new THREE.Group();
  add(g, box(0.4, 0.6, 0.4, p), 0, 0.3, 0);
  add(g, sphere(0.2, a, { emissive: glow, emissiveIntensity: 0.6 }), 0, 0.8, 0);
  return g;
}

function makeMug(p: THREE.ColorRepresentation, a: THREE.ColorRepresentation): THREE.Group {
  const g = new THREE.Group();
  add(g, cyl(0.1, 0.09, 0.2, p), 0, 0.1, 0);
  add(g, box(0.04, 0.12, 0.05, a), 0.13, 0.1, 0);
  return g;
}

function makeLaundry(p: THREE.ColorRepresentation, a: THREE.ColorRepresentation): THREE.Group {
  const g = new THREE.Group();
  add(g, cyl(0.25, 0.2, 0.45, p), 0, 0.225, 0);
  const cloth = box(0.35, 0.12, 0.25, a);
  cloth.rotation.z = 0.3;
  cloth.position.set(0.05, 0.5, 0);
  g.add(cloth);
  return g;
}

function makeMusicPlayer(p: THREE.ColorRepresentation, a: THREE.ColorRepresentation): THREE.Group {
  const g = new THREE.Group();
  add(g, box(0.4, 0.25, 0.2, p), 0, 0.125, 0);
  add(g, cyl(0.06, 0.06, 0.04, a), -0.1, 0.25, 0.1);
  add(g, cyl(0.06, 0.06, 0.04, a), 0.1, 0.25, 0.1);
  return g;
}

function makeDiningTable(p: THREE.ColorRepresentation, a: THREE.ColorRepresentation): THREE.Group {
  const g = new THREE.Group();
  for (const [x, z] of [[-0.65, -0.4], [0.65, -0.4], [-0.65, 0.4], [0.65, 0.4]] as [number, number][]) {
    add(g, box(0.08, 0.7, 0.08, a), x, 0.35, z);
  }
  add(g, box(1.4, 0.07, 0.9, p), 0, 0.735, 0);
  return g;
}

function makeDoor(p: THREE.ColorRepresentation, a: THREE.ColorRepresentation): THREE.Group {
  const g = new THREE.Group();
  add(g, box(1.0, 2.0, 0.1, p), 0, 1.0, 0);
  add(g, box(0.85, 1.7, 0.06, a), 0, 1.0, 0.08);
  return g;
}

export const PropFactory = {
  create(kind: string, palette: RoomPalette, tint?: string): THREE.Group {
    const p: THREE.ColorRepresentation = tint ?? palette.prop;
    const a: THREE.ColorRepresentation = palette.accent;
    switch (kind) {
      case "bed":           return makeBed(p, a);
      case "desk":          return makeDesk(p, a);
      case "sofa":          return makeSofa(p, a);
      case "table":         return makeTable(p, a);
      case "bookshelf":     return makeBookshelf(p, a);
      case "plant":         return makePlant(p, a);
      case "lamp":          return makeLamp(p, a, palette.glow);
      case "mirror":        return makeMirror(p);
      case "suitcase":      return makeSuitcase(p, a);
      case "notebook":      return makeNotebook(p, a);
      case "frame":         return makeFrame(p, a);
      case "window":        return makeWindow(p, palette.fog);
      case "chair":         return makeChair(p, a);
      case "wardrobe":      return makeWardrobe(p, a);
      case "altar":         return makeAltar(p, a, palette.glow);
      case "mug":           return makeMug(p, a);
      case "laundry":       return makeLaundry(p, a);
      case "music-player":  return makeMusicPlayer(p, a);
      case "dining-table":  return makeDiningTable(p, a);
      case "door":          return makeDoor(p, a);
      default: {
        const g = new THREE.Group();
        const m = box(0.3, 0.5, 0.3, p);
        m.position.y = 0.25;
        g.add(m);
        return g;
      }
    }
  },
};
