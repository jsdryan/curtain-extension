# Store Assets Guide

You need to create the following images for the Chrome Web Store listing.

## Required Images

### 1. Store Icon (128x128 px)
- Already exists: `icons/icon128.png`
- Ensure it has proper padding (96x96 icon content + 16px padding on each side)

### 2. Screenshots (1280x800 px, PNG or JPEG)
- **Minimum 1, recommended 5**
- Suggested screenshots to capture:

| # | Screenshot | Description |
|---|-----------|-------------|
| 1 | **Normal mode popup** | Show the popup in "normal mode" with the green status and "Pull Down Curtain" button |
| 2 | **Active mode popup** | Show the popup in "curtain active" mode with orange status, hidden counts, and the Shift+Delete tip |
| 3 | **Site list tab** | Show the "Monitored Sites" tab with the pre-configured site list |
| 4 | **Keyword list tab** | Show the "Sensitive Keywords" tab with the keyword list |
| 5 | **Before/After comparison** | Show the address bar clean after activation (no sensitive suggestions) |

**Tips for taking screenshots:**
- Use a 1280x800 browser window (or crop to this size)
- Use a clean browser profile with a neutral background
- Consider adding annotations (arrows, highlights) using a tool like Figma or Canva

### 3. Small Promotional Tile (440x280 px, PNG or JPEG)
- This appears in Chrome Web Store search results
- Suggested design:
  - Extension icon on the left
  - "Curtain" title
  - Tagline: "One-click privacy for screen sharing"
  - Clean, professional background

### 4. Marquee Promotional Tile (1400x560 px, optional)
- Larger promotional banner
- Only needed if you want to be featured

## Tools for Creating Assets
- **Figma** (free): Best for creating promotional tiles
- **Canva** (free): Quick and easy promotional images
- **macOS Screenshot**: Cmd+Shift+4 for capturing popup screenshots

## Quick Screenshot Steps

1. Open Chrome and pin the Curtain extension
2. Set browser window to 1280x800:
   - Open DevTools (F12) > Console
   - Run: `window.resizeTo(1280, 800)`
3. Click the Curtain icon to open popup
4. Take screenshot: Cmd+Shift+4 (macOS) or Win+Shift+S (Windows)
5. Crop/resize to exactly 1280x800 if needed

## File Naming Convention
```
store-assets/
  screenshot-1-normal-mode.png
  screenshot-2-active-mode.png
  screenshot-3-site-list.png
  screenshot-4-keyword-list.png
  screenshot-5-before-after.png
  promo-small-440x280.png
  promo-marquee-1400x560.png  (optional)
```
