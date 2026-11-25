# Top-Down Arena Shooter (Next.js, Electron & Android)

A fast-paced 2D top-down arena survival game built with **Next.js 16**, **React 19**, **HTML5 Canvas**, **Tailwind CSS**, and the **Web Audio API**. It can be run in the browser, as a standalone Windows desktop executable (`.exe`), or on **Android** (`.apk`) via **Capacitor**.

---

## 🎮 Play Options

### Option 1: Android APK
1. Download the latest `app-debug.apk` from the repository's **GitHub Releases** (`latest-apk` tag), built automatically via GitHub Actions.
2. Transfer/open the `.apk` on your Android device and allow installing from unknown sources if prompted.

### Option 2: Run the Standalone Windows Executable (.exe)
1. Open the folder: `dist/win-unpacked/`
2. Run **`Cyberstorm Neon Survivor.exe`**
3. Or double-click **`Launch Game.bat`** in the project root folder.

### Option 3: Run in Web Browser
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) (or `http://localhost:3001`) in your browser.

---

## 🕹️ Controls

| Action | Key / Input |
|---|---|
| **Move** | `W`, `A`, `S`, `D` or Arrow Keys |
| **Aim** | Mouse Cursor |
| **Shoot** | Left Click / Hold |
| **Dash (Invulnerability)** | `Space` or `Shift` |
| **Reload** | `R` (auto-reloads when empty) |
| **Switch Weapons** | Keys `1` to `5` or Mouse Wheel |
| **Pause Menu** | `Esc` or `P` |

---

## 🚀 Features

- **60+ FPS Canvas Engine**: The physics and rendering loop uses `requestAnimationFrame` and mutable references to prevent unnecessary React re-renders.
- **5 Weapons**: Pulse Blaster (infinite ammo), Scatter Cannon (shotgun), Vortex Carbine (assault rifle), Nova Launcher (explosive AoE), and Quasar Railgun (piercing laser).
- **Procedural Audio**: Zero external audio files required. Sound effects and synth background music are generated dynamically using the browser Web Audio API.
- **Enemy Varieties & Waves**: Fast crawlers, agile stalkers, ranged spitters, armored brutes, and wave bosses with radial bullet patterns.
- **Shield & Dash Mechanics**: Regenerating energy shields and tactical dash with temporary invulnerability.
- **Upgrades System**: Level up to choose from randomized stat perks.
- **High Score Tracking**: Stores best runs in `localStorage`.

---

## 📦 Project Structure

```
├── app/
│   ├── globals.css       # Tailwind CSS styles and reset
│   ├── layout.tsx        # Root HTML layout and font setup
│   └── page.tsx          # Main orchestrator component
├── components/
│   ├── GameCanvas.tsx     # Canvas rendering and game physics loop
│   ├── HUD.tsx            # Health, shield, ammo, and score overlay
│   ├── MobileControls.tsx # Touch joysticks and action buttons for Android/mobile
│   ├── StartScreen.tsx    # Title screen and controls overview
│   ├── UpgradeModal.tsx   # Level-up perk selection dialog
│   ├── PauseModal.tsx     # Settings and options modal
│   └── GameOverModal.tsx  # End game statistics and restart
├── android/               # Capacitor Android native project
├── .github/workflows/
│   └── build-apk.yml      # GitHub Actions workflow to build & release debug APK
├── electron/
│   └── main.js            # Desktop window runner with embedded local server
├── lib/
│   ├── audio.ts           # Web Audio API sound synthesizer
│   ├── weapons.ts         # Weapon configuration and damage stats
│   └── upgrades.ts        # Perk options and stat upgrade effects
├── types/
│   └── game.ts            # TypeScript interfaces and types
├── capacitor.config.ts    # Capacitor configuration (webDir: out)
├── Launch Game.bat        # Quick-launch batch file for Windows
├── next.config.ts         # Next.js export configuration
└── package.json           # Dependencies and scripts
```

---

## 📱 Building the Android APK

### Automated (GitHub Actions)
Pushing to `main` (or triggering the workflow manually) runs `.github/workflows/build-apk.yml`, which builds `app-debug.apk` and publishes it to **GitHub Releases** (`latest-apk`) and workflow artifacts.

### Local CLI Build (JDK 21 + Android SDK)
Requires **JDK 21** and **Android SDK** (`platform-tools`, `platforms;android-36`, `build-tools;36.0.0`) with `android/local.properties` pointing to your SDK directory:

```bash
npm run cap:sync
cd android
.\gradlew.bat assembleDebug
```

The APK will be generated at `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## 🛠️ Building the Standalone .exe

To rebuild the Windows application from source:

```bash
npm run build
npx electron-builder --win --dir
```

Output files will be generated in `dist/win-unpacked/`.

---

## 📄 License

MIT
