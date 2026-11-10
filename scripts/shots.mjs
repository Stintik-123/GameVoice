/* Скриншоты сайта для визуальной проверки: node scripts/shots.mjs */
import { chromium } from 'playwright';
import { listen } from './serve.mjs';

const { server, port } = await listen(0);
const BASE = `http://127.0.0.1:${port}`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

await page.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
await page.waitForTimeout(400);
await page.screenshot({ path: '.shots/01-home-light.png' });
console.log('01-home-light');

await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
await page.waitForTimeout(300);
await page.screenshot({ path: '.shots/02-home-dark.png' });
console.log('02-home-dark');

// карточка игры с вариантами локализации
await page.goto(BASE + '/index.html#alanswake2', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
const translations = await page.$('.translations');
if (translations) {
  await translations.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await translations.screenshot({ path: '.shots/03-details.png' });
  console.log('03-details');
} else {
  console.log('03-details: блок переводов не найден');
}

// список
await page.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
await page.click('.view-toggle button[data-view="list"]');
await page.waitForTimeout(500);
await page.screenshot({ path: '.shots/04-list.png' });
console.log('04-list');

// мобильный
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
await mobile.waitForTimeout(700);
await mobile.screenshot({ path: '.shots/05-mobile.png' });
console.log('05-mobile');

await browser.close();
server.close();
