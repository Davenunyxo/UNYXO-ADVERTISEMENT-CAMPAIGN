"""Sound design for the Unyxo finance ad (finance-ad/sfx.wav), cued to finance-ad/index.html.

Everything is synthesised (no samples / licences). Timeline:
0–6 shell game · 6–12 dashboard · 12–16 growth ($ + cha-ching) · 16–20 brand.
Usage: python3 finance-ad/sfx.py   (needs numpy)
"""
import wave
import numpy as np

SR = 48000
DUR = 20.0
rng = np.random.default_rng(11)
mix = np.zeros((int(SR * DUR) + SR, 2))


def t_axis(d): return np.arange(int(SR * d)) / SR


def env(n, attack=0.004, decay=None):
    t = np.arange(n) / SR
    return np.clip(t / attack, 0, 1) * (np.exp(-t / decay) if decay else 1.0)


def glide(f0, f1, d):
    t = t_axis(d)
    return 2 * np.pi * np.cumsum(f0 * (f1 / f0) ** (t / d)) / SR


def band_noise(d, lo, hi):
    n = int(SR * d)
    spec = np.fft.rfft(rng.standard_normal(n))
    f = np.fft.rfftfreq(n, 1 / SR)
    spec[(f < lo) | (f > hi)] = 0
    x = np.fft.irfft(spec, n)
    return x / (np.abs(x).max() + 1e-9)


def add(t0, sig, vol=1.0, pan=0.0):
    i = int(t0 * SR)
    sig = sig[: len(mix) - i] * vol
    mix[i:i + len(sig), 0] += sig * np.sqrt((1 - pan) / 2) * 1.414
    mix[i:i + len(sig), 1] += sig * np.sqrt((1 + pan) / 2) * 1.414


# ---------------------------------------------------------------- instruments
def blip(f0, f1, d=0.09, decay=0.035):
    return np.sin(glide(f0, f1, d)) * env(int(SR * d), 0.002, decay)


def tick(f=2200, d=0.03):
    return np.sin(2 * np.pi * f * t_axis(d)) * env(int(SR * d), 0.001, 0.008)


def whoosh(d, rise=True):
    n = int(SR * d)
    edges = np.geomspace(200, 11000, 9)
    bands = [band_noise(d, edges[k], edges[k + 1]) for k in range(8)]
    pos = np.linspace(0, 7, n) if rise else np.linspace(7, 0, n)
    out = sum(b * np.clip(1 - np.abs(pos - k) / 1.6, 0, 1) for k, b in enumerate(bands))
    return out * np.sin(np.pi * np.linspace(0, 1, n) ** (0.7 if rise else 1.3)) ** 2 * 0.6


def boom(d=1.2, f0=110, f1=38):
    n = int(SR * d)
    body = np.tanh(1.8 * np.sin(glide(f0, f1, d))) * env(n, 0.002, 0.33)
    hit = band_noise(0.12, 60, 2500) * env(int(SR * 0.12), 0.001, 0.02)
    body[: len(hit)] += 0.5 * hit
    return body


def kick():
    return np.tanh(2.2 * np.sin(glide(150, 45, 0.35))) * env(int(SR * 0.35), 0.001, 0.09)


def clack(f=900):
    """Hard shell touching the metal table."""
    n = int(SR * 0.25)
    click = band_noise(0.02, 1500, 9000) * env(int(SR * 0.02), 0.0003, 0.004)
    body = (np.sin(2 * np.pi * f * t_axis(0.25)) + 0.5 * np.sin(2 * np.pi * f * 2.7 * t_axis(0.25))) * env(n, 0.001, 0.035)
    thud = np.sin(glide(180, 70, 0.25)) * env(n, 0.001, 0.05)
    out = 0.5 * body + 0.8 * thud
    out[: len(click)] += click
    return out


def slap():
    """Stack of bills landing."""
    return band_noise(0.12, 300, 5000) * env(int(SR * 0.12), 0.001, 0.025) + 0.7 * np.sin(glide(120, 60, 0.12)) * env(int(SR * 0.12), 0.001, 0.04)


def chime(notes, gap=0.08, decay=0.45):
    out = np.zeros(int(SR * (gap * len(notes) + decay * 4)))
    for k, f in enumerate(notes):
        t = t_axis(decay * 4)
        tone = (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)) * env(len(t), 0.003, decay)
        i = int(k * gap * SR)
        out[i:i + len(tone)] += tone / 1.4
    return out


def cha_ching():
    """Cash-register 'cha' (drawer/mechanism burst) then a bright bell 'ching' with coin sparkle."""
    out = np.zeros(int(SR * 1.6))
    cha = band_noise(0.07, 2500, 11000) * env(int(SR * 0.07), 0.0005, 0.018)
    mech = band_noise(0.05, 400, 3000) * env(int(SR * 0.05), 0.0005, 0.012)
    out[: len(cha)] += 0.7 * cha
    out[int(0.03 * SR): int(0.03 * SR) + len(mech)] += 0.5 * mech
    t = t_axis(1.4)
    partials = [(2093, 1), (2637, .7), (3136, .55), (4186, .35), (5274, .22), (6272, .12)]
    bell = sum(a * np.sin(2 * np.pi * f * (1 + 0.0007 * k) * t) for k, (f, a) in enumerate(partials))
    bell *= env(len(t), 0.002, 0.38) * (1 + 0.15 * np.sin(2 * np.pi * 6 * t))
    i = int(0.09 * SR)
    out[i:i + len(bell)] += 0.45 * bell
    for _ in range(9):                     # coins
        f = rng.uniform(3200, 7200); s = rng.uniform(0.1, 0.45)
        p = np.sin(2 * np.pi * f * t_axis(0.12)) * env(int(SR * 0.12), 0.001, 0.02)
        j = int(s * SR)
        out[j:j + len(p)] += 0.18 * p
    return out


def coin(f=3520):
    t = t_axis(0.5)
    return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t)) * env(len(t), 0.001, 0.12)


def riser(d=1.0, f0=160, f1=950):
    t = t_axis(d)
    return (np.sin(glide(f0, f1, d)) * 0.5 + whoosh(d, True) * 0.8) * (t / d) ** 2


def shimmer(d=1.0, count=14):
    out = np.zeros(int(SR * d))
    for _ in range(count):
        f = rng.uniform(2200, 6200); s = rng.uniform(0, d * 0.5)
        tone = np.sin(2 * np.pi * f * t_axis(d - s)) * env(int(SR * (d - s)), 0.004, 0.22)
        i = int(s * SR)
        out[i:i + len(tone)] += tone / count * 3
    return out


def tension(d=1.2):
    """Unresolved minor-second pad for the empty-shell reveal."""
    t = t_axis(d)
    return (np.sin(2 * np.pi * 220 * t) + np.sin(2 * np.pi * 233.1 * t) + 0.5 * np.sin(2 * np.pi * 110 * t)) * env(len(t), 0.02, 0.45) * 0.4


# ------------------------------------------------------------------- cue sheet
# 0–6 · the shell game
add(0.0, whoosh(0.75, False), 0.35)                  # macro close-up snaps back (fast pan-in)
add(0.02, boom(1.4, 80, 35), 0.4)
add(0.66, whoosh(0.4, False), 0.25, 0.0)             # cash drops in
add(1.0, slap(), 0.55)
add(1.33, clack(820), 0.55)                          # coconut covers the cash
for k in range(9):                                   # nine fast shuffles, 0.2s each
    s, pan = 1.55 + k * 0.23, (-0.5, 0.5, -0.3, 0.3, 0.5, -0.5, 0.3, -0.3, 0.0)[k]
    add(s, whoosh(0.2, k % 2 == 0), 0.28, pan)
    add(s + 0.19, clack(700 + 35 * k), 0.32, pan)
add(3.98, whoosh(0.5, True), 0.3)                    # the chosen shell lifts…
add(4.35, tension(), 0.55)                           # …empty
add(4.38, boom(0.9, 90, 45), 0.4)
for k in range(3):                                   # headline lines
    add(4.25 + 0.2 * k, tick(1760 - 120 * k, 0.05), 0.18)
add(5.2, riser(0.8), 0.35)                           # zoom-through into the empty spot
add(5.6, whoosh(0.45, True), 0.35, 0.4)
add(6.0, boom(), 0.55)
# 6–12 · dashboard
add(6.05, whoosh(1.0, False), 0.25)                  # dashboard swings in
for k in range(2):
    add(6.35 + 0.36 * k, tick(1568 + 200 * k, 0.05), 0.2)
for k in range(18):                                  # KPIs counting up
    add(6.9 + k * 0.065, tick(1400 + k * 60, 0.02), 0.07, (k % 3 - 1) * 0.4)
add(7.2, np.sin(glide(300, 1100, 1.5)) * env(int(SR * 1.5), 0.2, 0.9) * 0.3, 0.35)   # revenue line draws
for k in range(12):                                  # bars grow
    add(7.6 + k * 0.07, blip(500 + k * 55, (500 + k * 55) * 1.5, 0.07), 0.12, -0.6 + 0.1 * k)
for k in range(4):                                   # table rows
    add(8.6 + 0.18 * k, tick(2000, 0.03), 0.14)
add(9.4, blip(900, 1400, 0.1), 0.2, 0.4)             # call-outs
add(9.7, blip(800, 1200, 0.1), 0.2, -0.4)
add(10.3, whoosh(0.7, True), 0.3)                    # exploded layers
add(11.05, riser(1.0), 0.35)                         # push into the revenue peak
add(12.0, boom(1.4), 0.6)
add(12.0, shimmer(1.2, 18), 0.35)
# 12–16 · growth: $ on the beat, cha-ching on the big hits
for b in np.arange(12.4, 15.45, 0.5):
    add(b, kick(), 0.4)
for s in (12.4, 13.4, 14.4):
    add(s, cha_ching(), 0.7, (-0.3, 0.3, 0.0)[int((s - 12.4) // 1)])
for k, s in enumerate((12.9, 13.9, 14.9)):
    add(s, coin(3520 + 300 * k), 0.3, (0.5, -0.5, 0.4)[k])
add(15.15, whoosh(0.8, False), 0.35)                 # pull-back
# 16–20 · brand
add(15.9, whoosh(1.0, True), 0.35, 0.6)              # logo pans in from the right
add(16.95, boom(1.6), 0.6)
add(16.95, shimmer(1.4, 18), 0.4)
for k in range(2):
    add(17.4 + 0.24 * k, tick(1760 + 200 * k, 0.05), 0.18)
add(18.2, chime([1047, 1319, 1568, 2093], 0.09, 0.5), 0.3)

# --------------------------------------------------------------- master
ir_t = t_axis(1.2)
ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t / 0.25); ir[0] = 0
size = 1 << (len(mix) + len(ir) - 1).bit_length()
wet = np.stack([np.fft.irfft(np.fft.rfft(mix[:, c], size) * np.fft.rfft(ir, size), size)[: len(mix)] for c in (0, 1)], 1)
out = mix + 0.12 * wet / (np.abs(wet).max() + 1e-9) * np.abs(mix).max()
out = np.tanh(1.3 * out / (np.abs(out).max() + 1e-9)) / np.tanh(1.3) * 0.89
out = out[: int(SR * DUR)] * np.clip((DUR - t_axis(DUR)) / 0.5, 0, 1)[:, None]
with wave.open('finance-ad/sfx.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((out * 32767).astype('<i2').tobytes())
print('wrote finance-ad/sfx.wav')
