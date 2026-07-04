# Life's Castle

A focus timer where concentration bakes bricks, daily structures seal at end of day, and long-term progress builds from walls to castles — per life category.

## Requirements

- **Node.js 20.19+** (required by Expo 54) — project includes `.nvmrc` → `20.19.4`
- npm
- **Expo Go** on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

## Setup (first time)

```bash
cd WallIdea

# Use Node 20 (required — system Node 16 will fail)
nvm install    # reads .nvmrc → Node 20
nvm use

npm install
```

## Run on your computer (browser preview)

```bash
nvm use
npm start
```

Open **http://localhost:8081** in your browser. This runs a **web preview** (localStorage database, no Skia). It is useful for quick testing; the full experience is on your phone via Expo Go.

## Run on your phone (recommended)

### Option A — Same Wi‑Fi (easiest)

1. Install **Expo Go** on your phone.
2. Connect phone and computer to the **same Wi‑Fi**.
3. In the project folder, run `npm start`.
4. In the terminal, press **`s`** to switch to Expo Go if needed.
5. **Android:** Scan the QR code shown in the terminal with the Expo Go app.
6. **iPhone:** Open the **Camera** app, scan the QR code, tap the Expo link (or scan from inside Expo Go).

### Option B — Different network (tunnel)

If your phone is not on the same network as your PC:

```bash
npx expo start --tunnel
```

Scan the QR code with Expo Go. Tunnel is slower but works across networks.

### Option C — USB (Android)

```bash
npx expo start --android
```

Requires Android Studio / emulator or a USB‑connected device with USB debugging enabled.

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npm run start:tunnel` | Start with tunnel (phone on different Wi‑Fi) |
| `npm test` | Run progression unit tests (14 tests) |
| `npm run typecheck` | TypeScript check |

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `ReadableStream is not defined` | You're on Node 16. Run `nvm use` (needs 20.19.4). |
| `Expo Go` SDK mismatch | Project is now **Expo SDK 54** — update Expo Go from the app store. |
| `npm error Invalid or unexpected token` with `npx` | Broken npm — use `npm run start:tunnel` instead of `npx expo start --tunnel`. |
| `expo-asset cannot be found` | Run `npx expo install expo-asset` or `npm install` again. |
| Browser shows errors / blank screen | Hard-refresh (Ctrl+Shift+R). Web uses fallbacks in `*.web.tsx` files. |
| Phone can't connect | Try `npx expo start --tunnel` or check firewall allows port 8081. |
| Skia / native module errors | Use **Expo Go** (not a custom dev build) for now. |

## Documentation

| Doc | Description |
|-----|-------------|
| [docs/PROJECT.md](docs/PROJECT.md) | Overview |
| [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md) | Full game mechanics |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Tech stack & data models |
| [docs/GRAPHICS.md](docs/GRAPHICS.md) | 2D vs 3D decision |
| [docs/FUTURE_FEATURES.md](docs/FUTURE_FEATURES.md) | Deferred features & flags |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Implementation phases |
| [docs/AGENT_MEMORY.md](docs/AGENT_MEMORY.md) | AI continuation context |

## Current Status

**v0.1** — 3D Life Map, focus timer, bricks, monuments, daily seal, building detail, stats, settings. Standalone Android APK via EAS Build.

## Build APK (v0.1)

Requires a free [Expo](https://expo.dev) account.

```bash
nvm use
npm install -g eas-cli   # once
eas login                # once
npm run build:apk        # cloud build → download .apk from Expo dashboard
```

Local build without EAS (Gradle on your machine):

```bash
nvm use
npm run prebuild:android   # once, generates android/
npm run build:apk:gradle   # → LifesCastle-v0.1.apk
```

Prerequisites: Android SDK at `~/Android/Sdk` (platform 35, build-tools 35, NDK 27, CMake 3.22.1), and a full JDK 17 with `javac` (not JRE-only). The build script uses Aliyun Maven mirrors when Google repos are blocked.

EAS local build (alternative):

```bash
npm run build:apk:local
```

The APK installs like any Android app (enable “Install unknown apps” if sideloading).
