/* Генерация статических картинок: node scripts/make-assets.mjs
   Создаёт images/og.png (1200×630) и apple-touch-icon.png (180×180)
   в фирменной палитре самиздата. */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const OG_HTML = `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><style>
  @font-face { font-family: 'x'; src: local('Arial'); }
  * { box-sizing: border-box; margin: 0; }
  body {
    width: 1200px; height: 630px; overflow: hidden;
    background: #efe6d3; color: #14110d;
    font-family: Georgia, 'Times New Roman', serif;
    position: relative;
  }
  .paper { position: absolute; inset: 0;
    background:
      repeating-linear-gradient(0deg, rgba(0,0,0,.025) 0 2px, transparent 2px 6px),
      radial-gradient(1200px 600px at 50% -10%, rgba(176,58,42,.10), transparent 60%);
  }
  .frame { position: absolute; inset: 34px; border: 4px solid #14110d; }
  .frame::after { content: ''; position: absolute; inset: 10px; border: 1px dashed rgba(20,17,13,.45); }
  .content { position: relative; height: 100%; display: flex; flex-direction: column;
    align-items: center; justify-content: center; text-align: center; padding: 0 120px; gap: 22px; }
  .kicker { font-family: 'Courier New', monospace; font-size: 20px; letter-spacing: .34em;
    text-transform: uppercase; color: #b03a2a; font-weight: 700; }
  h1 { font-size: 94px; line-height: 1.04; letter-spacing: -.02em; font-weight: 700; }
  .sub { font-family: 'Courier New', monospace; font-size: 26px; letter-spacing: .12em;
    text-transform: uppercase; color: #4a443a; }
  .rule { width: 240px; height: 4px; background: #b03a2a; }
  .stat { font-family: 'Courier New', monospace; font-size: 22px; color: #4a443a; }
</style></head>
<body>
  <div class="paper"></div>
  <div class="frame"></div>
  <div class="content">
    <div class="kicker">GameVoice</div>
    <h1>Русские локализации<br>и озвучки игр</h1>
    <div class="rule"></div>
    <div class="stat">102 игры · 461 рабочая ссылка</div>
    <div class="sub">stintik-123.github.io/GameVoice</div>
  </div>
</body></html>`;

const ICON_HTML = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; }
  body { width: 180px; height: 180px; background: #efe6d3; display: flex;
    align-items: center; justify-content: center; position: relative; overflow: hidden; }
  .box { width: 132px; height: 132px; border: 8px solid #14110d; background: #f6f0e2;
    box-shadow: 8px 8px 0 #b03a2a; display: flex; align-items: center; justify-content: center; }
  .box span { font-family: Georgia, serif; font-weight: 700; font-size: 62px; color: #14110d; }
</style></head><body><div class="box"><span>GV</span></div></body></html>`;

const browser = await chromium.launch();

async function shot(html, width, height, out) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.setContent(html, { waitUntil: 'load' });
  await page.waitForTimeout(200);
  const file = path.join(ROOT, out);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await page.screenshot({ path: file });
  await page.close();
  console.log('создано:', out);
}

await shot(OG_HTML, 1200, 630, 'images/og.png');
await shot(ICON_HTML, 180, 180, 'apple-touch-icon.png');

await browser.close();
