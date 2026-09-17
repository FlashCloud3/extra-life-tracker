# Extra Life Tracker - Application Options & Documentation

This document outlines all available features, configuration options, overlay types, and API endpoints for the Extra Life Donation Tracker.

---

## 1. Core Configuration
Located in the "Core Setup" section of the settings panel.

*   **Language:** Switch the interface between **English** and **French** (all phrase definitions and custom language dictionaries are located in `translations.js`).
*   **Participant ID:** Your specific Extra Life Participant ID (found in your fundraising page URL).
    *   *Note:* If you are using a specific ID loaded via the top switcher, this field is read-only.
*   **Team ID:** Your Extra Life Team ID.
*   **Auto-detect Team ID:** If enabled, the app automatically fetches the Team ID associated with your Participant ID.
*   **Refresh (seconds):** How often the app polls the Extra Life API for new data (Minimum: 15 seconds).
*   **Currency:** Choose between **USD ($)** and **CAD (C$)**. (Note: CAD uses a fixed estimated conversion rate).

## 2. Multi-User Profiles (Participant IDs)
The app supports tracking multiple participants simultaneously by using their **Participant ID** as the profile identifier.

*   **Usage:**
    *   To access the default profile: `http://localhost:3000`
    *   To load a specific participant: `http://localhost:3000/?profile=PARTICIPANT_ID`
*   **Loading an ID:** Type your Participant ID (e.g., `534123`) in the **"Load ID"** box at the top of the dashboard.
*   **Automatic Sync:** When you load an ID, the tracker automatically sets the configuration to track that specific Participant ID.
*   **Separate Settings:** Each ID maintains its own completely separate configuration file (colors, overlays, Twitch settings).
*   **OBS Links:** When you click "Copy Link" on the dashboard, the link automatically includes the correct `&profile=ID` parameter.

## 3. Event & Timing
Located in the "Event & Timing" section.

*   **Event Start Time:** Set the date and time for your marathon.
    *   *Effect:* Displays a countdown timer ("Starts in...") or elapsed timer ("Time Elapsed...") on the dashboard and progress bar overlays.
*   **Celebration Duration (s):** How long the confetti overlay lasts when triggered.

## 4. Theming & Visuals
Customize the look of your dashboard and overlays.

### Presets
*   **Neon Vibe** (Default)
*   **Solarized Dark**
*   **Hacker Green**
*   **Synthwave**
*   **Final Fantasy** (Classic Blue/White)
*   **Final Fantasy XIV** (Dark Grey/Gold/Aether Blue)
*   **Dwarf Fortress** (Black/Grey/Magma Red)

### Advanced Theming
*   **Font Family:**
    *   Press Start 2P (Pixel art style)
    *   Bungee
    *   Roboto Mono
    *   VT323
    *   Cinzel (Fantasy style)
*   **Notification Animation:**
    *   Slide In
    *   Fade In
    *   Bounce In
    *   Zoom In

### Custom Colors
You can manually override specific colors regardless of the preset:
*   Background, Panel, Text
*   Accent 1 (Primary headers/highlights)
*   Accent 2 (Secondary details/borders)
*   Border Color
*   Success (Positive numbers/buttons)
*   Error (Delete buttons/warnings)

## 5. Audio Settings
Manage sound alerts for donations and milestones.

*   **Enable Sound:** Master toggle for all audio.
*   **Volume:** Global volume slider (0% - 100%).
*   **Donation Sound:**
    *   *Default Coin:* A retro coin collect sound.
    *   *Custom:* Select an uploaded file.
*   **Milestone Sound:**
    *   *Default Fanfare:* A retro level-up jingle.
    *   *Custom:* Select an uploaded file.
*   **Custom Sound Library:**
    *   **Upload New Sound:** Upload `.mp3`, `.wav`, or `.ogg` files directly from your computer (Max 2MB).
    *   **Add from App Folder:** If you place files manually in the `/sounds` folder of the app directory, they appear here to be added.

## 6. Overlays (Browser Sources)
Add these URLs as "Browser Sources" in OBS, XSplit, or Streamlabs.

| Overlay Name | URL Parameter | Description |
| :--- | :--- | :--- |
| **Progress Bar** | `?overlay=progress` | Horizontal bar showing total raised vs goal. Includes timer. |
| **Notifications** | `?overlay=notifications` | Pop-up "Toast" cards for new donations. Queues multiple donations. |
| **Next Milestone** | `?overlay=milestone` | Shows the specific progress towards the *next* milestone on your list. |
| **Team Tracker** | `?overlay=team` | Displays the Team Name and Total Team Amount. |
| **Celebration** | `?overlay=celebration` | Full-screen transparent overlay. Fires confetti when a milestone is hit or "Test Donation" is clicked. |
| **Schedule** | `?overlay=schedule` | Displays your stream schedule list. Crosses out items marked as "Done". |
| **Sponsors** | `?overlay=sponsors` | Rotating slideshow of sponsor logos. |
| **Text Display** | `?overlay=text` | Full-screen display of a selected text file content. Updates automatically. |

**Tip:** You can click the "Copy Link" button in the "Overlay Links" section of the dashboard to get the exact URL.

## 7. Content Management

### Twitch Integration
*   **Enable Twitch Integration:** Master toggle to connect or disconnect the bot entirely.
*   **Enable Chat Alerts:** Toggle whether the bot automatically posts a message in chat ("🚨 New Donation...") when a donation is received.
*   **Enable Chat Commands:** Toggle whether the bot responds to commands like `!total` or custom triggers.
*   **Commands:** The bot responds to `!total`, `!goal`, and `!milestone` in your chat.

### Stream Schedule
*   **Add Item:** Enter a time and description to build your schedule.
*   **Mark Done:** Click "Done" on an item to cross it out on the overlay (live update).
*   **Delete:** Remove an item.

### Sponsors
*   **Slide Duration:** How long each image stays on screen before rotating.
*   **Add Sponsor:**
    1.  Place image files (`.jpg`, `.png`, etc.) in the `sponsors` folder in your app directory.
    2.  Select the file from the dropdown in settings.
    3.  Click "Add".

### Text Overlay
*   **File Selection:** Select a `.txt` file located in the `text_files` folder of your app directory.
*   **Font Size:** Adjust the text size for better readability (default 1.5rem).
*   **Usage:** Useful for "Now Playing", "Latest Subscriber", or general stream notes.
*   **Live Updates:** If you edit the file on your computer, the overlay updates automatically within 2 seconds.

## 8. Dashboard Controls
Buttons located on the main dashboard for live stream management.

*   **Test Donation (+$15):** Simulates a $15 donation. Triggers sound, notification, and celebration (if it crosses a goal/milestone). Great for testing audio levels.
*   **Resync Data:** Forces an immediate call to the Extra Life API to update stats.
*   **Clear & Stop All:**
    *   Stops all currently playing sounds.
    *   Clears the notification queue.
    *   Removes confetti.
    *   Useful if a sound gets stuck or you get flooded with alerts.

## 9. API Reference (Automation)
You can control the tracker externally (e.g., **Stream Deck**, **Touch Portal**, **Curl**) using HTTP POST requests to `http://localhost:3000`.

### Change Theme
*   **Endpoint:** `POST /api/theme`
*   **Content-Type:** `application/json`
*   **Body:**
    ```json
    { "name": "ffxiv", "profile": "PARTICIPANT_ID" }
    ```
*   **Available Theme Names:** `neon-vibe`, `solarized-dark`, `hacker-green`, `synthwave`, `final-fantasy`, `ffxiv`, `dwarf-fortress`.

### Stop All Events
*   **Endpoint:** `POST /api/stop-events`
*   **Body:** `{ "profile": "PARTICIPANT_ID" }`
*   **Effect:** Same as clicking the "Clear & Stop All" button.

### Example: Stream Deck Setup (System: Website / HTTP Request)
*   **URL:** `http://localhost:3000/api/theme`
*   **Method:** `POST`
*   **Content Type:** `application/json`
*   **Body:** `{ "name": "hacker-green", "profile": "534123" }`

---

## 10. Running Directly on GitHub Pages (Static Hosting)

The tracker can run completely standalone without a local Node.js server, making it ideal for free 24/7 hosting on **GitHub Pages**.

### Deploying to GitHub Pages
1. Push this repository to GitHub.
2. In your repository on GitHub, navigate to **Settings** > **Pages**.
3. Under **Build and deployment** > **Source**, choose **Deploy from a branch**.
4. Set the branch to `main` (or `master`) and directory to `/(root)`.
5. Click **Save**. Within a minute, your tracker will be live at `https://<username>.github.io/<repo-name>/`!

### Features in Standalone / GitHub Pages Mode
* **Direct Extra Life API Polling**: Directly queries the official DonorDrive API (`https://dd.extra-life.org/api/participants/...`) with native CORS support from the browser every refresh interval.
* **Instant OBS Cross-Tab Sync**: Uses the browser's native `BroadcastChannel` API to synchronize configuration changes, test donations, and clearing commands to all OBS browser source overlays in real-time.
* **Local Storage & Multiple Profiles**: Configurations for each Participant ID are saved in your browser's `localStorage`.
* **Profile Backup & Restore**: Export your configuration (theme, schedule, custom audio) as a `.json` file and import it anywhere.
* **In-Browser Twitch Chat Bot**: When enabled with a token, the bot connects directly to Twitch IRC over secure WebSockets via `tmi.js` in the browser to announce donations and reply to commands.
* **Hybrid Compatibility**: If you run `node server.js` locally, the app will automatically detect and connect to the local server; if no server is running or when hosted on GitHub Pages, it runs in Standalone Mode.