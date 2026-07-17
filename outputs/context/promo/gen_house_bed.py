#!/usr/bin/env python3
"""Simple house music bed — 4-on-floor, offbeat hats, bassline. Stdlib only."""
import wave
import struct
import math
import random
import os

SR = 44100
DUR = 33.0
BPM = 122.0
BEAT = 60.0 / BPM
N = int(SR * DUR)
OUT = os.path.join(os.path.dirname(__file__), "music_house.wav")

rng = random.Random(11)
noise = [rng.uniform(-1, 1) for _ in range(SR)]


def soft(x, t=0.9):
    return math.tanh(x / t) * t


def main():
    L = [0.0] * N
    R = [0.0] * N
    for i in range(N):
        t = i / SR
        master = 1.0
        if t < 0.4:
            master = t / 0.4
        if t > DUR - 2.0:
            master = max(0.0, (DUR - t) / 2.0)

        # 4-on-floor kick
        bp = (t % BEAT) / BEAT
        kick = math.exp(-bp * 20) * math.sin(2 * math.pi * (55 * math.exp(-bp * 7)) * t)
        kick += 0.4 * math.exp(-bp * 12) * math.sin(2 * math.pi * 45 * t)

        # sidechain duck
        sc = 1.0 - 0.72 * math.exp(-bp * 9)

        # offbeat open hat (classic house)
        half = BEAT / 2.0
        hp = ((t + half) % BEAT) / BEAT  # offbeat
        # actually open hat on & of each beat: at 0.5 of beat
        off = (t % BEAT)
        if off >= half:
            op = (off - half) / half
            ohat = math.exp(-op * 8) * abs(noise[i % SR]) * 0.55
        else:
            ohat = 0.0
        # closed hat 16ths light
        s16 = BEAT / 4.0
        sp = (t % s16) / s16
        chat = math.exp(-sp * 50) * abs(noise[(i * 2) % SR]) * 0.18

        # clap on 2 and 4
        bar = BEAT * 4
        beat_n = int((t % bar) / BEAT)
        clap = 0.0
        if beat_n in (1, 3):
            cp = (t % BEAT) / BEAT
            clap = math.exp(-cp * 18) * (abs(noise[i % SR]) + 0.3 * math.sin(2 * math.pi * 1800 * t)) * 0.55

        # bassline: house root movement
        bar_i = int(t / bar) % 8
        # A minor-ish house progression
        roots = [55.0, 55.0, 65.41, 73.42, 55.0, 49.0, 65.41, 73.42]
        f = roots[bar_i]
        # stepwise 8th notes
        e8 = BEAT / 2.0
        e8p = (t % e8) / e8
        bass_env = 0.75 + 0.25 * (1.0 - e8p)
        bass = soft(
            math.sin(2 * math.pi * f * t)
            + 0.35 * math.sin(2 * math.pi * f * 2 * t)
            + 0.15 * math.sin(2 * math.pi * f * 3 * t),
            0.75,
        )
        bass *= bass_env * sc * 0.7

        # chord stabs (house pads on offbars)
        stab = 0.0
        if beat_n == 0 and (t % BEAT) < 0.35:
            sp2 = (t % BEAT) / 0.35
            chord = (
                math.sin(2 * math.pi * f * 2 * t)
                + math.sin(2 * math.pi * f * 2 * 1.5 * t)
                + math.sin(2 * math.pi * f * 2 * 2 * t)
            ) / 3.0
            stab = math.exp(-sp2 * 4) * chord * 0.28 * sc

        # shaker loop texture
        shaker = 0.08 * abs(noise[(i * 5) % SR]) * sc

        mix = (
            kick * 0.95
            + bass
            + ohat * 0.5
            + chat * 0.4
            + clap * 0.65
            + stab
            + shaker
        )
        mix = soft(mix * master * 0.85, 0.95)
        # light stereo
        w = 0.08 * noise[(i + 333) % SR]
        L[i] = soft(mix + w * 0.1)
        R[i] = soft(mix - w * 0.1)

    peak = max(max(abs(x) for x in L), max(abs(x) for x in R), 1e-9)
    g = 0.9 / peak
    with wave.open(OUT, "w") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        frames = bytearray()
        for i in range(N):
            frames += struct.pack(
                "<hh",
                int(max(-1, min(1, L[i] * g)) * 32000),
                int(max(-1, min(1, R[i] * g)) * 32000),
            )
        wf.writeframes(frames)
    print("wrote", OUT, os.path.getsize(OUT))


if __name__ == "__main__":
    main()
