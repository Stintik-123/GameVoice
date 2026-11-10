/* Проверка фонового трейлера в hero: node scripts/check-hero-video.mjs */
import { chromium } from 'playwright';
import { listen } from './serve.mjs';

const { server, port } = await listen(0);
const BASE = `http://127.0.0.1:${port}`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(6000);

const state = await page.evaluate(() => {
  const wrap = document.querySelector('#heroVideo');
  const v = wrap?.querySelector('video');
  return {
    wrapOn: wrap?.classList.contains('is-on'),
    hasVideo: !!v,
    hasIframe: !!wrap?.querySelector('iframe'),
    readyState: v?.readyState,
    currentTime: v?.currentTime,
    duration: v?.duration,
    videoWidth: v?.videoWidth,
    paused: v?.paused,
    src: v?.currentSrc?.slice(0, 90),
  };
});
console.log(JSON.stringify(state, null, 1));

// прокрутить hero к следующей игре и проверить смену источника
const before = state.src;
await page.click('#heroNext');
await page.waitForTimeout(6000);
const state2 = await page.evaluate(() => {
  const v = document.querySelector('#heroVideo video');
  return { src: v?.currentSrc?.slice(0, 90), currentTime: v?.currentTime, readyState: v?.readyState };
});
console.log('после перехода:', JSON.stringify(state2));
console.log('источник сменился:', before !== state2.src);

console.log(errors.length ? 'ОШИБКИ: ' + errors.slice(0, 5).join(' | ') : 'консоль чистая');
await browser.close();
server.close();
