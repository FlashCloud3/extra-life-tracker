# Stream Sponsors & Partners Folder (`/sponsors`)

Drop your custom sponsor and partner images here so they appear automatically in the stream dashboard under **Settings** -> **Sponsors Carousel** -> **Add from App Folder**.

## Supported Image Formats
- `.png` (recommended for transparent logos)
- `.svg` (crisp, scalable vector graphics)
- `.webp`
- `.jpg` / `.jpeg`
- `.gif` (animated logos)

## Recommended Dimensions
- **Aspect Ratio:** 16:9 or banner style (e.g., 400 × 150 px, 300 × 100 px, 600 × 200 px)
- **Overlay Size in OBS:** By default, the `?overlay=sponsors` source runs at 400 × 150 px.

## Included Sample Banners
- `sponsor-sample-gold.svg` - Aurora Tech (Gold Sponsor banner)
- `sponsor-sample-silver.svg` - Nexus Gaming (Silver Partner banner)
- `sponsor-sample-energy.svg` - Pulse Energy (Energy Partner banner)
- `sponsor-sample-community.svg` - Heroes For Health (Community Charity Partner banner)
- `sponsor-sample-extra-life.svg` - Extra Life Guild (Supporter banner)

## How to Use
1. Copy or drop any logo or banner file into this `sponsors/` directory.
2. In the Extra Life stream overlay dashboard, navigate to **Settings** -> **Sponsors Carousel**.
3. Select your image from the **Add from App Folder** dropdown menu.
4. Click **Add** to add it to your rotating stream sponsors slideshow.
5. In OBS, add an OBS Browser Source pointing to `http://localhost:3000/?overlay=sponsors` (or your profile URL).
