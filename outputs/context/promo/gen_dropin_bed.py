#!/usr/bin/env python3
"""
Aggressive side-chained industrial techno bed for Context Engine promo.
Structure mirrors DROPIN energy: tension 0–8s, hard drop 8s→end.
Pure stdlib — no sample packs, no licensed commercial track.
"""
import wave
import struct
import math
import random
import os

SR = 44100
DUR = 32.0
BPM = 138.0
BEAT = 60.0 / BPM
DROP_AT = 8.0
N = int(SR * DUR)
OUT = os.path.join(os.path.dirname(__file__), "music_dropin_bed.wav")

rng = random.Random(7)
noise_table = [rng.uniform(-1.0, 1.0) for _ in range(SR * 2)]


def soft(x, t=0.85):
    return math.tanh(x / t) * t


def env_exp(phase, decay):
    return math.exp(-phase * decay) if phase >= 0 else 0.0


def main():
    buf_l = [0.0] * N
    buf_r = [0.0] * N

    for i in range(N):
        t = i / SR
        # master envelope: short fade in, hard end fade
        master = 1.0
        if t < 0.15:
            master = t / 0.15
        if t > DUR - 2.2:
            master = max(0.0, (DUR - t) / 2.2)

        # section gain: pre-drop restrained, drop full send
        if t < DROP_AT:
            section = 0.55 + 0.45 * (t / DROP_AT)  # build
            kick_amt = 0.55
            hat_amt = 0.35
            bass_amt = 0.40
            lead_amt = 0.0
            noise_hit_amt = 0.25
        else:
            section = 1.0
            kick_amt = 1.0
            hat_amt = 0.85
            bass_amt = 1.0
            lead_amt = 0.75
            noise_hit_amt = 0.70
            # drop impact boost first 0.4s after drop
            if t < DROP_AT + 0.4:
                section *= 1.15

        # --- kick (4-on-floor) ---
        beat_pos = (t % BEAT) / BEAT
        kick = env_exp(beat_pos, 22.0) * math.sin(
            2 * math.pi * (58.0 * math.exp(-beat_pos * 8.0)) * t
        )
        # sub thump
        kick += 0.55 * env_exp(beat_pos, 14.0) * math.sin(2 * math.pi * 48.0 * t)

        # sidechain envelope from kick (duck everything else)
        sc = 1.0 - 0.78 * env_exp(beat_pos, 10.0)
        if t >= DROP_AT:
            sc = 1.0 - 0.88 * env_exp(beat_pos, 9.0)

        # --- industrial hat / tick (16ths) ---
        step = BEAT / 4.0
        step_pos = (t % step) / step
        hat = 0.0
        # open/closed pattern: accent offbeats harder after drop
        n16 = int(t / step) % 4
        if n16 in (0, 2):
            hat = env_exp(step_pos, 55.0) * noise_table[i % len(noise_table)] * 0.35
        else:
            hat = env_exp(step_pos, 80.0) * noise_table[(i * 3) % len(noise_table)] * 0.55

        # --- metallic industrial noise scrape (every bar pre-drop, every half after) ---
        bar = BEAT * 4.0
        scrape_period = bar if t < DROP_AT else bar / 2.0
        scp = (t % scrape_period) / scrape_period
        scrape = (
            env_exp(scp, 6.0)
            * noise_table[(i * 7) % len(noise_table)]
            * math.sin(2 * math.pi * (900 + 400 * scp) * t)
            * noise_hit_amt
        )

        # --- bass (sidechained) ---
        # root A1 / E1 movement
        bar_i = int(t / bar) % 4
        bass_f = {0: 55.0, 1: 55.0, 2: 41.2, 3: 61.7}[bar_i]
        bass = math.sin(2 * math.pi * bass_f * t)
        bass += 0.4 * math.sin(2 * math.pi * bass_f * 2 * t + 0.2)
        # mild distortion
        bass = soft(bass * 1.8, 0.7)
        bass *= sc * bass_amt

        # --- dark pad / drone (pre-drop tension, reduced after) ---
        pad = 0.22 * math.sin(2 * math.pi * 110.0 * t + 0.3 * math.sin(2 * math.pi * 0.08 * t))
        pad += 0.15 * math.sin(2 * math.pi * 164.8 * t)
        if t < DROP_AT:
            # rising tension filter-ish: more highs into drop
            rise = t / DROP_AT
            pad += 0.12 * rise * math.sin(2 * math.pi * 220.0 * t)
            pad += 0.08 * rise * noise_table[i % len(noise_table)]
        pad *= sc * (0.9 if t < DROP_AT else 0.45)

        # --- post-drop lead stabs (off-beat) ---
        lead = 0.0
        if t >= DROP_AT and lead_amt > 0:
            half = BEAT * 2.0
            hp = (t % half) / half
            # stab on beat 2 and 4 of bar
            beat_in_bar = int((t % bar) / BEAT)
            if beat_in_bar in (1, 3):
                freq = 220.0 if beat_in_bar == 1 else 293.66
                lead = (
                    env_exp((t % BEAT) / BEAT, 12.0)
                    * soft(
                        math.sin(2 * math.pi * freq * t)
                        + 0.5 * math.sin(2 * math.pi * freq * 1.5 * t)
                        + 0.3 * math.sin(2 * math.pi * freq * 2.0 * t),
                        0.6,
                    )
                    * lead_amt
                )
            lead *= sc

        # --- drop impact noise slam ---
        impact = 0.0
        if DROP_AT <= t < DROP_AT + 0.35:
            ip = (t - DROP_AT) / 0.35
            impact = env_exp(ip, 8.0) * noise_table[i % len(noise_table)] * 1.4

        # mix
        kick_v = kick * kick_amt
        hat_v = hat * hat_amt * sc
        mix = (
            kick_v * 0.95
            + bass * 0.70
            + pad * 0.55
            + hat_v * 0.45
            + scrape * 0.35 * sc
            + lead * 0.50
            + impact * 0.80
        )
        mix *= master * section * 0.72
        mix = soft(mix, 0.92)

        # stereo width
        width = 0.12 * noise_table[(i + 1000) % len(noise_table)] * sc
        L = soft(mix + width * 0.15, 0.95)
        R = soft(mix - width * 0.15, 0.95)
        buf_l[i] = L
        buf_r[i] = R

    # soft peak normalize
    peak = max(max(abs(x) for x in buf_l), max(abs(x) for x in buf_r), 1e-9)
    gain = 0.92 / peak

    with wave.open(OUT, "w") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        frames = bytearray()
        for i in range(N):
            frames += struct.pack(
                "<hh",
                int(max(-1, min(1, buf_l[i] * gain)) * 32000),
                int(max(-1, min(1, buf_r[i] * gain)) * 32000),
            )
        wf.writeframes(frames)
    print("wrote", OUT, "peak_pre_norm", round(peak, 3), "bytes", os.path.getsize(OUT))


if __name__ == "__main__":
    main()
