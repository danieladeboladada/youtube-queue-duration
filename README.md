# YouTube Queue Duration

A Chrome extension that shows the total duration of the videos in the current YouTube "Up Next" queue — whether that's an explicit playlist or YouTube's autoplay/Mix queue.

Click the extension icon while watching a YouTube video that's part of a playlist or Mix, and it totals up the runtime of everything in the sidebar queue.

## Try it in your browser

This isn't published on the Chrome Web Store — you load it directly from source ("unpacked") in a few steps:

1. **Clone the repo**
   ```bash
   git clone https://github.com/danieladeboladada/youtube-queue-duration.git
   ```

2. **Open Chrome's extensions page** — go to `chrome://extensions` in your address bar.

3. **Turn on Developer mode** — toggle in the top-right corner of that page. Three new buttons appear: "Load unpacked," "Pack extension," and "Update."

4. **Click "Load unpacked"** and select the `youtube-queue-duration` folder you just cloned (the folder itself, not a file inside it).

5. **Confirm it loaded** — a card titled "YouTube Queue Duration" should appear with no red "Errors" button.

6. **(Optional) Pin it to the toolbar** — click the puzzle-piece icon in Chrome's toolbar, find "YouTube Queue Duration," and click the pin icon.

7. **Try it out** — open a YouTube video that's part of a playlist or Mix (e.g. search a song and click "Play all" or the radio/mix icon so the "Up Next" sidebar appears), then click the extension icon. You'll see the total duration, video count, and an expandable breakdown of individual videos.

### Other states to try
- A plain single video with no playlist/Mix queue → "No queue found"
- Any non-YouTube tab → "Not a YouTube video"
- A queue that includes a live stream or premiere → it's counted but excluded from the total, with a note explaining why

## How it works

No background process, no data collection, nothing runs until you click the icon. On click, the popup injects a small script into the active tab that reads the queue panel already rendered in YouTube's DOM (`ytd-playlist-panel-renderer`) and sums up each item's displayed duration.

## Permissions

- `activeTab` — read the current tab only when you click the extension icon.
- `scripting` — run the scraping script in that tab.

No `host_permissions`, no `storage`, no background service worker.
