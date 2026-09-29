"""Score + sound design for the Unyxo trailer ("Music by a very dramatic synthesizer").

Fully synthesised (numpy only): braams, synth brass fanfare, pulse ostinato, risers, impacts and
comic SFX, all cued to trailer/main.js. Writes trailer/score.wav (48 kHz stereo, ~-14 LUFS).
"""
import wave
import numpy as np

SR, DUR = 48000, 30.0
rng = np.random.default_rng(3)
mix = np.zeros((int(SR * DUR) + SR * 2, 2))
N = lambda d: int(SR * d)
T = lambda d: np.arange(N(d)) / SR
hz = lambda m: 440.0 * 2 ** ((m - 69) / 12)          # MIDI → Hz


def env(n, a=.005, d=None, r=None):
    t = np.arange(n) / SR
    e = np.clip(t / a, 0, 1) * (np.exp(-t / d) if d else 1.0)
    if r:
        e *= np.clip((n / SR - t) / r, 0, 1)
    return e


def glide(f0, f1, d):
    t = T(d)
    return 2 * np.pi * np.cumsum(f0 * (f1 / f0) ** (t / d)) / SR


def noise(d, lo, hi):
    n = N(d); sp = np.fft.rfft(rng.standard_normal(n)); f = np.fft.rfftfreq(n, 1 / SR)
    sp[(f < lo) | (f > hi)] = 0; x = np.fft.irfft(sp, n); return x / (np.abs(x).max() + 1e-9)


def add(t0, sig, vol=1., pan=0.):
    i = N(t0); sig = sig[: len(mix) - i] * vol
    mix[i:i + len(sig), 0] += sig * np.sqrt((1 - pan) / 2) * 1.414
    mix[i:i + len(sig), 1] += sig * np.sqrt((1 + pan) / 2) * 1.414


# ---------------------------------------------------------------- instruments
def brass(notes, d, a=.08, bright=1.0, vib=.004):
    """Synth brass: additive saw whose brightness opens with the envelope."""
    t = T(d); e = np.clip(t / a, 0, 1) * np.clip((d - t) / .35, 0, 1)
    br = np.clip(t / (a * 3), 0, 1) * bright
    out = np.zeros(len(t))
    for m in notes:
        f = hz(m) * (1 + vib * np.sin(2 * np.pi * 5.2 * t))
        for det in (-.0025, .0025):
            ph = 2 * np.pi * np.cumsum(f * (1 + det)) / SR
            for h in range(1, 16):
                cutoff = 1 + br * 13
                amp = (1 / h) * np.clip(cutoff - h + 1, 0, 1)
                out += amp * np.sin(h * ph)
    return np.tanh(1.2 * out / (len(notes) * 3)) * e


def braam(root=24, d=3.0):
    b = brass([root, root + 12, root + 19, root + 24], d, a=.03, bright=.8, vib=.0)
    sub = np.sin(glide(hz(root) * 1.02, hz(root), d)) * env(N(d), .01, 1.2)
    hit = noise(.25, 40, 3000) * env(N(.25), .001, .05)
    out = np.tanh(2.2 * (b + .9 * sub)) * .8; out[:len(hit)] += .6 * hit
    return out


def boom(d=1.4, f0=110, f1=34):
    b = np.tanh(2 * np.sin(glide(f0, f1, d))) * env(N(d), .002, .35)
    h = noise(.15, 50, 3000) * env(N(.15), .001, .025); b[:len(h)] += .6 * h; return b


def whoosh(d, rise=True, lo=200, hi=11000):
    n = N(d); edges = np.geomspace(lo, hi, 9); bands = [noise(d, edges[k], edges[k + 1]) for k in range(8)]
    pos = np.linspace(0, 7, n) if rise else np.linspace(7, 0, n)
    out = sum(b * np.clip(1 - np.abs(pos - k) / 1.6, 0, 1) for k, b in enumerate(bands))
    return out * np.sin(np.pi * np.linspace(0, 1, n) ** (.7 if rise else 1.3)) ** 2 * .6


def riser(d, f0=120, f1=1500):
    t = T(d); return (np.sin(glide(f0, f1, d)) * .4 + whoosh(d, True) * .9) * (t / d) ** 2.2


def blip(f0, f1, d=.09, dec=.035):
    return np.sin(glide(f0, f1, d)) * env(N(d), .002, dec)


def bell(notes, gap=.08, dec=.5):
    out = np.zeros(N(gap * len(notes) + dec * 4))
    for k, m in enumerate(notes):
        t = T(dec * 4); f = hz(m)
        tone = (np.sin(2 * np.pi * f * t) + .35 * np.sin(2 * np.pi * f * 2.01 * t) + .15 * np.sin(2 * np.pi * f * 3.02 * t)) * env(len(t), .002, dec)
        i = N(k * gap); out[i:i + len(tone)] += tone / 1.5
    return out


def pluck(m, d=.6):
    t = T(d); f = hz(m)
    return (np.sin(2 * np.pi * f * t) + .3 * np.sin(4 * np.pi * f * t) * np.exp(-t * 8)) * env(len(t), .002, .22)


def pad(notes, d, a=.8, r=1.0):
    t = T(d); out = sum(np.sin(2 * np.pi * hz(m) * (1 + dt) * t + ph) for m in notes for dt, ph in ((-.003, 0), (.003, 1.1)))
    return out / (2 * len(notes)) * np.clip(t / a, 0, 1) * np.clip((d - t) / r, 0, 1)


def kick():
    return np.tanh(2.2 * np.sin(glide(150, 42, .35))) * env(N(.35), .001, .09)


def hat(d=.05):
    return noise(d, 7000, 16000) * env(N(d), .0005, .01)


def stamp():
    out = .8 * np.tanh(3 * np.sin(glide(160, 60, .25))) * env(N(.25), .001, .05)
    n = noise(.08, 200, 3000) * env(N(.08), .0005, .015); out[:len(n)] += n
    return out


def cha_ching():
    out = np.zeros(N(1.6)); c = noise(.07, 2500, 11000) * env(N(.07), .0005, .018); out[:len(c)] += .7 * c
    b = bell([96, 100, 103, 108], .0, .4) * .6; i = N(.09); out[i:i + len(b)] += b[: len(out) - i]
    for _ in range(9):
        p = np.sin(2 * np.pi * rng.uniform(3200, 7200) * T(.12)) * env(N(.12), .001, .02); j = N(rng.uniform(.1, .45)); out[j:j + len(p)] += .18 * p
    return out


def buzz(f=110, d=.35):
    t = T(d); return np.tanh(3 * sum(np.sin(2 * np.pi * f * h * t) / h for h in range(1, 8))) * env(N(d), .003, None, .05) * .5


def jet(d=1.8):
    """Jet flyby: filtered noise + whine with doppler drop."""
    t = T(d); x = t / d
    roar = noise(d, 150, 5000) * np.exp(-((x - .5) / .28) ** 2)
    whine = np.sin(glide(1900, 1100, d)) * np.exp(-((x - .5) / .22) ** 2) * .25
    return roar * .8 + whine


def rip():
    return noise(.28, 800, 9000) * env(N(.28), .004, None, .05) * (1 + .6 * np.sin(2 * np.pi * 60 * T(.28)))


def projector(d):
    t = T(d); return noise(d, 900, 6000) * (.5 + .5 * (np.sin(2 * np.pi * 24 * t) > 0)) * .12


# ---------------------------------------------------------------- cue sheet
C = 48  # C3
add(0.0, projector(2.3), .5)                                           # green card
add(0.0, pad([C - 12, C - 5], 2.4, .8, .6), .15)
# presents
add(2.25, braam(24, 3.2), .9)
add(2.3, whoosh(1.4, False), .25)
add(2.35, pad([C, C + 7, C + 12, C + 16], 2.8, .6, .8), .25)          # choir-ish shimmer
for k in range(10):
    add(2.5 + k * .2, np.sin(2 * np.pi * hz(96 + (k % 5) * 2) * T(.4)) * env(N(.4), .002, .12), .05, (k % 2) * .8 - .4)
# In a world…
add(4.95, boom(2.2, 70, 30), .7)
add(5.0, brass([C - 24, C - 12], 2.1, .4, .35), .45)
add(6.3, riser(.75, 90, 900), .35)
# city — pulse ostinato 120 BPM, 16ths, 7.0 → 14.3
for k, b in enumerate(np.arange(7.0, 14.3, .125)):
    m = [C - 12, C - 12, C - 5, C - 12][k % 4] + (0 if b < 10.3 else [0, 3, 5, 7][int((b - 10.3) // 1) % 4])
    add(b, np.tanh(2 * np.sin(2 * np.pi * hz(m) * T(.12))) * env(N(.12), .002, .04), .22 + .1 * min(1, (b - 7) / 7))
for b in np.arange(7.0, 14.3, .5):
    add(b, kick(), .45)
for b in np.arange(7.25, 14.3, .5):
    add(b, hat(), .12)
add(7.0, whoosh(1.2, False), .3)
add(8.0, riser(.95, 140, 1400), .4)
add(8.85, boom(1.6), .9)                                               # 47 SPREADSHEETS slam
add(8.87, brass([C - 12, C - 5, C, C + 7], .9, .02, 1.0), .5)
add(8.9, bell([91, 96, 100], .05, .5), .25)
# villains (10.3, 11.3, 12.3, 13.3): stab + gag each
for k, (s, stab) in enumerate(zip((10.3, 11.3, 12.3, 13.3), ([C, C + 3, C + 7], [C + 2, C + 5, C + 9], [C + 3, C + 7, C + 10], [C + 1, C + 4, C + 7]))):
    add(s, brass(stab, .45, .01, 1.0), .5)
    add(s - .05, whoosh(.18, k % 2 == 0), .35, (k % 2) * .8 - .4)
add(10.5, stamp(), .7)                                                # OVERDUE stamp
add(10.45, np.sin(glide(300, 120, .4)) * env(N(.4), .003, .15), .25)  # grumpy "bwomp"
for k, s in enumerate((11.35, 11.5, 11.62, 11.72, 11.8, 11.87)):      # group chat pings
    add(s, bell([88 + (k % 3) * 2, 95], .05, .12), .16, (k % 3 - 1) * .6)
add(12.35, whoosh(.35, True, 1000, 12000), .3, .6)                     # reply-all "sent"
add(12.55, bell([84, 91, 96], .06, .2), .2)
add(13.38, buzz(98, .32), .4)                                          # #REF! error
add(13.75, buzz(92, .25), .3)
# chaos
add(14.25, riser(.12, 300, 2000), .3)
add(14.3, boom(2.2, 90, 28), 1.0)
add(14.3, noise(1.8, 40, 6000) * env(N(1.8), .002, .45), .6)          # explosion body
for k in range(14):                                                   # debris
    add(14.4 + rng.uniform(0, 1.2), noise(.06, 1500, 9000) * env(N(.06), .0005, .01), .12, rng.uniform(-.8, .8))
add(14.35, brass([C - 12, C - 11, C - 5], 1.5, .05, .9), .45)          # dissonant cluster
# It's a plane! — sudden quiet, then a jet flyby across the frame
jt = jet(1.8); j0 = N(16.0)
pan = np.linspace(-.9, .9, len(jt))
mix[j0:j0 + len(jt), 0] += jt * np.sqrt((1 - pan) / 2) * 1.414 * .55
mix[j0:j0 + len(jt), 1] += jt * np.sqrt((1 + pan) / 2) * 1.414 * .55
add(16.55, blip(900, 1400, .12), .15)
# hero: swoop, landing, fanfare
add(17.4, riser(1.6, 100, 1800), .55)
add(18.2, whoosh(.9, True), .45)
add(19.02, boom(2.4, 120, 30), 1.0)
add(19.05, noise(1.0, 60, 4000) * env(N(1.0), .002, .2), .4)
fan = [(19.1, [C, C + 4, C + 7, C + 12], .45), (19.6, [C - 2, C + 2, C + 5, C + 10], .45), (20.1, [C + 5, C + 9, C + 12, C + 17], .35), (20.45, [C + 7, C + 12, C + 16, C + 19], .55)]
for s, ch, d in fan:
    add(s, brass(ch, d + .1, .03, 1.0, .006), .55)
add(19.1, braam(24, 1.8), .45)
add(19.35, whoosh(.25, True, 2000, 12000), .2, .5)
add(19.45, bell([88, 95], .07, .18), .25)                              # "has entered the chat" message pop
add(20.55, riser(.3, 400, 3000), .35)
# One system — calm, modern
add(20.8, boom(1.0, 80, 40), .35)
add(20.8, pad([C, C + 4, C + 7, C + 11], 4.6, .4, 1.0), .3)
for k, m in enumerate([C + 24, C + 28, C + 31, C + 35, C + 36, C + 31]):
    add(21.0 + k * .22, pluck(m), .3, (k % 2) * .5 - .25)
# Bookings? Invoices? The group chat?
add(22.3, whoosh(.2, True), .25)
for k in range(10):
    add(22.35 + k * .065, blip(700 + k * 90, (700 + k * 90) * 1.3, .07), .16, (k % 3 - 1) * .5)
add(23.0, bell([84, 88, 91, 96], .07, .35), .3)
add(23.3, whoosh(.2, False), .25)
add(23.58, stamp(), .75)                                              # PAID
add(23.62, cha_ching(), .6)
add(24.25, whoosh(.2, True), .25)
add(24.47, rip(), .5)                                                 # tape
add(24.62, blip(600, 300, .15, .06), .3)                              # "mute" boop
add(24.7, blip(1200, 1800, .1), .25)                                  # 99+ badge
# reviews — five star dings, rising
for k in range(5):
    add(25.3 + k * .09, bell([84 + [0, 4, 7, 11, 12][k]], .0, .4), .25, (k - 2) * .3)
add(25.2, pad([C + 5, C + 9, C + 12, C + 16], 2.2, .5, .6), .2)
# end card — final braam + resolving chord
add(27.15, riser(.25, 200, 2000), .3)
add(27.2, braam(24, 2.8), .85)
add(27.25, brass([C, C + 7, C + 12, C + 16, C + 19], 2.7, .12, .9, .005), .5)
add(27.3, pad([C + 12, C + 16, C + 19, C + 23, C + 26], 2.7, .6, 1.4), .25)
for k in range(12):
    add(27.4 + k * .13, np.sin(2 * np.pi * hz(96 + [0, 4, 7, 12][k % 4]) * T(.5)) * env(N(.5), .002, .15), .05, (k % 2) * .8 - .4)

# ---------------------------------------------------------------- master
ir_t = T(1.6); ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t / .35); ir[0] = 0
size = 1 << (len(mix) + len(ir) - 1).bit_length()
wet = np.stack([np.fft.irfft(np.fft.rfft(mix[:, c], size) * np.fft.rfft(ir, size), size)[:len(mix)] for c in (0, 1)], 1)
out = mix + .16 * wet / (np.abs(wet).max() + 1e-9) * np.abs(mix).max()
out = np.tanh(1.4 * out / (np.abs(out).max() + 1e-9)) / np.tanh(1.4) * .89
out = out[:N(DUR)] * np.clip((DUR - T(DUR)) / .8, 0, 1)[:, None]
with wave.open('trailer/score.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out * 32767).astype('<i2').tobytes())
print('wrote trailer/score.wav')
