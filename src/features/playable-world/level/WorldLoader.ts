import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { SparkRenderer, SplatMesh } from "@sparkjsdev/spark";
import { WORLD_LABS } from "../core/Constants.ts";

const gltfLoader = new GLTFLoader();
const splatCache = new Map<string, SplatMesh>();
const colliderCache = new Map<string, THREE.Object3D>();
let sparkInitialized = false;

function ensureSpark(scene: THREE.Scene, renderer: THREE.WebGLRenderer): void {
  if (sparkInitialized) return;
  const spark = new SparkRenderer({ renderer, sortRadial: true, enableLod: true, lodSplatScale: 1.0 });
  scene.add(spark);
  sparkInitialized = true;
}

export async function loadSplatScene(
  slug: string,
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  mobile = false,
): Promise<{ splat: SplatMesh; collider: THREE.Object3D }> {
  ensureSpark(scene, renderer);
  const tier = mobile ? WORLD_LABS.MOBILE_TIER : WORLD_LABS.DESKTOP_TIER;
  const splatPath = `${WORLD_LABS.WORLDS_BASE}${slug}-${tier}.spz`;
  const colliderPath = `${WORLD_LABS.WORLDS_BASE}${slug}-collider.glb`;

  const [splat, collider] = await Promise.all([
    loadSplat(slug, splatPath, scene),
    loadCollider(slug, colliderPath, scene),
  ]);

  return { splat, collider };
}

async function loadSplat(slug: string, path: string, scene: THREE.Scene): Promise<SplatMesh> {
  if (splatCache.has(slug)) return splatCache.get(slug)!;
  const splat = new SplatMesh({ url: path });
  splat.rotation.x = Math.PI; // World Labs Y-flip
  scene.add(splat);
  if (splat.initialized) await splat.initialized;
  splatCache.set(slug, splat);
  return splat;
}

async function loadCollider(slug: string, path: string, scene: THREE.Scene): Promise<THREE.Object3D> {
  if (colliderCache.has(slug)) return colliderCache.get(slug)!;
  const gltf = await gltfLoader.loadAsync(path);
  const collider = gltf.scene;
  collider.visible = false;
  collider.rotation.x = Math.PI;
  collider.traverse((c) => {
    if ("isMesh" in c && c.isMesh) {
      (c as THREE.Mesh).material = new THREE.MeshBasicMaterial({ visible: false });
    }
  });
  collider.updateMatrixWorld(true);
  scene.add(collider);
  colliderCache.set(slug, collider);
  return collider;
}

export function getGroundY(collider: THREE.Object3D, x: number, z: number, fallback = 0): number {
  const rc = new THREE.Raycaster(new THREE.Vector3(x, 50, z), new THREE.Vector3(0, -1, 0));
  const hits = rc.intersectObject(collider, true);
  return hits.length > 0 ? hits[0].point.y : fallback;
}

export function clearWorldLoaderCache(): void {
  splatCache.clear();
  colliderCache.clear();
  sparkInitialized = false;
}
