/* Проверка живого сайта: node scripts/check-live.mjs */
import { chromium } from 'playwright';

const URL = process.argv[2] || 'https://stintik-123.github.io/GameVoice/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

const cards = await page.$$eval('.game-card', (n) => n.length);
const found = await page.textContent('#resultsCount').catch(() => '');
console.log('карточек:', cards, '| счётчик:', (found || '').trim());

// поиск
await page.fill('#searchInput', 'киберпанк');
await page.waitForTimeout(600);
const after = await page.$$eval('.game-card', (n) => n.length);
console.log('поиск «киберпанк» →', after);

await page.fill('#searchInput', '');
await page.waitForTimeout(400);

// карточка
await page.click('.game-card');
await page.waitForTimeout(900);
const links = await page.$$eval('.translation-card a.btn', (n) => n.length).catch(() => 0);
console.log('ссылок в карточке:', links);

console.log(errors.length ? 'ОШИБКИ: ' + errors.join(' | ') : 'консоль чистая');
await browser.close();
