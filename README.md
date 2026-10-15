<div align="center">
  <h1>🎮 Extra Life Donation Tracker & OBS Overlays</h1>
  <p><strong>A retro-styled live donation tracker, stream alerts system, and customizable OBS overlay suite for Extra Life & DonorDrive charity marathons.</strong></p>
  <p>Works both as a local full-stack Node.js app or completely serverless on <strong>GitHub Pages</strong>.</p>
  <p><a href="./README_FR.md">🇫🇷 Version Française</a> • <a href="./APP_OPTIONS.md">⚙️ Options Reference (EN)</a> • <a href="./APP_OPTIONS_FR.md">⚙️ Options (FR)</a></p>
</div>

---

## 🌟 Key Features

* **Real-Time Extra Life Sync:** Tracks your total raised, fundraising goal, latest donor, donation history, milestones, and team totals.
* **10 OBS Browser Source Overlays:**
  * **Progress Bar:** High-visibility fundraising bar with goal progress and marathon countdown/elapsed timer.
  * **Toast Notifications:** Retro pop-up alerts with animations and sound effects for incoming donations.
  * **Milestones:** Displays progress toward your next incentive or marathon milestone.
  * **Team Header Overlay:** Sleek horizontal banner with team fundraising progress, goal, and donor count.
  * **Team Donations Overlay:** Dedicated scrolling list showing the most recent team-wide donations across all roster members.
  * **Team Dashboard Overlay:** Full-screen team command center displaying team stats, participant roster, individual totals, and live donation feed.
  * **Confetti Celebration:** Full-screen celebratory confetti burst when hitting goals or milestones.
  * **Stream Schedule:** Interactive marathon schedule overlay that crosses off completed blocks in real-time.
  * **Sponsors Carousel:** Rotating banner display for stream sponsors and partners.
  * **Text Display:** Live text file or custom message reader for stream notes, rules, or custom banners.
  * **QR Code Overlay:** Scan-to-donate QR code badge with customizable participant URL, label, and direct donation link.
* **Full-Page Views:** Switch effortlessly between **Participant Dashboard**, **Team Dashboard**, and dedicated **Full-Page Settings** views.
* **Twitch Bot with Live Status Indicator:** Real-time visual status badge (Connected, Connecting, Error, Disabled) on both top bar and Settings panel with automated donation announcements and custom chat commands.
* **Built-in Starter Media Assets:** Includes 5 ready-to-use 16-bit sound effects in `/sounds` and 5 custom vector sponsor banners in `/sponsors`.
* **Server Fetch Status:** Real-time indicator showing the exact time data was last fetched from the server or API.
* **Multi-User Profiles:** Track multiple streamers or team members independently using their Participant ID (`?profile=ID`).
* **Profile Backup:** Export and import complete settings as JSON files for easy backup and cross-device migration.
* **Dual Currency Support (USD / CAD):** Automated live API exchange rate conversion or custom exchange rate calculation based on your Canadian Dollar page total.
* **Retro Themes & Typography:** Built-in themes (Neon Vibe, Synthwave, Hacker Green, Final Fantasy, FFXIV, Dwarf Fortress, Solarized) and retro pixel fonts (Press Start 2P, VT323, Bungee, Cinzel).
* **Bilingual UI & Modular Translations:** Instant toggle between English and French, with all strings cleanly separated in `translations.js`.
* **Zero-Install Static Mode:** Can run 100% in-browser on GitHub Pages without needing a backend server.

---

## 🚀 Quick Start

You can run the tracker either **online via GitHub Pages** (zero installation) or **locally on your computer using Node.js**.

### Option A: Running Online via GitHub Pages (Zero-Install)
1. Fork or push this repository to your GitHub account.
2. In your GitHub repository, go to **Settings** > **Pages**.
3. Under **Build and deployment** > **Source**, select **Deploy from a branch**.
4. Select the `main` (or `master`) branch and `/ (root)` directory, then click **Save**.
5. Once deployed, open your site at:
   ```
   https://<your-username>.github.io/<repo-name>/
   ```
> **Important Note for GitHub Pages:** Keep the main dashboard open in a browser tab on your computer while streaming. In static mode, the dashboard polls the DonorDrive API and synchronizes with your OBS overlays via the browser's native `BroadcastChannel` API.

---

### Option B: Running Locally with Full-Stack Node.js
**Prerequisites:** [Node.js](https://nodejs.org/) (version 18 or higher recommended).

1. **Clone the repository:**
   ```bash
   git clone https://github.com/<your-username>/<repo-name>.git
   cd <repo-name>
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Start the local server:**
   ```bash
   npm start
   ```
4. **Open the dashboard:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your web browser.

---

### Option C: Running Locally in Static / GitHub Pages Mode (Zero Backend)
If you want to run the app on your computer **without starting the Node.js Express server**, simulating the exact client-side environment of GitHub Pages:

1. **Start any local static server in the project folder:**
   ```bash
   # Option 1: Using Python 3
   python3 -m http.server 8080

   # Option 2: Using Node.js npx
   npx serve . -l 8080
   ```
2. **Open the dashboard:**
   Navigate to [http://localhost:8080](http://localhost:8080) (or your static server port).

---

## 🧭 Dashboard Views & Navigation

The dashboard offers three full-page views accessible from the top navigation bar:

1. **👤 Participant Dashboard:**
   - Real-time fundraising stats: Total Raised, Goal, Progress Bar, and Marathon Timer.
   - **📈 Annual Fundraising Progress & Milestones Graph (Collapsible, Collapsed by Default):** Interactive timeline tracking cumulative donations across the campaign year, with horizontal target lines for each milestone and campaign goal, celebratory markers (🏆) pinpointing the exact date and donation where each milestone was unlocked, and toggleable **Cumulative Growth** vs **Monthly Breakdown** views.
   - Recent donations list, milestone tracker, and quick action buttons (Test Donation, Manual Resync, Clear Overlays).
   - Quick-access OBS browser source links with one-click **Copy Link** and **Open Popup** preview buttons.

2. **👥 Team Dashboard:**
   - Full team fundraising progress bar, total raised, goal, and donor count.
   - **📈 Team & Member Annual Progress Graph (Collapsible, Collapsed by Default):** Interactive annual collection graph with one-click toggle between **Entire Team Progress** (macro team cumulative growth curve & team goal targets) and **Selected Member Progress** (individual member curve with personal milestones).
   - Interactive roster list of all team members with their individual totals and fundraising goals.
   - **Recent Team Donations List:** Automatically sorted with the **most recent donations first** across all team members, with search and donor filtering.
   - Member inspection: Click any team participant to inspect their personal donations and progress.
   - Dedicated team overlay links (Team Header, Team Donations feed, Team Full Dashboard).

3. **⚙️ Settings (Dedicated Full-Page View):**
   - Clean, full-page dedicated section for all app configuration without cluttering your live stream dashboard.
   - Grouped into collapsible, easy-to-read sections:
     - **Core Setup & Participant ID:** Language (EN/FR), Participant ID, Team ID, polling interval, and CAD currency conversion.
     - **Twitch Integration & Live Status:** Real-time connection badge, OAuth token generator, donation chat alerts, and custom chat commands.
     - **Appearance & Themes:** Theme presets, retro pixel fonts, notification animations, and custom HEX colors.
     - **Sounds & Audio Alerts:** Master volume, default 8-bit sounds, custom upload, and `/sounds` folder sound selector.
     - **QR Code Overlay:** Configurable scan-to-donate QR overlay with custom title, participant URL, and size.
     - **Marathon Schedule:** Add schedule items, reorder, and mark completed items in real-time.
     - **Sponsors Carousel:** Configure rotation slide duration, upload sponsor logos, or choose images from the `/sponsors` folder.
     - **Text Display Overlay:** Custom message, local `.txt` file reader, or remote text URL with custom typography and alignments.
     - **Milestones:** Custom fundraising goals and incentive target list.
     - **Profile Backup:** One-click JSON export and import for seamless backup and cross-device migration.

---

## 🟣 Twitch Chat Bot & Live Status

The tracker includes an integrated Twitch bot powered by `tmi.js` that works in **both** local server mode and standalone GitHub Pages mode.

### Live Connection Status Indicators:
- **Top Navigation Bar:** Displays a persistent Twitch status badge:
  - 🟢 **Connected (`#channel`):** Bot is connected to Twitch IRC and actively monitoring chat.
  - 🟡 **Connecting:** Establishing WebSocket connection.
  - 🔴 **Error / Reconnect:** Displays detailed connection/auth errors with a quick **Reconnect** button.
  - ⚪ **Disabled / Needs Config:** Indicates bot is toggled off or missing credentials.
- **Settings Panel:** Includes full status card showing real-time ping state, handled commands count, alerts sent count, and a **Send Test Chat Message** button.

### Setting up the Twitch Bot:
1. Open the **Settings** view > **Twitch Integration** section.
2. Check **Enable Twitch Bot**.
3. Enter your **Twitch Channel** name (your Twitch username in lowercase).
4. Provide an **OAuth Token**:
   * Click **Get OAuth Token** to authorize with Twitch and automatically populate your token.
   * Or use [twitchtokengenerator.com](https://twitchtokengenerator.com/) (select scopes `chat:read` and `chat:edit`).
   * Paste the token (`oauth:xxxxxxxxxxxxxx`) into the field.
5. Configure features:
   * **Chat Alerts:** Automatically posts celebratory messages when new donations arrive.
   * **Built-in Commands:** `!total`, `!goal`, `!milestone`.
   * **Custom Commands:** Create your own triggers (e.g. `!schedule`, `!rules`, `!donate`).

---

## 🎥 OBS Browser Source Overlays

All overlays run as standard **Browser Sources** in OBS Studio, Streamlabs Desktop, or XSplit.

### Recommended OBS Browser Source Settings:
* **Custom CSS:** Leave blank (all overlays have native transparent backgrounds).
* **Control audio via OBS:** Check this if you want OBS to capture alert sounds directly.
* **Shutdown source when not visible:** Uncheck to prevent overlays from reloading during scene switches.

### Overlay Reference Table

| Overlay | URL Parameter | Recommended Dimensions | Description |
| :--- | :--- | :--- | :--- |
| **Progress Bar** | `?overlay=progress` | 800 × 120 px | Fundraising bar with total raised, goal, and marathon countdown/elapsed timer. |
| **Donation Notifications** | `?overlay=notifications` | 500 × 200 px | Pop-up toast alert for incoming donations with sound & animations. |
| **Next Milestone** | `?overlay=milestone` | 600 × 100 px | Shows progress towards your next incentive or milestone. |
| **Team Header** | `?overlay=team-header` | 850 × 220 px | Compact horizontal banner with team progress, total, goal, and donor count. |
| **Team Donations** | `?overlay=team-donations` | 500 × 750 px | Vertical feed showing the **most recent team donations first**. |
| **Team Dashboard** | `?overlay=team-dashboard` | 1280 × 850 px | Full-screen command center with team progress, full roster, and donations feed. |
| **Celebration** | `?overlay=celebration` | 1920 × 1080 px | Full-screen confetti effect triggered by milestones or goals. |
| **Marathon Schedule** | `?overlay=schedule` | 450 × 600 px | Interactive schedule list; completed blocks are crossed out in real-time. |
| **Sponsors Carousel** | `?overlay=sponsors` | 400 × 150 px | Rotating logo slideshow for sponsors and community partners. |
| **Text Display** | `?overlay=text` | 600 × 150 px | Live display of text files, rules, notes, or custom banners. |
| **QR Code Overlay** | `?overlay=qrcode` | 260 × 320 px | Retro-styled QR code box linking viewers straight to your donation page. |

> **Profile Tip:** Add `&profile=YOUR_ID` to any overlay URL to bind it to a specific participant (the dashboard's "Copy Link" buttons do this automatically).

---

## 📁 Starter Media Folders (`/sounds` & `/sponsors`)

The repository includes dedicated asset folders with starter media ready for immediate use:

### 1. Audio Alerts (`/sounds/`)
- **`chime.wav`** — Melodic two-tone alert chime (E5 & A5).
- **`bell.wav`** — Clear notification bell with resonant harmonic decay.
- **`fanfare.wav`** — Triumphant 4-note celebration fanfare (C5-E5-G5-C6).
- **`coin.wav`** — Classic 8-bit retro arcade coin blip.
- **`alert.wav`** — Modern double-tone digital notification.
- *How to use:* Drop any `.wav`, `.mp3`, or `.ogg` file into `/sounds/` and select it from the **Sounds** section dropdown in Settings.

### 2. Sponsor Logos & Banners (`/sponsors/`)
- **`sponsor-sample-gold.svg`** — Premium Gold tier partner banner.
- **`sponsor-sample-silver.svg`** — Silver tier partner banner.
- **`sponsor-sample-energy.svg`** — Energy drink sponsor banner (*Pulse Energy*).
- **`sponsor-sample-community.svg`** — Community charity partner banner (*Heroes For Health*).
- **`sponsor-sample-extra-life.svg`** — Extra Life Guild supporter banner (*Play Games • Heal Kids*).
- *How to use:* Drop any `.svg`, `.png`, `.jpg`, `.webp`, or `.gif` image into `/sponsors/` and add it to the carousel from the **Sponsors** section dropdown in Settings.

---

## 💾 Profile Backup & Multi-User Profiles

- **Multiple Profiles:** Manage multiple streamers on the same system using `?profile=PARTICIPANT_ID`. Each profile keeps completely isolated settings, colors, schedule, audio, and credentials.
- **Export Settings (JSON):** Downloads your full profile configuration as a `.json` backup.
- **Import Settings (JSON):** Instantly restores your settings on any device or browser.

---

## 🔌 Automation & Stream Deck API (Local Server Mode)

When running locally with `npm start`, trigger actions via HTTP POST requests:

- **Change Theme:** `POST http://localhost:3000/api/theme` with `{"name": "synthwave", "profile": "534123"}`
- **Stop All Events & Sounds:** `POST http://localhost:3000/api/stop-events` with `{"profile": "534123"}`
- **Test Donation:** `POST http://localhost:3000/api/test-donation` with `{"amount": 15, "profile": "534123"}`

---

## 📜 License
This project is open-source and intended for charity streaming and fundraising for Children's Miracle Network Hospitals via Extra Life.
