/* Скриншот hero с playing-трейлером: node scripts/shot-hero.mjs */
import { chromium } from 'playwright';
import { listen } from './serve.mjs';

const { server, port } = await listen(0);
const BASE = `http://127.0.0.1:${port}`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(9000);
await page.screenshot({ path: '.shots/06-hero-video.png' });
console.log('06-hero-video');

const st = await page.evaluate(() => {
  const v = document.querySelector('#heroVideo video');
  return { t: v?.currentTime, w: v?.videoWidth, on: document.querySelector('#heroVideo')?.classList.contains('is-on') };
});
console.log(JSON.stringify(st));

await browser.close();
server.close();
