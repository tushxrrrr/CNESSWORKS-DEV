"""Survey-terrain geometry for the Analyze page, shared by tools/build-analyze.py (static page) and
tools/export-analyze-graphic.py (data for the Next.js page). Deterministic: same seed, same lines."""
import math, random

# ---------------- Signature graphic: survey terrain ----------------
def terrain():
    """Contour lines of a few hills (viewBox 1600x400, drawn with xMidYMid slice)."""
    rnd = random.Random(20261120)
    hills = [(150, 250, 210, 7), (470, 120, 170, 6), (760, 300, 230, 8), (1040, 110, 190, 7), (1330, 260, 220, 8), (1560, 70, 150, 5), (300, -20, 140, 4)]
    paths = []
    for hx, hy, R, rings in hills:
        ph = [rnd.uniform(0, 6.283) for _ in range(4)]; amp = [rnd.uniform(.05, .12), rnd.uniform(.03, .08), rnd.uniform(.02, .05)]
        sx, sy = rnd.uniform(1.15, 1.6), rnd.uniform(.55, .8)
        for k in range(1, rings + 1):
            f = k / rings; pts = []
            for j in range(40):
                t = j / 40 * 2 * math.pi
                w = 1 + amp[0] * math.sin(2 * t + ph[0] + f) + amp[1] * math.sin(3 * t + ph[1] - f * 1.3) + amp[2] * math.sin(5 * t + ph[2] + f * 2)
                r = R * f * w
                pts.append((hx + math.cos(t) * r * sx, hy + math.sin(t) * r * sy))
            mids = [((pts[i][0] + pts[(i + 1) % 40][0]) / 2, (pts[i][1] + pts[(i + 1) % 40][1]) / 2) for i in range(40)]
            d = f'M{mids[-1][0]:.0f} {mids[-1][1]:.0f}' + ''.join(f'Q{pts[i][0]:.0f} {pts[i][1]:.0f} {mids[i][0]:.0f} {mids[i][1]:.0f}' for i in range(40)) + 'Z'
            paths.append(f'<path class="{"ix" if k % 3 == 0 else "ct"}" d="{d}"/>')
    return ''.join(paths)

WAY = {  # waypoint positions in % of the route band (x, y); the last point is the details step
    'organization': [(9, 62), (22, 34), (36, 58), (50, 30), (63, 60), (76, 36), (91, 52)],
    'product': [(8, 40), (19, 66), (31, 38), (43, 64), (55, 34), (67, 62), (79, 36), (92, 54)],
}
def seg_paths(pts):
    """One path per leg (start -> wp1, wp1 -> wp2, ...), Catmull-Rom smoothed, in a 0-100 box."""
    P = [(1, pts[0][1] + 6)] + pts
    out = []
    for i in range(len(P) - 1):
        p0 = P[max(0, i - 1)]; p1 = P[i]; p2 = P[i + 1]; p3 = P[min(len(P) - 1, i + 2)]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6); c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        out.append(f'M{p1[0]} {p1[1]}C{c1[0]:.2f} {c1[1]:.2f} {c2[0]:.2f} {c2[1]:.2f} {p2[0]} {p2[1]}')
    return out
