# Unyxo Systems — 30s 3D trailer (1080×1920, Instagram Reels)

A movie-trailer parody for Unyxo, rendered in real 3D (three.js / WebGL) and scored in code.

| Time | Scene |
|---|---|
| 0–2.3 | Green "approved for **all small businesses**" card |
| 2.3–5.0 | Chrome Unyxo mark under sweeping searchlights — "UNYXO SYSTEMS presents" |
| 5.0–7.0 | "In a world…" (ember haze) |
| 7.0–10.3 | Fly-down through a city of spreadsheet skyscrapers — "where small businesses run on" → **47 SPREADSHEETS** slams in (3D gold) |
| 10.3–14.3 | The villains, 1s each with whip-pans: The Overdue Invoice · The Group Chat · Reply-All · The #REF! Error |
| 14.3–16.0 | "It was chaos." — fireball and paper storm |
| 16.0–17.4 | "It's a plane!" (it is, literally, a plane) |
| 17.4–20.8 | The caped Unyxo mark dives down the canyon, lands with a shockwave — "Unyxo Systems has entered the chat." |
| 20.8–25.2 | "One system." dashboard → Bookings? (booked while you sleep) · Invoices? (PAID) · The group chat? (MUTED) |
| 25.2–27.2 | ★★★★★ "I closed all 47 tabs." / "Two thumbs up." — Our mom |
| 27.2–30.0 | End card: unyxo SYSTEMS · Software. Simplified. · Now booking at unyxo.dev |

- `index.html` + `main.js`: the whole film. Every frame is a pure function of `t`, so renders are deterministic. Open `index.html` over http to watch it live (`?t=12.5` freezes a frame).
- `score.py`: the soundtrack ("music by a very dramatic synthesizer"): braams, a synth-brass fanfare, the pulse, risers and every gag sound, cued to the picture. Writes `score.wav`.
- `render.mjs`: renders frames with parallel headless-Chrome workers and encodes an Instagram-grade MP4.

```bash
python3 trailer/score.py
node trailer/render.mjs                    # → out/unyxo-trailer-reels.mp4
node trailer/render.mjs --stills 3.9,12,19 # → trailer/out/still-*.png
```
