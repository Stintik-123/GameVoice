/* Забирает полный список проектов GamesVoice через публичный API.
   Результат: data/gamesvoice-products.json
   Запуск: node scripts/fetch-gamesvoice.mjs */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'data');
const API = 'https://api.gamesvoice.ru/api/products';

async function fetchPage(page, limit) {
  const url = `${API}?page=${page}&limit=${limit}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} на ${url}`);
  return res.json();
}

const limit = 100;
const all = [];
let page = 1;
let lastId = null;
while (page <= 20) {
  const json = await fetchPage(page, limit);
  const items = json?.data || [];
  if (!items.length) break;
  all.push(...items);
  lastId = items[items.length - 1]?.id;
  console.log(`страница ${page}: +${items.length} (всего ${all.length}), последний id ${lastId}`);
  if (items.length < limit) break;
  page++;
}

fs.mkdirSync(OUT_DIR, { recursive: true });
const file = path.join(OUT_DIR, 'gamesvoice-products.json');
fs.writeFileSync(file, JSON.stringify({ fetched: new Date().toISOString(), count: all.length, products: all }, null, 1) + '\n');
console.log(`Записано ${all.length} проектов в ${path.relative(ROOT, file)}`);

const sample = all[0];
console.log('Поля проекта:', Object.keys(sample).join(', '));
console.log('Пример:', JSON.stringify({ ...sample, banners: undefined, preview: undefined }).slice(0, 700));
