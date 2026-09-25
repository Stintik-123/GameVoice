(function () {
  'use strict';

  const COVER_COLORS = {
    cyberpunk: ['#3d1a28', '#1a1520'],
    bg3: ['#1a2030', '#101418'],
    hogwarts: ['#1a2840', '#0e1828'],
    eldenring: ['#2a2410', '#1a1810'],
    witcher: ['#1e2a18', '#141810'],
    starfield: ['#12182a', '#0e1018'],
    stalker: ['#2a2a14', '#141810'],
    gow: ['#1a2830', '#101418'],
    re4: ['#2a1410', '#141010'],
    horizon: ['#143028', '#101818'],
    alan: ['#181820', '#101014'],
    metaphor: ['#2a1830', '#141018'],
    hades: ['#301018', '#141010'],
    rdr2: ['#302018', '#181410']
  };

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function escapeRegExp(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function highlight(text, q) {
    const safe = escapeHTML(text);
    if (!q || !q.trim()) return safe;
    const escaped = escapeRegExp(q.trim());
    if (!escaped) return safe;
    try {
      const re = new RegExp('(' + escaped + ')', 'gi');
      return safe.replace(re, '<mark>$1</mark>');
    } catch (e) {
      return safe;
    }
  }

  function coverStyle(g) {
    if (g.cover) {
      return 'background-image:url(' + g.cover + ');background-size:cover;background-position:center;';
    }
    const c = COVER_COLORS[g.coverClass] || COVER_COLORS[g.id] || ['#2a2018', '#0f0c0a'];
    return 'background:linear-gradient(160deg,' + c[0] + ',' + c[1] + ');';
  }

  function initialOf(g) {
    const clean = (g.title || '').replace(/[^A-Za-zА-Яа-я0-9]/g, '');
    return (clean.charAt(0) || '?').toUpperCase();
  }

  function ratingOf(g) {
    if (!g.translations || !g.translations.length) return 0;
    let max = 0;
    for (let i = 0; i < g.translations.length; i++) {
      const r = g.translations[i].rating || 0;
      if (r > max) max = r;
    }
    return max;
  }

  function translationCount(g) {
    return g.translations ? g.translations.length : 0;
  }

  function lastUpdated(g) {
    if (!g.translations) return '';
    let max = '';
    for (let i = 0; i < g.translations.length; i++) {
      const u = g.translations[i].updated || '';
      if (u > max) max = u;
    }
    return max;
  }

  function statusLabel(s) {
    if (s === 'done') return 'готово';
    if (s === 'progress') return 'в работе';
    if (s === 'abandoned') return 'заброшено';
    return s || '';
  }

  function typeLabel(t) {
    const map = { text: 'текст', voice: 'озвучка', both: 'текст + озвучка', subtitles: 'субтитры', neuro: 'нейро-озвучка' };
    return map[t] || t || '';
  }

  function numPad(n) {
    const s = String(n);
    return s.length < 3 ? '000'.slice(s.length) + s : s;
  }

  function cardHTML(g, isFav, index, query) {
    const rating = ratingOf(g);
    const count = translationCount(g);
    const favClass = isFav ? ' on' : '';
    const fullTitle = g.title + (g.subtitle ? ' ' + g.subtitle : '');
    const num = numPad((index || 0) + 1);
    return '<article class="game-card" data-id="' + g.id + '" tabindex="0" role="button" aria-label="' + escapeHTML(fullTitle) + '">' +
      '<button class="game-card-fav' + favClass + '" type="button" data-fav="' + g.id + '" aria-label="В избранное">★</button>' +
      '<div class="game-card-cover" data-letter="' + initialOf(g) + '" style="' + coverStyle(g) + '"></div>' +
      '<div class="game-card-body">' +
        '<div class="game-card-num">№ ' + num + ' · ' + escapeHTML(g.genre) + ' · ' + escapeHTML(g.year) + '</div>' +
        '<div class="game-card-title">' + highlight(fullTitle, query) + '</div>' +
        '<div class="game-card-meta">' + count + ' вар. · ★ ' + rating.toFixed(1) + '</div>' +
      '</div>' +
      '</article>';
  }

  function miniCardHTML(g) {
    return '<button class="mini-card" type="button" data-id="' + g.id + '">' +
      '<span class="mini-cover" style="' + coverStyle(g) + '">' + initialOf(g) + '</span>' +
      '<span class="mini-title">' + escapeHTML(g.title) + '</span>' +
      '</button>';
  }

  function topItemHTML(g, index) {
    const rating = ratingOf(g);
    const count = translationCount(g);
    return '<li class="top-item" data-id="' + g.id + '" tabindex="0" role="button">' +
      '<span class="top-num">' + (index + 1) + '</span>' +
      '<span class="top-cover" style="' + coverStyle(g) + '">' + initialOf(g) + '</span>' +
      '<span><span class="top-title">' + escapeHTML(g.title) + '</span><span class="top-sub">' + escapeHTML(g.developer) + ' · ' + count + ' вариантов</span></span>' +
      '<span class="top-rating">★ ' + rating.toFixed(1) + '</span>' +
      '</li>';
  }

  function translationHTML(g, t, idx, userRating) {
    const rKey = g.id + ':' + idx;
    const myRating = userRating || 0;
    let stars = '';
    for (let n = 1; n <= 5; n++) {
      stars += '<button type="button" data-n="' + n + '" class="' + (n <= myRating ? 'filled' : '') + '" aria-label="' + n + ' из 5">★</button>';
    }
    const badges = '<span>' + escapeHTML(t.author) + '</span>' +
      '<span class="status-' + t.status + '">' + statusLabel(t.status) + '</span>' +
      '<span class="type-badge">' + typeLabel(t.type) + '</span>' +
      (t.version ? '<span>' + escapeHTML(t.version) + '</span>' : '') +
      (t.updated ? '<span>' + escapeHTML(t.updated) + '</span>' : '');
    return '<article class="translation-card" data-key="' + rKey + '">' +
      '<div class="t-head">' +
        '<div>' +
          '<div class="t-name">' + escapeHTML(t.name) + '</div>' +
          '<div class="t-badges">' + badges + '</div>' +
        '</div>' +
        '<div class="rating-stars" data-key="' + rKey + '" aria-label="Ваша оценка">' + stars + '</div>' +
      '</div>' +
      (t.body ? '<div class="t-body">' + t.body + '</div>' : '') +
      (t.install || '') +
      '<div class="t-links">' + (t.links || '') + '</div>' +
      '</article>';
  }

  function statsHTML() {
    const total = games.length;
    let withVoice = 0;
    let done = 0;
    for (let i = 0; i < games.length; i++) {
      const g = games[i];
      if (g.translations.some(function (t) { return t.type === 'voice' || t.type === 'both'; })) withVoice++;
      done += g.translations.filter(function (t) { return t.status === 'done'; }).length;
    }
    return '<div class="stat"><span class="stat-num">' + total + '</span><span class="stat-label">игр в каталоге</span></div>' +
      '<div class="stat"><span class="stat-num">' + withVoice + '</span><span class="stat-label">с озвучкой</span></div>' +
      '<div class="stat"><span class="stat-num">' + done + '</span><span class="stat-label">готовых вариантов</span></div>';
  }

  function emptyHTML(text) {
    return '<div class="empty-state"><p>' + escapeHTML(text) + '</p></div>';
  }

  function newsHTML() {
    const items = [];
    for (let i = 0; i < games.length; i++) {
      const g = games[i];
      for (let j = 0; j < g.translations.length; j++) {
        const t = g.translations[j];
        if (t.updated) {
          items.push({ game: g, tr: t, date: t.updated });
        }
      }
    }
    items.sort(function (a, b) { return b.date.localeCompare(a.date); });
    const top = items.slice(0, 6);
    if (!top.length) {
      return '<div class="empty-state"><p>Пока нет записей</p></div>';
    }
    return top.map(function (it) {
      return '<article class="news-card" data-id="' + it.game.id + '">' +
        '<div class="news-top">' +
          '<span class="news-kind ' + it.tr.status + '">' + statusLabel(it.tr.status) + '</span>' +
          '<span class="news-date">' + escapeHTML(it.date) + '</span>' +
        '</div>' +
        '<div class="news-game">' + escapeHTML(it.game.title) + '</div>' +
        '<div class="news-tr">' + escapeHTML(it.tr.name) + '</div>' +
        '<div class="news-author">' + escapeHTML(it.tr.author) + '</div>' +
        '</article>';
    }).join('');
  }

  window.__gvHighlight = highlight;

  window.GV = {
    cardHTML: cardHTML,
    miniCardHTML: miniCardHTML,
    topItemHTML: topItemHTML,
    translationHTML: translationHTML,
    statsHTML: statsHTML,
    emptyHTML: emptyHTML,
    newsHTML: newsHTML,
    coverStyle: coverStyle,
    initialOf: initialOf,
    ratingOf: ratingOf,
    translationCount: translationCount,
    lastUpdated: lastUpdated,
    statusLabel: statusLabel,
    typeLabel: typeLabel,
    escapeHTML: escapeHTML
  };
})();
