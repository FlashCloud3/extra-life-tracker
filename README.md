<div align="center">
  <h1>🎮 Extra Life Donation Tracker & OBS Overlays</h1>
  <p><strong>A retro-styled live donation tracker, stream alerts system, and customizable OBS overlay suite for Extra Life & DonorDrive charity marathons.</strong></p>
  <p>Works both as a local full-stack Node.js app or completely serverless on <strong>GitHub Pages</strong>.</p>
</div>

---

## 🌟 Key Features

* **Real-Time Extra Life Sync:** Tracks your total raised, fundraising goal, latest donor, donation history, milestones, and team totals.
* **8 OBS Browser Source Overlays:**
  * **Progress Bar:** High-visibility fundraising bar with goal progress and marathon countdown/elapsed timer.
  * **Toast Notifications:** Retro pop-up alerts with animations and sound effects for incoming donations.
  * **Milestones:** Displays progress toward your next incentive or marathon milestone.
  * **Team Tracker:** Displays team name and combined team fundraising totals.
  * **Confetti Celebration:** Full-screen celebratory confetti burst when hitting goals or milestones.
  * **Stream Schedule:** Interactive marathon schedule overlay that crosses off completed blocks in real-time.
  * **Sponsors Carousel:** Rotating banner display for stream sponsors and partners.
  * **Text Display:** Live text file reader for stream notes, now-playing, or custom banners.
* **Server Fetch Status:** Real-time indicator showing the exact time data was last fetched from the server.
* **Twitch Chat Bot:** Automatically announces new donations in Twitch chat and answers viewer commands (`!total`, `!goal`, `!milestone`).
* **Multi-User Profiles:** Track multiple streamers or team members independently using their Participant ID (`?profile=ID`).
* **Dual Currency Support:** Real-time conversion between USD ($) and CAD (C$).
* **Custom Audio & Retro Sounds:** Built-in 8-bit coin and fanfare audio, plus custom `.mp3`/`.wav`/`.ogg` upload support.
* **Retro Themes & Typography:** 7 built-in themes (Neon Vibe, Synthwave, Hacker Green, Final Fantasy, FFXIV, Dwarf Fortress, Solarized) and retro pixel fonts (Press Start 2P, VT323, Bungee, Cinzel).
* **Bilingual UI:** Instant toggle between English and French.
* **Zero-Install Static Mode:** Can run 100% in-browser on GitHub Pages without needing a backend server.

---

## 🚀 Quick Start

You can run the tracker either **online via GitHub Pages** (zero installation) or **locally on your computer using Node.js**.

### Option A: Running Online via GitHub Pages (Recommended / Zero-Install)

1. Fork or push this repository to your GitHub account.
2. In your GitHub repository, go to **Settings** > **Pages**.
3. Under **Build and deployment** > **Source**, select **Deploy from a branch** (or use the included GitHub Actions workflow).
4. Select the `main` (or `master`) branch and `/ (root)` directory, then click **Save**.
5. Once deployed, open your site at:
   ```
   https://<your-username>.github.io/<repo-name>/
   ```
> **Important Note for GitHub Pages:** Keep the dashboard open in a browser tab while streaming. In static mode, the dashboard polls the DonorDrive API and communicates with your OBS overlays via the browser's native `BroadcastChannel` API.

---

### Option B: Running Locally with Node.js

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

## 🛠️ Initial Configuration

When you first open the dashboard:

1. **Find your Extra Life Participant ID:**
   * Go to your Extra Life fundraising page.
   * Look at the URL in your browser:
     ```
     https://www.extra-life.org/participant/534123
     ```
   * Your Participant ID is the number at the end (e.g. `534123`).
2. **Load your Profile:**
   * Enter your Participant ID into the **Load ID** box at the top of the dashboard and click **Load**.
   * The app will fetch your fundraising details, goal, and donation list immediately.
3. **Configure Core Settings:**
   * **Language:** Select English or French.
   * **Team ID:** Enter your Team ID, or leave **Auto-detect Team ID** checked to find it automatically.
   * **Refresh Interval:** Time in seconds between Extra Life API checks (minimum 15 seconds to prevent rate limits).
   * **Currency:** Choose USD ($) or CAD (C$) with automated currency conversion.
   * **Event Start Time:** Set the date and time of your stream marathon to show a countdown or elapsed timer.

---

## 🎥 Adding Overlays to OBS Studio / Streamlabs

All overlays run as standard **Browser Sources** in OBS Studio, Streamlabs Desktop, or XSplit.

### How to Add an Overlay in OBS:
1. In OBS, go to your **Sources** panel and click **+** > **Browser**.
2. Name the source (e.g., `Extra Life Progress Bar`).
3. In the dashboard's **Overlay Links** section, click **Copy Link** next to the overlay you want to use.
4. Paste the URL into the **URL** field in OBS.
5. Set the suggested width and height (see table below).
6. **Recommended OBS Browser Source Settings:**
   * Check **Shutdown source when not visible** (optional, recommended off if you switch scenes often).
   * Leave **Custom CSS** blank (the tracker provides transparent backgrounds automatically).
   * Check **Control audio via OBS** if you want OBS to capture alert sounds directly from the browser source.

### Overlay Reference Table

| Overlay | URL Parameter | Suggested Dimensions | Description |
| :--- | :--- | :--- | :--- |
| **Progress Bar** | `?overlay=progress` | 800 × 120 px | Fundraising progress bar with current total, goal, and marathon timer. |
| **Donation Notifications** | `?overlay=notifications` | 500 × 200 px | Pop-up toast alert for incoming donations with sound & animations. |
| **Next Milestone** | `?overlay=milestone` | 600 × 100 px | Tracks progress towards your next incentive or fundraising milestone. |
| **Team Tracker** | `?overlay=team` | 500 × 100 px | Displays the Team Name and total amount raised by the team. |
| **Celebration** | `?overlay=celebration` | 1920 × 1080 px | Full-screen confetti effect when milestones or goals are achieved. |
| **Marathon Schedule** | `?overlay=schedule` | 450 × 600 px | List of gaming schedule blocks; items marked "Done" are crossed out live. |
| **Sponsors Carousel** | `?overlay=sponsors` | 400 × 150 px | Rotating logo slideshow for sponsors and partners. |
| **Text Display** | `?overlay=text` | 600 × 150 px | Live display of text files (e.g., stream notes, now playing). |

> **Profile Tip:** If you are tracking a specific Participant ID, ensure your overlay link contains `&profile=YOUR_ID` (the dashboard's "Copy Link" buttons add this automatically).

---

## 💬 Twitch Chat Bot Integration

The tracker includes an integrated Twitch bot powered by `tmi.js` that works in **both** local server mode and standalone GitHub Pages mode.

### Setting up the Twitch Bot:
1. Open the **Twitch Integration** section in the dashboard settings.
2. Toggle **Enable Twitch Integration** to ON.
3. Enter your **Twitch Channel** name (your Twitch username in lowercase).
4. Provide an **OAuth Token**:
   * Generate an IRC OAuth chat token using your Twitch account (e.g., via [twitchapps.com/tmi](https://twitchapps.com/tmi/)).
   * Paste the token (in the format `oauth:xxxxxxxxxxxxxx`) into the **OAuth Token** field.
5. Configure your bot preferences:
   * **Enable Chat Alerts:** Automatically posts a message in your chat when a new donation arrives (e.g. `🎉 New Extra Life Donation! GenerousGamer donated $25.00! Thank you!`).
   * **Enable Chat Commands:** Allows viewers and mods to type commands in chat:
     * `!total` — Returns the current amount raised and goal.
     * `!goal` — Displays remaining amount needed to reach the goal.
     * `!milestone` — Announces the next upcoming milestone.

---

## 🔊 Audio & Alert Customization

* **Default Sounds:** Includes 8-bit retro arcade collect sounds for standard donations and a level-up fanfare for milestone achievements.
* **Custom Audio Upload:** Upload your own `.mp3`, `.wav`, or `.ogg` sound files (up to 2MB) directly in the dashboard under **Audio Settings**.
* **Volume Control:** Set the master sound volume from 0% to 100%.
* **Mute / Test:** Use the **Test Donation (+$15)** button to test audio levels without waiting for a real donation.

---

## 🎛️ Dashboard Controls

| Button / Control | Description |
| :--- | :--- |
| **Test Donation (+$15)** | Simulates a $15 donation to verify audio, toast animations, and confetti. |
| **Re-sync Data** | Forces an immediate refresh from the Extra Life API. |
| **Clear & Stop All** | Immediately silences any active sounds, flushes queued alerts, and clears confetti. |
| **⏱ Last fetched from server** | Displays the exact local time the data was last updated from the server. |
| **Export Profile** | Downloads your current configuration (colors, milestones, audio, schedule) as a `.json` backup file. |
| **Import Profile** | Restores a previously saved profile configuration. |

---

## 🎨 Themes & Visual Customization

Choose from pre-built visual presets or customize every color manually:

* **Theme Presets:** Neon Vibe (Default), Solarized Dark, Hacker Green, Synthwave, Final Fantasy (Classic Blue/White), Final Fantasy XIV (Dark Grey & Gold), Dwarf Fortress (Magma Red).
* **Fonts:** Press Start 2P, Bungee, Roboto Mono, VT323, Cinzel.
* **Toast Notification Animations:** Slide In, Fade In, Bounce In, Zoom In.
* **Custom Color Pickers:** Accent colors, background, panel background, borders, success green, and error red.

---

## 🔌 Automation & Stream Deck API (Local Server Mode)

When running locally with `npm start`, you can trigger actions using HTTP POST requests from external tools like **Elgato Stream Deck**, **Touch Portal**, or command-line scripts:

### Change Theme:
* **Endpoint:** `POST http://localhost:3000/api/theme`
* **Headers:** `Content-Type: application/json`
* **Body:**
  ```json
  {
    "name": "synthwave",
    "profile": "534123"
  }
  ```
* *Available theme names:* `neon-vibe`, `solarized-dark`, `hacker-green`, `synthwave`, `final-fantasy`, `ffxiv`, `dwarf-fortress`.

### Stop All Sounds & Alerts:
* **Endpoint:** `POST http://localhost:3000/api/stop-events`
* **Headers:** `Content-Type: application/json`
* **Body:**
  ```json
  {
    "profile": "534123"
  }
  ```

---

## ❓ Frequently Asked Questions (FAQ)

<details>
<summary><strong>Q: Why aren't alert sounds playing in OBS?</strong></summary>
OBS browser sources sometimes mute audio or block autoplay by default.
1. Right-click the Browser Source in OBS > **Properties**.
2. Check the box **Control audio via OBS**.
3. In the OBS **Audio Mixer**, find the browser source and make sure it is not muted, and that its monitoring state is set to **Monitor and Output** under Advanced Audio Properties.
</details>

<details>
<summary><strong>Q: Why is there a delay between a donation and the alert?</strong></summary>
The Extra Life / DonorDrive API updates periodically, and the tracker polls the API every 15–60 seconds (as configured in your Refresh interval). You can click <strong>Re-sync Data</strong> on the dashboard at any time to check immediately.
</details>

<details>
<summary><strong>Q: Can multiple streamers on our team use this together?</strong></summary>
Yes! Each participant can load their own Participant ID. Each ID stores separate settings, themes, and overlays in isolated profiles.
</details>

<details>
<summary><strong>Q: Do I need a server running 24/7 if I host on GitHub Pages?</strong></summary>
No. In GitHub Pages mode, all fetching and synchronization happens inside your browser tabs using client-side API requests and the <code>BroadcastChannel</code> API. Simply keep the dashboard tab open on your streaming computer while live.
</details>

---

## 📜 License

This project is open-source and intended for charity streaming and fundraising for Children's Miracle Network Hospitals via Extra Life.
