// Link check for the Next.js app (URL mode of the verifiers): every link that names a production URL
// (data-prod-href) must stay in the app when the app serves that page (local path, same tab) and go to the live
// site otherwise. Pages the app serves: lib/site.ts APP_PAGES.
const LIVE = 'https://www.cnessworks.com';
const APP = ['cness-advantage', 'analyze', 'mother-of-certification', 'cness-certification', 'product-certification', 'globaldirectory'];
async function checkAppLinks(page, base = '') {
  const links = await page.evaluate(() => [...document.querySelectorAll('a[data-prod-href]')].map(a => ({ prod: a.getAttribute('data-prod-href'), href: a.getAttribute('href'), target: a.getAttribute('target'), text: a.textContent.trim().slice(0, 40) })));
  const bad = []; let inApp = 0;
  for (const l of links) {
    const [path, rest = ''] = [l.prod.split(/[?#]/)[0], l.prod.slice(l.prod.split(/[?#]/)[0].length)];
    const route = path.startsWith(LIVE + '/') ? path.slice(LIVE.length + 1) : null;
    if (route && APP.includes(route)) { inApp++; const want = `${base}/${route}${rest}`; if (l.href !== want) bad.push(`"${l.text}" (${l.prod}) links to ${l.href}, expected ${want}`); if (l.target) bad.push(`"${l.text}" opens a new tab for a page in the app`); }
    else if (l.href !== l.prod) bad.push(`"${l.text}" links to ${l.href}, expected the live site ${l.prod}`);
  }
  return { bad, total: links.length, inApp };
}
module.exports = { checkAppLinks };
