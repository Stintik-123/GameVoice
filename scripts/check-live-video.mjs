/* Проверка живой версии: трейлер в hero + тёмная тема. node scripts/check-live-video.mjs */
import { chromium } from 'playwright';

const URL = process.argv[2] || 'https://stintik-123.github.io/GameVoice/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(9000);

const v = await page.evaluate(() => {
  const el = document.querySelector('#heroVideo video');
  return {
    on: document.querySelector('#heroVideo')?.classList.contains('is-on'),
    readyState: el?.readyState,
    currentTime: el?.currentTime,
    width: el?.videoWidth,
    duration: el?.duration,
  };
});
console.log('hero-видео:', JSON.stringify(v));

// тёмная тема
await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
await page.waitForTimeout(400);
const colors = await page.evaluate(() => {
  const cs = getComputedStyle(document.documentElement);
  return {
    paper: cs.getPropertyValue('--paper').trim(),
    paper2: cs.getPropertyValue('--paper-2').trim(),
    bodyBg: getComputedStyle(document.body).backgroundColor,
  };
});
console.log('тёмная тема:', JSON.stringify(colors));

console.log(errors.length ? 'ОШИБКИ: ' + errors.slice(0, 5).join(' | ') : 'консоль чистая');
await browser.close();
