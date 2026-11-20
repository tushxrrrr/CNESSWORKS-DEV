#!/usr/bin/env python3
"""Writes lib/analyze/graphic.json for the Next.js Analyze page: the terrain contour paths, waypoint positions and
trail legs for each path, from the same generator as the static page (tools/analyze_graphic.py)."""
import json, pathlib, re, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from analyze_graphic import terrain, WAY, seg_paths
ROOT = pathlib.Path(__file__).resolve().parent.parent
paths = [{'cls': c, 'd': d} for c, d in re.findall(r'<path class="(\w+)" d="([^"]+)"/>', terrain())]
out = {'terrain': {'viewBox': '0 0 1600 400', 'paths': paths}, 'tracks': {t: {'points': [list(p) for p in pts], 'legs': seg_paths(pts)} for t, pts in WAY.items()}}
dst = ROOT / 'lib/analyze/graphic.json'; dst.parent.mkdir(parents=True, exist_ok=True)
dst.write_text(json.dumps(out, separators=(',', ':')))
print(f'wrote {dst.relative_to(ROOT)} ({dst.stat().st_size // 1024} KB, {len(paths)} contour paths)')
