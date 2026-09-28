# UNYXO — Smart Booking & Scheduling ad

30-second 1920×1080 ad, built as a frame-accurate HTML animation (`ad/index.html`) and rendered to MP4. Each scene holds long enough to read its text.

| Time | Scene |
|---|---|
| 0–3.5s | **Question:** "Missing out on potential walk-in clients?" A door marked FULL: "−3 clients turned away in the last hour" |
| 3.5–7s | **Introducing the Walk-in Queue** (UNYXO mark): "Avoid the clutter in your shop — give your clients the freedom to wait anywhere they like." Chips: QR check-in · Live queue updates · Turn-ready alerts |
| 7–17.5s | **How it works:** the barbershop's seats fill up ("No seats available"), a customer scans the in-store QR code, joins the queue, watches their place count down (#4 → #2) and gets a "your turn next" notification |
| 17.5–22.5s | **Calendar:** each day shows its Confirmed / Pending confirmation / Canceled counts and a colour bar. The Day Schedule panel shows a timeline from opening (9:00 AM) with client, barber and status, plus a **View more ▾** button. It switches from Sep 22 to **Today, Sep 27**, which adds the purple **Walk-in Queue (today only)** |
| 22.5–26.5s | **Live Walk-in Queue pop-up:** chair status (Marcus / Dre / Luis), the queue with a new QR join, and the owner taps **Notify** — "Sam got a text: Your chair with Dre is ready" |
| 26.5–30s | UI tilts back, the UNYXO mark draws in, then **SMART BOOKING & SCHEDULING** and *Business done better* appear |

Outputs:
- `out/unyxo-smart-booking-ad-reels.mp4` — **Instagram Reels**: 1080×1920 (9:16), H.264 High@4.2, 30 fps, AAC audio track, faststart. All text stays inside the Reels safe area (roughly y 220–1540 px, x 60–1020 px), clear of Instagram's top bar, right-hand buttons and bottom caption area.
- `out/unyxo-smart-booking-ad.mp4` — 1920×1080 (16:9) for YouTube / web.

## Preview / re-render
- Open `ad/index.html` in a browser to watch the 16:9 version loop, or `ad/index.html?portrait` for the 9:16 Reels layout. Add `&t=4.5` (or `?t=4.5`) to freeze a frame.
- `npm install`, then `node render.mjs` (16:9) or `node render.mjs --portrait` (Reels). Set `FFMPEG` and `CHROME` env vars if needed; add `--stills 1,5,9` to export PNG frames instead.
