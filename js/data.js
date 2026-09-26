const games = [
  {
    id: 'cyberpunk',
    title: 'Cyberpunk 2077',
    subtitle: '+ Phantom Liberty',
    year: '2020',
    genre: 'RPG',
    developer: 'CD Projekt RED',
    platforms: ['steam', 'gog', 'epic'],
    cover: null,
    tags: ['открытый мир', 'футуристика', 'dlc'],
    trailerId: '8X2kIfS6fb8',
    extraTrailers: [{ id: 'sJbexcm4Trk', label: 'Phantom Liberty' }],
    desc: 'Официальный текст и озвучка основной игры. Для Phantom Liberty — фанатские дубляжи (официально только субтитры).',
    translations: [
      { type: 'text', status: 'done', author: 'CD Projekt RED',
        name: 'Официальный перевод CDPR',
        body: '<p><strong>Что переведено:</strong> Весь основной сюжет и Phantom Liberty (текст и субтитры)</p><p><strong>Примечание:</strong> Русская озвучка основной игры есть, DLC Phantom Liberty — только субтитры.</p>',
        links: '<span class="link-muted">Уже в игре</span>' },
      { type: 'voice', status: 'done', author: 'DreamVoice', version: 'v5.3', updated: '2025-08',
        name: 'DreamVoice — Гибридный дубляж Phantom Liberty',
        body: '<p><strong>Статус:</strong> актуально на патч 2.3+</p><p><strong>Что озвучено:</strong> Полный дубляж DLC Phantom Liberty (гибрид: нейросеть и ручная доработка)</p><p><strong>Совместимость:</strong> Steam, GOG</p>',
        links: '<a href="https://www.playground.ru/cyberpunk_2077/file/cyberpunk_2077_gibridnyj_dublyazh_dlya_dlc_phantom_liberty_v1_0_5_3_dreamvoice-1691775" class="btn" target="_blank" rel="noopener">Playground</a><a href="https://t.me/DreamVoiceRu" class="btn" target="_blank" rel="noopener">Telegram</a>',
        install: '<details class="install"><summary>Краткая установка</summary><ol><li>Удалите предыдущие моды озвучки</li><li>Скачайте архив с Playground</li><li>Распакуйте в папку с игрой по инструкции из архива</li></ol></details>' },
      { type: 'voice', status: 'done', author: 'SynthVoiceRu', version: 'r12', updated: '2024-03',
        name: 'Нейро-дубляж SynthVoiceRu',
        body: '<p><strong>Что озвучено:</strong> Основная игра и DLC в разном качестве</p>',
        links: '<a href="https://www.playground.ru/cyberpunk_2077/file/cyberpunk_2077_nejro_dublyazh_dlya_dlc_phantom_liberty_v2_0_0_synthvoiceru-1683699" class="btn" target="_blank" rel="noopener">Playground</a>' }
    ]
  },
  {
    id: 'bg3',
    title: "Baldur's Gate 3",
    year: '2023',
    genre: 'CRPG',
    developer: 'Larian Studios',
    platforms: ['steam', 'gog', 'ps', 'xbox'],
    cover: null,
    tags: ['dnd', 'пошаговая', 'кооператив'],
    trailerId: '1T22wNvoNiU',
    desc: 'Официальный текст. Полной профессиональной озвучки нет — есть нейросетевые варианты SynthVoiceRu с прямыми ссылками.',
    translations: [
      { type: 'text', status: 'done', author: 'Larian Studios',
        name: 'Официальный перевод Larian',
        body: '<p><strong>Что переведено:</strong> Полный текстовый перевод и субтитры</p>',
        links: '<span class="link-muted">Уже в игре</span>' },
      { type: 'voice', status: 'done', author: 'SynthVoiceRu', version: '1.0 (SV2)', updated: '2024-12',
        name: 'SynthVoiceRu — Нейросетевой дубляж и закадр',
        body: '<p><strong>Что озвучено:</strong> Полный дубляж и отдельная закадровая версия (модель SV2)</p>',
        links: '<a href="https://www.playground.ru/baldurs_gate_3/file/baldurs_gate_3_russkaya_ozvuchka_nejrosetevoj_dublyazh_v1_0_synthvoiceru-1698229" class="btn" target="_blank" rel="noopener">Playground — дубляж</a><a href="https://www.playground.ru/baldurs_gate_3/file/baldurs_gate_3_rusifikator_zvuka_nejrosetevoj_zakadr_v1_0_synthvoiceru-1698264" class="btn" target="_blank" rel="noopener">Закадр</a>',
        install: '<details class="install"><summary>Краткая установка</summary><ol><li>Скачать файлы (3–4 архива)</li><li>Положить в папку Mods Larian (LocalAppData)</li><li>В настройках отключить озвучку реплик по клику</li></ol></details>' }
    ]
  },
  {
    id: 'hogwarts',
    title: 'Hogwarts Legacy',
    year: '2023',
    genre: 'Action-RPG',
    developer: 'Avalanche Software',
    platforms: ['steam', 'ps', 'xbox'],
    cover: null,
    tags: ['гарри поттер', 'открытый мир', 'магия'],
    trailerId: '1O6Qstncpnc',
    desc: 'Один из самых качественных фанатских дубляжей последних лет — GamesVoice.',
    translations: [
      { type: 'both', status: 'done', author: 'GamesVoice', version: '1.5', updated: '2026-09',
        name: 'GamesVoice — Полная локализация',
        body: '<p><strong>Что переведено:</strong> Текст, текстуры, полная профессиональная озвучка</p>',
        links: '<a href="https://www.playground.ru/hogwarts_legacy/file/hogwarts_legacy_rusifikator_teksta_tekstur_i_zvuka_gamesvoice-1681716" class="btn" target="_blank" rel="noopener">Playground</a><a href="https://gamesvoice.ru/library" class="btn" target="_blank" rel="noopener">GamesVoice</a>',
        install: '<details class="install"><summary>Краткая установка</summary><ol><li>Скачать последнюю версию с Playground</li><li>Запустить установщик и указать папку с игрой</li></ol></details>' }
    ]
  },
  {
    id: 'stalker2',
    title: 'S.T.A.L.K.E.R. 2',
    subtitle: 'Heart of Chornobyl',
    year: '2024',
    genre: 'FPS / Survival',
    developer: 'GSC Game World',
    platforms: ['steam', 'xbox'],
    cover: null,
    tags: ['сталкер', 'зона', 'выживание'],
    trailerId: 'nAz9qlbl_8g',
    desc: 'Гибридные фанатские дубляжи — один из самых активных проектов локализации.',
    translations: [
      { type: 'text', status: 'done', author: 'GSC / сообщество',
        name: 'Официальный и улучшенный текст',
        body: '<p><strong>Что переведено:</strong> Текст и субтитры</p>',
        links: '<span class="link-muted">Уже в игре</span>' },
      { type: 'voice', status: 'done', author: 'Eloquence / Реплика / SynthVoice', version: '2.0', updated: '2026-01',
        name: 'Тройной гибридный дубляж',
        body: '<p><strong>Что озвучено:</strong> ~26 000 файлов: Реплика + Eloquence Studio + SynthVoice</p>',
        links: '<a href="https://www.playground.ru/stalker_2/file/s_t_a_l_k_e_r_2_rusifikator_zvuka_trojnoj_gibridnyj_dublyazh_eloquence_studio_replika_synthvoice-1817504" class="btn" target="_blank" rel="noopener">Playground — тройной дубляж</a><a href="https://www.playground.ru/stalker_2/file/rus" class="btn" target="_blank" rel="noopener">Все русики</a>',
        install: '<details class="install"><summary>Краткая установка</summary><ol><li>Скачать архив нужного варианта</li><li>Распаковать в Stalker2\\Content\\Paks\\~mods</li></ol></details>' }
    ]
  }
];
