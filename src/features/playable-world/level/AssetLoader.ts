import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";

const loader = new GLTFLoader();
const modelCache = new Map<string, THREE.Object3D>();

export async function loadModel(path: string): Promise<THREE.Object3D> {
  if (!modelCache.has(path)) {
    const gltf = await loader.loadAsync(path);
    modelCache.set(path, gltf.scene);
  }
  return SkeletonUtils.clone(modelCache.get(path)!);
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
