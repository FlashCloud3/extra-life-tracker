# Running Extra Life Tracker Locally in Static / GitHub Pages Mode

This guide explains how to run the **Extra Life Donation Tracker** on your local computer exactly as it behaves when hosted on **GitHub Pages** (pure client-side static mode, without running the Node.js backend server).

---

## 📖 Overview

The tracker is engineered with a **dual-architecture design**:
1. **Full-Stack Mode:** Runs via `node server.js` using Express, Socket.IO, and a Twitch IRC bot.
2. **Static / GitHub Pages Mode:** Runs 100% in the browser. It polls the DonorDrive API directly via client-side `fetch()`, syncs between the dashboard and OBS overlays via the browser's native `BroadcastChannel` API, and persists all configuration in `localStorage`.

Running locally like GitHub Pages allows you to:
- Test your stream setup and overlays locally without pushing to GitHub.
- Stream without running a background Node.js server.
- Verify how the client handles CORS, API polling, and `BroadcastChannel` synchronization before deploying.

---

## ⚠️ Important: Why You Need a Local HTTP Server

You **cannot** simply double-click `index.html` or open `file:///C:/path/to/index.html` in your browser.

Modern browsers enforce strict security policies (CORS) that block ES Module imports (`import ... from '...'`) and Babel script execution over the `file://` protocol. You must serve the directory over HTTP (e.g., `http://localhost:8080`).

---

## 🚀 Step-by-Step: How to Launch Locally

Choose any of the quick methods below to launch a lightweight static web server in the project directory:

### Method 1: Using Python (Recommended - No Extra Tools Needed)

Python is pre-installed on most operating systems (macOS, Linux) and readily available on Windows.

1. Open your terminal or Command Prompt.
2. Navigate to your project folder:
   ```bash
   cd /path/to/extralife-tracker
   ```
3. Run Python's built-in web server:
   ```bash
   # Python 3
   python3 -m http.server 8080

   # Or if python3 is aliased as python:
   python -m http.server 8080
   ```
4. Open your browser and visit:
   ```
   http://localhost:8080
   ```

---

### Method 2: Using Node.js (`npx serve`)

If you have Node.js installed, you can use `npx` to run a static server without installing any packages globally:

1. Open your terminal in the project directory.
2. Run:
   ```bash
   npx serve . -l 8080
   ```
3. Open your browser and visit:
   ```
   http://localhost:8080
   ```

*(Alternative Node server: `npx http-server -p 8080`)*

---

### Method 3: Using VS Code "Live Server" Extension

If you use Visual Studio Code:

1. Install the **Live Server** extension (by Ritwick Dey) from the VS Code Extensions Marketplace (`Ctrl+Shift+X` or `Cmd+Shift+X`).
2. Open the project folder in VS Code.
3. Right-click `index.html` in the file explorer and select **"Open with Live Server"**.
4. VS Code will automatically start a local server and open your default browser (typically at `http://127.0.0.1:5500`).

---

### Method 4: Using PHP (Built-in Server)

If you have PHP installed:

1. Open your terminal in the project directory.
2. Run:
   ```bash
   php -S localhost:8080
   ```
3. Open your browser and visit:
   ```
   http://localhost:8080
   ```

---

## 🖥️ How Static / GitHub Pages Mode Operates

Once loaded through any local HTTP server:

1. **Automatic Standalone Detection:**
   The tracker detects that there is no active Socket.IO connection to `server.js`. The top-right status badge will show:
   ```
   Standalone Client (In-Browser)
   ```
   This confirms the app is executing in the exact same standalone mode used on GitHub Pages.

2. **Master Sync Node (Keep Dashboard Open):**
   In static mode, your dashboard browser tab acts as the master controller.
   - It executes periodic `fetch()` requests to the DonorDrive API (`https://www.extra-life.org/api/participants/...`).
   - It checks for incoming donations and goal milestones.
   - It broadcasts events to your OBS overlays using the browser's native `new BroadcastChannel('extralife_sync')`.
   > **Crucial Rule:** While streaming in static mode, **keep the dashboard tab open** in a browser window so it can continue polling and feeding data to your overlays.

3. **Data Persistence (`localStorage`):**
   - Configurations and custom themes are saved to your browser's `localStorage`.
   - To back up or transfer your setup, scroll to the **Profile Backup** section at the bottom of the settings and click **Export Settings (JSON)**.

---

## 🎥 Adding Local Static Overlays to OBS Studio

When running locally in static mode, add browser sources to OBS using your local static server URL:

1. In OBS Studio, add a new **Browser Source** in your Scene.
2. In the **URL** field, use your local static server address with the `overlay` parameter:
   - **Progress Bar:** `http://localhost:8080/?overlay=progress&profile=YOUR_PARTICIPANT_ID`
   - **Toast Alerts:** `http://localhost:8080/?overlay=notifications&profile=YOUR_PARTICIPANT_ID`
   - **Next Milestone:** `http://localhost:8080/?overlay=milestone&profile=YOUR_PARTICIPANT_ID`
   - **Team Tracker:** `http://localhost:8080/?overlay=team&profile=YOUR_PARTICIPANT_ID`
   - **Celebration Confetti:** `http://localhost:8080/?overlay=celebration&profile=YOUR_PARTICIPANT_ID`
   - **Stream Schedule:** `http://localhost:8080/?overlay=schedule&profile=YOUR_PARTICIPANT_ID`
   - **Sponsors Carousel:** `http://localhost:8080/?overlay=sponsors&profile=YOUR_PARTICIPANT_ID`
   - **Text Display:** `http://localhost:8080/?overlay=text&profile=YOUR_PARTICIPANT_ID`
   - **QR Code Card:** `http://localhost:8080/?overlay=qrcode&profile=YOUR_PARTICIPANT_ID`

3. **Recommended OBS Browser Source Settings:**
   - **Width / Height:** Match the dimensions listed in the dashboard's "Overlay Links" table (e.g., 600x120 for Progress Bar, 1920x1080 for Confetti).
   - **Shutdown source when not visible:** **Unchecked** (keeps the overlay listening to the `BroadcastChannel`).
   - **Refresh browser when scene becomes active:** **Unchecked**.

---

## 🎛️ OBS Custom Browser Dock: Real-Time Sync & Testing in Static Mode

When running on GitHub Pages (or a local static HTTP server without `server.js`):
* External desktop browsers (such as Google Chrome) and OBS Browser Sources run in **separate process sandboxes and user profiles**.
* Because of this OS/browser isolation, native `BroadcastChannel` events cannot cross between Chrome and OBS Studio.

### The Solution: Embed the Dashboard Inside OBS

By adding your dashboard as an **OBS Custom Browser Dock**, the dashboard runs within the **exact same Chromium Embedded Framework (CEF) process** as your browser source overlays. Native `BroadcastChannel` communication works instantly!

#### Setup Steps:
1. Open OBS Studio.
2. In the top menu, click **Docks** > **Custom Browser Docks...**
3. In the dialog:
   * **Dock Name:** `Extra Life Control`
   * **URL:** Your dashboard URL (e.g. `https://<username>.github.io/<repo>/?profile=YOUR_PARTICIPANT_ID` or `http://localhost:8080/?profile=YOUR_ID` for local static mode)
4. Click **Apply**, then **Close**.
5. The Extra Life dashboard will open directly inside OBS. You can snap it into your OBS interface (alongside your Scenes, Audio Mixer, or Twitch Chat) or pop it out to a second monitor.
6. **Instant Testing:** Click **"Test Donation (+15$)"**, **"Clear Overlays"**, or update themes/settings inside the dock — all OBS overlays will update immediately in real time!

> **Real Donations Note:** Viewers' real donations from your Extra Life page do **not** rely on the dock or browser tab; each OBS overlay independently queries DonorDrive's API directly. The Custom Browser Dock is specifically for manual control, test alerts, and live settings synchronization.

---

## ⚖️ Feature Comparison: Static (GitHub Pages) vs. Backend Mode

| Feature | Static / GitHub Pages Mode (Local or Hosted) | Full-Stack Node Mode (`npm start`) |
| :--- | :--- | :--- |
| **Server Requirements** | None (Any static web server or GitHub Pages) | Node.js runtime required (`node server.js`) |
| **Data Fetching** | Client-side `fetch()` directly to Extra Life API | Server polls API every 15s and caches data |
| **OBS Overlay Sync** | Browser `BroadcastChannel` (same machine / browser context) | WebSockets / Socket.IO (works across local network & multiple PCs) |
| **Dashboard Requirement** | **Must keep dashboard tab open** while streaming | Dashboard can be closed; server handles syncing |
| **Configuration Storage** | Browser `localStorage` (exportable via JSON backup) | `db.json` file on your hard drive |
| **Twitch Chat Bot (`tmi.js`)** | Disabled (browsers cannot host IRC bot connections) | Enabled (announces donations & replies to `!total`, `!goal`) |
| **Custom Audio & Themes** | Fully supported (saved in browser storage) | Fully supported |
