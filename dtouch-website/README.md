# D Touch Barber Studio — website

A cinematic, scroll-driven site for D Touch Barber Studio. The page tells one continuous story:

**clipper close-up → camera pulls back → D TOUCH emerges from the clipper → Barber Studio → Precision / Detail / Style / Confidence → Services → Barbers → Before/After → The Studio → Why clients come back → Reviews → Booking → Your style. Our touch. D TOUCH.**

Preview recordings: `preview/dtouch-scroll-desktop.mp4`, `preview/dtouch-scroll-mobile.mp4`.

## Run it

It's a static site: no build step, and it works on any host (Netlify, Vercel, GitHub Pages, Cloudflare Pages, or regular web hosting).

```bash
cd dtouch-website
python3 -m http.server 8080     # then open http://localhost:8080
```

Open it through a web server rather than double-clicking `index.html`. Browsers block the self-hosted fonts over `file://`.

## Edit the business information

Everything the site says about the business is in **`assets/js/config.js`**:

| Field | What it does |
|---|---|
| `bookingUrl` | Where every BOOK button goes: Booksy, Square, Fresha, StyleSeat, Vagaro and so on. External links open in a new tab. |
| `services` | Name, description, duration, price and card image for each service. Empty values show "—" plus a "to be confirmed" note. Delete any service the studio doesn't offer. |
| `barbers` | Name, specialty and portrait photo path for each barber. Cards show "Barber name / Portrait coming soon" until filled in. |
| `beforeImage` / `afterImage` | Photos for the before/after slider in "The D Touch Difference". |
| `reviews` | Real client reviews only (`{ name, text, rating }`). While it's empty, the section shows a "reviews will appear here" panel. |
| `address`, `mapsUrl`, `phone`, `email`, `instagram`, `hours`, `googleReviewsUrl` | Shown in the booking / contact section. |

No reviews, barbers, prices or contact details were invented. Every one of them is a clearly marked placeholder until real information is added.

## Images

| File | Used for |
|---|---|
| `assets/img/clipper.webp` | The provided Wahl clipper, cut out from its background at 3× the source size. Used for the hero, the macro close-ups, some service cards and the final section. |
| `assets/img/studio.webp` | The provided studio interior photo, with the map widget cropped off. Used for "Step into D Touch", the detail strip and some service cards. |
| `assets/img/og.jpg` | Social share preview. |

**Recommended upgrades:**
- A high-resolution clipper photo, at least 2000px tall on a plain background, will make the hero close-up noticeably sharper. The current source is only 402×780px. Replace `clipper.webp` with the same framing and nothing else needs to change.
- Real photos of haircuts, fades and beard work, plus barber portraits and before/after shots. Add them through `config.js`.

## How it's built

- `index.html`: semantic markup. Section headings are real `<h1>`/`<h2>` for SEO, and the page includes meta and Open Graph tags plus schema.org `BarberShop` data.
- `assets/css/style.css`: the design system. Deep black and charcoal, Archivo Expanded for display type, Inter for body text, and a single restrained blue taken from the clipper's accent.
- `assets/js/main.js`: renders the config and runs all motion with **GSAP ScrollTrigger**, plus **Lenis** smooth scrolling. Everything is self-hosted in `assets/vendor/` and `assets/fonts/`.
- **D TOUCH 3D emblem:** real CSS 3D. Each letter is a stack of extrusion layers behind a dark-chrome face, with blue edge light on the back layer and a light-sweep layer on top. It's built from text, so it stays sharp at any size and needs no WebGL.
- **Hero sequence:** a pinned, scroll-scrubbed timeline. Diagonal close-up → pull back to an upright product shot with call-outs → blue light at the centre → letters push out of the clipper and spread sideways → light sweep → camera push → "Barber Studio", tagline and CTAs.
- **Mobile:** shorter pinned sequences, a lighter emblem, vertically stacked services and a persistent "Book appointment" bar.
- **Accessibility:** `prefers-reduced-motion` turns off smoothing and pinning and shows the final states. The page also has a skip link, focus styles, alt text and ARIA labels.

## Tools

- `tools/shots.mjs`: screenshots at chosen scroll positions (`node dtouch-website/tools/shots.mjs 0,2,5` or `--mobile`).
- `tools/record.mjs`: records a scroll-through MP4 into `preview/`.
- Both use `?capture`, which switches off smooth scrolling so the scroll animations follow the scroll position exactly.
