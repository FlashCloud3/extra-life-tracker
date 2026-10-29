# Extra Life Tracker - Application Options & Detailed Settings Reference

> 🇫🇷 **Version française disponible :** Voir [`APP_OPTIONS_FR.md`](./APP_OPTIONS_FR.md) et [`README_FR.md`](./README_FR.md)


This document provides a comprehensive guide to all navigation views, configuration settings, OBS overlay sources, asset folders, and API endpoints.

---

## 🧭 Navigation Views

The top navigation bar provides three primary views:

1. **👤 Participant Dashboard:**
   - Real-time fundraising stats: Total Raised, Goal, Progress Bar, Marathon Elapsed/Countdown Timer.
   - **📈 Annual Fundraising Progress & Milestones Graph (Collapsible, Collapsed by Default):** Interactive chart displaying cumulative fundraising curves throughout the campaign year, horizontal milestone and goal threshold lines (color-coded for achieved vs upcoming targets), milestone hit celebratory pins (🏆) marking the exact donation date and donor that unlocked each incentive, plus toggleable **Cumulative Growth** vs **Monthly Breakdown** views.
   - Recent donations list and milestone achievements.
   - Live stream controls: **Test Donation (+$15)**, **Resync Data**, and **Clear & Stop All**.
   - Overlay links cards for all participant overlays with one-click **Copy Link** and **Open Popup** preview buttons.

2. **👥 Team Dashboard:**
   - Full team fundraising progress bar, total raised, goal, and donor count.
   - **📈 Team & Member Annual Progress Graph (Collapsible, Collapsed by Default):** Interactive annual progress graph with seamless toggling between **Entire Team Progress** (macro team cumulative line & team goal milestones) and **Selected Member Progress** (individual member curve with personal milestones).
   - Interactive roster list of all team members with their individual totals and fundraising goals.
   - **Recent Team Donations Feed:** Automatically ordered with the **most recent donations first** across all team members, with search and donor filtering.
   - Team member inspection: Click any team participant to view their personal donations and progress.
   - Quick links and popup previews for Team Header, Team Donations feed, and full Team Dashboard overlays.

3. **⚙️ Settings (Full-Page View):**
   - Clean, full-page dedicated view containing all configuration sections without cluttering the live stream dashboard.
   - Organized into collapsible panels described below.

---

## ⚙️ Settings Reference Guide

### 1. Core Setup & Identification
Located under **Core Setup**:
* **Language:** Switch the entire UI dynamically between **English (`en`)** and **French (`fr`)**. All translations are defined in `translations.js`.
* **Participant ID:** Your unique Extra Life numeric ID (e.g. `534123` from your fundraising page URL `extra-life.org/participant/534123`).
* **Auto-detect Team ID:** Automatically queries DonorDrive to find and link the team your participant belongs to.
* **Team ID:** Manually set your Extra Life Team ID if you want to track a team independently.
* **Refresh Interval (seconds):** How frequently the app polls the Extra Life API for new data (minimum 15s; 60s recommended).
* **Currency Mode:**
  * **USD ($):** Standard Extra Life currency.
  * **CAD (C$):** Automatically fetches live exchange rates, or allows custom fixed rate calculation based on your Extra Life Canadian page total.

### 2. Event & Timing
* **Event Start Time:** Set the date and time for your marathon.
  * *Effect:* Displays a countdown timer ("Starts in...") prior to start, and an elapsed timer ("Time Elapsed...") once started on both dashboard and progress bar overlays.
* **Celebration Duration (seconds):** Duration of the confetti celebration burst when goals or milestones are reached.

### 3. Twitch Integration & Live Status
* **Status Badge & Diagnostics:**
  * Persistent live status indicator in both top navigation and Settings:
    - 🟢 **Connected (`#channel`):** Active WebSocket connection to Twitch IRC.
    - 🟡 **Connecting:** Reconnecting or negotiating IRC handshake.
    - 🔴 **Error:** Authentication or connection error with detail tooltip and **Reconnect** button.
    - ⚪ **Disabled / Needs Config:** Integration switched off or credentials needed.
  * Diagnostics: Displays handled command count, alerts sent count, and last activity timestamp.
  * **Send Test Message:** Sends a verification message to your channel to confirm chat write permissions.
* **Enable Twitch Integration:** Master toggle for the Twitch chat bot.
* **Twitch Channel:** Your Twitch username in lowercase.
* **Twitch OAuth Token:** Token with `chat:read` and `chat:edit` scopes. Click **Get OAuth Token** for automatic authorization.
* **Enable Chat Alerts:** Automatically posts a chat alert when a donation arrives.
* **Enable Chat Commands:** Responds to built-in viewer commands (`!total`, `!goal`, `!milestone`).
* **Custom Commands:** Create your own viewer commands (e.g., `!donate`, `!schedule`, `!guild`) with custom reply messages.

### 4. Themes & Visual Customization
* **Visual Presets:**
  * **Neon Vibe** (Default retro cyan/magenta aesthetic)
  * **Solarized Dark** (Muted blue/teal palette)
  * **Hacker Green** (CRT terminal phosphor green)
  * **Synthwave** (80s retrowave purple/pink)
  * **Final Fantasy** (Classic Blue & White window frame)
  * **Final Fantasy XIV** (Dark Grey, Gold & Aether Blue)
  * **Dwarf Fortress** (Dark stone & Magma Red)
* **Pixel Fonts & Typography:** Press Start 2P, Bungee, Roboto Mono, VT323, Cinzel.
* **Notification Animations:** Slide In, Fade In, Bounce In, Zoom In.
* **Custom Color Overrides:** Override background, panel, text, borders, headers, primary buttons, secondary buttons, success, and error colors.

### 5. Sound & Audio Settings
* **Enable Sound:** Master toggle for all audio alerts.
* **Master Volume:** Volume slider from 0% to 100%.
* **Donation Sound:** Choose between built-in 8-bit coin, uploaded files, or sounds from `/sounds/`.
* **Milestone Sound:** Choose between built-in fanfare, uploaded files, or sounds from `/sounds/`.
* **Sound Library & App Folder (`/sounds`):**
  * Upload custom `.mp3`, `.wav`, or `.ogg` files (up to 2MB).
  * **`/sounds` Folder:** Drop audio files into the project's `/sounds` folder to have them automatically appear in dropdowns. Includes 5 starter sounds: `chime.wav`, `bell.wav`, `fanfare.wav`, `coin.wav`, `alert.wav`.

### 6. QR Code Overlay Settings
* **Custom URL:** Defaults to your Extra Life participant page, or enter any custom URL.
* **Label / Call to Action:** Text displayed above the QR code (e.g., "Scan to Donate!").
* **Color & Size:** Adjust QR size, background color, and frame colors to match your layout.

### 7. Marathon Schedule
* **Add Block:** Enter time (e.g. `10:00 AM`) and game/activity description.
* **Live Check-off:** Mark items as "Done" on the dashboard to cross them out in real-time on stream overlays.
* **Reorder / Delete:** Manage schedule items.

### 8. Sponsors Carousel
* **Slide Duration:** Number of seconds each sponsor banner remains visible.
* **Adding Sponsors:**
  - **Upload Image:** Select a local image from your device.
  - **Paste Image URL:** Provide any direct HTTPS image link.
  - **`/sponsors` Folder:** Drop images into `/sponsors/` (supports `.svg`, `.png`, `.jpg`, `.webp`, `.gif`). Includes 5 starter sponsor banners (`sponsor-sample-gold.svg`, `silver`, `energy`, `community`, `extra-life`).

### 9. Text Display Overlay
* **Source Options:**
  - **Direct Text Input:** Type custom announcements, rules, or messages directly in Settings.
  - **Local File (`/text_files`):** Automatically reads and live-reloads any `.txt` file placed in `/text_files`.
  - **Remote URL:** Fetches text from any raw URL periodically.
* **Formatting:** Configure font size, text alignment (top-left, center, bottom-right, etc.).

### 10. Milestones & Incentives
* Add fundraising targets with amounts and descriptions (e.g. `$500 - Bean Boozled Challenge`).
* Automatically feeds the **Next Milestone** overlay and Twitch `!milestone` command.

### 11. Profile Backup & Multiple Users
* **Participant ID Switching:** Switch between different streamers via `?profile=PARTICIPANT_ID`. Each ID maintains isolated settings.
* **Export Settings:** Exports current profile settings as a downloadable `.json` file.
* **Import Settings:** Restores an exported `.json` configuration file.

---

## 🎥 OBS Overlay Browser Sources

| Overlay | Parameter | Dimensions | Description |
| :--- | :--- | :--- | :--- |
| **Progress Bar** | `?overlay=progress` | 800 × 120 | Horizontal bar with current total, goal, and marathon timer. |
| **Notifications** | `?overlay=notifications` | 500 × 200 | Pop-up toast alert queue for new donations with animations and sound. |
| **Next Milestone** | `?overlay=milestone` | 600 × 100 | Progress bar and remaining amount toward the upcoming milestone. |
| **Annual Progress Graph** | `?overlay=graph` | 880 × 420 | Full annual campaign cumulative fundraising graph and milestone thresholds. |
| **Team Progress Graph** | `?overlay=team-graph` | 880 × 420 | Annual progress graph for the whole team or selected member. |
| **Team Header** | `?overlay=team-header` | 850 × 220 | Horizontal team banner with total raised, goal, and donor count. |
| **Team Donations** | `?overlay=team-donations` | 500 × 750 | Dedicated list showing the **most recent team donations first**. |
| **Team Dashboard** | `?overlay=team-dashboard` | 1280 × 850 | Full-screen command center with team stats, full roster, and donations feed. |
| **Celebration** | `?overlay=celebration` | 1920 × 1080 | Full-screen confetti effect triggered by goals and milestones. |
| **Schedule** | `?overlay=schedule` | 450 × 600 | Marathon schedule list; items marked "Done" are crossed out live. |
| **Sponsors** | `?overlay=sponsors` | 400 × 150 | Rotating slideshow for stream sponsor banners. |
| **Text Display** | `?overlay=text` | 600 × 150 | Custom message, local `.txt` file, or remote text stream banner. |
| **QR Code** | `?overlay=qrcode` | 260 × 320 | Retro scan-to-donate QR code badge. |

### 🎛️ OBS Custom Browser Dock (Recommended for GitHub Pages)
When hosting the dashboard on GitHub Pages (static mode without a local `server.js`), external browsers (Chrome) and OBS Browser Sources run in separate process sandboxes and cannot exchange `BroadcastChannel` messages.
* **Setup:** In OBS Studio, open **Docks** > **Custom Browser Docks...**, name the dock `Extra Life Control`, and set the URL to:
  `https://<your-username>.github.io/<repo-name>/?profile=YOUR_PARTICIPANT_ID`
* **Result:** The dashboard runs directly inside OBS in the same CEF process as all browser sources. The **"Test Donation"** button, emergency clear, and live setting changes trigger all OBS overlays in real time!
* *Note:* Real donations from viewers poll DonorDrive independently in each overlay and do not require Chrome or the dock to be open.

---

## 🔌 Local Automation API (Stream Deck / HTTP Endpoints)

When running the local server (`npm start`), control the tracker using HTTP POST requests:

* **Change Theme:** `POST http://localhost:3000/api/theme`
  * Body: `{"name": "synthwave", "profile": "534123"}`
* **Stop All Sounds & Alerts:** `POST http://localhost:3000/api/stop-events`
  * Body: `{"profile": "534123"}`
* **Test Donation:** `POST http://localhost:3000/api/test-donation`
  * Body: `{"amount": 15, "profile": "534123"}`
* **List Sponsors / Sounds:**
  * `GET http://localhost:3000/api/list-sponsors`
  * `GET http://localhost:3000/api/list-sounds`
