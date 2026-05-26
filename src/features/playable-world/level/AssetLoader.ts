import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";

const loader = new GLTFLoader();
const modelCache = new Map<string, THREE.Object3D>();

let contextHookInstalled = false;
function ensureContextRestoredListener(): void {
  if (contextHookInstalled || typeof window === "undefined") return;
  // When the Android WebView drops the GL context (app backgrounded), cached
  // scene graphs still reference dead GPU resources — invalidate so the next
  // load re-uploads textures fresh.
  window.addEventListener("webglcontextrestored", () => {
    modelCache.clear();
  });
  contextHookInstalled = true;
}

async function fetchInto(path: string): Promise<THREE.Object3D> {
  if (!modelCache.has(path)) {
    const gltf = await loader.loadAsync(path);
    modelCache.set(path, gltf.scene);
  }
  return modelCache.get(path)!;
}

// Deep-clones the object graph AND its materials. SkeletonUtils.clone() alone
// shares material instances with the cached source, which means tinting a
// prop in one scene tints every other clone in every other scene.
function cloneWithMaterials(source: THREE.Object3D): THREE.Object3D {
  const clone = SkeletonUtils.clone(source);
  clone.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mat = mesh.material;
    if (Array.isArray(mat)) {
      mesh.material = mat.map((m) => m.clone());
    } else if (mat) {
      mesh.material = mat.clone();
    }
  });
  return clone;
}

export async function loadModel(path: string): Promise<THREE.Object3D> {
  ensureContextRestoredListener();
  const source = await fetchInto(path);
  return cloneWithMaterials(source);
}

// Idempotent batch preloader — resolves once every requested path is in cache.
// Failures on individual assets are swallowed so a missing GLB doesn't block
// the rest (the consumer falls back to procedural via getCachedClone returning
// null).
export async function preloadAssets(paths: readonly string[]): Promise<void> {
  if (paths.length === 0) return;
  ensureContextRestoredListener();
  await Promise.all(
    paths.map(async (path) => {
      if (modelCache.has(path)) return;
      try {
        const gltf = await loader.loadAsync(path);
        modelCache.set(path, gltf.scene);
      } catch {
        // Intentionally silent — see comment above.
      }
    }),
  );
}

// Synchronous cache read. Returns a fresh deep-cloned instance if the asset
// has been preloaded; null otherwise. Callers handle the null path with a
// procedural fallback so the scene always renders.
export function getCachedClone(path: string): THREE.Object3D | null {
  const source = modelCache.get(path);
  return source ? cloneWithMaterials(source) : null;
}

// Loads the character GLB as a static mesh in its bind pose. Walk/idle
// animations were removed (the 108 MB walk export was unusable) and will be
// rebuilt as a separate animation pipeline.
export async function loadCharacter(modelPath: string): Promise<THREE.Object3D> {
  const mesh = await loadModel(modelPath);
  mesh.traverse((c) => {
    if ("isMesh" in c && c.isMesh) {
      (c as THREE.Mesh).castShadow = false;
      (c as THREE.Mesh).receiveShadow = false;
    }
  });
  return mesh;
}

export function applyMeshColor(root: THREE.Object3D, namePart: string, hex: string): void {
  const color = new THREE.Color(hex);
  root.traverse((c) => {
    if ("isMesh" in c && c.isMesh && c.name.toLowerCase().includes(namePart.toLowerCase())) {
      const mat = (c as THREE.Mesh).material;
      if (Array.isArray(mat)) {
        mat.forEach((m) => {
          if ("color" in m) (m as THREE.MeshStandardMaterial).color.set(color);
        });
      } else if ("color" in mat) {
        (mat as THREE.MeshStandardMaterial).color.set(color);
      }
    }
  });
}
