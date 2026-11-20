// Regenerates tools/data/worldmap.json (the dotted world map on Mother of Certification): land dots on a 2.5 degree grid,
// grouped by the six regions in the industry table's filters. Uses Natural Earth 1:110m countries (world-atlas).
// Usage: npm i world-atlas@2.0.2 topojson-client@3.1.0 d3-geo@3.1.1 (in <dir>), then node tools/gen-worldmap.js <dir> tools/data/worldmap.json
const path = require('path'); const G = process.argv[2]; const req = m => require(path.join(G, 'node_modules', m));
const topo = req('topojson-client'), { geoContains } = req('d3-geo');
const world = require(path.join(G, 'node_modules/world-atlas/countries-110m.json'));
const fc = topo.feature(world, world.objects.countries);
const EU = new Set(['United Kingdom','France','Germany','Spain','Portugal','Italy','Norway','Sweden','Finland','Denmark','Poland','Netherlands','Belgium','Switzerland','Austria','Czechia','Slovakia','Hungary','Romania','Bulgaria','Greece','Ireland','Iceland','Croatia','Serbia','Bosnia and Herz.','Slovenia','Albania','Macedonia','North Macedonia','Montenegro','Kosovo','Estonia','Latvia','Lithuania','Belarus','Ukraine','Moldova','Luxembourg']);
const REG = n => n === 'India' ? 'India' : n === 'Canada' ? 'Canada' : n === 'United States of America' ? 'USA' : n === 'Australia' ? 'Australia' : n === 'Japan' ? 'Japan' : EU.has(n) ? 'Europe' : 'rest';
const step = 2.5, top = 80, bot = -56, out = {}; const cnt = {};
for (let lat = top; lat >= bot; lat -= step) for (let lon = -180 + step / 2; lon < 180; lon += step) {
  const f = fc.features.find(f => geoContains(f, [lon, lat])); if (!f) continue;
  const r = REG(f.properties.name); const x = Math.round((lon + 180) / step * 10) / 10, y = Math.round((top - lat) / step * 10) / 10;
  (out[r] = out[r] || []).push([x, y]);
}
// small regions get a denser pass so they read on the map (Japan)
const res = { w: Math.round(360 / step), h: Math.round((top - bot) / step) + 1, paths: {}, c: {} };
for (const [r, pts] of Object.entries(out)) { res.paths[r] = pts.map(([x, y]) => `M${x} ${y}h0`).join(''); res.c[r] = [+(pts.reduce((s, p) => s + p[0], 0) / pts.length).toFixed(1), +(pts.reduce((s, p) => s + p[1], 0) / pts.length).toFixed(1)]; cnt[r] = pts.length; }
console.error(cnt, res.w, res.h, JSON.stringify(res).length);
require('fs').writeFileSync(process.argv[3], JSON.stringify(res));
