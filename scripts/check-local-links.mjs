/* Проверка локальных ссылок в index.html и js: node scripts/check-local-links.mjs */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = ['index.html', 'manifest.webmanifest', 'sitemap.xml', 'robots.txt'];
const refs = new Set();

for (const f of files) {
  const text = fs.readFileSync(path.join(ROOT, f), 'utf8');
  for (const m of text.matchAll(/(?:src|href)="([^"#?][^"]*)"/g)) {
    const u = m[1].split('?')[0].split('#')[0];
    if (!u) continue;
    if (/^(https?:|data:|mailto:|\/\/)/i.test(u)) continue;
    refs.add(u);
  }
}

// ссылки из css
for (const f of fs.readdirSync(path.join(ROOT, 'css'))) {
  const text = fs.readFileSync(path.join(ROOT, 'css', f), 'utf8');
  for (const m of text.matchAll(/url\(['"]?([^'")]+)['"]?\)/g)) {
    const u = m[1].split('?')[0].split('#')[0];
    if (!u) continue;
    if (/^(https?:|data:)/i.test(u)) continue;
    refs.add(path.posix.join('css', u));
  }
}

let bad = 0;
for (const r of [...refs].sort()) {
  const p = path.join(ROOT, r.replace(/^\.\//, ''));
  if (!fs.existsSync(p)) {
    console.log('  БИТАЯ:', r);
    bad++;
  }
}
console.log(bad ? `битых ссылок: ${bad}` : `битых ссылок нет (проверено ${refs.size})`);
process.exit(bad ? 1 : 0);
