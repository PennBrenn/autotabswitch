# FaceGuard Chrome Extension

Auto-switch tabs or show a warning overlay when an unknown face is detected via your webcam.

---

## Installation

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `faceguard` folder
5. The FaceGuard icon will appear in your toolbar

---

## First-Time Setup

### 1. Train Your Face
- Click the FaceGuard icon in the toolbar
- Go to the **Train** tab
- Click **Start Camera** (allow camera permission when prompted)
- Position your face clearly in frame
- Click **Capture** 5–10 times, varying your angle slightly each time
- Click **Save Profile**

### 2. Configure Settings
- **Response Mode**: Choose what happens when an unknown face is detected:
  - **Tab Switch** — navigates your active tab to the Decoy URL
  - **Warning** — shows a fullscreen warning overlay on the active page
  - **Both** — does both simultaneously
- **Check Interval** — how often the camera checks for faces (1–15 seconds)
- **Match Sensitivity** — how strictly your face must match; higher = stricter
- **Camera Brightness** — boost if you're in a dark environment
- **No-Face Action** — what to do when no face is detected at all (ignore or trigger)
- **Decoy URL** — the page to navigate to when triggered (default: `about:blank`)

### 3. Activate Protection
- Toggle the main switch in the popup
- A small monitor window will open (keep it running in the background)
- The status badge will change to **WATCHING** once ready

---

## Requirements

- **Internet connection** on first use — face recognition models (~5MB) load from jsDelivr CDN on startup
- Camera permission must be granted to the extension
- Works in Chrome (Manifest V2, developer/unpacked mode)

---

## How It Works

1. A background monitor window runs face-api.js with your webcam feed
2. Every N seconds, it captures a frame and detects all faces
3. Each detected face is compared to your stored face profile using a 128-dimensional face embedding
4. If a face doesn't match (distance > threshold), the configured action is triggered
5. All processing is **100% local** — no data leaves your device

---

## Troubleshooting

**"face-api.js failed to load"**  
Check your internet connection. The library loads from `cdn.jsdelivr.net` on first run.

**False positives (triggering when it's you)**  
Lower the sensitivity slider, or re-train with more varied captures.

**Camera permission denied**  
The monitor window needs camera access. When it first opens, click Allow in the permission prompt.

**Monitor window closed accidentally**  
Toggle protection off and back on in the popup to reopen it.
