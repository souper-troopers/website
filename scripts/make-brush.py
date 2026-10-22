# The home banner's brush strokes (trial, 22 October): one irregular, bristly stroke as an SVG -
# a few dozen horizontal "bristle" paths with wavy top and bottom edges, broken and frayed at the
# edges, then roughened by a turbulence displacement. Used as a stretched background behind the
# homepage h1 (seed 4) and paragraph (seed 17); see .photo-hero--brush in Layout.astro.
#   python3 scripts/make-brush.py 4 > public/brush/brush-headline.svg
#   python3 scripts/make-brush.py 17 > public/brush/brush-paragraph.svg
# The fill is the site ink (#24232b), baked in: the outline is a drop-shadow filter, and a CSS mask
# would cut it off.
import random, sys, math

COLOR = "#24232b"
seed = int(sys.argv[1]) if len(sys.argv) > 1 else 3
random.seed(seed)
W, H = 1000, 200


def lf(n=4):
    ph = [random.uniform(0, 6.28) for _ in range(n)]
    am = [random.uniform(.4, 1) / (i + 1) for i in range(n)]
    return lambda x: sum(a * math.sin((i + 1) * 1.3 * x * math.pi + p) for i, (a, p) in enumerate(zip(am, ph)))


top = lf()
bot = lf()
tilt = random.uniform(-6, 6)
paths = []


def bristles(y0, y1, xs0, xe0, N, wmin, wmax):
    for k in range(N):
        t = k / (N - 1)
        edge = min(t, 1 - t)
        xs = xs0 + random.uniform(0, 25) + (random.uniform(0, 60) if edge < .12 else 0)
        xe = xe0 - random.uniform(0, 90) * (random.random() ** .7) - (random.uniform(40, 180) if edge < .12 else 0)
        if random.random() < .15:
            xe = xe0 + random.uniform(0, 30)
        w = random.uniform(wmin, wmax) if edge > .1 else random.uniform(2, 5)
        segs = [(xs, xe)]
        if edge < .18 and random.random() < .7:
            segs = []
            a = xs
            while a < xe:
                b = min(xe, a + random.uniform(80, 400))
                segs.append((a, b))
                a = b + random.uniform(10, 70)
        for a, b in segs:
            pts = []
            for i in range(9):
                u = i / 8
                x = a + (b - a) * u
                xn = x / W
                yy = y0 + (y1 - y0) * t + (1 - t) * 14 * top(xn) + t * 14 * bot(xn) + tilt * (xn - .5) + random.uniform(-1, 1)
                pts.append((x, yy))
            d = "M" + " L".join(f"{x:.0f} {y:.1f}" for x, y in pts)
            paths.append(f'<path d="{d}" stroke-width="{w:.1f}"/>')


bristles(30, 170, 20, W - 70, 52, 9, 14)
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="none">'
       f'<filter id="r" x="-5%" y="-15%" width="110%" height="130%"><feTurbulence type="fractalNoise" baseFrequency=".03 .1" numOctaves="3" seed="{seed}"/><feDisplacementMap in="SourceGraphic" scale="14"/></filter>'
       f'<g fill="none" stroke="{COLOR}" stroke-linecap="round" stroke-linejoin="round" filter="url(#r)">' + "".join(paths) + '</g></svg>')
print(svg)
