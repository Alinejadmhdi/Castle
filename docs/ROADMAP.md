# Life's Castle — Implementation Roadmap

## Phase 0 — Foundation

- [x] Brainstorm game design
- [x] Define folder architecture
- [x] Write project documentation
- [x] User decisions locked
- [x] Initialize Expo + TypeScript project
- [x] Configure path aliases (`@/` → `src/`)

---

## Phase 1 — Data & Constants

- [x] TypeScript types, constants, progression service, unit tests

---

## Phase 2 — Persistence

- [x] SQLite schema + init (`services/database/`)
- [x] Category CRUD repositories
- [x] Brick, session, building, daily build repositories
- [x] Empty state UI (no seed categories)

---

## Phase 3 — Core Timer

- [x] Category create/pick (user-created)
- [x] Session config (color, duration)
- [x] Active timer (strict/soft via AppState)
- [x] Fractional brick calculation on complete
- [x] `timerStore`

---

## Phase 4 — Brick & Daily System

- [x] Brick creation from session (`brickService`)
- [x] Miniature resist log (one-tap brick)
- [x] Daily build accumulator
- [x] Day seal at midnight (auto via `useDailySeal`) + manual **Finish Day** in Settings
- [x] Session-complete kiln animation

---

## Phase 5 — Settlement View (3D)

- [x] Three.js plot renderer (`SettlementPlot` + `SettlementScene3D`)
- [x] Bricks stack bottom-up (`gridY=0` = ground course)
- [x] Bird's-eye Life Map (all categories)
- [x] Category detail plot
- [x] Tap brick → popover with session info
- [x] Fractional brick width rendering (scaled box mesh)
- [x] Miniature inset plot (40% scale)
- [x] Streak badge on bricks (highlight mesh)
- [x] `SettlementRenderer` interface (`mode: '3d'`)

---

## Phase 6 — Building Progression

- [x] Macro stage unlock detection
- [x] Sub-building + compound logic (no consumption)
- [x] Building instances plotted permanently
- [x] Building detail screen (`/building/[id]`)
- [x] Unlock celebration (confetti + sound + haptic)

---

## Phase 7 — Stats, Audio & Settings

- [x] Stats dashboard
- [x] Ambient sounds during timer (expo-av)
- [x] SFX for complete / unlock
- [x] Settings: focus mode, categories CRUD, sounds, fractional toggle
- [x] "Coming soon" rows for deferred feature flags

---

## Phase 8 — Polish

- [x] Onboarding flow (empty state prompts first category on Life Map)
- [x] Empty states
- [x] App icon & splash assets
- [x] Performance pass on large brick counts (demand frameloop, incremental bricks)

---

## Phase 9 — Ship (v0.1)

- [x] EAS build config (`eas.json` preview APK profile)
- [x] Android package + versionCode
- [ ] Internal testing on device
- [ ] Store assets (screenshots)
- [ ] v1.0 Play Store release

---

## Phase 10 — 3D Polish (ongoing)

- [x] `ThreeSettlementRenderer` implementing `SettlementRenderer`
- [x] Enable `VIEW_MODE_3D` feature flag
- [x] Procedural brick + building meshes, orbit camera
- [ ] GLB building models per macro stage
- [ ] Instanced brick meshes for large walls
- [ ] Device performance pass (low-end Android)

---

*Last updated: 2026-07-02 — 3D settlement renderer; bottom-up bricks*
