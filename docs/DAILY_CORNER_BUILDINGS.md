# Daily Corner Buildings — Design Preview

Four small CoC-style corner buildings for **daily goal progress**. Each category's daily goal is split into **4 quarters**; earning `goal ÷ 4` bricks today places the next corner building.

## Emotional progression — "Warmth enters your life, one day at a time"

Each corner is a chapter in **today's story**. Same cozy woodland cottage journey; each stage only exists because you showed up yesterday's stage.

| Corner | Name | Feeling | Unlocks at |
|--------|------|---------|------------|
| 1 | **Today Begins** | Lantern on stump — you showed up today | ≥ 25% of daily goal |
| 2 | **Warmth Growing** | Shelter & campfire around the flame | ≥ 50% |
| 3 | **Building the Home** | Walls rising, roof beams up — mid-construction | ≥ 75% |
| 4 | **A Day Well Lived** | Black-roof cottage, hearth glowing, flowers everywhere | ≥ 100% |

**Art direction:** CoC cozy cottage in the woods. Building only, no grass. Stage 3 = during the build (exposed beams, walls going up). Stage 4 = black roof, abundant flowers, chimney smoke, warm interior glow.

## Map placement

- Fixed positions at the **4 corners** of each category's Life Map plot
- Same billboard sprite style as main buildings (`BuildingStageSprite`)
- **Reset at midnight** — all 4 removed; rebuild from today's bricks only
- Driven by `brick_value_today` vs `daily_goal_hours` (standard) or today's resist bricks (miniature)

## Example

Daily goal = **4 hours** → 1 corner per hour:

- 0–0.99 hr → no corners
- 1.0 hr → corner 1 (Foundation)
- 2.0 hr → corners 1–2
- 3.0 hr → corners 1–3
- 4.0 hr → all 4 (Beacon complete)

## Assets

```
assets/daily-corners/
  day-corner-01-foundation.png
  day-corner-02-walls.png
  day-corner-03-roof.png
  day-corner-04-beacon.png
```

Transparency processed to match `building-stages/` pipeline.

---

**Status:** Awaiting your approval before app integration.
