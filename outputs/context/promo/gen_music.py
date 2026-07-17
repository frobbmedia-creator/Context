#!/usr/bin/env python3
"""Dark ambient tech bed for Context Engine promo — pure stdlib wave."""
import wave
import struct
import math
import random
import os

sr = 44100
dur = 35.0
n = int(sr * dur)
out = os.path.join(os.path.dirname(__file__), "music_bed.wav")

wf = wave.open(out, "w")
wf.setnchannels(2)
wf.setsampwidth(2)
wf.setframerate(sr)

rng = random.Random(42)
noise = [rng.uniform(-1, 1) for _ in range(sr)]


def soft_clip(x, t=0.9):
    return math.tanh(x / t) * t


frames = bytearray()
for i in range(n):
    t = i / sr
    env = 1.0
    if t < 1.5:
        env = t / 1.5
    if t > dur - 3.0:
        env = max(0.0, (dur - t) / 3.0)

    d1 = math.sin(2 * math.pi * 55.0 * t)
    d2 = 0.55 * math.sin(2 * math.pi * 82.5 * t + 0.3)
    d3 = 0.35 * math.sin(2 * math.pi * 110.0 * t + 0.7)

    pad = 0.25 * math.sin(
        2 * math.pi * 220.0 * t + 0.2 * math.sin(2 * math.pi * 0.07 * t)
    )
    pad += 0.18 * math.sin(
        2 * math.pi * 329.63 * t + 0.15 * math.sin(2 * math.pi * 0.05 * t)
    )

    pulse_phase = (t % 0.5) / 0.5
    kick = math.exp(-pulse_phase * 18) * math.sin(
        2 * math.pi * 70 * math.exp(-pulse_phase * 6) * t
    )

    tick_p = (t % 0.25) / 0.25
    tick = 0.12 * math.exp(-tick_p * 40) * math.sin(2 * math.pi * 2400 * t)

    nval = noise[i % sr] * 0.04 * (0.5 + 0.5 * math.sin(2 * math.pi * 0.1 * t))
    swell = (
        0.15
        * (0.5 + 0.5 * math.sin(2 * math.pi * 0.03 * t))
        * math.sin(2 * math.pi * 165 * t)
    )

    mix = 0.45 * d1 + 0.3 * d2 + 0.2 * d3 + pad + 0.55 * kick + tick + nval + swell
    L = soft_clip(mix * env * 0.55)
    R = soft_clip(
        (
            0.42 * d1
            + 0.32 * d2
            + 0.22 * d3
            + pad * 0.95
            + 0.52 * kick
            + tick * 0.9
            + nval
            + swell * 1.05
        )
        * env
        * 0.55
    )
    frames += struct.pack("<hh", int(L * 30000), int(R * 30000))

wf.writeframes(frames)
wf.close()
print("wrote", out, os.path.getsize(out), "bytes")
