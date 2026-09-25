/* ============================================================
   GameVoice — база данных каталога (22 игры)
   type: text | voice | both | subtitles
   status: done | progress | abandoned
   platforms: steam | gog | epig | goa | ps | xbox | switch
   ============================================================ */

const games = [
  {
    id: 'cyberpunk',
    title: 'Cyberpunk 2077',
    subtitle: '+ Phantom Liberty',
    year: '2020',
    genre: 'RPG',
    developer: 'CD Projekt RED',
    platforms: ['steam', 'gog', 'epig'],
    coverClass: 'cyberpunk',
    tags: ['открытый мир', 'футуристика', 'dlc'],
    trailerId: '8X2kIfS6fb8',
    extraTrailers: [{ id: 'sJbexcm4Trk', label: 'Phantom Liberty' }],
    desc: 'Официальный текстовый перевод + несколько фанатских озвучек для основного сюжета и Phantom Liberty.',
    translations: [
      {
        type: 'text', status: 'done', author: 'CD Projekt RED', rating: 4.8,
        name: 'Официальный перевод CDPR',
        body: `<p><strong>Что переведено:</strong> Весь основной сюжет + Phantom Liberty (текст и субтитры)</p><p><strong>Примечание:</strong> Идёт в комплекте с игрой. Русская озвучка основной игры есть, DLC — только субтитры.</p>`,
        links: `<span class="link-muted">Уже в игре</span>`
      },
      {
        type: 'voice', status: 'done', author: 'DreamVoice', rating: 4.6, version: 'v5.3', updated: '2025-08',
        name: 'DreamVoice — Гибридный дубляж Phantom Liberty',
        body: `<p><strong>Статус:</strong> актуально на патч 2.3+</p><p><strong>Что озвучено:</strong> Полный дубляж DLC Phantom Liberty (гибрид: нейросеть + доработка) + неозвученные фрагменты основной игры</p><p><strong>Совместимость:</strong> Steam / GOG</p>`,
        links: `<a href="https://www.playground.ru/cyberpunk_2077/file/cyberpunk_2077_gibridnyj_dublyazh_dlya_dlc_phantom_liberty_v1_0_5_3_dreamvoice-1691775" class="btn btn-accent" target="_blank" rel="noopener">Playground</a><a href="https://t.me/DreamVoiceRu" class="btn btn-ghost" target="_blank" rel="noopener">Telegram DreamVoice</a>`,
        install: `<details class="install"><summary>Краткая установка</summary><ol><li>Удалите предыдущие моды озвучки</li><li>Скачайте архив нужной версии с Playground</li><li>Распакуйте в папку с игрой (см. инструкцию в архиве)</li><li>Запустите игру</li></ol></details>`
      },
      {
        type: 'voice', status: 'progress', author: 'GamesVoice', rating: 0, version: '—', updated: '2026-09',
        name: 'GamesVoice — Профессиональный дубляж Phantom Liberty',
        body: `<p><strong>Статус:</strong> В активной разработке (запись идёт)</p><p><strong>Что планируется:</strong> Полный профессиональный дубляж с актёрами основной русской локализации</p>`,
        links: `<a href="https://gamesvoice.ru/library" class="btn btn-accent" target="_blank" rel="noopener">GamesVoice</a>`
      },
      {
        type: 'voice', status: 'done', author: 'SynthVoiceRu', rating: 3.9, version: 'r12', updated: '2024-03',
        name: 'Нейро-дубляж SynthVoiceRu',
        body: `<p><strong>Что озвучено:</strong> Основная игра + DLC в разном качестве</p><p><strong>Примечание:</strong> Быстрый вариант, качество ниже гибридного дубляжа DreamVoice</p>`,
        links: `<a href="https://www.playground.ru/cyberpunk_2077/file/cyberpunk_2077_nejro_dublyazh_dlya_dlc_phantom_liberty_v2_0_0_synthvoiceru-1683699" class="btn btn-accent" target="_blank" rel="noopener">Playground</a>`
      }
    ]
  },
  {
    id: 'bg3',
    title: "Baldur's Gate 3",
    subtitle: '',
    year: '2023',
    genre: 'CRPG',
    developer: 'Larian Studios',
    platforms: ['steam', 'gog', 'ps', 'xbox'],
    coverClass: 'bg3',
    tags: ['dnd', 'пошаговая', 'кооператив'],
    trailerId: '1T22wNvoNiU',
    desc: 'Официальный текст. Полноценной профессиональной озвучки нет — есть качественные нейросетевые варианты.',
    translations: [
      {
        type: 'text', status: 'done', author: 'Larian Studios', rating: 4.5,
        name: 'Официальный перевод Larian',
        body: `<p><strong>Что переведено:</strong> Полный текстовый перевод + субтитры</p>`,
        links: `<span class="link-muted">Уже в игре</span>`
      },
      {
        type: 'voice', status: 'done', author: 'SynthVoiceRu', rating: 4.7, version: '1.0 (SV2)', updated: '2024-12',
        name: 'SynthVoiceRu — Нейросетевой дубляж + закадр',
        body: `<p><strong>Что озвучено:</strong> Полный дубляж и отдельная закадровая версия</p><p><strong>Особенности:</strong> Модель SV2, исправлены обрезания в кат-сценах</p>`,
        links: `<a href="https://www.playground.ru/baldurs_gate_3/file/baldurs_gate_3_russkaya_ozvuchka_nejrosetevoj_dublyazh_v1_0_synthvoiceru-1698229" class="btn btn-accent" target="_blank" rel="noopener">Playground (дубляж)</a><a href="https://www.playground.ru/baldurs_gate_3/file/baldurs_gate_3_rusifikator_zvuka_nejrosetevoj_zakadr_v1_0_synthvoiceru-1698264" class="btn btn-ghost" target="_blank" rel="noopener">Playground (закадр)</a>`,
        install: `<details class="install"><summary>Краткая установка</summary><ol><li>Скачать файлы (3–4 архива)</li><li>Положить в <code>%LocalAppData%\\Larian Studios\\Baldur's Gate 3\\Mods</code></li><li>В настройках игры отключить озвучку реплик по клику</li></ol></details>`
      }
    ]
  },
  {
    id: 'hogwarts',
    title: 'Hogwarts Legacy',
    subtitle: '',
    year: '2023',
    genre: 'Action-RPG',
    developer: 'Avalanche Software',
    platforms: ['steam', 'ps', 'xbox'],
    coverClass: 'hogwarts',
    tags: ['гарри поттер', 'открытый мир', 'магия'],
    trailerId: '1O6Qstncpnc',
    desc: 'Один из самых качественных фанатских дубляжей последних лет от GamesVoice.',
    translations: [
      {
        type: 'both', status: 'done', author: 'GamesVoice', rating: 4.9, version: '1.5', updated: '2026-09',
        name: 'GamesVoice — Полная локализация',
        body: `<p><strong>Что переведено:</strong> Текст, текстуры, полная профессиональная озвучка</p><p><strong>Актёры:</strong> Профессиональный состав студии (143 актёра)</p><p><strong>Совместимость:</strong> Steam, актуальные патчи; v1.5 исправляет проблемы с серверами WB для РФ/РБ</p>`,
        links: `<a href="https://www.playground.ru/hogwarts_legacy" class="btn btn-accent" target="_blank" rel="noopener">Playground</a><a href="https://gamesvoice.ru/library" class="btn btn-ghost" target="_blank" rel="noopener">GamesVoice</a>`,
        install: `<details class="install"><summary>Краткая установка</summary><ol><li>Скачать последнюю версию с Playground или GamesVoice</li><li>Запустить установщик и указать папку с игрой</li><li>Проверить совместимость с текущим патчем</li></ol></details>`
      }
    ]
  },
  {
    id: 'eldenring',
    title: 'Elden Ring',
    subtitle: '+ Shadow of the Erdtree',
    year: '2022',
    genre: 'Action-RPG',
    developer: 'FromSoftware',
    platforms: ['steam', 'ps', 'xbox'],
    coverClass: 'eldenring',
    tags: ['soulslike', 'открытый мир', 'dlc'],
    trailerId: 'E3Huy2cdih0',
    extraTrailers: [{ id: 'qLZenOn7WUo', label: 'Shadow of the Erdtree' }],
    desc: 'Официальной русской озвучки нет. Фанатские варианты: нейро-озвучка и любительский дубляж.',
    translations: [
      {
        type: 'text', status: 'done', author: 'FromSoftware', rating: 4.3,
        name: 'Официальный перевод (текст + субтитры)',
        body: `<p><strong>Что переведено:</strong> Полностью, включая Shadow of the Erdtree</p><p><strong>Примечание:</strong> Озвучка только английская</p>`,
        links: `<span class="link-muted">Уже в игре</span>`
      },
      {
        type: 'voice', status: 'done', author: 'Сообщество / Nexus', rating: 4.0, version: '2.x', updated: '2025-05',
        name: 'Нейро-дубляж и моды озвучки',
        body: `<p><strong>Что озвучено:</strong> Реплики NPC и боссов (нейросеть, ручная разметка)</p><p><strong>Особенности:</strong> Ищите актуальные моды на Nexus Mods</p>`,
        links: `<a href="https://www.nexusmods.com/eldenring/mods/?search=&RH_ModList=navTag:144-1_10_0_0%2B0%2B0%2Btime_desc" class="btn btn-accent" target="_blank" rel="noopener">Nexus Mods</a>`,
        install: `<details class="install"><summary>Краткая установка</summary><ol><li>Установить Mod Engine 2</li><li>Следовать инструкции конкретного мода</li><li>Запускать игру через Mod Engine</li></ol></details>`
      }
    ]
  },
  {
    id: 'witcher3',
    title: 'The Witcher 3',
    subtitle: 'Wild Hunt Complete',
    year: '2015',
    genre: 'RPG',
    developer: 'CD Projekt RED',
    platforms: ['steam', 'gog', 'ps', 'xbox', 'switch'],
    coverClass: 'witcher',
    tags: ['фэнтези', 'ведьмак', 'next-gen'],
    trailerId: 'py0a8QrFIsw',
    desc: 'Эталон русской локализации: официальный полный дубляж + улучшенная версия для Next-Gen.',
    translations: [
      {
        type: 'both', status: 'done', author: 'CD Projekt RED / Snowball', rating: 5.0, version: 'Next-Gen', updated: '2022-12',
        name: 'Официальный полный дубляж',
        body: `<p><strong>Что переведено:</strong> Текст + полная озвучка, включая Hearts of Stone и Blood and Wine</p><p><strong>Примечание:</strong> В Next-Gen перезаписаны часть реплик и текстуры книг</p>`,
        links: `<span class="link-muted">Уже в игре</span>`
      },
      {
        type: 'text', status: 'done', author: 'FFS Community', rating: 4.4, version: 'v9', updated: '2024-03',
        name: 'Фанатский перевод книг и глоссария',
        body: `<p><strong>Что переведено:</strong> Все книги дословно, терминология ближе к Сапковскому</p>`,
        links: `<a href="https://www.playground.ru/the_witcher_3/file/rus" class="btn btn-accent" target="_blank" rel="noopener">Playground</a>`,
        install: `<details class="install"><summary>Краткая установка</summary><ol><li>Скачать архив мода</li><li>Скопировать в директорию mods</li><li>Активировать через лаунчер</li></ol></details>`
      }
    ]
  },
  {
    id: 'starfield',
    title: 'Starfield',
    subtitle: '+ Shattered Space',
    year: '2023',
    genre: 'Action-RPG',
    developer: 'Bethesda Game Studios',
    platforms: ['steam', 'goa', 'xbox'],
    coverClass: 'starfield',
    tags: ['космос', 'open world', 'bethesda'],
    trailerId: 'uMOPoAq5vIA',
    desc: 'Официального русского нет. Сообщество делает нейро-озвучку и фанатский перевод текста.',
    translations: [
      {
        type: 'text', status: 'done', author: 'Сообщество', rating: 4.2, version: '2.x', updated: '2025-04',
        name: 'Фанатский текстовый перевод',
        body: `<p><strong>Что переведено:</strong> Интерфейс, диалоги, квесты (в разной полноте)</p>`,
        links: `<a href="https://www.playground.ru/starfield/file/rus" class="btn btn-accent" target="_blank" rel="noopener">Playground</a>`
      },
      {
        type: 'voice', status: 'progress', author: 'SynthVoiceRu / сообщество', rating: 3.8, version: 'beta', updated: '2025-06',
        name: 'Нейро-озвучка',
        body: `<p><strong>Статус:</strong> В работе, покрытие растёт</p>`,
        links: `<a href="https://www.playground.ru/starfield" class="btn btn-accent" target="_blank" rel="noopener">Playground</a>`
      }
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
    coverClass: 'stalker',
    tags: ['сталкер', 'зона', 'выживание'],
    trailerId: 'nAz9qlbl_8g',
    desc: 'Гибридные фанатские дубляжи от нескольких студий — один из самых активных проектов локализации.',
    translations: [
      {
        type: 'text', status: 'done', author: 'GSC / сообщество', rating: 4.0,
        name: 'Официальный / улучшенный текст',
        body: `<p><strong>Что переведено:</strong> Текст и субтитры (официально + патчи сообщества)</p>`,
        links: `<span class="link-muted">Уже в игре / обновления</span>`
      },
      {
        type: 'voice', status: 'done', author: 'Eloquence / Replika / SynthVoice', rating: 4.3, version: '25.08.26', updated: '2026-08',
        name: 'Гибридный дубляж (Replika + Eloquence + SynthVoice)',
        body: `<p><strong>Что озвучено:</strong> ~26 000 файлов: основа Replika + дополнения Eloquence Studio и SynthVoice</p>`,
        links: `<a href="https://www.playground.ru/stalker_2/file/s_t_a_l_k_e_r_2_heart_of_chornobyl_rusifikator_zvuka_dublyazh_eloquence_studio_replika_synthvoice_25_08_26-1817504" class="btn btn-accent" target="_blank" rel="noopener">Playground</a>`,
        install: `<details class="install"><summary>Краткая установка</summary><ol><li>Скачать актуальный пак с Playground</li><li>Следовать инструкции в архиве (замена .wem)</li><li>Проверить совместимость с патчем игры</li></ol></details>`
      }
    ]
  },
  {
    id: 'godofwar',
    title: 'God of War',
    subtitle: '2018',
    year: '2018',
    genre: 'Action-Adventure',
    developer: 'Santa Monica Studio',
    platforms: ['steam', 'ps'],
    coverClass: 'gow',
    tags: ['мифология', 'экшен', 'сюжет'],
    trailerId: 'K0u_kAWLJOA',
    desc: 'Официальный текст. Полная профессиональная озвучка от GamesVoice — один из флагманских проектов студии.',
    translations: [
      {
        type: 'text', status: 'done', author: 'Sony / локализаторы', rating: 4.4,
        name: 'Официальный перевод',
        body: `<p><strong>Что переведено:</strong> Полный текст и субтитры</p>`,
        links: `<span class="link-muted">Уже в игре</span>`
      },
      {
        type: 'voice', status: 'done', author: 'GamesVoice', rating: 4.8, version: 'финал', updated: '2024',
        name: 'GamesVoice — Полный дубляж',
        body: `<p><strong>Что озвучено:</strong> Полная профессиональная озвучка</p><p><strong>Актёры:</strong> Профессиональный состав GamesVoice</p>`,
        links: `<a href="https://gamesvoice.ru/library" class="btn btn-accent" target="_blank" rel="noopener">GamesVoice</a><a href="https://www.playground.ru/god_of_war" class="btn btn-ghost" target="_blank" rel="noopener">Playground</a>`
      }
    ]
  },
  {
    id: 'resident4',
    title: 'Resident Evil 4',
    subtitle: 'Remake',
    year: '2023',
    genre: 'Survival Horror',
    developer: 'Capcom',
    platforms: ['steam', 'ps', 'xbox'],
    coverClass: 're4',
    tags: ['хоррор', 'ремейк', 'экшен'],
    trailerId: 'E69tQMKd0oA',
    desc: 'Официальный текст. Фанатские нейро- и любительские озвучки на Nexus и Playground.',
    translations: [
      {
        type: 'text', status: 'done', author: 'Capcom', rating: 4.2,
        name: 'Официальный перевод',
        body: `<p><strong>Что переведено:</strong> Текст и субтитры</p>`,
        links: `<span class="link-muted">Уже в игре</span>`
      },
      {
        type: 'voice', status: 'done', author: 'Сообщество', rating: 3.9, version: '1.x', updated: '2025',
        name: 'Нейро / любительская озвучка',
        body: `<p><strong>Что озвучено:</strong> Основные диалоги (качество варьируется)</p>`,
        links: `<a href="https://www.nexusmods.com/residentevil42023" class="btn btn-accent" target="_blank" rel="noopener">Nexus Mods</a><a href="https://www.playground.ru/resident_evil_4_2023" class="btn btn-ghost" target="_blank" rel="noopener">Playground</a>`
      }
    ]
  },
  {
    id: 'horizon2',
    title: 'Horizon Forbidden West',
    subtitle: '',
    year: '2022',
    genre: 'Action-RPG',
    developer: 'Guerrilla',
    platforms: ['steam', 'ps'],
    coverClass: 'horizon',
    tags: ['открытый мир', 'роботы', 'пост-апок'],
    trailerId: 'Lq594XmpPBg',
    desc: 'Официальный текст. Озвучка — фанатские проекты.',
    translations: [
      {
        type: 'text', status: 'done', author: 'Sony', rating: 4.3,
        name: 'Официальный перевод',
        body: `<p><strong>Что переведено:</strong> Полный текст и субтитры</p>`,
        links: `<span class="link-muted">Уже в игре</span>`
      },
      {
        type: 'voice', status: 'progress', author: 'Сообщество', rating: 0, version: '—', updated: '2025',
        name: 'Фанатская озвучка',
        body: `<p><strong>Статус:</strong> Ищите актуальные проекты на Playground</p>`,
        links: `<a href="https://www.playground.ru/horizon_forbidden_west" class="btn btn-accent" target="_blank" rel="noopener">Playground</a>`
      }
    ]
  },
  {
    id: 'alanswake2',
    title: 'Alan Wake 2',
    subtitle: '',
    year: '2023',
    genre: 'Survival Horror',
    developer: 'Remedy Entertainment',
    platforms: ['steam', 'epig', 'ps', 'xbox'],
    coverClass: 'alan',
    tags: ['хоррор', 'детектив', 'сюжет'],
    trailerId: 'dlQ3FeNu5Yw',
    desc: 'Официальный текст. GamesVoice сделали профессиональную озвучку.',
    translations: [
      {
        type: 'text', status: 'done', author: 'Remedy', rating: 4.4,
        name: 'Официальный перевод',
        body: `<p><strong>Что переведено:</strong> Текст и субтитры</p>`,
        links: `<span class="link-muted">Уже в игре</span>`
      },
      {
        type: 'voice', status: 'done', author: 'GamesVoice', rating: 4.7, version: 'финал', updated: '2025',
        name: 'GamesVoice — Полный дубляж',
        body: `<p><strong>Что озвучено:</strong> Профессиональная озвучка от GamesVoice</p>`,
        links: `<a href="https://gamesvoice.ru/library" class="btn btn-accent" target="_blank" rel="noopener">GamesVoice</a><a href="https://www.playground.ru/alan_wake_2" class="btn btn-ghost" target="_blank" rel="noopener">Playground</a>`
      }
    ]
  },
  {
    id: 'metaphor',
    title: 'Metaphor: ReFantazio',
    subtitle: '',
    year: '2024',
    genre: 'JRPG',
    developer: 'Studio Zero / Atlus',
    platforms: ['steam', 'ps', 'xbox'],
    coverClass: 'metaphor',
    tags: ['jrpg', 'фэнтези', 'атлус'],
    trailerId: 'pP6kU_T6JVE',
    desc: 'Официальный текст. Нейро-озвучка от сообщества.',
    translations: [
      {
        type: 'text', status: 'done', author: 'Atlus', rating: 4.1,
        name: 'Официальный перевод',
        body: `<p><strong>Что переведено:</strong> Текст и субтитры</p>`,
        links: `<span class="link-muted">Уже в игре</span>`
      },
      {
        type: 'voice', status: 'done', author: 'Сообщество', rating: 3.8, version: '1.x', updated: '2025',
        name: 'Нейро-озвучка',
        body: `<p><strong>Что озвучено:</strong> Диалоги (нейросеть)</p>`,
        links: `<a href="https://www.nexusmods.com/metaphorrefantazio" class="btn btn-accent" target="_blank" rel="noopener">Nexus Mods</a>`
      }
    ]
  },
  {
    id: 'hades2',
    title: 'Hades II',
    subtitle: '',
    year: '2025',
    genre: 'Roguelike',
    developer: 'Supergiant Games',
    platforms: ['steam'],
    coverClass: 'hades',
    tags: ['roguelike', 'мифология', 'ранний доступ'],
    trailerId: '91t0qI6Z2kA',
    desc: 'Официальный текст. Фанатские проекты озвучки в работе.',
    translations: [
      {
        type: 'text', status: 'done', author: 'Supergiant', rating: 4.5,
        name: 'Официальный перевод',
        body: `<p><strong>Что переведено:</strong> Полный текст</p>`,
        links: `<span class="link-muted">Уже в игре</span>`
      },
      {
        type: 'voice', status: 'progress', author: 'Сообщество', rating: 0, version: '—', updated: '2026',
        name: 'Фанатская озвучка',
        body: `<p><strong>Статус:</strong> В разработке сообществом</p>`,
        links: `<a href="https://t.me/hades2_ru" class="btn btn-ghost" target="_blank" rel="noopener">Telegram</a>`
      }
    ]
  },
  {
    id: 'rdr2',
    title: 'Red Dead Redemption 2',
    subtitle: '',
    year: '2018',
    genre: 'Action-Adventure',
    developer: 'Rockstar Games',
    platforms: ['steam', 'ps', 'xbox'],
    coverClass: 'rdr2',
    tags: ['вестерн', 'открытый мир', 'сюжет'],
    trailerId: 'eaW0hdKyVdm',
    desc: 'Официальный текст. Нейросетевые и любительские варианты озвучки.',
    translations: [
      {
        type: 'text', status: 'done', author: 'Rockstar', rating: 4.0,
        name: 'Официальный текстовый перевод',
        body: `<p><strong>Что переведено:</strong> Полный текст и субтитры</p><p><strong>Примечание:</strong> Озвучка только английская</p>`,
        links: `<span class="link-muted">Уже в игре</span>`
      },
      {
        type: 'voice', status: 'done', author: 'SynthVoiceRu / сообщество', rating: 4.2, version: '2.x', updated: '2025-08',
        name: 'Нейро-дубляж',
        body: `<p><strong>Что озвучено:</strong> Основной сюжет и ключевые диалоги</p>`,
        links: `<a href="https://www.playground.ru/red_dead_redemption_2" class="btn btn-accent" target="_blank" rel="noopener">Playground</a>`
      }
    ]
  },
  {
    id: 'wukong',
    title: 'Black Myth: Wukong',
    subtitle: '',
    year: '2024',
    genre: 'Action-RPG',
    developer: 'Game Science',
    platforms: ['steam', 'ps', 'xbox'],
    coverClass: 'wukong',
    tags: ['soulslike', 'китайская мифология', 'боссы'],
    trailerId: '2KNyKIVA9_I',
    desc: 'Официальный китайский/английский. Русский текст есть; озвучка — фанатские нейро-проекты.',
    translations: [
      {
        type: 'text', status: 'done', author: 'Game Science', rating: 4.2,
        name: 'Официальный / сообщество — текст',
        body: `<p><strong>Что переведено:</strong> Текст и субтитры</p>`,
        links: `<span class="link-muted">Уже в игре</span>`
      },
      {
        type: 'voice', status: 'progress', author: 'Сообщество', rating: 0, version: '—', updated: '2026-09',
        name: 'Фанатский нейро-дубляж',
        body: `<p><strong>Статус:</strong> Активная разработка</p>`,
        links: `<a href="https://www.playground.ru/black_myth_wukong" class="btn btn-accent" target="_blank" rel="noopener">Playground</a>`
      }
    ]
  },
  {
    id: 'liesofp',
    title: 'Lies of P',
    subtitle: '',
    year: '2023',
    genre: 'Soulslike',
    developer: 'Round8 Studio / Neowiz',
    platforms: ['steam', 'ps', 'xbox'],
    coverClass: 'liesofp',
    tags: ['soulslike', 'стимпанк', 'пиноккио'],
    trailerId: 'RWtCvn5rPOk',
    desc: 'Официальный текст. Нейросетевые и любительские проекты озвучки.',
    translations: [
      {
        type: 'text', status: 'done', author: 'Neowiz', rating: 4.1,
        name: 'Официальный перевод',
        body: `<p><strong>Что переведено:</strong> Полный текст и субтитры</p>`,
        links: `<span class="link-muted">Уже в игре</span>`
      },
      {
        type: 'voice', status: 'done', author: 'SynthVoiceRu', rating: 4.0, version: '1.2', updated: '2025-03',
        name: 'Нейро-дубляж',
        body: `<p><strong>Что озвучено:</strong> Основные диалоги и боссы</p>`,
        links: `<a href="https://www.playground.ru/lies_of_p" class="btn btn-accent" target="_blank" rel="noopener">Playground</a>`
      }
    ]
  },
  {
    id: 'expedition33',
    title: 'Clair Obscur: Expedition 33',
    subtitle: '',
    year: '2025',
    genre: 'Turn-based RPG',
    developer: 'Sandfall Interactive',
    platforms: ['steam', 'ps', 'xbox'],
    coverClass: 'metaphor',
    tags: ['jrpg', 'франция', 'сюжет'],
    trailerId: 'RVnzpjU08SQ',
    desc: 'Хит 2025. Официальный текст; нейро-дубляж от SynthVoiceRu и профессиональная работа GamesVoice.',
    translations: [
      {
        type: 'text', status: 'done', author: 'Sandfall', rating: 4.6,
        name: 'Официальный перевод',
        body: `<p><strong>Что переведено:</strong> Полный текст и субтитры</p>`,
        links: `<span class="link-muted">Уже в игре</span>`
      },
      {
        type: 'voice', status: 'done', author: 'SynthVoiceRu', rating: 4.3, version: '1.0', updated: '2025-05',
        name: 'SynthVoiceRu — Нейро-дубляж и закадр',
        body: `<p><strong>Что озвучено:</strong> Дубляж и закадровая версия</p>`,
        links: `<a href="https://www.playground.ru/clair_obscur_expedition_33/file/clair_obscur_expedition_33_rusifikator_zvuka_nejrosetevoj_dublyazh_i_zakadrovaya_ozvuchka_synthvoiceru-1769524" class="btn btn-accent" target="_blank" rel="noopener">Playground</a>`,
        install: `<details class="install"><summary>Краткая установка</summary><ol><li>Извлечь файлы в <code>...\\Sandfall\\Content\\Paks\\~mods</code></li><li>Создать папку ~mods, если её нет</li></ol></details>`
      },
      {
        type: 'voice', status: 'done', author: 'GamesVoice', rating: 4.8, version: 'финал', updated: '2025',
        name: 'GamesVoice — Профессиональный дубляж',
        body: `<p><strong>Что озвучено:</strong> Профессиональная озвучка студии</p>`,
        links: `<a href="https://gamesvoice.ru/library" class="btn btn-accent" target="_blank" rel="noopener">GamesVoice</a>`
      }
    ]
  },
  {
    id: 'silenthill2',
    title: 'Silent Hill 2',
    subtitle: 'Remake',
    year: '2024',
    genre: 'Survival Horror',
    developer: 'Bloober Team',
    platforms: ['steam', 'ps'],
    coverClass: 'alan',
    tags: ['хоррор', 'ремейк', 'психология'],
    trailerId: 'pyWk85cJx5E',
    desc: 'Официальный текст. Профессиональная озвучка от GamesVoice.',
    translations: [
      {
        type: 'text', status: 'done', author: 'Konami / Bloober', rating: 4.3,
        name: 'Официальный перевод',
        body: `<p><strong>Что переведено:</strong> Текст и субтитры</p>`,
        links: `<span class="link-muted">Уже в игре</span>`
      },
      {
        type: 'voice', status: 'done', author: 'GamesVoice', rating: 4.7, version: 'финал', updated: '2025',
        name: 'GamesVoice — Полный дубляж',
        body: `<p><strong>Что озвучено:</strong> Профессиональная озвучка</p>`,
        links: `<a href="https://gamesvoice.ru/library" class="btn btn-accent" target="_blank" rel="noopener">GamesVoice</a><a href="https://www.playground.ru/silent_hill_2" class="btn btn-ghost" target="_blank" rel="noopener">Playground</a>`
      }
    ]
  },
  {
    id: 'kcd2',
    title: 'Kingdom Come: Deliverance 2',
    subtitle: '',
    year: '2025',
    genre: 'RPG',
    developer: 'Warhorse Studios',
    platforms: ['steam', 'ps', 'xbox'],
    coverClass: 'rdr2',
    tags: ['средневековье', 'реализм', 'rpg'],
    trailerId: '61qg2v_0YjE',
    desc: 'Официальный текст. Масштабная нейро-озвучка SynthVoiceRu (сотни тысяч реплик).',
    translations: [
      {
        type: 'text', status: 'done', author: 'Warhorse', rating: 4.5,
        name: 'Официальный перевод',
        body: `<p><strong>Что переведено:</strong> Полный текст и субтитры</p>`,
        links: `<span class="link-muted">Уже в игре</span>`
      },
      {
        type: 'voice', status: 'done', author: 'SynthVoiceRu', rating: 4.4, version: '09.06.2025', updated: '2025-10',
        name: 'SynthVoiceRu — Нейросетевой перевод',
        body: `<p><strong>Что озвучено:</strong> 300k+ реплик, модель SVR_TTS 3.0; варианты: полный дубляж, закадр EN, закадр CZ</p>`,
        links: `<a href="https://www.playground.ru/kingdom_come_deliverance_2" class="btn btn-accent" target="_blank" rel="noopener">Playground</a>`
      }
    ]
  },
  {
    id: 'splitfiction',
    title: 'Split Fiction',
    subtitle: '',
    year: '2025',
    genre: 'Co-op Adventure',
    developer: 'Hazelight',
    platforms: ['steam', 'ps', 'xbox'],
    coverClass: 'cyberpunk',
    tags: ['кооп', 'приключение', 'хазелайт'],
    trailerId: '6kJg_8_8Q2w',
    desc: 'Полный русификатор текста и звука от Mechanics VoiceOver.',
    translations: [
      {
        type: 'both', status: 'done', author: 'Mechanics VoiceOver', rating: 4.6, version: '1.11', updated: '2026-03',
        name: 'Mechanics VoiceOver — Текст + озвучка',
        body: `<p><strong>Что переведено:</strong> Полная озвучка всех персонажей, текст, баланс звука</p>`,
        links: `<a href="https://www.playground.ru/split_fiction/file/split_fiction_rusifikator_teksta_i_zvuka_mechanics_voiceover_v1_11-1807111" class="btn btn-accent" target="_blank" rel="noopener">Playground</a>`
      }
    ]
  },
  {
    id: 'oblivionrem',
    title: 'Oblivion Remastered',
    subtitle: 'The Elder Scrolls IV',
    year: '2025',
    genre: 'RPG',
    developer: 'Bethesda / Virtuos',
    platforms: ['steam', 'goa', 'xbox', 'ps'],
    coverClass: 'eldenring',
    tags: ['rpg', 'бethесда', 'ремастер'],
    trailerId: 'XYtdqN0aY0M',
    desc: 'Порт классической озвучки 1С от SynthVoice + текстовые русификаторы сообщества.',
    translations: [
      {
        type: 'text', status: 'done', author: 'Segnetofaza / сообщество', rating: 4.2, version: '0.1.x', updated: '2025-04',
        name: 'Текстовый русификатор',
        body: `<p><strong>Что переведено:</strong> Интерфейс, диалоги, кириллические текстуры</p>`,
        links: `<a href="https://www.playground.ru/elder_scrolls_4_oblivion_remastered" class="btn btn-accent" target="_blank" rel="noopener">Playground</a>`
      },
      {
        type: 'voice', status: 'done', author: 'SynthVoice', rating: 4.3, version: 'порт 1С', updated: '2025-04',
        name: 'Порт озвучки 1С',
        body: `<p><strong>Что озвучено:</strong> Классическая русская озвучка 1С, портированная на Remastered</p>`,
        links: `<a href="https://www.playground.ru/elder_scrolls_4_oblivion_remastered" class="btn btn-accent" target="_blank" rel="noopener">Playground</a>`
      }
    ]
  }
];

/* Статусы и типы для фильтров */
const TYPE_LABELS = { all: 'Все типы', text: 'Текст', voice: 'Озвучка', both: 'Текст + Озвучка', subtitles: 'Субтитры' };
const STATUS_LABELS = { all: 'Любой статус', done: 'Завершён', progress: 'В работе', abandoned: 'Заброшен' };
const PLATFORM_LABELS = { all: 'Все платформы', steam: 'Steam', gog: 'GOG', epig: 'Epic', goa: 'Game Pass', ps: 'PlayStation', xbox: 'Xbox', switch: 'Switch' };
