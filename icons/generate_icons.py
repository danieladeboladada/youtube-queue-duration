from PIL import Image, ImageDraw
import math
import os

SIZES = [16, 48, 128]
RED = (255, 0, 0, 255)
WHITE = (255, 255, 255, 255)

out_dir = os.path.dirname(os.path.abspath(__file__))

for size in SIZES:
    scale = 4
    s = size * scale
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    pad = s * 0.06
    draw.rounded_rectangle([pad, pad, s - pad, s - pad], radius=s * 0.22, fill=RED)

    cx, cy = s / 2, s / 2
    r = s * 0.32
    ring_w = max(2 * scale, s * 0.055)
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=WHITE, width=int(ring_w))

    # clock hands: 12 o'clock up to ~10-past position, and a short minute hand
    hand_w = max(2 * scale, s * 0.045)
    hour_len = r * 0.5
    minute_len = r * 0.78

    hour_angle = -90  # pointing up
    minute_angle = -20  # pointing slightly past 3 o'clock, clock-hand look

    def endpoint(angle_deg, length):
        a = math.radians(angle_deg)
        return (cx + length * math.cos(a), cy + length * math.sin(a))

    draw.line([ (cx, cy), endpoint(hour_angle, hour_len) ], fill=WHITE, width=int(hand_w))
    draw.line([ (cx, cy), endpoint(minute_angle, minute_len) ], fill=WHITE, width=int(hand_w))

    center_r = hand_w * 0.9
    draw.ellipse([cx - center_r, cy - center_r, cx + center_r, cy + center_r], fill=WHITE)

    img = img.resize((size, size), Image.LANCZOS)
    img.save(os.path.join(out_dir, f"icon{size}.png"))
    print(f"wrote icon{size}.png")
