# GameVoice — каталог русификаторов и озвучек

Статичный сайт (HTML/CSS/JS, без сборки) — каталог русских локализаций игр
в стиле самиздат/broadsheet: тёплая бумага, типографская краска, газетные заголовки.

**Live:** [stintik-123.github.io/GameVoice](https://stintik-123.github.io/GameVoice/)
**Репозиторий:** [github.com/Stintik-123/GameVoice](https://github.com/Stintik-123/GameVoice)

## Структура

```
/
├── index.html              # Разметка, модалки, подключение шрифтов/скриптов (defer)
├── manifest.webmanifest    # PWA
├── robots.txt
├── sitemap.xml
├── favicon.svg
├── apple-touch-icon.png
├── css/
│   ├── tokens.css          # Дизайн-токены: цвета, светлая/тёмная темы
│   ├── base.css            # Reset, типографика, базовые состояния
│   ├── layout.css          # Header, hero, секции, футер, адаптив
│   ├── components.css      # Карточки, фильтры, модалки, тосты
│   └── covers.css          # Steam-обложки, бейджи, герой-оверлеи
├── images/
│   └── og.png              # Open Graph 1200×630
└── js/
    ├── data.js             # База: игры, варианты локализации, реальные ссылки
    ├── steam-covers.js     # Подстановка обложек/герой-картинок по Steam appid
    ├── components.js       # GV.* — рендер HTML-компонентов
    └── app.js              # Логика: поиск, фильтры, избранное, hero
```

## Возможности

- Поиск (`/`) по названию, студии, жанру, году и тегам с подсветкой совпадений
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
# из корня репозитория
python3 -m http.server 8099
# открыть http://localhost:8099
```

Любой статический сервер подходит (Live Server, `npx serve`, GitHub Pages).

## Данные

Все ссылки в `js/data.js` ведут на публичные страницы Playground, Nexus Mods,
GamesVoice, Steam Workshop и Telegram. GameVoice **не хостит** файлы — только навигация.

Поля игры: `id`, `title`, `subtitle`, `year`, `genre`, `developer`, `platforms`,
`tags`, `trailerId`, `extraTrailers`, `desc`, `translations`.

Поля перевода: `type` (text/voice/both/subtitles), `status` (done/progress/abandoned),
`author`, `version`, `updated` (YYYY-MM или YYYY-MM-DD), `name`, `body`, `links`, `install`.

Обложки и герой-фоны подгружаются автоматически из Steam CDN по appid
(`js/steam-covers.js`); там же можно задать `g.cover` / `g.heroImage` вручную.

## Разработка

Логика — `js/app.js`, компоненты — `js/components.js`, стили — `css/*`.
Сборки нет: правьте исходники и обновляйте страницу.

Еженедельная проверка ссылок из `js/data.js`: `.github/workflows/link-check.yml` (lychee).
