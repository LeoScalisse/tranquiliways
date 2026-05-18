# World Visual Richness — Design Spec

**Date:** 2026-05-18  
**Approach:** B — PropFactory + renderer upgrade  
**Status:** Approved

---

## Problem

TranquiliWays worlds generate correctly (DilemmaWorld data model, navigation, collisions all work), but the Three.js visual environment is visually blank: props are anonymous `BoxGeometry(0.35, random, 0.35)` with no recognizable form, ground is a flat plane, and the renderer has no tone mapping or shadows. The experience does not feel like a place.

## Goal

Make Ambiente scenes feel "coerente e atmosférico" — recognizable voxel props, warm lighting with soft shadows, ground with visual texture. No Blender GLBs, no new navigation logic.

---

## Architecture

Three targeted changes. Everything else (GameState, collisions, D-pad, AssetLoader, hub scenes) is untouched.

```
src/features/playable-world/level/PropFactory.ts   ← NEW
src/features/playable-world/ui/scene-ambiente.ts   ← MODIFY
src/features/playable-world/ui/isometric-world.tsx ← MODIFY (renderer only)
```

---

## 1. PropFactory

**File:** `src/features/playable-world/level/PropFactory.ts`

**API:**
```ts
PropFactory.create(type: string, palette: RoomPalette, tint?: string): THREE.Group
```

Returns a `THREE.Group` composed of BoxGeometry/SphereGeometry primitives. All meshes in the group have `castShadow = true`. Fallback for unknown types: cube `0.3×0.5×0.3`.

**Props:**

| type | geometry |
|------|----------|
| `tree` | trunk `0.25×0.7×0.25` + sphere bush `r=0.5` at y=0.9 + sphere bush `r=0.35` at y=1.25 |
| `bush` | 3 spheres `r=0.3–0.4`, clustered, y offset 0.3 |
| `rock` | 2–3 BoxGeometry scaled and rotated randomly, each `~0.4×0.3×0.35` |
| `flower` | stem `0.06×0.4×0.06` + sphere `r=0.15` at top |
| `bench` | slab `1.1×0.08×0.35` at y=0.35 + 2 posts `0.08×0.35×0.08` |
| `chair` | seat `0.4×0.07×0.4` + back `0.4×0.5×0.06` + 4 legs `0.06×0.35×0.06` |
| `desk` | top `0.9×0.07×0.5` + 4 legs `0.06×0.65×0.06` |
| `lamp` | pole `0.07×1.4×0.07` + head `0.25×0.2×0.25` + `PointLight(palette.glow, 1.2, 3.5)` |
| `sofa` | seat `1.0×0.2×0.45` + back `1.0×0.45×0.12` + 2 arms `0.12×0.3×0.45` |
| `plant` | pot `0.25×0.28×0.25` + sphere `r=0.3` at top |
| `shelf` | 3 horizontal slabs + 2 thin side panels |
| `window` | outer frame `0.1×1.4×1.0` + center plane semi-transparent `opacity=0.3` |
| `door` | frame `1.0×2.0×0.1` + inner panel `0.85×1.7×0.06` |
| `rug` | `PlaneGeometry(1.6, 1.0)`, `rotation.x = -PI/2`, highlight color |
| `cloud` | 4 spheres `r=0.3–0.5`, clustered, `opacity=0.75`, transparent |

**Color logic:**
- Primary color: `tint ?? palette.prop`
- Accent parts (lamp head, sofa back, chair back): `palette.accent`
- Transparent parts (window glass, cloud): `palette.fog` with opacity

---

## 2. scene-ambiente.ts — changes

### Ground
Replace `PlaneGeometry(14, 14)` with a 7×7 grid of `PlaneGeometry(2, 2)` tiles. Alternate tiles get `color.lerp(white, 0.06)` — subtle checkerboard. All tiles `receiveShadow = true`.

### Lighting
Replace current ambient+directional with:

```ts
// Warm sky, cool ground — gives depth
new THREE.HemisphereLight(palette.skyTop, palette.ground, 0.9)

// Shadow-casting sun
const sun = new THREE.DirectionalLight(palette.glow, dirIntensity)
sun.position.set(6, 10, 4)
sun.castShadow = true
sun.shadow.mapSize.set(1024, 1024)  // mobile budget
sun.shadow.normalBias = 0.1         // prevents shadow acne
sun.shadow.camera.left = -8
sun.shadow.camera.right = 8
sun.shadow.camera.top = 8
sun.shadow.camera.bottom = -8
```

### Props
```ts
room.props.forEach((prop) => {
  const group = PropFactory.create(prop.type, room.palette, prop.tint);
  group.position.set(prop.position[0], 0, prop.position[2]);
  scene.add(group);
});
```

---

## 3. isometric-world.tsx — renderer setup

Add after `new THREE.WebGLRenderer(...)`:

```ts
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.4;
```

No other changes to this file.

---

## Data Contract

`PropFactory` consumes `room.props: PropSpec[]` from the existing `RoomBlueprint` model — no model changes needed. Unknown `type` values fall back to cube, so AI-generated prop names that don't match the table are safe.

Hub-nuvem and hub-caminho scenes are out of scope for this change.

---

## Performance Budget

- Shadow map: 1024×1024 (not 4096 — mobile-first)
- Props per scene: existing limit ~20 from `RoomBlueprint`
- No instanced meshes needed at this scale
- `antialias: false` on renderer stays (existing)
- `Math.min(devicePixelRatio, 2)` stays (existing)

---

## Out of Scope

- Hub-nuvem / hub-caminho visual upgrades
- GLB asset loading from Blender
- Raycaster prop interaction (click-to-reveal)
- Character animations tied to environment
- Audio / ambient sound
