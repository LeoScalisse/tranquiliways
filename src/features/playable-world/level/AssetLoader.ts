import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";

const loader = new GLTFLoader();
const modelCache = new Map<string, THREE.Object3D>();
const clipCache = new Map<string, THREE.AnimationClip[]>();

export async function loadModel(path: string): Promise<THREE.Object3D> {
  if (!modelCache.has(path)) {
    const gltf = await loader.loadAsync(path);
    modelCache.set(path, gltf.scene);
  }
  return SkeletonUtils.clone(modelCache.get(path)!);
}

export async function loadClips(path: string): Promise<THREE.AnimationClip[]> {
  if (!clipCache.has(path)) {
    const gltf = await loader.loadAsync(path);
    clipCache.set(path, gltf.animations);
  }
  return clipCache.get(path)!;
}

export async function loadCharacterWithAnimations(
  modelPath: string,
  walkPath: string,
): Promise<{
  mesh: THREE.Object3D;
  mixer: THREE.AnimationMixer;
  walkAction: THREE.AnimationAction;
}> {
  const [mesh, walkClips] = await Promise.all([loadModel(modelPath), loadClips(walkPath)]);

  mesh.traverse((c) => {
    if ("isMesh" in c && c.isMesh) {
      (c as THREE.Mesh).castShadow = false;
      (c as THREE.Mesh).receiveShadow = false;
    }
  });

  const mixer = new THREE.AnimationMixer(mesh);
  const walkClip = THREE.AnimationClip.findByName(walkClips, walkClips[0]?.name ?? "");
  const walkAction = mixer.clipAction(walkClip);
  walkAction.play();
  walkAction.setEffectiveWeight(0);

  return { mesh, mixer, walkAction };
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
