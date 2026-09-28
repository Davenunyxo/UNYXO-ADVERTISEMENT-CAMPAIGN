"""Synthesises the ad's sound-effect track (ad/sfx.wav), cued to the on-screen actions.

Every sound is generated from sine waves and filtered noise, so there are no
third-party samples or licences involved. Cue times match the timeline in
ad/index.html (0–3.5 question · 3.5–7 introducing · 7–17.5 QR walk-in queue ·
17.5–22.5 calendar · 22.5–26.5 live-queue pop-up · 26.5–30 brand).

Usage: python3 sfx.py   (needs numpy)
"""
import wave
import numpy as np

SR = 48000
DUR = 30.0
rng = np.random.default_rng(7)
mix = np.zeros((int(SR * DUR) + SR, 2))


def t_axis(dur):
    return np.arange(int(SR * dur)) / SR


def env(n, attack=0.004, decay=None):
    """Fast attack, exponential decay (decay = time constant in s)."""
    t = np.arange(n) / SR
    a = np.clip(t / attack, 0, 1)
    d = np.exp(-t / decay) if decay else 1.0
    return a * d


def glide(f0, f1, dur):
    """Phase of a sine whose pitch glides exponentially from f0 to f1."""
    t = t_axis(dur)
    f = f0 * (f1 / f0) ** (t / dur)
    return 2 * np.pi * np.cumsum(f) / SR


def band_noise(dur, lo, hi):
    n = int(SR * dur)
    spec = np.fft.rfft(rng.standard_normal(n))
    freqs = np.fft.rfftfreq(n, 1 / SR)
    spec[(freqs < lo) | (freqs > hi)] = 0
    x = np.fft.irfft(spec, n)
    return x / (np.abs(x).max() + 1e-9)


def add(t0, sig, vol=1.0, pan=0.0):
    i = int(t0 * SR)
    sig = sig[: len(mix) - i] * vol
    mix[i:i + len(sig), 0] += sig * np.sqrt((1 - pan) / 2) * 1.414
    mix[i:i + len(sig), 1] += sig * np.sqrt((1 + pan) / 2) * 1.414


# ---------------------------------------------------------------- instruments
def blip(f0, f1, dur=0.09, decay=0.035):
    return np.sin(glide(f0, f1, dur)) * env(int(SR * dur), 0.002, decay)


def tick(f=2200, dur=0.03):
    return np.sin(2 * np.pi * f * t_axis(dur)) * env(int(SR * dur), 0.001, 0.008)


def click():
    n = int(SR * 0.04)
    noise = np.diff(rng.standard_normal(n + 1)) * env(n, 0.0005, 0.003)
    return 0.5 * noise + 0.6 * tick(3200, 0.04)


def whoosh(dur, rise=True):
    """Noise swept through bands: low→high (rise) or high→low."""
    n = int(SR * dur)
    edges = np.geomspace(250, 11000, 9)
    bands = [band_noise(dur, edges[k], edges[k + 1]) for k in range(8)]
    pos = np.linspace(0, 7, n) if rise else np.linspace(7, 0, n)
    out = np.zeros(n)
    for k, b in enumerate(bands):
        out += b * np.clip(1 - np.abs(pos - k) / 1.6, 0, 1)
    shape = np.sin(np.pi * np.linspace(0, 1, n) ** (0.7 if rise else 1.3)) ** 2
    return out * shape * 0.6


def boom(dur=1.1):
    n = int(SR * dur)
    body = np.tanh(1.8 * np.sin(glide(120, 40, dur))) * env(n, 0.002, 0.35)
    hit = band_noise(0.12, 60, 2500) * env(int(SR * 0.12), 0.001, 0.02)
    body[: len(hit)] += 0.5 * hit
    return body


def chime(notes, gap=0.08, decay=0.45):
    dur = gap * len(notes) + decay * 4
    out = np.zeros(int(SR * dur))
    for k, f in enumerate(notes):
        t = t_axis(decay * 4)
        tone = (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t))
        tone *= env(len(t), 0.003, decay)
        i = int(k * gap * SR)
        out[i:i + len(tone)] += tone / 1.4
    return out


def buzz():
    """Short "denied" double buzz."""
    out = np.zeros(int(SR * 0.4))
    for start in (0.0, 0.2):
        t = t_axis(0.14)
        tone = sum(np.sin(2 * np.pi * h * f * t) / h for f in (98, 104) for h in range(1, 7))
        tone *= env(len(t), 0.004, 0.09) * 0.25
        i = int(start * SR)
        out[i:i + len(tone)] += tone
    return out


def vibrate(dur=0.55):
    t = t_axis(dur)
    gate = ((t % 0.28) < 0.2).astype(float)
    return np.sin(2 * np.pi * 165 * t) * (0.6 + 0.4 * np.sin(2 * np.pi * 30 * t)) * gate * env(len(t), 0.01)


def shutter():
    out = np.zeros(int(SR * 0.12))
    for start in (0.0, 0.055):
        burst = band_noise(0.03, 1500, 9000) * env(int(SR * 0.03), 0.0005, 0.006)
        i = int(start * SR)
        out[i:i + len(burst)] += burst
    return out


def scan(dur=1.45):
    t = t_axis(dur)
    hum = np.sin(2 * np.pi * 1450 * t) * (0.5 + 0.5 * np.sin(2 * np.pi * 11 * t)) * 0.25
    hum *= np.clip(t / 0.1, 0, 1) * np.clip((dur - t) / 0.15, 0, 1)
    for k in np.arange(0, dur - 0.05, 0.24):
        b = tick(2400, 0.03)
        i = int(k * SR)
        hum[i:i + len(b)] += 0.6 * b
    return hum


def riser(dur=1.0):
    t = t_axis(dur)
    tone = np.sin(glide(160, 950, dur)) * 0.5 + whoosh(dur, True) * 0.8
    return tone * (t / dur) ** 2


def shimmer(dur=1.0, count=14):
    out = np.zeros(int(SR * dur))
    for _ in range(count):
        f = rng.uniform(2200, 6200)
        start = rng.uniform(0, dur * 0.5)
        tone = np.sin(2 * np.pi * f * t_axis(dur - start)) * env(int(SR * (dur - start)), 0.004, 0.22)
        i = int(start * SR)
        out[i:i + len(tone)] += tone / count * 3
    return out


# ------------------------------------------------------------------- cue sheet
qr = lambda q: 7 + 2.1 * q          # QR segment local time -> ad time
brand = lambda T: 26.5 + (T - 6) * 0.875

# 0–3.5  question
add(0.15, whoosh(0.9, True), 0.35)
add(0.95, boom(), 0.6)
add(1.35, buzz(), 0.5, -0.3)                      # FULL sign
add(1.95, blip(620, 180, 0.35, 0.12), 0.3, 0.3)   # −3 clients
add(3.0, whoosh(0.6, False), 0.35)
# 3.5–7  introducing
add(3.65, shimmer(1.1), 0.5)
add(3.72, blip(700, 1400, 0.14, 0.05), 0.25)      # logo pops in
add(4.05, boom(), 0.55)                           # title lands
for k, f in enumerate((1175, 1319, 1568)):        # feature chips
    add(5.0 + 0.15 * k, blip(f, f * 1.25, 0.08), 0.22, -0.4 + 0.4 * k)
add(6.5, whoosh(0.6, True), 0.35)
# 7–17.5  QR walk-in queue
for i in range(6):                                # seats fill up
    add(qr(0.45 + i * 0.11), blip(420 + i * 70, (420 + i * 70) * 1.6, 0.09), 0.22, -0.5 + 0.2 * i)
add(qr(1.17), buzz(), 0.5)                        # "No seats available"
add(qr(1.2), whoosh(0.8, True), 0.3, 0.4)         # phone rises
add(qr(1.8), tick(1760, 0.05), 0.25)              # step 1 lights
add(qr(1.82), scan(), 0.22, 0.4)                  # scanning
add(qr(2.55), shutter(), 0.45, 0.4)               # QR detected
add(qr(2.58), chime([1568, 2093], 0.07, 0.25), 0.3, 0.4)
add(qr(2.88), chime([1047, 1319, 1568], 0.07, 0.35), 0.35, 0.3)   # joined ✓
add(qr(3.02), blip(900, 1300, 0.08), 0.18, -0.4)  # shop sees the new join
add(qr(3.55), tick(1760, 0.05), 0.3, 0.4)         # #4 → #3
add(qr(4.0), tick(1976, 0.05), 0.3, 0.4)          # #3 → #2
add(qr(4.2), vibrate(), 0.45, 0.4)                # phone buzzes
add(qr(4.23), chime([1319, 1760], 0.12, 0.4), 0.4, 0.4)           # "It's your turn next!"
add(qr(4.72), whoosh(0.6, False), 0.3)
# 17.5–22.5  calendar
add(17.45, whoosh(0.7, True), 0.28)
for i in range(9):                                # dots sparkle in
    add(17.65 + i * 0.07, tick(1500 + i * 140, 0.04), 0.1, -0.6 + 0.15 * i)
add(18.4, whoosh(0.45, True), 0.2, 0.5)           # day panel opens
for i in range(4):
    add(18.7 + i * 0.1, click(), 0.07, 0.5)
add(19.95, whoosh(0.45, False), 0.22, 0.5)        # switch to today
for k, f in enumerate((784, 988, 1175)):          # walk-in entries pop
    add(20.7 + 0.15 * k, blip(f, f * 1.3, 0.08), 0.2, 0.5)
# 22.5–26.5  live-queue pop-up
add(23.05, click(), 0.45, 0.4)                    # "Open live queue"
add(23.1, whoosh(0.45, True), 0.3)
add(23.12, blip(380, 900, 0.16, 0.06), 0.2)
add(24.2, blip(700, 1100, 0.09), 0.22, 0.3)       # new QR join
add(24.85, click(), 0.45, 0.4)                    # "Notify Sam"
add(24.95, chime([1319, 1661, 1976], 0.06, 0.35), 0.35, 0.3)      # text sent ✓
add(25.97, whoosh(0.6, False), 0.3)
# 26.5–30  brand
add(26.55, riser(1.0), 0.32)
for k, T in enumerate((6.55, 6.9, 7.25)):         # logo nodes pop
    add(brand(T), blip((1568, 1760, 2093)[k], (1568, 1760, 2093)[k] * 1.02, 0.3, 0.12), 0.22, (-0.5, 0.5, 0)[k])
add(brand(7.1), boom(1.4), 0.75)                  # headline lands
add(brand(7.1), shimmer(1.4, 18), 0.45)
add(brand(8.6), shimmer(1.0), 0.4)                # light sweep

# --------------------------------------------------------------- master bus
ir_t = t_axis(1.3)
ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t / 0.28)
ir[0] = 0
n = len(mix) + len(ir)
size = 1 << (n - 1).bit_length()
wet = np.stack([np.fft.irfft(np.fft.rfft(mix[:, c], size) * np.fft.rfft(ir, size), size)[: len(mix)] for c in (0, 1)], 1)
out = mix + 0.12 * wet / (np.abs(wet).max() + 1e-9) * np.abs(mix).max()
out = np.tanh(1.3 * out / (np.abs(out).max() + 1e-9)) / np.tanh(1.3) * 0.89   # peak ≈ −1 dBFS
out = out[: int(SR * DUR)]
fade = np.clip((DUR - t_axis(DUR)) / 0.6, 0, 1)[:, None]
out *= fade

with wave.open('ad/sfx.wav', 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((out * 32767).astype('<i2').tobytes())
print('wrote ad/sfx.wav')
