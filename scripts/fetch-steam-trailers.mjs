/* Собирает трейлеры из Steam Store API.
   node scripts/fetch-steam-trailers.mjs

   Для каждого товара с ссылкой на Steam-магазин достаём appid, забираем
   ролики из store.steampowered.com/api/appdetails и сохраняем HLS-манифест
   + постер. Результат → data/steam-trailers.json */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PRODUCTS = path.join(ROOT, 'data', 'gamesvoice-products.json');
const OUT = path.join(ROOT, 'data', 'steam-trailers.json');

const CONC = 4;

function appIdFrom(stores) {
  for (const s of stores || []) {
    const m = String(s.link || '').match(/store\.steampowered\.com\/app\/(\d+)/i);
    if (m) return m[1];
  }
  return '';
}

async function fetchJson(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          Referer: 'https://store.steampowered.com/',
        },
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch {
      if (attempt === 2) return null;
      await new Promise((r) => setTimeout(r, 900 * (attempt + 1)));
    }
  }
  return null;
}

/** Лучший ролик: сначала highlight, затем по максимальной пропускной способности. */
function pickMovie(movies) {
  if (!Array.isArray(movies) || !movies.length) return null;
  const scored = movies.map((m) => {
    const hls = m.hls_h264 || '';
    const band = /BANDWIDTH=(\d+)/.exec(hls) ? 0 : 0;
    return { m, band, score: (m.highlight ? 1e6 : 0) + band };
  });
  scored.sort((a, b) => b.score - a.score);
  for (const { m } of scored) {
    const hls = m.hls_h264 || '';
    if (!hls) continue;
    return {
      id: String(m.id || ''),
      name: m.name || '',
      hls,
      poster: m.thumbnail || '',
      highlight: !!m.highlight,
    };
  }
  return null;
}

const raw = JSON.parse(fs.readFileSync(PRODUCTS, 'utf8'));
const products = raw.products || raw;
const targets = [];
for (const p of products) {
  const appId = appIdFrom(p.stores);
  if (appId) targets.push({ alias: p.alias, appId });
}
console.log('товаров со Steam:', targets.length);

let prev = {};
if (fs.existsSync(OUT)) {
  try {
    prev = JSON.parse(fs.readFileSync(OUT, 'utf8')).trailers || {};
  } catch {
    prev = {};
  }
}

const result = { ...prev };
const queue = targets.slice();
let done = 0;

async function worker() {
  while (queue.length) {
    const t = queue.shift();
    if (!t) break;
    const url = `https://store.steampowered.com/api/appdetails?appids=${t.appId}&cc=us&l=en`;
    const data = await fetchJson(url);
    const app = data && data[t.appId];
    if (app && app.success && app.data) {
      const movie = pickMovie(app.data.movies);
      if (movie) result[t.alias] = { appId: t.appId, ...movie };
    }
    done++;
    if (done % 20 === 0) console.log(`  обработано ${done}/${targets.length}`);
    await new Promise((r) => setTimeout(r, 300));
  }
}

await Promise.all(Array.from({ length: CONC }, worker));

fs.writeFileSync(
  OUT,
  JSON.stringify({ updated: new Date().toISOString().slice(0, 10), trailers: result }, null, 2)
);
console.log(`готово: ${Object.keys(result).length} трейлеров → data/steam-trailers.json`);
