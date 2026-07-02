# Life's Castle — Graphics: 3D Settlement Renderer

## Short Answer

**3D is the primary renderer** — `@react-three/fiber` + `expo-gl` + Three.js on native, `@react-three/fiber` on web. Bricks stack **bottom-up** (`gridY=0` = ground course).

---

## Stack

| Layer | Package |
|-------|---------|
| Scene | `@react-three/fiber` (`/native` on iOS/Android, web on browser) |
| GL context | `expo-gl` (native) |
| Helpers | `@react-three/drei` (OrbitControls on web) |
| Math | `three` |

---

## Brick Placement (bottom → top)

```
gridX: 0 … (columns-1)  left → right on each course
gridY: 0 = bottom course on ground plane
       1 = second course, etc.
```

- `computeGridPosition(globalIndex)` in `src/features/progression/progressionService.ts`
- `gridToWorldPosition(gridX, gridY, …)` in `src/rendering/three/gridToWorld.ts` — `y = gridY * (height + gap) + height/2`

Fractional bricks render as scaled box width (`scaleX = fractionalValue`).

---

## File Map

```
src/components/map/
  SettlementPlot.tsx          # native Canvas
  SettlementPlot.web.tsx      # web Canvas
  three/
    SettlementScene3D.tsx     # lights, ground, bricks, buildings
    BrickMesh.tsx
    BuildingMesh.tsx
    SettlementControls.native.tsx  # touch orbit (native)
    SettlementControls.web.tsx     # drei OrbitControls

src/rendering/three/
  constants.ts
  gridToWorld.ts
  ThreeSettlementRenderer.ts  # mode: '3d'
```

Game logic never imports Three directly — only the plot components and renderer metadata do.

---

## Camera & Controls

- Default camera: elevated bird's-eye angle, auto-adjusts as wall height grows
- Native: custom pan/zoom touch controls (`SettlementControls.native.tsx`)
- Web: `OrbitControls` from drei

Brick tap: `onClick` on mesh → `onBrickPress` callback (popover on category screen).

---

## Visual Layers (ground → sky)

1. Grass ground plane
2. Completed buildings (all stages, never removed)
3. Brick wall courses (bottom course first)
4. Streak highlight on selected brick
5. UI overlays (popover, confetti — React Native layer above Canvas)

---

## Future Polish (not blocking MVP)

- GLB building models per macro stage
- Instanced meshes for 1000+ bricks (LOD when zoomed out)
- Shadow maps on native (currently directional lights only)
- Per-brick kiln reveal animation in 3D

---

## Performance Notes

- 3D is heavier than 2D — test on low-end Android
- Mitigation: reduce draw calls via instancing, cap visible courses when zoomed out
- `expo-gl` is auto-linked (no `app.json` plugin entry needed)

---

*Last updated: 2026-07-02 — 3D primary; bottom-up brick stacking*
