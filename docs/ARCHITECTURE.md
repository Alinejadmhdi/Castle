# Life's Castle — Technical Architecture

## Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | **Expo SDK 52+** | Cross-platform, OTA |
| Language | **TypeScript** | Typed brick/building models |
| Navigation | **Expo Router** | File-based routes |
| State | **Zustand** | Timer, categories, UI |
| Persistence | **expo-sqlite** | Brick history, queries |
| Animation | **react-native-reanimated** | Timer, brick fly-in, confetti |
| Graphics | **@shopify/react-native-skia** | 2D isometric plot (MVP) |
| Audio | **expo-av** | Ambient loops, SFX |
| Haptics | **expo-haptics** | Stage unlock feedback |
| Testing | **Jest** | Progression math unit tests |

3D upgrade path: `@react-three/fiber/native` behind `VIEW_MODE_3D` flag — see `docs/GRAPHICS.md`.

---

## Folder Structure

```
WallIdea/
├── docs/
├── assets/images, fonts, sounds/
├── src/
│   ├── app/                    # Expo Router screens
│   │   ├── (tabs)/             # Life Map, Stats, Settings
│   │   ├── category/[id].tsx
│   │   ├── session/new.tsx, active.tsx, complete.tsx
│   │   ├── building/[id].tsx
│   │   ├── miniature/log.tsx
│   │   └── _layout.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── brick/              # BrickTile, StreakBadge, BrickPopover
│   │   ├── wall/
│   │   ├── building/             # BuildingSprite, CompoundLink
│   │   ├── timer/
│   │   ├── map/                  # LifeMapBirdEye, SettlementPlot
│   │   ├── celebration/        # Confetti, UnlockOverlay
│   │   └── audio/                # AmbientPlayer
│   ├── features/
│   │   ├── timer/
│   │   ├── bricks/
│   │   ├── categories/           # User CRUD only
│   │   ├── buildings/
│   │   ├── progression/          # Stages, daily, compound logic
│   │   ├── streaks/
│   │   ├── stats/
│   │   └── miniature/
│   ├── store/
│   ├── services/
│   │   ├── database/
│   │   ├── audio/
│   │   ├── sync/                 # No-op stub for future cloud
│   │   └── social/               # No-op stub for future
│   ├── constants/
│   │   ├── buildings.ts
│   │   ├── dailyBuildings.ts
│   │   ├── compoundBuildings.ts
│   │   ├── miniatureBuildings.ts
│   │   ├── streakRewards.ts
│   │   ├── featureFlags.ts
│   │   └── theme.ts
│   ├── types/
│   ├── utils/
│   └── hooks/
├── app.json, package.json, tsconfig.json
└── README.md
```

---

## Data Models

### Category

```typescript
interface Category {
  id: string;
  name: string;
  defaultColor: string;
  icon: string;
  type: 'standard' | 'miniature';
  sortOrder: number;
  isHidden: boolean;
  totalBrickValue: number;      // fractional sum
  currentStageIndex: number;
  currentStreak: number;
  longestStreak: number;
  createdAt: string;
}
```

### Brick

```typescript
interface Brick {
  id: string;
  categoryId: string;
  color: string;
  sessionId: string | null;     // null for miniature resist logs
  fractionalValue: number;      // 0.417 = 25 min
  globalIndex: number;
  stageIndex: number;
  positionInStage: number;
  dailyBuildId: string | null;
  buildingInstanceId: string | null;
  gridX: number;
  gridY: number;
  streakRewardLabel: number | null;  // 3, 7, 14, 30...
  completedAt: string;
  isMiniature: boolean;
}
```

### FocusSession

```typescript
type FocusMode = 'strict' | 'soft';

interface FocusSession {
  id: string;
  categoryId: string;
  brickColor: string;
  plannedDurationMs: number;
  elapsedMs: number;
  startedAt: string;
  endedAt: string | null;
  status: 'active' | 'completed' | 'abandoned' | 'paused';
  pauseCount: number;
  bricksEarned: number;
}
```

### BuildingInstance (plotted structure)

```typescript
interface BuildingInstance {
  id: string;
  categoryId: string;
  kind: 'macro' | 'daily' | 'compound' | 'sub' | 'miniature';
  stageKey: string;
  name: string;
  brickIds: string[];
  totalBrickValue: number;
  plotX: number;
  plotY: number;
  scale: number;                // 1.0 standard, 0.4 miniature
  unlockedAt: string;
  parentCompoundId: string | null;
}
```

### DailyBuild (in-progress day)

```typescript
interface DailyBuild {
  id: string;
  categoryId: string;
  date: string;                 // YYYY-MM-DD
  brickValueToday: number;
  brickIds: string[];
  structureKey: string | null;  // set at day close
  sealed: boolean;
}
```

### UserSettings

```typescript
interface UserSettings {
  focusMode: 'strict' | 'soft';
  fractionalBricksEnabled: boolean;
  ambientSound: 'rain' | 'fire' | 'wind' | 'none';
  sfxEnabled: boolean;
  hapticsEnabled: boolean;
}
```

---

## Key Services

### `progressionService`

- `getMacroStage(brickValue)` → stage index
- `getDailyStructure(hoursToday)` → daily building key
- `getCompoundProgress(categoryId, stageIndex)` → sub-building slots
- `checkUnlocks(categoryId)` → new BuildingInstance[]
- `allocateBrick(brick)` → stage, daily, sub-building slot

### `streakService`

- `updateStreak(categoryId, date)` 
- `getRewardLabel(streakDay)` → number | null

### `brickService`

- `createFromSession(session)` → Brick[]
- `createMiniatureResist(categoryId)` → Brick

### `dailyBuildService`

- `addBrickToToday(categoryId, brick)`
- `sealDay(categoryId)` → BuildingInstance | null

### `renderService` (Skia)

- Implements `SettlementRenderer` interface (see GRAPHICS.md)
- Bird's-eye plot layout
- Tap hit-test → brick or building

### Stub services (future)

- `SyncAdapter` — no-op
- `SocialService` — no-op
- `CharityService` — no-op

---

## State Flow

```
Start session → timerStore
Complete → brickService.createFromSession()
        → dailyBuildService.addBrickToToday()
        → streakService.updateStreak()
        → progressionService.checkUnlocks()
        → if unlock → celebrationStore.trigger()
        → navigate session/complete (animation)
```

---

## Conventions

- IDs: `expo-crypto` randomUUID
- Dates: ISO 8601; day boundaries use device local timezone
- Colors: `#RRGGBB`
- Imports: `@/` → `src/`
- Feature flags: check before rendering deferred UI

---

*Last updated: 2026-07-02*
