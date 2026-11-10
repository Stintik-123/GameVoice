/* Быстрая проверка сайта в headless Chromium: ошибки консоли, счётчики,
   работа поиска, фильтров, модалок и перехода по ссылке.
   Запуск: node scripts/check-site.mjs */
import { chromium } from 'playwright';
import { listen } from '../scripts/serve.mjs';

const { server, port } = await listen(0);
const BASE = `http://127.0.0.1:${port}`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok });
  console.log(`[${ok ? '  ok  ' : ' FAIL '}] ${name}${ok || !detail ? '' : ' — ' + detail}`);
}

await page.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(700);

const cards = await page.$$eval('.game-card', (n) => n.length);
check('карточки отрисованы', cards > 0, String(cards));

const count = await page.textContent('#resultsCount');
check('счётчик результатов заполнен', /\d+/.test(count || ''), count);

const statNums = await page.$$eval('.stat-num', (n) => n.map((x) => x.textContent.trim()));
check('статистика посчитана', statNums.length >= 3 && Number(statNums[0]) > 50, statNums.join(' / '));

// поиск
await page.fill('#searchInput', 'gothic');
await page.waitForTimeout(500);
const found = await page.$$eval('.game-card', (n) => n.length);
check('поиск находит игру', found > 0, String(found));
await page.fill('#searchInput', 'киберпанк');
await page.waitForTimeout(500);
const translit = await page.$$eval('.game-card', (n) => n.length);
check('транслит работает (киберпанк → Cyberpunk)', translit > 0, String(translit));
await page.click('#resetFilters');
await page.waitForTimeout(400);

// фильтр-чип
await page.click('.chip[data-chip="text"]');
await page.waitForTimeout(400);
const afterChip = await page.$$eval('.game-card', (n) => n.length);
check('фильтр по чипу сужает выдачу', afterChip > 0 && afterChip <= cards, String(afterChip));
await page.click('#resetFilters');
await page.waitForTimeout(300);

// карточка
await page.click('.game-card');
await page.waitForTimeout(600);
const translations = await page.$$eval('.translation-card', (n) => n.length);
check('карточка открылась с вариантами перевода', translations > 0, String(translations));
const linkCount = await page.$$eval('.t-links a', (n) => n.length);
check('в карточке есть ссылки', linkCount > 0, String(linkCount));

// избранное
await page.click('.game-card-fav');
await page.waitForTimeout(400);
const favBadge = await page.textContent('#favCount');
check('избранное сохранилось', favBadge.trim() === '1', favBadge);

// модалка
await page.click('#faqBtn');
await page.waitForTimeout(400);
check('FAQ открылась', await page.isVisible('#faqModal.open'));
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
check('Escape закрыл модалку', !(await page.isVisible('#faqModal.open')));

// тема
await page.click('#themeBtn');
await page.waitForTimeout(300);
const theme = await page.getAttribute('html', 'data-theme');
check('тема переключилась', theme === 'dark' || theme === 'light', String(theme));

// мобильный вид
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
await mobile.waitForTimeout(500);
const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
check('нет горизонтального скролла на мобильном', overflow <= 1, String(overflow));
await mobile.click('#burgerBtn');
await mobile.waitForTimeout(400);
check('мобильное меню открылось', await mobile.evaluate(() => document.body.classList.contains('nav-open') || document.querySelector('#mobileMenu').classList.contains('open')));
await mobile.close();

await page.screenshot({ path: '.shots/01-home.png' });
await page.screenshot({ path: '.shots/02-full.png', fullPage: true });

check('консоль без ошибок', errors.length === 0, errors.slice(0, 3).join(' | '));

await browser.close();
server.close();

const passed = results.filter((r) => r.ok).length;
console.log(`\nПройдено: ${passed} из ${results.length}`);
process.exit(passed === results.length ? 0 : 1);
