# UNYXO — Smart Booking & Scheduling ad

30-second 1920×1080 ad, built as a frame-accurate HTML animation (`ad/index.html`) and rendered to MP4. Each scene holds long enough to read its text.

| Time | Scene |
|---|---|
| 0–4s | **Question:** "Missing out on potential walk-in clients?" A door marked FULL: "−3 clients turned away in the last hour" |
| 4–7s | **Introducing the Walk-in Queue:** "Your customers wait anywhere — not in your shop." Chips: QR check-in · Live queue updates · Turn-ready alerts |
| 7–15s | **How it works** (purple): the barbershop's seats fill up ("No seats available"), a customer scans the in-store QR code, joins the queue, watches their place count down (#4 → #2) and gets a "your turn next" notification |
| 15–22.5s | **Calendar:** every day of September 2026 shows counts of Confirmed (green), Pending confirmation (yellow) and Canceled (red) plus a 9 AM–5 PM hourly status strip. The Day Schedule panel lists each hour with client name, barber ("with Marcus") and status: first Sep 22, then **Today, Sep 27** with its purple **Walk-in Queue (today only)** |
| 22.5–26.5s | Cursor clicks Sep 22, a glass **Client Profile** card expands (2:00 PM · Fade + beard · with Marcus), notes type *"VIP Client – Prefers morning follow-ups"*, and the slot is dragged to 9:30 AM |
| 26.5–30s | UI tilts back into 3D, the metallic UNYXO mark draws in, then **SMART BOOKING & SCHEDULING** and *Business done easier* appear |

Output: `out/unyxo-smart-booking-ad.mp4`

## Preview / re-render
- Open `ad/index.html` in a browser to watch it loop. Add `?t=4.5` to freeze a frame.
- `npm install`, then `node render.mjs` (set `FFMPEG` and `CHROME` env vars if needed). Add `--stills 1,5,9` to export PNG frames instead.
