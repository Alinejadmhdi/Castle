# Life's Castle — Project Overview

> **Working title:** Life's Castle  
> **Workspace:** `WallIdea`  
> **Inspiration:** [Forest](https://www.forestapp.cc/) — focus timer with visual growth rewards  
> **Core twist:** Focus time bakes **bricks** that stack into **walls**, then unlock **buildings** up to a **castle**.

---

## One-Sentence Pitch

A focus timer where every hour of undisturbed work lays one colored brick on a life-category wall, and enough bricks unlock progressively larger buildings you can watch being built brick-by-brick.

---

## Core Loop

```
Choose category → Choose brick color → Start timer → Stay focused
    → Timer completes → 1 brick baked → Brick placed on wall
    → Repeat → Wall grows → Building milestones unlock → Castle
```

---

## Key Differentiators vs Forest

| Forest | Life's Castle |
|--------|---------------|
| Trees grow per session | Bricks bake per **hour** (configurable later) |
| Single forest view | **Per-category** walls / settlements |
| Tree dies if you leave app | Brick cracks / is lost (TBD — see open questions) |
| Coins for real trees | Buildings as pure progression (no IAP in v1) |
| Abstract forest | **Literal masonry** — see each brick in each structure |

---

## Target Platform (v1 decision)

**Expo (React Native) + TypeScript**

- Cross-platform iOS + Android from one codebase
- Good animation libraries (Reanimated, Skia) for brick/wall visuals
- Local-first storage (SQLite / MMKV) — no backend required for MVP
- Can add web later via Expo web if needed

---

## Documentation Index

| Document | Purpose |
|----------|---------|
| [GAME_DESIGN.md](./GAME_DESIGN.md) | Mechanics, categories, buildings, brick math |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Code structure, modules, data models |
| [ROADMAP.md](./ROADMAP.md) | Phased implementation plan |
| [docs/GRAPHICS.md](./GRAPHICS.md) | 2D vs 3D graphics decision |
| [FUTURE_FEATURES.md](./FUTURE_FEATURES.md) | Deferred features & feature flags |

---

## Glossary

- **Brick** — One unit of completed focus time (default: 1 hour).
- **Course** — A horizontal row of bricks in a wall.
- **Wall** — The first progression stage; bricks stack in a template grid.
- **Settlement** — A category's plot containing wall + unlocked buildings.
- **Category** — Life domain (Work, Study, Art, Sport, …).
- **Milestone** — Brick count threshold that unlocks the next building stage.

---

## Open Questions (resolve before coding features)

See [GAME_DESIGN.md § Open Questions](./GAME_DESIGN.md#open-questions).

---

*Last updated: 2026-07-02*
