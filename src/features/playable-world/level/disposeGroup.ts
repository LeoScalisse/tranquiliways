import * as THREE from "three";

// Recursively releases GPU resources (geometries, materials, textures) held by
// an Object3D subtree. Three.js does not auto-dispose; without this, every
// scene transition leaks geometry + texture memory and eventually crashes the
// WebGL context on Android mid-range devices.
export function disposeGroup(root: THREE.Object3D | null | undefined): void {
  if (!root) return;
  root.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.geometry?.dispose();
      disposeMaterialField(mesh.material);
      return;
    }
    const sprite = node as THREE.Sprite;
    if (sprite.isSprite) {
      disposeMaterialField(sprite.material);
    }
  });
}

function disposeMaterialField(field: THREE.Material | THREE.Material[] | undefined): void {
  if (!field) return;
  if (Array.isArray(field)) {
    field.forEach(disposeMaterial);
  } else {
    disposeMaterial(field);
  }
}

function disposeMaterial(material: THREE.Material): void {
  for (const value of Object.values(material as unknown as Record<string, unknown>)) {
    if (value instanceof THREE.Texture) value.dispose();
  }
  material.dispose();
}
