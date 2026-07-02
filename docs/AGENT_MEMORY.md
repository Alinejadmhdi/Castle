# Agent Memory — Life's Castle

> Read at the start of every coding session.

---

## Project Identity

- **App name:** Life's Castle
- **Folder:** `WallIdea`
- **Concept:** Focus timer → bricks → daily buildings → 27 macro stages → castle. Per-category settlements. Miniature mode for temptation/diet.

---

## Locked Decisions (user-approved 2026-07-02)

0. **Expo SDK 54** — matches current Expo Go app (upgraded from 52)

1. **Fractional bricks** — `completedMs / 3_600_000`
2. **Focus modes:** Strict + Soft only (no Gentle) — user picks in settings
3. **Per-category settlements** with bird's-eye Life Map
4. **User-created categories only** — no presets
5. **Miniature categories** — resist log, 1 brick per temptation, 40% scale, separate ladder
6. **Daily buildings** — 2–10 hr tiers (Paver → Pavilion), sealed at midnight
7. **27 macro stages** — Foundation → Castle (11,000 cumulative)
8. **Compound buildings** — 2048-style combine, **never consume** — all stay plotted
9. **Streak labels** on bricks at days 3, 7, 14, 30, 60, 100, 365
10. **3D settlement renderer** — `@react-three/fiber` + `expo-gl`; bricks stack bottom-up (`gridY=0` = ground). `VIEW_MODE_3D: true`
11. **MVP includes:** session animation, tap brick, unlock confetti+sound, ambient audio, stats
12. **Deferred with flags:** cloud sync, social, leaderboards, multi-timer, real-money planting

---

## File Locations

| What | Path |
|------|------|
| Macro stages | `src/constants/buildings.ts` |
| Daily tiers | `src/constants/dailyBuildings.ts` |
| Compound rules | `src/constants/compoundBuildings.ts` |
| Miniature ladder | `src/constants/miniatureBuildings.ts` |
| Streak milestones | `src/constants/streakRewards.ts` |
| Feature flags | `src/constants/featureFlags.ts` |
| Types | `src/types/index.ts` |
| Progression logic | `src/features/progression/` |
| Game design | `docs/GAME_DESIGN.md` |
| Graphics 2D/3D | `docs/GRAPHICS.md` |
| Future features | `docs/FUTURE_FEATURES.md` |

---

## Progression Quick Reference

```
brickValue = sum of fractionalValue per category
macroStage = largest stage where cumulativeBricks <= brickValue
dailyStructure = tier by hours logged today (2/4/6/8/10)
compound = when stage gap >= 80, fill with sub-buildings (Wing×4 → Grand Wing)
```

---

## What NOT to Build in v1

- Cloud sync, auth, social
- Multiple simultaneous timers
- Real-money charity
- Predefined categories

---

## Session Checklist

1. Read `docs/ROADMAP.md` for current phase
2. Update checkboxes when completing work
3. Update this file on new user decisions

---

*Last updated: 2026-07-02 — 2D MVP built; renderer abstracted for future 3D*
