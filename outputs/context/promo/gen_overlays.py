#!/usr/bin/env python3
"""Larger monospaced lower-thirds for Context Engine promo."""
from PIL import Image, ImageDraw, ImageFont
import os

OVER = os.path.join(os.path.dirname(__file__), "overlays")
os.makedirs(OVER, exist_ok=True)

font_path = "/System/Library/Fonts/Menlo.ttc"
alt = "/System/Library/Fonts/Supplemental/Andale Mono.ttf"
try:
    title_font = ImageFont.truetype(font_path, 52, index=0)
    sub_font = ImageFont.truetype(font_path, 26, index=0)
    hero_font = ImageFont.truetype(font_path, 64, index=0)
    hero_sub = ImageFont.truetype(font_path, 28, index=0)
    mono_small = ImageFont.truetype(font_path, 22, index=0)
except Exception:
    title_font = ImageFont.truetype(alt, 52)
    sub_font = ImageFont.truetype(alt, 26)
    hero_font = ImageFont.truetype(alt, 64)
    hero_sub = ImageFont.truetype(alt, 28)
    mono_small = ImageFont.truetype(alt, 22)

W, H = 1280, 720
TEAL = (13, 148, 136, 255)
WHITE = (250, 250, 250, 255)
BAR_H = 200  # taller bar for larger type

shots = [
    ("shot1", "128k is not memory.", "Prompt-stuffing is a DoS against your own agents."),
    ("shot2", "Context is a compile step.", "Budgeted slices. Schema boundaries. No vibes."),
    ("shot3", "Local silicon. Typed handoffs.", "Hermes · OpenClaw · Ollama on bare metal."),
    ("shot4", "consensus_threshold: 0.70", "Fail closed. Drop. Mutate. Retry."),
    ("shot5", "CONTEXT ENGINE", "context.frobbmedia.com  ·  Local. Typed. Thresholded."),
]


def make_lower_third(name, title, sub):
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    top = H - BAR_H
    # darker, taller lower third for readability
    d.rectangle([0, top, W, H], fill=(9, 9, 11, 200))
    # teal accent bar
    d.rectangle([56, top + 18, 56 + 72, top + 24], fill=TEAL)
    d.text((56, top + 40), title, font=title_font, fill=WHITE)
    d.text((56, top + 110), sub, font=sub_font, fill=TEAL)
    path = os.path.join(OVER, f"{name}.png")
    img.save(path)
    print("wrote", path)


for s in shots:
    make_lower_third(*s)

# cold open
open_img = Image.new("RGBA", (W, H), (9, 9, 11, 255))
d = ImageDraw.Draw(open_img)
t = "CONTEXT ENGINE"
s = "context.frobbmedia.com"
tb = d.textbbox((0, 0), t, font=hero_font)
sb = d.textbbox((0, 0), s, font=hero_sub)
tw, th = tb[2] - tb[0], tb[3] - tb[1]
sw, sh = sb[2] - sb[0], sb[3] - sb[1]
d.text(((W - tw) // 2, (H - th) // 2 - 10), t, font=hero_font, fill=WHITE)
d.text(((W - sw) // 2, (H - sh) // 2 + 55), s, font=hero_sub, fill=TEAL)
box = 72
bx, by = (W - box) // 2, (H - th) // 2 - 120
d.rounded_rectangle([bx, by, bx + box, by + box], radius=10, outline=TEAL, width=3)
cb = d.textbbox((0, 0), "[C]", font=mono_small)
cw, ch = cb[2] - cb[0], cb[3] - cb[1]
d.text((bx + (box - cw) // 2, by + (box - ch) // 2 - 2), "[C]", font=mono_small, fill=WHITE)
open_img.save(os.path.join(OVER, "open.png"))
print("wrote open.png")
print("done")
