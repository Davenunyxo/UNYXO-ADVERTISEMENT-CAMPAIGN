# UNYXO — Smart Booking & Scheduling ad

30-second 1920×1080 ad, built as a frame-accurate HTML animation (`ad/index.html`) and rendered to MP4. Each scene holds long enough to read its text.

| Time | Scene |
|---|---|
| 0–4s | **Question:** "Missing out on potential walk-in clients?" A door marked FULL with customers walking away: "When every seat is taken, walk-ins walk right back out." |
| 4–7s | **Introducing the Walk-in Queue:** "Your customers wait anywhere — not in your shop." Chips: QR check-in · Live queue updates · Turn-ready alerts |
| 7–16.5s | **How it works:** the shop's waiting area fills up ("No seats available"), a customer scans the in-store QR code, joins the queue, watches their place count down (#4 → #2) and gets a "your turn next" notification. The steps *Scan → Join → Get notified* light up as it happens |
| 16.5–20s | Color-coded September 2026 calendar (green = confirmed, yellow = waiting, blue = in progress); the live queue panel opens and the QR customer appears in it |
| 20–25s | Cursor clicks Sep 22, a glass **Client Profile** card expands, the notes field types *"VIP Client – Prefers morning follow-ups"*, and the slot is dragged from 2:00 PM to 9:30 AM |
| 25–30s | UI tilts back into 3D, the metallic UNYXO mark draws in, then **SMART BOOKING & SCHEDULING** and *Business done easier* appear |

Output: `out/unyxo-smart-booking-ad.mp4`

## Preview / re-render
- Open `ad/index.html` in a browser to watch it loop. Add `?t=4.5` to freeze a frame.
- `npm install`, then `node render.mjs` (set `FFMPEG` and `CHROME` env vars if needed). Add `--stills 1,5,9` to export PNG frames instead.
