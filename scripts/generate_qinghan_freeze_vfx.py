from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


WIDTH = 1920
HEIGHT = 1080
OUT_DIR = Path("assets/mascot/kbn")
SEED = 20260623


def blank() -> Image.Image:
    return Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))


def composite(base: Image.Image, layer: Image.Image, blur: float = 0) -> None:
    if blur:
        layer = layer.filter(ImageFilter.GaussianBlur(blur))
    base.alpha_composite(layer)


def draw_soft_ellipse(
    base: Image.Image,
    box: tuple[float, float, float, float],
    color: tuple[int, int, int, int],
    blur: float,
) -> None:
    layer = blank()
    ImageDraw.Draw(layer).ellipse(box, fill=color)
    composite(base, layer, blur)


def normalized_box(x0: float, y0: float, x1: float, y1: float) -> tuple[float, float, float, float]:
    return (min(x0, x1), min(y0, y1), max(x0, x1), max(y0, y1))


def draw_snowflake(
    image: Image.Image,
    cx: float,
    cy: float,
    radius: float,
    alpha: int,
    rotation: float,
) -> None:
    glow = blank()
    core = blank()
    dg = ImageDraw.Draw(glow)
    dc = ImageDraw.Draw(core)
    for i in range(6):
        angle = rotation + math.tau * i / 6
        x2 = cx + math.cos(angle) * radius
        y2 = cy + math.sin(angle) * radius
        dg.line((cx, cy, x2, y2), fill=(170, 232, 255, max(20, alpha // 3)), width=max(2, int(radius / 14)))
        dc.line((cx, cy, x2, y2), fill=(238, 253, 255, alpha), width=max(1, int(radius / 24)))
        for offset in (0.46, 0.66):
            bx = cx + math.cos(angle) * radius * offset
            by = cy + math.sin(angle) * radius * offset
            for branch in (-1, 1):
                ba = angle + branch * math.radians(42)
                ex = bx + math.cos(ba) * radius * 0.18
                ey = by + math.sin(ba) * radius * 0.18
                dc.line((bx, by, ex, ey), fill=(220, 249, 255, max(45, alpha - 38)), width=1)
    dc.ellipse((cx - radius * 0.07, cy - radius * 0.07, cx + radius * 0.07, cy + radius * 0.07), fill=(255, 255, 255, alpha))
    composite(image, glow, 2.5)
    composite(image, core)


def crack_segments(
    rng: random.Random,
    x: float,
    y: float,
    angle: float,
    length: float,
    depth: int,
) -> list[tuple[float, float, float, float]]:
    if depth <= 0 or length < 26:
        return []
    wiggle = math.radians(rng.uniform(-11, 11))
    angle += wiggle
    end_x = x + math.cos(angle) * length
    end_y = y + math.sin(angle) * length
    segments = [(x, y, end_x, end_y)]
    if depth > 1:
        split_count = 1 if depth <= 2 else 2
        for _ in range(split_count):
            t = rng.uniform(0.34, 0.78)
            bx = x + (end_x - x) * t
            by = y + (end_y - y) * t
            branch_angle = angle + rng.choice((-1, 1)) * math.radians(rng.uniform(24, 48))
            branch_len = length * rng.uniform(0.32, 0.58)
            segments.extend(crack_segments(rng, bx, by, branch_angle, branch_len, depth - 1))
    segments.extend(crack_segments(rng, end_x, end_y, angle, length * rng.uniform(0.5, 0.68), depth - 1))
    return segments


def draw_cracks(
    image: Image.Image,
    rng: random.Random,
    starts: list[tuple[float, float, float, float, int]],
    alpha: int = 190,
) -> None:
    glow = blank()
    core = blank()
    dg = ImageDraw.Draw(glow)
    dc = ImageDraw.Draw(core)
    for x, y, deg, length, depth in starts:
        for x1, y1, x2, y2 in crack_segments(rng, x, y, math.radians(deg), length, depth):
            dg.line((x1, y1, x2, y2), fill=(128, 220, 255, max(28, alpha // 4)), width=7)
            dg.line((x1, y1, x2, y2), fill=(238, 253, 255, max(35, alpha // 5)), width=3)
            dc.line((x1, y1, x2, y2), fill=(247, 254, 255, alpha), width=2)
            if rng.random() > 0.55:
                dc.line((x1, y1, x2, y2), fill=(107, 210, 255, max(50, alpha // 2)), width=1)
    composite(image, glow, 2.2)
    composite(image, core)


def draw_edge_frost(image: Image.Image, rng: random.Random, strength: float = 1.0) -> None:
    haze = blank()
    d = ImageDraw.Draw(haze)
    band = int(110 * strength)
    d.rectangle((0, 0, WIDTH, band), fill=(226, 250, 255, int(44 * strength)))
    d.rectangle((0, HEIGHT - band, WIDTH, HEIGHT), fill=(226, 250, 255, int(48 * strength)))
    d.rectangle((0, 0, band, HEIGHT), fill=(226, 250, 255, int(42 * strength)))
    d.rectangle((WIDTH - band, 0, WIDTH, HEIGHT), fill=(226, 250, 255, int(42 * strength)))
    for x, y, r in (
        (0, 0, 360),
        (WIDTH, 0, 340),
        (0, HEIGHT, 380),
        (WIDTH, HEIGHT, 360),
    ):
        d.ellipse((x - r, y - r, x + r, y + r), fill=(246, 254, 255, int(86 * strength)))
    composite(image, haze, 26)

    ice = blank()
    di = ImageDraw.Draw(ice)
    for side in ("top", "bottom"):
        y = 20 if side == "top" else HEIGHT - 22
        for x in range(-30, WIDTH + 30, 18):
            h = rng.randint(16, 82)
            w = rng.randint(14, 42)
            offset = h if side == "top" else -h
            box = normalized_box(x - w, y - h * 0.4, x + w, y + offset)
            di.ellipse(box, fill=(245, 254, 255, rng.randint(42, 104)))
    for side in ("left", "right"):
        x = 20 if side == "left" else WIDTH - 22
        for y in range(-30, HEIGHT + 30, 18):
            w = rng.randint(18, 82)
            h = rng.randint(14, 46)
            offset = w if side == "left" else -w
            box = normalized_box(x - w * 0.4, y - h, x + offset, y + h)
            di.ellipse(box, fill=(245, 254, 255, rng.randint(34, 92)))
    for inset, alpha in ((42, 160), (58, 94), (82, 48)):
        di.rounded_rectangle(
            (inset, inset, WIDTH - inset, HEIGHT - inset),
            radius=34,
            outline=(234, 252, 255, int(alpha * strength)),
            width=max(2, int(8 * strength)),
        )
    composite(image, ice, 1.4)

    texture = blank()
    dt = ImageDraw.Draw(texture)
    for _ in range(950):
        edge = rng.choice(("top", "bottom", "left", "right", "corner"))
        if edge == "top":
            x, y = rng.uniform(0, WIDTH), rng.uniform(0, 160)
        elif edge == "bottom":
            x, y = rng.uniform(0, WIDTH), rng.uniform(HEIGHT - 170, HEIGHT)
        elif edge == "left":
            x, y = rng.uniform(0, 170), rng.uniform(0, HEIGHT)
        elif edge == "right":
            x, y = rng.uniform(WIDTH - 170, WIDTH), rng.uniform(0, HEIGHT)
        else:
            x = rng.choice((rng.uniform(0, 240), rng.uniform(WIDTH - 240, WIDTH)))
            y = rng.choice((rng.uniform(0, 220), rng.uniform(HEIGHT - 220, HEIGHT)))
        r = rng.uniform(0.8, 3.2)
        a = rng.randint(35, 135)
        dt.ellipse((x - r, y - r, x + r, y + r), fill=(248, 254, 255, int(a * strength)))
    composite(image, texture, 0.25)


def draw_particles(image: Image.Image, rng: random.Random, count: int, alpha_scale: float = 1.0) -> None:
    layer = blank()
    d = ImageDraw.Draw(layer)
    for _ in range(count):
        x = rng.uniform(0, WIDTH)
        y = rng.uniform(0, HEIGHT)
        r = rng.uniform(0.8, 2.8)
        a = int(rng.randint(45, 170) * alpha_scale)
        d.ellipse((x - r, y - r, x + r, y + r), fill=(236, 252, 255, a))
        if rng.random() > 0.78:
            d.line((x - r * 2, y, x + r * 2, y), fill=(170, 232, 255, a // 2), width=1)
            d.line((x, y - r * 2, x, y + r * 2), fill=(170, 232, 255, a // 2), width=1)
    composite(image, layer, 0.15)


def generate_locked() -> Image.Image:
    rng = random.Random(SEED)
    image = blank()
    draw_soft_ellipse(image, (180, 80, 1740, 1040), (206, 243, 255, 46), 74)
    draw_soft_ellipse(image, (360, 160, 1580, 900), (255, 255, 255, 34), 118)
    draw_soft_ellipse(image, (520, 260, 1400, 820), (176, 232, 255, 28), 95)
    for _ in range(28):
        cx = rng.uniform(120, WIDTH - 120)
        cy = rng.uniform(80, HEIGHT - 80)
        rx = rng.uniform(220, 620)
        ry = rng.uniform(120, 310)
        draw_soft_ellipse(image, (cx - rx, cy - ry, cx + rx, cy + ry), (214, 247, 255, rng.randint(12, 34)), rng.uniform(36, 88))
    draw_edge_frost(image, rng, 1.0)
    starts = [
        (76, 126, 26, 190, 2),
        (WIDTH - 78, 138, 154, 190, 2),
        (84, HEIGHT - 132, -28, 190, 2),
        (WIDTH - 86, HEIGHT - 154, 204, 190, 2),
    ]
    draw_cracks(image, rng, starts, 82)
    for cx, cy, radius, alpha in (
        (WIDTH * 0.24, HEIGHT * 0.35, 68, 126),
        (WIDTH * 0.74, HEIGHT * 0.38, 58, 112),
        (WIDTH * 0.38, HEIGHT * 0.72, 74, 128),
        (WIDTH * 0.66, HEIGHT * 0.72, 52, 98),
        (WIDTH * 0.86, HEIGHT * 0.78, 42, 82),
        (WIDTH * 0.12, HEIGHT * 0.58, 46, 92),
        (WIDTH * 0.52, HEIGHT * 0.52, 60, 86),
    ):
        draw_snowflake(image, cx, cy, radius, alpha, rng.uniform(0, math.tau))
    draw_particles(image, rng, 560, 0.78)
    return image


def generate_wave() -> Image.Image:
    rng = random.Random(SEED + 1)
    image = blank()
    origin = (WIDTH * 0.17, HEIGHT * 0.78)
    glow = blank()
    dg = ImageDraw.Draw(glow)
    for radius, alpha, width in ((220, 210, 8), (380, 155, 6), (620, 86, 5), (860, 42, 4)):
        box = (origin[0] - radius, origin[1] - radius, origin[0] + radius, origin[1] + radius)
        dg.ellipse(box, outline=(226, 251, 255, alpha), width=width)
    for _ in range(68):
        angle = rng.uniform(-1.0, 0.55)
        length = rng.uniform(320, 1280)
        sx = origin[0] + math.cos(angle) * rng.uniform(80, 210)
        sy = origin[1] + math.sin(angle) * rng.uniform(80, 210)
        ex = origin[0] + math.cos(angle) * length
        ey = origin[1] + math.sin(angle) * length
        dg.line((sx, sy, ex, ey), fill=(154, 229, 255, rng.randint(24, 74)), width=rng.randint(1, 3))
    composite(image, glow, 2.0)
    core = blank()
    dc = ImageDraw.Draw(core)
    dc.ellipse((origin[0] - 90, origin[1] - 90, origin[0] + 90, origin[1] + 90), fill=(255, 255, 255, 95))
    composite(image, core, 18)
    draw_edge_frost(image, rng, 0.52)
    draw_particles(image, rng, 420, 1.0)
    return image


def generate_shatter() -> Image.Image:
    rng = random.Random(SEED + 2)
    image = blank()
    draw_edge_frost(image, rng, 0.68)
    starts = [
        (70, 100, 24, 480, 3),
        (WIDTH - 70, 124, 154, 500, 3),
        (70, HEIGHT - 110, -28, 440, 3),
        (WIDTH - 74, HEIGHT - 130, 205, 470, 3),
    ]
    draw_cracks(image, rng, starts, 160)
    shard_layer = blank()
    ds = ImageDraw.Draw(shard_layer)
    for _ in range(90):
        edge = rng.choice(("top", "bottom", "left", "right"))
        if edge == "top":
            cx, cy = rng.uniform(0, WIDTH), rng.uniform(0, 160)
        elif edge == "bottom":
            cx, cy = rng.uniform(0, WIDTH), rng.uniform(HEIGHT - 160, HEIGHT)
        elif edge == "left":
            cx, cy = rng.uniform(0, 160), rng.uniform(0, HEIGHT)
        else:
            cx, cy = rng.uniform(WIDTH - 160, WIDTH), rng.uniform(0, HEIGHT)
        size = rng.uniform(10, 42)
        angle = rng.uniform(0, math.tau)
        pts = []
        for i in range(3):
            a = angle + math.tau * i / 3 + rng.uniform(-0.25, 0.25)
            pts.append((cx + math.cos(a) * size * rng.uniform(0.55, 1.15), cy + math.sin(a) * size * rng.uniform(0.55, 1.15)))
        ds.polygon(pts, fill=(226, 249, 255, rng.randint(40, 118)))
        ds.line(pts + [pts[0]], fill=(255, 255, 255, rng.randint(70, 165)), width=1)
    composite(image, shard_layer, 0.4)
    draw_particles(image, rng, 820, 0.85)
    return image


def make_preview(locked: Image.Image) -> Image.Image:
    bg = Image.new("RGBA", (WIDTH, HEIGHT), (16, 27, 34, 255))
    wash = blank()
    draw_soft_ellipse(wash, (200, 100, WIDTH - 200, HEIGHT - 80), (42, 78, 90, 170), 90)
    bg.alpha_composite(wash)
    bg.alpha_composite(locked)
    return bg


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    wave = generate_wave()
    locked = generate_locked()
    shatter = generate_shatter()
    wave.save(OUT_DIR / "freeze-vfx-wave-clean.png")
    locked.save(OUT_DIR / "freeze-vfx-locked-clean.png")
    shatter.save(OUT_DIR / "freeze-vfx-shatter-clean.png")
    make_preview(locked).save(OUT_DIR / "freeze-vfx-clean-preview.png")
    print("Generated Qinghan freeze VFX assets:")
    for name in (
        "freeze-vfx-wave-clean.png",
        "freeze-vfx-locked-clean.png",
        "freeze-vfx-shatter-clean.png",
        "freeze-vfx-clean-preview.png",
    ):
        path = OUT_DIR / name
        print(f"- {path} ({path.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
