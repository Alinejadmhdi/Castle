# Life's Castle — Game Design

## Session Rules

### Timer

- User starts a focus session with: **category**, **brick color**, **duration**.
- **Brick yield:** `completedMs / 3_600_000` — fractional bricks enabled (25 min = 0.417 brick).
- **Base unit:** 1.0 brick = 1 hour. Visual grid supports partial-width bricks.
- Timer runs in foreground; background handling via expo-notifications + app state.

### Focus Modes (user selects in Settings)

| Mode | Behavior |
|------|----------|
| **Strict** | Leaving app or stopping early = session lost, brick cracks |
| **Soft** | One pause grace; second exit or abandon = brick lost |

No Gentle mode — user must choose Strict or Soft.

### Brick Placement

- Completed brick animates (kiln bake → fly to plot).
- Standard categories: bricks go to **daily build area** first, then **macro wall/stage**.
- Miniature categories: instant single brick on miniature plot (no hour timer required — see Miniature Categories).
- Each brick stores: `id`, `categoryId`, `color`, `completedAt`, `sessionId`, `fractionalValue`, `streakRewardLabel`, grid position, `buildingInstanceId`.

---

## Categories

### User-Created Only

- **No predefined categories.** Empty state on first launch prompts "Create your first category."
- User sets: name, default color, icon, type (`standard` | `miniature`).
- CRUD in Settings + quick-add from session screen.

### Standard Categories

Focus timer categories (Work, Study, Art, Sport — all user-named).

Each has its own **settlement plot** on the Life Map bird's-eye view.

### Miniature Categories

For habit resistance (diet, temptation, etc.):

- User labels category (e.g. "Diet", "No Social Media").
- **No timer** — tap "Resisted" to log one miniature brick.
- Fixed or user-chosen **special color** per category (e.g. gold for diet wins).
- Bricks are **miniature scale** (40% size) on an inset plot.
- Separate miniature building ladder (smaller brick counts).
- Each resisted temptation = 1 miniature brick (always whole, not fractional).

---

## Streak Rewards

Streak = consecutive calendar days with ≥1 brick placed in a category (or globally — **per category**).

When a brick completes on a streak milestone day, it gets a **numbered reward label** baked onto the brick:

| Streak day | Label | Badge color |
|------------|-------|-------------|
| 3 | `3` | Bronze |
| 7 | `7` | Silver |
| 14 | `14` | Gold |
| 30 | `30` | Platinum |
| 60 | `60` | Ruby |
| 100 | `100` | Diamond |
| 365 | `365` | Crown |

Label renders as embossed number on brick face. Stored in `brick.streakRewardLabel`.

---

## Daily Buildings (5–10 Hour Cycle)

Each calendar day, bricks earned in a standard category accumulate toward a **daily structure** completable in one day's work.

### Daily Structure Tiers (by hours logged that day)

| Hours today | Daily structure | Bricks (fractional OK) |
|-------------|-----------------|------------------------|
| 0 – 1.9 | None | — |
| 2 – 3.9 | **Day Paver** | 2 |
| 4 – 5.9 | **Day Post** | 4 |
| 6 – 7.9 | **Day Shed** | 6 |
| 8 – 9.9 | **Day Workshop** | 8 |
| 10+ | **Day Pavilion** | 10 |

- At **local midnight** (or user taps "Finish Day"), today's daily structure is **completed and plotted** on the settlement (permanent, never consumed).
- Daily structure bricks also count toward **macro stage** cumulative total.
- If user logs 10 hours, they get Day Pavilion (10 bricks) placed as one completed daily building.

### Flow

```
Morning → sessions → bricks fill daily template
End of day → daily building sealed → appears on plot
Next day → new empty daily template starts
Meanwhile → macro stage progression continues from total bricks
```

---

## Macro Progression: 27 Stages (0–26)

Cumulative brick count (all time, per category) drives the main building ladder. Thresholds are defined in `src/constants/buildings.ts`.

| Stage | Key | Building | Cumulative | This stage | Compound fill |
|-------|-----|----------|------------|------------|---------------|
| 0 | `foundation` | Foundation | 4 | 4 | — |
| 1 | `low_wall` | Low Wall | 12 | 8 | — |
| 2 | `knee_wall` | Knee Wall | 24 | 12 | — |
| 3 | `chest_wall` | Chest Wall | 40 | 16 | — |
| 4 | `full_enclosure` | Full Enclosure | 64 | 24 | — |
| 5 | `gated_wall` | Gated Wall | 88 | 24 | — |
| 6 | `garden_enclosure` | Garden Enclosure | 120 | 32 | — |
| 7 | `lean_to` | Lean-To Shelter | 160 | 40 | — |
| 8 | `shack` | Shack | 210 | 50 | — |
| 9 | `hut` | Hut | 270 | 60 | — |
| 10 | `cottage` | Cottage | 350 | 80 | Yes |
| 11 | `bungalow` | Bungalow | 450 | 100 | Yes |
| 12 | `small_house` | Small House | 580 | 130 | Yes |
| 13 | `house` | House | 750 | 170 | Yes |
| 14 | `farmhouse` | Farmhouse | 960 | 210 | Yes |
| 15 | `townhouse` | Townhouse | 1,220 | 260 | Yes |
| 16 | `manor` | Manor | 1,540 | 320 | Yes |
| 17 | `villa` | Villa | 1,920 | 380 | Yes |
| 18 | `mansion` | Mansion | 2,400 | 480 | Yes |
| 19 | `estate` | Estate | 3,000 | 600 | Yes |
| 20 | `keep` | Keep | 3,700 | 700 | Yes |
| 21 | `fortified_manor` | Fortified Manor | 4,500 | 800 | Yes |
| 22 | `small_fort` | Small Fort | 5,400 | 900 | Yes |
| 23 | `fort` | Fort | 6,500 | 1,100 | Yes |
| 24 | `citadel` | Citadel | 7,800 | 1,300 | Yes |
| 25 | `castle_gatehouse` | Castle Gatehouse | 9,200 | 1,400 | Yes |
| 26 | `castle` | Castle | 11,000 | 1,800 | Yes |

**On stage unlock:** confetti + celebration + haptic. Unlock toast shows **stage name + cumulative brick threshold** (e.g. `Cottage · 350 bricks`).

### How stages appear on the Life Map (3D)

The map is a **Clash-of-Clans-style isometric 3D plot** per category (grass pad, stone border, pine forest ring).

| Mechanic | Behavior |
|----------|----------|
| **Wall bricks** | Only bricks for the **current in-progress stage** render on the near wall. Older stage bricks are hidden from the wall. |
| **Stage monuments** | When a stage unlocks, the **completed prior stage** is sealed as a permanent **monument** (CoC 3D mesh) at a **reserved non-overlapping plot slot** (position saved in DB). Monuments **never disappear** when you advance. |
| **When monuments start** | **Miniature:** from **Birdhouse** (stage 3) onward. Earlier stages are wall-only. **Standard:** from **Hut** (stage 9) onward. Earlier wall tiers do not spawn plot monuments. |
| **Wall → building** | On unlock, wall bricks from the finished stage are **absorbed** into that stage's monument (`buildingInstanceId` assigned). |
| **In-progress stage** | New bricks for the active stage continue stacking on the wall until the next unlock. |
| **Sub-buildings / compounds** | From stage 10 onward, long gaps also spawn **sub-buildings** (Pillar, Wing, Tower, Bastion) and **compounds** when enough subs combine — these are separate plotted instances, also permanent. |

### 3D visual tiers (CoC meshes)

Monuments use procedural CoC-style geometry (`CoCBuildingModel`), scaled by `BUILDING_VISUAL_SCALE` (currently **12**):

| Stages | Visual |
|--------|--------|
| 0 | Stone foundation slabs |
| 1–4 | Stone enclosure walls (1–4 courses, capped pillars at 4–5) |
| 5 | Gated wall + gatehouse |
| 6 | Garden fence ring + fountain + flowers |
| 7 | Lean-to (open wood shelter) |
| 8 | Wood shack + flat roof |
| 9 | Round thatch hut |
| 10–13 | Plaster cottages / houses (thatch → yellow → blue → tile roofs) |
| 14–19 | Larger manor-tier plaster buildings + chimneys |
| 20–26 | Stone keep → fort → citadel → gatehouse → full castle with towers |

---

## Compound Buildings (2048-Style Merge, No Consumption)

When a macro stage requires **many hours** (stage brick count ≥ **80**, from **Cottage / stage 10** onward), the gap is filled with **repeatable sub-buildings** that later **combine visually** into a compound structure. Rule selection scales with stage gap size (`src/constants/compoundBuildings.ts`).

### Rules

1. Sub-buildings are **plotted permanently** when completed (never consumed).
2. When N matching sub-buildings of tier T exist, a **compound building** unlocks at a link point between them.
3. All sub-buildings **remain visible**; compound is an additional structure (not a replacement).
4. After compound unlocks, counter resets — user builds next set of sub-buildings toward the next compound or stage.

### Example: Manor → Villa gap (380 bricks)

Sub-building: **Wing** (80 bricks each)

| Wings completed | What appears |
|-----------------|--------------|
| 1 | Wing A plotted |
| 2 | Wing B plotted |
| 3 | Wing C plotted |
| 4 | Wing D plotted + **Grand Wing** compound (links all 4) |

Wings A–D stay forever. Grand Wing is a new plotted structure referencing brick IDs from all 4 wings.

### Compound Tiers (used in long stages)

| Sub-building | Bricks | Combine count | Compound result |
|--------------|--------|---------------|-----------------|
| Pillar | 20 | 4 → | Arch Row |
| Wing | 80 | 4 → | Grand Wing |
| Tower | 150 | 2 → | Twin Tower |
| Bastion | 200 | 4 → | Fortress Ring |

`progressionService` assigns bricks to sub-building slots when stage gap exceeds threshold.

---

## Miniature Building Ladder

For `categoryType: 'miniature'` (1 brick = 1 resisted temptation). Defined in `src/constants/miniatureBuildings.ts`.

| Stage | Key | Building | Cumulative | This stage |
|-------|-----|----------|------------|------------|
| 0 | `pebble_path` | Pebble Path | 3 | 3 |
| 1 | `tiny_wall` | Tiny Wall | 7 | 4 |
| 2 | `garden_fence` | Garden Fence | 12 | 5 |
| 3 | `birdhouse` | Birdhouse | 18 | 6 |
| 4 | `mini_shed` | Mini Shed | 25 | 7 |
| 5 | `mini_cottage` | Mini Cottage | 35 | 10 |
| 6 | `mini_manor` | Mini Manor | 50 | 15 |
| 7 | `mini_castle` | Mini Castle | 75 | 25 |

- Rendered at **40% scale** (`MINIATURE_SCALE = 0.4`) on the same 3D plot style as standard categories.
- Same monument + wall-absorption rules as macro stages (per-stage monuments persist on the plot).

## Brick Colors

- User picks color before each standard session.
- Miniature categories: one signature color per category (set at creation).
- Mixed-color structures show life history.
- Store as `#RRGGBB`.

---

## Brick Traceability

- Tap any brick → session date, duration, color, streak label, which building it belongs to.
- Tap any building → list of all bricks + sub-buildings that built it.
- **Nothing is consumed** — full history always visible.

---

## Screens

1. **Life Map** — bird's-eye **3D isometric** view of all category settlements (pinch zoom-out, fixed 45° angle)
2. **Category Detail** — same 3D plot with monuments, wall, forest; daily area in data layer
3. **New Session** — pick/create category, color, duration
4. **Active Timer** — countdown, ambient sound toggle
5. **Session Complete** — kiln animation → brick flies to plot
6. **Resist Log** (miniature) — one-tap brick for temptation categories
7. **Building Detail** — brick-by-brick breakdown
8. **Stats Dashboard** — hours, bricks, streaks, per-category charts
9. **Settings** — focus mode, categories, sounds, fractional toggle, building gallery preview

---

## Audio

| Event | Sound |
|-------|-------|
| Timer running | Ambient loop (rain, fire, wind — user picks) |
| Session complete | Brick kiln "ding" |
| Brick lands | Soft thud |
| Stage unlock | Fanfare + confetti |
| Compound unlock | Deeper fanfare |
| Streak milestone | Chime |

All toggleable in Settings.

---

## Resolved Decisions

| # | Decision | Choice |
|---|----------|--------|
| 1 | Focus penalty | Strict + Soft (user choice) |
| 2 | Settlements | Per category |
| 3 | Sub-hour | Fractional bricks enabled |
| 4 | Categories | User-created only |
| 5 | Graphics | **3D CoC-style isometric map** (Expo + React Three Fiber) |
| 6 | Buildings consumed? | Never — all plotted permanently as monuments |
| 7 | Daily shape | Yes — 5–10 hr daily buildings |
| 8 | Compound merge | Yes — 2048-style, no consumption |
| 9 | Stage display | Wall = current stage only; each unlock adds a permanent monument |
| 10 | Unlock message | Stage name + **cumulative** brick threshold |

---

*Last updated: 2026-07-02 — aligned with `buildings.ts`, `miniatureBuildings.ts`, and 3D Life Map behavior.*
