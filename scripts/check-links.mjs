/* Проверяет живость внешних ссылок каталога и сохраняет результат в
   data/link-status.json. Сборщик каталога затем убирает мёртвые ссылки.

   Запуск: node scripts/check-links.mjs
   Окружение: CONC=8 TIMEOUT=20000 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GAMES } from '../js/data.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'data', 'link-status.json');
const CONC = Number(process.env.CONC || 8);
const TIMEOUT = Number(process.env.TIMEOUT || 20000);

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/* Собираем все внешние ссылки из каталога. */
const urls = new Set();
for (const g of GAMES) {
  for (const t of g.translations || []) {
    const html = String(t.links || '');
    for (const m of html.matchAll(/href="(https?:[^"]+)"/g)) urls.add(m[1]);
  }
}
const list = [...urls];
console.log(`Проверяем ${list.length} ссылок, потоков ${CONC}`);

async function probe(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    let res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: ctrl.signal,
      headers: { 'User-Agent': UA, Accept: '*/*' },
    });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: ctrl.signal,
        headers: { 'User-Agent': UA, Range: 'bytes=0-1024' },
      });
    }
    const status = res.status;
    // 401/403/405/429 — это не битая ссылка, а магазин, который режет ботов
    const blocked = [401, 403, 405, 429].includes(status);
    const ok = status < 400 || blocked;
    return { ok, status, blocked, final: res.url };
  } catch (err) {
    return { ok: false, status: 0, error: String(err?.message || err).slice(0, 120) };
  } finally {
    clearTimeout(timer);
  }
}

const links = {};
let cursor = 0;
let done = 0;
let alive = 0;

async function worker() {
  for (;;) {
    const i = cursor++;
    if (i >= list.length) return;
    const url = list[i];
    const r = await probe(url);
    links[url] = { ok: r.ok, status: r.status, blocked: !!r.blocked, checked: new Date().toISOString() };
    done++;
    if (r.ok) alive++;
    else console.log(`  мёртвая (${r.status || 'ошибка'}): ${url.slice(0, 110)}`);
    if (done % 25 === 0) console.log(`  проверено ${done}/${list.length}, живых ${alive}`);
  }
}

await Promise.all(Array.from({ length: CONC }, worker));

fs.writeFileSync(
  OUT,
  JSON.stringify({ checked: new Date().toISOString(), total: list.length, alive, links }, null, 1) + '\n'
);
console.log(`Готово: ${alive} живых из ${list.length}. Результат в ${path.relative(ROOT, OUT)}`);
