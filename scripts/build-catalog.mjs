/* Собирает каталог GameVoice: ручные записи (js/data-curated.js) + данные
   GamesVoice API (data/gamesvoice-products.json) → js/data.js.

   Запуск:
     node scripts/fetch-gamesvoice.mjs     # обновить данные API
     node scripts/build-catalog.mjs        # пересобрать каталог

   Мёртвые ссылки помечаются в data/link-status.json и не попадают в каталог:
   вместо них остаётся ссылка на страницу проекта. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CURATED } from '../js/data-curated.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PRODUCTS = path.join(ROOT, 'data', 'gamesvoice-products.json');
const LINK_STATUS = path.join(ROOT, 'data', 'link-status.json');
const OUT = path.join(ROOT, 'js', 'data.js');

const PRODUCT_PAGE = 'https://gamesvoice.ru/product/';

/* --------------------------------- утилиты -------------------------------- */

function stripHtml(html) {
  return String(html || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&laquo;/g, '«')
    .replace(/&raquo;/g, '»')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstParagraph(html) {
  const m = String(html || '').match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  return stripHtml(m ? m[1] : html).slice(0, 320);
}

/** Ищет в описании строку вида «Разработчик: Remedy Entertainment». */
function fieldFromDescription(html, label, stops) {
  const text = stripHtml(html);
  const stop = (stops || []).map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const re = new RegExp(label + '\\s*:\\s*(.+?)(?=' + stop + '|$)', 'i');
  const m = text.match(re);
  return m ? m[1].trim().replace(/[.,;]$/, '') : '';
}

const AFTER_GENRE = ['Разработчик', 'Издатель', 'Дата выхода'];
const AFTER_DEV = ['Издатель', 'Дата выхода'];

function platformsFromStores(stores) {
  const map = [
    [/steam/i, 'steam'],
    [/gog/i, 'gog'],
    [/epic/i, 'epic'],
    [/playstation/i, 'ps'],
    [/xbox/i, 'xbox'],
    [/nintendo|switch/i, 'switch'],
    [/store\.steampowered/i, 'steam'],
  ];
  const out = [];
  for (const s of stores || []) {
    const label = `${s.name || ''} ${s.link || ''}`;
    for (const [re, id] of map) {
      if (re.test(label) && !out.includes(id)) out.push(id);
    }
  }
  return out;
}

const PLATFORM_LABELS = {
  steam: 'Steam',
  gog: 'GOG',
  epic: 'Epic Games',
  ps: 'PlayStation',
  xbox: 'Xbox',
  switch: 'Nintendo Switch',
};

const TYPE_BY_FLAGS = (p) => {
  const hasText = !!p.is_text;
  const hasVoice = !!p.is_sound || !!p.is_song;
  if (hasText && hasVoice) return 'both';
  if (hasVoice) return 'voice';
  if (hasText) return 'text';
  return 'subtitles';
};

const TYPE_LABEL = {
  text: 'текст',
  voice: 'озвучка',
  both: 'текст + озвучка',
  subtitles: 'субтитры',
};

/** Оборачивает длинный блок в раскрывающийся <details>. */
function collapsible(title, html) {
  return `<details class="t-more"><summary>${title}</summary><div class="t-more__body">${html}</div></details>`;
}

/** Обрезает HTML до разумной длины по границе тега/слова. */
function clampHTML(html, limit = 4000) {
  if (html.length <= limit) return html;
  let cut = html.slice(0, limit);
  const last = cut.lastIndexOf('>');
  if (last > limit * 0.6) cut = cut.slice(0, last + 1);
  return cut + '<p class="t-more__cut">… список сокращён.</p>';
}

/** Собирает HTML-тело карточки из полей API. */
function bodyFrom(product) {
  const parts = [];
  const desc = String(product.description || '').trim();
  if (desc) parts.push(clampHTML(desc, 2500));
  const instruction = String(product.instruction || '').trim();
  if (instruction) parts.push(collapsible('Установка', clampHTML(instruction, 2500)));
  const authors = String(product.authors || '').trim();
  if (authors) parts.push(collapsible('Команда и актёры', clampHTML(authors, 6000)));
  const faq = String(product.faq || '').trim();
  if (faq) parts.push(collapsible('Частые вопросы', clampHTML(faq, 2500)));
  const updates = Array.isArray(product.updates) ? product.updates.slice(0, 3) : [];
  if (updates.length) {
    const items = updates
      .map((u) => {
        const v = stripHtml(u.version || u.title || '');
        const t = stripHtml(u.text || u.body || u.description || '');
        const d = (u.created_at || u.published_at || '').slice(0, 10);
        return `<li><strong>${v || 'Обновление'}</strong>${d ? ' · ' + d : ''}${t ? ' — ' + t : ''}</li>`;
      })
      .join('');
    parts.push('<h4>Обновления</h4><ul>' + items + '</ul>');
  }
  return parts.join('\n');
}

/** Ссылка-кнопка. */
function linkBtn(href, label, cls) {
  return `<a class="${cls}" href="${href}" target="_blank" rel="noopener">${label}</a>`;
}

function linksFrom(product, alive) {
  const out = [];
  const ok = (url) => alive(url);
  const page = PRODUCT_PAGE + product.alias;

  if (product.file && ok(product.file)) {
    out.push(linkBtn(product.file, 'Скачать озвучку', 'btn btn-primary'));
  }
  if (product.yandex_link && ok(product.yandex_link)) {
    out.push(linkBtn(product.yandex_link, 'Яндекс.Диск', 'btn'));
  }
  if (product.mail_link && ok(product.mail_link)) {
    out.push(linkBtn(product.mail_link, 'Почта (MIME)', 'btn'));
  }
  if (product.google_link && ok(product.google_link)) {
    out.push(linkBtn(product.google_link, 'Google Drive', 'btn'));
  }
  for (const s of product.stores || []) {
    if (s.link && ok(s.link)) out.push(linkBtn(s.link, s.name || 'Магазин', 'btn'));
  }
  out.push(linkBtn(page, 'Страница проекта', 'btn'));
  return out.join('\n');
}

/* ------------------------------ сборка каталога ---------------------------- */

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

const linkStatus = readJson(LINK_STATUS, { links: {} });
const aliveCache = linkStatus.links || {};

function isAlive(url) {
  if (!url) return false;
  if (!url.startsWith('http')) return true;
  const rec = aliveCache[url];
  // без проверки считаем ссылку живой, если её не проверяли
  if (rec === undefined) return true;
  return rec.ok === true;
}

const products = readJson(PRODUCTS, { products: [] }).products || [];
const curatedById = new Map(CURATED.map((g) => [g.id, g]));

const built = [];
const seen = new Set();

for (const p of products) {
  const alias = p.alias || String(p.id);
  if (!alias || seen.has(alias)) continue;
  seen.add(alias);

  const genreRaw = fieldFromDescription(p.description, 'Жанр', AFTER_GENRE);
  const genre = genreRaw ? genreRaw.split(',')[0].trim() : '';
  const developer = fieldFromDescription(p.description, 'Разработчик', AFTER_DEV);
  const yearMatch = stripHtml(p.description).match(/Дата выхода игры\s*:\s*[^\d]*(\d{4})/i);
  const year = yearMatch ? yearMatch[1] : '';
  const type = TYPE_BY_FLAGS(p);
  const updated = String(p.published_at || '').slice(0, 7);
  const status = p.is_develop ? 'progress' : 'done';

  const tags = [];
  if (genre) tags.push(genre.toLowerCase());
  if (p.is_song) tags.push('песни');
  if (p.is_texture) tags.push('текстуры');
  if (p.is_official) tags.push('официальный перевод');
  else tags.push('фанатская озвучка');

  const translations = [
    {
      type,
      status,
      author: p.is_official ? 'GamesVoice (официальная)' : 'GamesVoice',
      version: '',
      updated,
      name: p.title_rus ? p.title_eng + ' — ' + p.title_rus : p.title_eng,
      body: bodyFrom(p),
      links: linksFrom(p, isAlive),
    },
  ];

  const apiGame = {
    id: alias,
    title: p.title_eng,
    subtitle: p.title_rus || '',
    year,
    genre,
    developer,
    platforms: platformsFromStores(p.stores),
    cover: p.preview || null,
    heroImage: (p.banners && (p.banners.desktop || p.banners.mobile)) || null,
    tags: tags.filter(Boolean),
    desc: firstParagraph(p.description),
    source: 'gamesvoice',
    translations,
  };

  const curated = curatedById.get(alias);
  if (curated) {
    // ручная запись главнее: сохраняем описания, авторов, трейлеры и ссылки
    built.push({
      ...apiGame,
      ...curated,
      id: alias,
      cover: curated.cover || apiGame.cover,
      heroImage: curated.heroImage || apiGame.heroImage,
      platforms: (curated.platforms && curated.platforms.length) ? curated.platforms : apiGame.platforms,
      tags: (curated.tags && curated.tags.length) ? curated.tags : apiGame.tags,
      source: 'curated+gamesvoice',
    });
  } else {
    built.push(apiGame);
  }
}

// ручные игры, которых нет в API
for (const g of CURATED) {
  if (seen.has(g.id)) continue;
  built.push({ ...g, source: 'curated' });
}

built.sort((a, b) => a.title.localeCompare(b.title, 'ru'));

/* --------------------------------- запись --------------------------------- */

const header = `/* Каталог GameVoice — ФАЙЛ ГЕНЕРИРУЕТСЯ.
   Источник: scripts/build-catalog.mjs (ручные записи + GamesVoice API).
   Правьте js/data-curated.js или данные API, потом запустите сборку. */

export const GAMES = `;

const body = built
  .map((g) => {
    const t = g.translations
      .map(
        (tr) =>
          `    {
      type: ${JSON.stringify(tr.type)},
      status: ${JSON.stringify(tr.status)},
      author: ${JSON.stringify(tr.author || '')},
      version: ${JSON.stringify(tr.version || '')},
      updated: ${JSON.stringify(tr.updated || '')},
      name: ${JSON.stringify(tr.name || '')},
      body: ${JSON.stringify(tr.body || '')},
      links: ${JSON.stringify(tr.links || '')}
    }`
      )
      .join(',\n');
    return `  {
    id: ${JSON.stringify(g.id)},
    title: ${JSON.stringify(g.title)},
    subtitle: ${JSON.stringify(g.subtitle || '')},
    year: ${JSON.stringify(g.year || '')},
    genre: ${JSON.stringify(g.genre || '')},
    developer: ${JSON.stringify(g.developer || '')},
    platforms: ${JSON.stringify(g.platforms || [])},
    cover: ${JSON.stringify(g.cover || null)},
    heroImage: ${JSON.stringify(g.heroImage || null)},
    tags: ${JSON.stringify(g.tags || [])},
    desc: ${JSON.stringify(g.desc || '')},
    source: ${JSON.stringify(g.source || 'gamesvoice')},
    trailerId: ${JSON.stringify(g.trailerId || null)},
    extraTrailers: ${JSON.stringify(g.extraTrailers || [])},
    translations: [
${t}
    ]
  }`;
  })
  .join(',\n');

fs.writeFileSync(OUT, header + '[\n' + body + '\n];\n');

const withVoice = built.filter((g) =>
  g.translations.some((t) => t.type === 'voice' || t.type === 'both')
).length;
console.log(`Каталог собран: ${built.length} игр, из них с озвучкой ${withVoice}`);
console.log(`  ручных: ${built.filter((g) => g.source.startsWith('curated')).length}, из API: ${built.filter((g) => g.source === 'gamesvoice').length}`);
console.log(`  жанров: ${new Set(built.map((g) => g.genre).filter(Boolean)).size}`);
console.log(`  с обложкой: ${built.filter((g) => g.cover).length}`);
console.log(`  записано в ${path.relative(ROOT, OUT)}`);
