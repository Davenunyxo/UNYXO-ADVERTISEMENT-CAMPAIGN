# UNYXO — Smart Booking & Scheduling ad

10-second 1920×1080 ad, built as a frame-accurate HTML animation (`ad/index.html`) and rendered to MP4.

| Time | Scene |
|---|---|
| 0–3s | Push-in on the September 2026 calendar. Tiles sweep into status colors (green = confirmed, yellow = waiting queue, blue = in progress), and the live **Online Queue** drawer slides open |
| 3–6s | Camera pans, cursor clicks Sep 22, a glass **Client Profile** card expands, the notes field types *"VIP Client – Prefers morning follow-ups"*, and the slot is dragged from 2:00 PM to 9:30 AM |
| 6–10s | UI tilts back into 3D, the metallic UNYXO mark draws in with its glow, then **SMART BOOKING & SCHEDULING** and *Business done easier* appear |

Output: `out/unyxo-smart-booking-ad.mp4`

## Preview / re-render
- Open `ad/index.html` in a browser to watch it loop. Add `?t=4.5` to freeze a frame.
- `npm install`, then `node render.mjs` (set `FFMPEG` and `CHROME` env vars if needed). Add `--stills 1,5,9` to export PNG frames instead.
