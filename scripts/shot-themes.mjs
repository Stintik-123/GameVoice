/* Полностраничные скриншоты обеих тем: node scripts/shot-themes.mjs */
import { chromium } from 'playwright';
import { listen } from './serve.mjs';

const { server, port } = await listen(0);
const BASE = `http://127.0.0.1:${port}`;
const browser = await chromium.launch();

for (const theme of ['light', 'dark']) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
  await page.waitForTimeout(400);

  await page.evaluate(() => window.scrollTo(0, 700));
  await page.waitForTimeout(500);
  await page.screenshot({ path: `.shots/08-catalog-${theme}.png` });

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await page.screenshot({ path: `.shots/09-footer-${theme}.png` });

  console.log(theme);
  await page.close();
}

await browser.close();
server.close();
