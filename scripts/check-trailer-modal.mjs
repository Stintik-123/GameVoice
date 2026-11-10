/* Проверка модалки трейлера: node scripts/check-trailer-modal.mjs */
import { chromium } from 'playwright';
import { listen } from './serve.mjs';

const { server, port } = await listen(0);
const BASE = `http://127.0.0.1:${port}`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto(BASE + '/index.html#1997', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);

const btnVisible = await page.isVisible('#heroTrailerBtn');
console.log('кнопка «Трейлер» видна:', btnVisible);
await page.click('#heroTrailerBtn');
await page.waitForTimeout(7000);

const state = await page.evaluate(() => {
  const modal = document.querySelector('#trailerModal');
  const v = document.querySelector('#videoFrame video');
  const i = document.querySelector('#videoFrame iframe');
  return {
    modalOpen: modal?.classList.contains('open'),
    title: document.querySelector('#trailerTitle')?.textContent,
    hasVideo: !!v,
    hasIframe: !!i,
    readyState: v?.readyState,
    duration: v?.duration,
    currentTime: v?.currentTime,
    videoWidth: v?.videoWidth,
  };
});
console.log(JSON.stringify(state, null, 1));

await page.screenshot({ path: '.shots/07-trailer-modal.png' });
console.log('07-trailer-modal');
console.log(errors.length ? 'ОШИБКИ: ' + errors.slice(0, 4).join(' | ') : 'консоль чистая');

await browser.close();
server.close();
