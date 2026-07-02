# Life's Castle — Future Features (Architecture Hooks)

> Features deferred from MVP but **designed in** via feature flags and service interfaces so they can be added without refactors.

---

## Feature Flag Pattern

```typescript
// src/constants/featureFlags.ts
export const FEATURE_FLAGS = {
  REAL_MONEY_PLANTING: false,      // v3+
  SOCIAL_FEED: false,              // v3+
  LEADERBOARDS: false,             // v3+
  MULTIPLE_TIMERS: false,          // v2+
  CLOUD_SYNC: false,               // v2+
  VIEW_MODE_3D: false,             // v2+
  WIDGET: false,                   // v2+
  WATCH_COMPANION: false,          // v3+
} as const;
```

Settings screen shows grayed "Coming soon" rows for `false` flags.

---

## Deferred Features

### Real-Money Charitable Planting (Forest-style)

- **Not masonry-themed** — optional separate tab if ever added
- Hook: `src/services/charity/` stub with `CharityService` interface
- Requires: payment SDK (RevenueCat / Stripe), backend receipt validation
- **Flag:** `REAL_MONEY_PLANTING`

### Social Feed / Leaderboards

- Requires: auth, backend, moderation
- Hook: `src/services/social/` stub
- Never mix with local-first brick data without explicit sync consent
- **Flags:** `SOCIAL_FEED`, `LEADERBOARDS`

### Multiple Simultaneous Timers

- v1: `timerStore` enforces `activeSession: Session | null` (single)
- v2: extend to `activeSessions: Session[]` with split-screen UI
- **Flag:** `MULTIPLE_TIMERS`

### Cloud Sync / Accounts

- v1: SQLite local only
- v2: `SyncAdapter` interface; export/import JSON backup first
- v3: optional account + encrypted sync
- **Flag:** `CLOUD_SYNC`
- Hook: `src/services/sync/SyncAdapter.ts` (no-op implementation in v1)

### Sub-Hour Bricks

- **Included in MVP** — user requested fractional bricks
- `bricksEarned = completedMs / 3_600_000` (1.0 = 1 hour)
- Visual: fractional bricks render at proportional width in grid cell
- Setting: `fractionalBricksEnabled` (default `true`)

---

## Already In MVP (moved from "later")

- Streak reward labels on bricks
- Session-complete animation
- Bird's-eye Life Map
- Tap brick → session info
- Unlock celebration (confetti + sound)
- Ambient sounds during timer
- Stats dashboard
- Custom user-created categories
- Miniature temptation categories
- Strict + Soft focus modes (no Gentle)

---

*Last updated: 2026-07-02*
