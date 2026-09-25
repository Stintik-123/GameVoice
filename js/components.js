(function () {
  'use strict';

  function hashHue(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h * 31 + str.charCodeAt(i)) % 360;
    }
    return h;
  }

  function coverStyle(g) {
    if (g.cover) {
      return 'background-image:url(' + g.cover + ');background-size:cover;background-position:center;';
    }
    const h = hashHue(g.id);
    const h2 = (h + 40) % 360;
    return 'background:linear-gradient(160deg,hsl(' + h + ',38%,22%),hsl(' + h2 + ',30%,10%));';
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
    const map = {
      text: 'текст',
      voice: 'озвучка',
      both: 'текст + озвучка',
      subtitles: 'субтитры',
      neuro: 'нейро-озвучка'
    };
    return map[t] || t || '';
  }

  function cardHTML(g, isFav) {
    const rating = ratingOf(g);
    const count = translationCount(g);
    const favClass = isFav ? ' on' : '';
    const fullTitle = g.title + (g.subtitle ? ' ' + g.subtitle : '');
    return '<article class="game-card" data-id="' + g.id + '" tabindex="0" role="button" aria-label="' + fullTitle + '">' +
      '<button class="game-card-fav' + favClass + '" type="button" data-fav="' + g.id + '" aria-label="В избранное">★</button>' +
      '<div class="game-card-cover" data-letter="' + initialOf(g) + '" style="' + coverStyle(g) + '"></div>' +
      '<div class="game-card-title">' + fullTitle + '</div>' +
      '<div class="game-card-meta">' + g.year + ' · ' + count + ' вар. · ★ ' + rating.toFixed(1) + '</div>' +
      '</article>';
  }

  function miniCardHTML(g) {
    return '<button class="mini-card" type="button" data-id="' + g.id + '">' +
      '<span class="mini-cover" style="' + coverStyle(g) + '">' + initialOf(g) + '</span>' +
      '<span class="mini-title">' + g.title + '</span>' +
      '</button>';
  }

  function translationHTML(g, t, idx, userRating) {
    const rKey = g.id + ':' + idx;
    const myRating = userRating || 0;
    let stars = '';
    for (let n = 1; n <= 5; n++) {
      stars += '<button type="button" data-n="' + n + '" class="' + (n <= myRating ? 'filled' : '') + '" aria-label="' + n + ' из 5">★</button>';
    }
    const badges = '<span>' + t.author + '</span>' +
      '<span class="status-' + t.status + '">' + statusLabel(t.status) + '</span>' +
      '<span class="type-badge">' + typeLabel(t.type) + '</span>' +
      (t.version ? '<span>' + t.version + '</span>' : '') +
      (t.updated ? '<span>обновлено ' + t.updated + '</span>' : '');
    return '<article class="translation-card" data-key="' + rKey + '">' +
      '<div class="t-head">' +
        '<div>' +
          '<div class="t-name">' + t.name + '</div>' +
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
    return '<div class="empty-state"><p>' + text + '</p></div>';
  }

  window.GV = {
    cardHTML: cardHTML,
    miniCardHTML: miniCardHTML,
    translationHTML: translationHTML,
    statsHTML: statsHTML,
    emptyHTML: emptyHTML,
    coverStyle: coverStyle,
    initialOf: initialOf,
    ratingOf: ratingOf,
    translationCount: translationCount,
    lastUpdated: lastUpdated,
    statusLabel: statusLabel,
    typeLabel: typeLabel
  };
})();
