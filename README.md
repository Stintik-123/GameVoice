# GameVoice — каталог русификаторов и озвучек

Статичный сайт (HTML/CSS/JS, без сборки) — каталог русских локализаций игр
в стиле самиздат/broadsheet: тёплая бумага, типографская краска, газетные заголовки.

**Live:** [stintik-123.github.io/GameVoice](https://stintik-123.github.io/GameVoice/)
**Репозиторий:** [github.com/Stintik-123/GameVoice](https://github.com/Stintik-123/GameVoice)

В каталоге **102 игры** (13 вручную собранных + 89 из открытого API GamesVoice),
**461 рабочая ссылка** на скачивание озвучек, русификаторы и магазины.

## Структура

```
/
├── index.html              # Разметка, модалки, подключение шрифтов/скриптов (module)
├── manifest.webmanifest    # PWA
├── package.json            # npm-команды для сборки каталога и проверок
├── robots.txt
├── sitemap.xml
├── favicon.svg
├── apple-touch-icon.png    # Генерируется scripts/make-assets.mjs
├── css/
│   ├── tokens.css          # Дизайн-токены: цвета, светлая/тёмная темы
│   ├── base.css            # Reset, типографика, базовые состояния
│   ├── layout.css          # Header, hero, секции, футер, адаптив
│   ├── components.css      # Карточки, фильтры, модалки, тосты
│   ├── covers.css          # Steam-обложки, бейджи, герой-оверлеи
│   └── updates.css         # Блок «Обновления»
├── images/
│   ├── og.png              # Open Graph 1200×630 (генерируется)
│   └── *.jpg               # фото для блоков «О проекте» и «Обновления»
├── data/
│   ├── gamesvoice-products.json  # сырой ответ API GamesVoice (90 проектов)
│   └── link-status.json          # результат проверки ссылок
└── js/
    ├── app.js              # Точка входа: инициализация, hero, модалки, тема
    ├── router.js           # parseHash → home / catalog / favorites / about / game
    ├── store.js            # Состояние: фильтры, сортировка, избранное, тема
    ├── catalog.js          # createCatalog → byId / filter / genres / counts
    ├── search.js           # translit + skeleton, buildIndex, matches, highlight
    ├── render.js           # Рендер карточек, переводов, статистики
    ├── steam-covers.js     # Обложки и герой-фоны по Steam appid
    ├── data-curated.js     # 13 ручных карточек (описания, авторы, трейлеры)
    └── data.js             # Генерируется: 102 игры (ручные + API)
```

## Возможности

- Поиск (`/`) по названию, студии, жанру, году и тегам с подсветкой совпадений;
  работает транслит и «фонетический скелет» — «киберпанк» находит «Cyberpunk»
- Фильтры: тип (чипы со счётчиками) / жанр / статус + сортировка
  (дата обновления · год · число вариантов · алфавит), сброс в один клик
- Виды каталога: сетка · список · лента (carousel), выбор запоминается
- Избранное и история просмотров (localStorage)
- Deep-link `#cyberpunk` / `#bg3` открывает карточку игры
- Hero-баннер с ротацией и фоновым muted-трейлером YouTube (десктоп, не при reduced-motion)
- Клавиши: `/` — поиск, `Esc` — закрыть модалку/меню
- Модалки с автофокусом, возвратом фокуса и focus trap
- FAQ; предложение игры → issue на GitHub
- Светлая/тёмная тема с учётом системной настройки; PWA-манифест
- Fallback обложек (буква названия), если Steam-картинка недоступна

## Запуск

```bash
npm install          # только для dev-инструментов (playwright)
npm run serve        # http://localhost:8099
```

Любой статический сервер подходит (Live Server, `npx serve`, GitHub Pages).

## Данные

Каталог собирается скриптом из двух источников:

1. `js/data-curated.js` — 13 карточек, собранных вручную: описания, авторы,
   трейлеры, ссылки на Playground/GamesVoice. Ручные записи главнее.
2. `data/gamesvoice-products.json` — открытый API GamesVoice
   (`api.gamesvoice.ru/api/products`), даёт обложки, ссылки на скачивание,
   магазины и статус проекта.

```bash
npm run fetch:api      # обновить data/gamesvoice-products.json
npm run check:links    # перепроверить ссылки → data/link-status.json
npm run build:catalog  # пересобрать js/data.js
```

Мёртвые ссылки (404/таймаут) вырезаются из карточек; ответы 401/403/405/429
считаются блокировкой бота, а не поломкой ссылки.

Поля игры: `id`, `title`, `subtitle`, `year`, `genre`, `developer`, `platforms`,
`tags`, `trailerId`, `extraTrailers`, `desc`, `translations`.

Поля перевода: `type` (text/voice/both/subtitles), `status` (done/progress/abandoned),
`author`, `version`, `updated` (YYYY-MM или YYYY-MM-DD), `name`, `body`, `links`.

Длинные блоки «Установка», «Команда и актёры» и «Частые вопросы» сворачиваются
в `<details>` — карточка не превращается в простыню.

Обложки и герой-фоны подгружаются автоматически из Steam CDN по appid
(`js/steam-covers.js`); там же можно задать `g.cover` / `g.heroImage` вручную.

## Разработка

JS — ES-модули: `app.js` (точка входа) → `router` / `store` / `catalog` /
`search` / `render`. Стили — `css/*`, сборки нет: правьте исходники и
обновляйте страницу.

```bash
npm run check:site   # 15 e2e-проверок (playwright): поиск, фильтры, модалки, тема
npm run shots        # скриншоты в .shots/ для визуальной проверки
npm run assets       # пересобрать images/og.png и apple-touch-icon.png
```

Еженедельная проверка ссылок из `js/data.js`: `.github/workflows/link-check.yml` (lychee).
