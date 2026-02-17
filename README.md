# TypeAssist — Virtual Typing Tool

A desktop application that types preloaded text into **any input field** on your system — including paste-restricted fields. Uses OS-level keystroke simulation via Electron + robotjs.

---

## How It Works

1. Paste your text into the app
2. Click on any input field in any application (browser, form, chat, terminal)
3. Press the hotkey (default: **F9**)
4. TypeAssist sends real keystrokes character-by-character

The app uses `robotjs` to send actual keyboard events at the OS level, so it works everywhere — even where `Ctrl+V` paste is blocked.

---

## Setup

### Prerequisites
- **Node.js** 18+ (https://nodejs.org)
- **Python 3** (required by robotjs native build)
- **Windows**: Visual Studio Build Tools (`npm install -g windows-build-tools`)
- **macOS**: Xcode Command Line Tools (`xcode-select --install`)
- **Linux**: `sudo apt install libxtst-dev libpng++-dev`

### Install

```bash
# Clone or download this folder, then:
cd typeassist
npm install
```

### Run in Development

```bash
npm start
```

### Build Distributable

```bash
# Windows
npm run build

# macOS
npm run build:mac

# Linux
npm run build:linux
```

Output goes to the `dist/` folder.

---

## Features

| Feature | Description |
|---------|-------------|
| **Global Hotkey** | Press F9 (customizable) from any app to trigger typing |
| **Speed Control** | Slow (~50 WPM), Normal (~100 WPM), Fast (~240 WPM), Instant (~600 WPM) |
| **Start Delay** | 0–10 second countdown to switch to your target app |
| **System Tray** | Runs in background; close button minimizes to tray |
| **Cancel Anytime** | Press ESC to stop mid-typing |
| **History** | Tracks your 10 most recent typing sessions |

---

## Architecture

```
typeassist/
├── main.js          # Electron main process (window, tray, hotkeys, robotjs typing)
├── preload.js       # Secure IPC bridge (contextIsolation)
├── index.html       # Full UI (HTML + CSS + JS, no framework needed)
├── package.json     # Dependencies & build config
└── README.md
```

### Key Design Decisions

- **Frameless window** with custom titlebar for a clean look
- **contextIsolation: true** — renderer never touches Node directly
- **robotjs in main process** — typing happens server-side, UI stays responsive
- **Global shortcuts** via Electron's `globalShortcut` module
- **Countdown timer** gives you time to alt-tab to the target field

---

## Troubleshooting

### robotjs won't install
robotjs requires native compilation. Make sure you have:
- Windows: `npm install -g windows-build-tools` (run as admin)
- macOS: `xcode-select --install`
- Linux: `sudo apt install libxtst-dev libpng++-dev build-essential`

### Keystrokes not working
- **macOS**: Grant Accessibility permissions in System Preferences → Security & Privacy → Accessibility
- **Linux**: May need `xdotool` or X11 permissions
- **Windows**: Some admin-elevated windows may block simulated input

### Antivirus flagging
Unsigned Electron apps can trigger antivirus. For distribution, sign your app with a code signing certificate.

---

## Notes

- This tool sends **real OS keystrokes** — it's not clipboard-based
- Works with any application: browsers, forms, chat apps, terminals, IDEs
- Some ultra-secure environments (banking apps, exam software) may still block simulated input
- For production use, consider code signing and adding auto-update support
