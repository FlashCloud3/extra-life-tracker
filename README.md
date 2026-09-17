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
  * **Text Display:** Live text file or custom message reader for stream notes, rules, or custom banners.
* **Server Fetch Status:** Real-time indicator showing the exact time data was last fetched from the server or API.
* **Twitch Chat Bot:** Automatically announces new donations in Twitch chat, responds to built-in commands (`!total`, `!goal`, `!milestone`), and supports custom viewer commands.
* **Multi-User Profiles:** Track multiple streamers or team members independently using their Participant ID (`?profile=ID`).
* **Profile Backup:** Export and import complete settings as JSON files for easy backup and cross-device migration.
* **Dual Currency Support (USD / CAD):** Automated live API exchange rate conversion or custom exchange rate calculation based on your Canadian Dollar page total.
* **Custom Audio & Retro Sounds:** Built-in 8-bit coin and fanfare audio, plus custom `.mp3`/`.wav`/`.ogg` upload support.
* **Retro Themes & Typography:** Built-in themes (Neon Vibe, Synthwave, Hacker Green, Final Fantasy, FFXIV, Dwarf Fortress, Solarized) and retro pixel fonts (Press Start 2P, VT323, Bungee, Cinzel).
* **Bilingual UI & Modular Translations:** Instant toggle between English and French, with all strings cleanly separated in `translations.js` for easy editing or adding new languages.
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
   * On the welcome screen or in the top navigation, enter your Participant ID and click **Start Tracking** / **Load Profile**.
   * The app will fetch your fundraising details, goal, and donation list immediately.
3. **Configure Core Settings:**
   * **Language:** Switch between English and French.
   * **Auto-detect Team ID:** Automatically links your team if your participant account belongs to one, or manually enter a Team ID.
   * **Refresh Interval:** Frequency (in seconds, minimum 60s recommended) to poll the Extra Life API for new donations.
   * **Currency:** Select **USD ($)** or **CAD (C$)**:
     * When CAD is selected, live exchange rates are retrieved automatically.
     * You can enter a custom rate or enter your current Extra Life CAD total to auto-calculate the exact multiplier.
   * **Event Start Time:** Set the date and time of your marathon to show a countdown timer before the stream and an elapsed timer during the stream.
   * **Celebration Duration:** Set how many seconds the full-screen confetti effect runs when hitting milestones or goals.

---

## 🎥 Adding Overlays to OBS Studio / Streamlabs

All overlays run as standard **Browser Sources** in OBS Studio, Streamlabs Desktop, or XSplit.

### How to Add an Overlay in OBS:
1. In OBS, go to your **Sources** panel and click **+** > **Browser**.
2. Name the source (e.g., `Extra Life Progress Bar`).
3. In the dashboard's **Overlay Links** section, click **Copy Link** next to the overlay you want to use.
4. Paste the URL into the **URL** field in OBS.
5. Set the recommended width and height (see table below).
6. **Recommended OBS Browser Source Settings:**
   * Leave **Custom CSS** blank (all overlays provide transparent backgrounds automatically).
   * Check **Control audio via OBS** if you want OBS to capture alert sounds directly from the notification browser source.
   * Uncheck **Shutdown source when not visible** to prevent overlays from re-initializing when switching scenes.

### Overlay Reference Table

| Overlay | URL Parameter | Recommended Dimensions | Description |
| :--- | :--- | :--- | :--- |
| **Progress Bar** | `?overlay=progress` | 800 × 120 px | Fundraising progress bar with current total, goal, and marathon timer. |
| **Donation Notifications** | `?overlay=notifications` | 500 × 200 px | Pop-up toast alert for incoming donations with sound & animations. |
| **Next Milestone** | `?overlay=milestone` | 600 × 100 px | Tracks progress towards your next incentive or fundraising milestone. |
| **Team Tracker** | `?overlay=team` | 500 × 100 px | Displays the Team Name and total amount raised by the team. |
| **Celebration** | `?overlay=celebration` | 1920 × 1080 px | Full-screen confetti effect when milestones or goals are achieved. |
| **Marathon Schedule** | `?overlay=schedule` | 450 × 600 px | List of gaming schedule blocks; items marked "Done" are crossed out live. |
| **Sponsors Carousel** | `?overlay=sponsors` | 400 × 150 px | Rotating logo slideshow for stream sponsors and partners. |
| **Text Display** | `?overlay=text` | 600 × 150 px | Live display of text files, rules, schedule notes, or custom banners. |

> **Profile Tip:** If you are tracking a specific Participant ID, ensure your overlay link contains `&profile=YOUR_ID` (the dashboard's "Copy Link" buttons add this automatically).

---

## 💾 Profile Backup & Settings Management

Under the **Profile Backup** section of the dashboard:

* **Export Settings (JSON):** Downloads a complete `.json` backup containing your themes, colors, milestones, sounds, custom commands, schedule items, sponsors, and text overlay configuration.
* **Import Settings (JSON):** Restores a previously exported `.json` configuration file. This makes it easy to back up your setup or transfer your configuration to another computer or browser.
* **Per-Profile Isolation:** Configurations are keyed to your Participant ID, meaning you can manage multiple streamers or team members on the same dashboard without overwriting settings.

---

## 🖼️ Sponsors Carousel Overlay

The **Sponsors Overlay** (`?overlay=sponsors`) displays rotating sponsor logos or partner images on your stream:

1. Expand the **Sponsors** section in the dashboard.
2. Set the **Slide Duration** (seconds each sponsor logo is visible before transitioning).
3. Add sponsors using any of three methods:
   * **Upload Image File:** Select an image from your computer to store it in your browser/server.
   * **Paste Image URL:** Provide a direct URL to a web-hosted logo (PNG, JPG, SVG, GIF).
   * **Local Folder (Node.js mode):** Drop image files into the `/sponsors` directory in your app folder and select them from the dropdown.
4. Customize the sponsor's display name and preview the rotating slideshow.

---

## 📝 Text Overlay & Remote File Reader

The **Text Overlay** (`?overlay=text`) provides a clean typography banner for stream announcements, gaming rules, or schedule notes:

1. Expand the **Text Overlay** section in the dashboard.
2. Choose your content source:
   * **Custom Text Content:** Type announcements, stream rules, or notes directly into the dashboard textarea for instant live display.
   * **Local Text File (Node.js mode):** Place `.txt` files in the `/text_files` folder in your app directory and select one from the dropdown.
   * **Remote Text URL:** Provide a URL to a raw text file (e.g. a raw GitHub URL or Pastebin) that refreshes automatically.
3. Configure **Text Alignment** (top-left, center, bottom-right, etc.) and **Font Size** (rem) to fit your stream layout.

---

## 💬 Twitch Chat Bot Integration

The tracker includes an integrated Twitch bot powered by `tmi.js` that works in **both** local server mode and standalone GitHub Pages mode.

### Setting up the Twitch Bot:
1. Open the **Twitch Integration** section in the dashboard.
2. Check **Enable Twitch Bot**.
3. Enter your **Twitch Channel** name (your Twitch username in lowercase).
4. Provide an **OAuth Token**:
   * Click **Get Twitch Token** or visit [twitchapps.com/tmi](https://twitchapps.com/tmi/).
   * Authorize with Twitch to get your token (`oauth:xxxxxxxxxxxxxx`).
   * Paste the token into the **OAuth Token** field.
5. Configure your bot preferences:
   * **Enable Chat Alerts:** Automatically posts a message in your chat when a new donation arrives (e.g. `🎉 New Extra Life Donation! GenerousGamer donated $25.00! Thank you!`).
   * **Enable Chat Commands:**
     * `!total` — Returns the current amount raised for Extra Life.
     * `!goal` — Displays the current fundraising goal.
     * `!milestone` — Announces the next upcoming milestone.
   * **Custom Commands:** Add your own bot commands by entering a trigger (e.g., `!schedule` or `!donate`) and the response text.

---

## 🔊 Audio & Alert Customization

* **Default Retro Sounds:** Includes 8-bit retro arcade coin sounds for standard donations and a fanfare for milestone achievements.
* **Custom Sound Upload:** Upload your own `.mp3`, `.wav`, or `.ogg` sound files directly in the dashboard under **Sounds**.
* **App Folder Sounds (Node.js mode):** Drop audio files into the `/sounds` directory in your app folder.
* **Volume Slider:** Adjust master audio volume from 0% to 100%.
* **Test Donation (+$15):** Simulates a $15 donation to preview audio, toast animations, and confetti bursts.
* **Clear & Stop All:** Instantly halts any active sound playback, clears active alerts, and stops confetti effects.

---

## 🌍 Localization & Adding Languages

All user interface text and messages are cleanly separated into `translations.js`:

* **Supported Languages:** English (`en`) and French (`fr`).
* **Switching Languages:** Use the **Language** dropdown in the **Core Setup** panel to toggle languages dynamically.
* **Customizing or Translating:**
  1. Open `translations.js` in any text editor.
  2. Modify existing strings or add a new language object (e.g. `es`, `de`).
  3. All keys are structured logically by section: Core Setup, Overlays, Sounds, Sponsors, Text Display, Twitch Bot, and Profile Backup.

---

## 🎨 Themes & Visual Customization

Choose from pre-built visual presets or customize every color manually:

* **Theme Presets:** Neon Vibe (Default), Solarized Dark, Hacker Green, Synthwave, Final Fantasy (Classic Blue/White), Final Fantasy XIV (Dark Grey & Gold), Dwarf Fortress (Magma Red).
* **Typography:** Press Start 2P, Bungee, Roboto Mono, VT323, Cinzel.
* **Notification Animations:** Slide In, Fade In, Bounce In, Zoom In.
* **Color Customizer:** Background, panel, text, border, accent colors, success green, and error red.

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

OBS browser sources sometimes mute audio or block autoplay by default:
1. Right-click the Browser Source in OBS > **Properties**.
2. Check the box **Control audio via OBS**.
3. In the OBS **Audio Mixer**, click the gear / three dots next to the source > **Advanced Audio Properties**.
4. Set the Audio Monitoring dropdown to **Monitor and Output**.
</details>

<details>
<summary><strong>Q: Why is there a delay between a donation and the alert?</strong></summary>

The Extra Life / DonorDrive API updates periodically, and the tracker checks for updates on the interval set in your settings (typically 60 seconds). You can click **Resync Data** on the dashboard at any time to query the API immediately.
</details>

<details>
<summary><strong>Q: How does GitHub Pages mode communicate with OBS?</strong></summary>

In GitHub Pages mode, all data fetching happens in your browser tab. The dashboard uses the browser's native `BroadcastChannel` API to synchronize state, alerts, sounds, and themes across open tabs and OBS browser sources running on the same computer. Simply keep the dashboard tab open while streaming.
</details>

<details>
<summary><strong>Q: How do Canadian Dollar (CAD) donations work?</strong></summary>

The Extra Life API returns amounts in USD. When you select **CAD (C$)**, the tracker converts amounts using either live exchange rates from an exchange rate API or your custom rate. You can also type your current Extra Life website Canadian Dollar total into the helper box to calculate the exact conversion rate used by DonorDrive.
</details>

---

## 📜 License

This project is open-source and intended for charity streaming and fundraising for Children's Miracle Network Hospitals via Extra Life.
