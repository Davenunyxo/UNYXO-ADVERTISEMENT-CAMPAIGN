# Unyxo Systems — "Stop Guessing With Your Finances"

**Format:** 20s · 1080×1920 (9:16, Instagram Reels) · 30 fps · H.264 High + AAC
**Look:** dark-mode cyber-minimalism. Background `#09090B`, electric cyan `#22D3EE` and purple `#A855F7` neon, emerald `#10B981` for money and growth, glass cards, Poppins type, light film grain and vignette.
**Camera language (from the reference product-site recording):**
1. Extreme diagonal macro close-up that pulls back into a clean, centred hero shot.
2. Thin "spec" call-outs flanking the subject.
3. An element lifting straight up to reveal what's underneath (the reference's lid lift).
4. Exploded view: layers separating in depth.
5. Push-in / depth-of-field into a detail.
6. Full-bleed colour section with a huge stat and echo trails behind the type.
7. A clean, centred brand reveal with a soft backlight.

Headlines use the reference's **echo type**: each line lands with two trailing ghost copies that slide in behind it and converge.

Files: `index.html` (the animation, also a live preview in any browser), `sfx.py` (the sound design, which generates `sfx.wav`). Render with:

```bash
python3 finance-ad/sfx.py
node render.mjs --portrait --page finance-ad/index.html --audio finance-ad/sfx.wav --duration 20 --out out/unyxo-finance-ad-reels.mp4
```

---

## Scene 1 — The Shell Game · 0.0–6.0s

| Time | Picture | Motion spec | Sound |
|---|---|---|---|
| 0.0–1.5 | Macro close-up of a glossy black shell and its cyan/purple rim light, tilted −26°, on a brushed-metal table | Camera: scale 2.9 → 1, rotate −26° → 0°, translate (−150, +120) → 0. Ease in-out cubic. Reference move #1. | Reverse whoosh + low sub swell |
| 1.35–1.8 | A $10K cash stack drops in under the hovering centre shell | Drop from −700px with ease-out and a 10px settle bounce. Mirrored reflection on the table. | Whoosh down → paper slap |
| 1.6–4.2 | Spec call-outs: `01 YOUR CASH ———— SOMEWHERE ?` | Slide in 40px from the sides, fade out before the lift. Reference move #2. | — |
| 1.9–2.25 | Centre shell lowers over the cash | Ease in-out; the cash hides under it | Shell clack on the metal |
| 2.35–3.94 | Four fast swaps: (0↔1), (1↔2), (0↔2), (0↔1), 0.36s each | Shells travel on arcs: the front shell moves +60px and scales 1.09, the back shell moves −46px and scales 0.92. Up to 5px motion blur. Reflections follow. | A whoosh plus a clack for each swap, panned left/right |
| 3.98–4.5 | The chosen (centre) shell lifts straight up and tilts −9°. **It's empty.** A cyan glow marks the empty spot. | Lift −280px, ease-out cubic. Reference move #3. | Rising whoosh → unresolved minor-second pad + soft boom |
| 4.25–5.5 | **"your finances / shouldn't be a / guessing game."** ("guessing game" in a cyan→purple gradient) | Echo-type entrance, 0.2s stagger per line, blur 10px → 0 | Three ticks |
| 5.45–6.05 | **Transition:** camera dives into the empty spot, a diagonal neon light streak wipes across, and a cyan-white flash hits | Camera scale ×7 (ease-in), blur to 14px, 24° streak sweep; flash peaks at 6.0s | Riser → whoosh → impact at 6.0 |

**Motion prompt:** *Extreme macro of a glossy obsidian shell on brushed gunmetal, cyan and purple rim light, shallow depth of field, camera rotating from a 26° dutch angle and pulling back to a symmetrical three-shell hero shot. A banded $10K stack drops under the centre shell. Four whip-fast shuffles on arcs with motion blur and table reflections. The centre shell lifts in a clean vertical reveal: nothing underneath, only a cold cyan glow. Kinetic lowercase headline with trailing echo copies. Crash-zoom into the empty spot, neon light-streak wipe, white-cyan flash.*

---

## Scene 2 — Financial Control & Analytics · 6.0–12.0s

| Time | Picture | Motion spec | Sound |
|---|---|---|---|
| 6.0–7.25 | Glass UNYXO Finance dashboard swings in from a steep diagonal | rotateX 42° → 0, rotateZ −17° → 0, scale 1.3 → 1, +260px → 0. Ease-out quint. The reference's diagonal-to-straight move. | Whoosh |
| 6.35–7.1 | **"keep track of all your financials / in one convenient space"** | Echo type; the second line uses the cyan→purple gradient | Two ticks |
| 6.9–8.1 | KPI cards count up: Revenue **$148,920** ▲32% · Expenses **$61,480** ▼12% · Net profit **$87,440** ▲48% | Ease-out count | Accelerating ticks |
| 7.2–8.7 | Revenue-growth line draws Jan→Dec, glowing cyan→purple, with a light riding its tip | Clip reveal, ease in-out | Rising sine sweep |
| 7.6–8.9 | 12 monthly-profit bars grow | Back-ease, 0.07s stagger | Pitched blips |
| 8.6–9.5 | Quarterly table fills Q1→Q4 (revenue, expenses, profit, growth in green) | Slide in 40px, 0.18s stagger | Row clicks |
| 9.4–10.3 | Call-outs pop: `Costs down 12%` and `Q4 · best quarter` (next to the revenue peak) | Back-ease scale | Two blips |
| 10.35–11.0 | **Exploded view:** the cards separate in depth as the panel rotates (rotateX +16°, rotateY −20°) | translateZ: KPIs 70 · line 150 · bars 95 · table 35px. Reference move #4. | Whoosh |
| 11.1–12.05 | **Transition:** depth-of-field (every card except the revenue chart blurs to 10px), then a push-in on the revenue peak into an emerald flash | Camera scale ×4.2 on the peak (950, 790). Reference move #5. | Riser → impact + shimmer at 12.0 |

The figures are internally consistent: quarterly revenue adds up to $148,920, expenses to $61,480 and profit to $87,440. Q1→Q4 profit goes from $9,900 to $36,220, which is the +266% used in scene 3. They're demo numbers for the ad.

**Motion prompt:** *Dark glassmorphism finance dashboard swinging from a steep dutch-angle perspective into a flat, straight-on frame. Neon cyan-to-purple revenue line drawing itself with a glowing head. Gradient bars springing up in sequence. Quarterly table rows sliding in. Floating call-out chips. The UI then explodes into depth layers like an exploded product diagram. Rack focus to the revenue chart and a crash push-in on its peak.*

---

## Scene 3 — Growth & Revenue Realized · 12.0–16.0s

| Time | Picture | Motion spec | Sound |
|---|---|---|---|
| 12.0–13.4 | Full-bleed emerald field with a faint grid and a glowing trend line sweeping up across the frame | Stroke draw; camera eases 1.12 → 1. Reference move #6: the full-colour stat section. | — |
| 12.2–12.8 | **PROFIT GROWTH · Q1 → Q4 / +266%** (huge white→emerald type) and **$148,920 · revenue this year** counting up | Echo type with 60px trails; the stat pulses +5% on every beat | — |
| 12.4–15.4 | Glass **$** coins (emerald and cyan) emerge on the beat and bounce rhythmically with squash and stretch | New coin every 0.5s; bounce height 80px with slow decay | **Kick on every beat (0.5s)** · **cha-ching at 12.4, 13.4 and 14.4** · coin pings at 12.9, 13.9 and 14.9 |
| 15.2–16.0 | **Transition:** camera pulls back and the whole scene shrinks into a rounded card that fades to black | Scale 1 → 0.3, corner radius → 120px | Reverse whoosh |

**Motion prompt:** *Full-bleed deep emerald scene with a subtle grid and a luminous growth curve sweeping upward. Massive "+266%" with motion-trail echo copies, pulsing on the beat. Glossy glass dollar coins popping in on a 120 BPM grid, bouncing with squash and stretch, each hit landing on a cash-register cha-ching. Cinematic pull-back as the scene collapses into a floating card.*

---

## Scene 4 — Call to Action & Branding · 16.0–20.0s

| Time | Picture | Motion spec | Sound |
|---|---|---|---|
| 15.9–17.1 | The official UNYXO mark pans in from the right into the centre, with a cyan and purple backlight blooming behind it | translateX +760 → 0, rotateY −55° → 0, scale 0.8 → 1, ease-out quint. The glows drift and breathe. | Whoosh → impact + shimmer at 16.95 |
| 16.9–17.6 | **UNYXO** wordmark | Letter-spacing 46 → 26px | — |
| 17.4–18.2 | **"track your financials / with Unyxo"** ("with Unyxo" in gradient) | Echo type | Two ticks |
| 18.2–20.0 | **"Business done better."** Hold. | Fade up 16px | Four-note resolving chime |

**Motion prompt:** *Deep-black void. The white UNYXO emblem glides in from the right on a 3D swing, settling dead centre while cyan and purple neon backlights bloom and breathe behind it. The wordmark tightens into place, then the CTA "track your financials with Unyxo" lands with echo trails. Hold on the brand.*

---

## Safe zones (Reels)
All text sits between y ≈ 250 and 1500px, clear of Instagram's top bar, the right-hand buttons and the caption area at the bottom.
