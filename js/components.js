(function () {
  'use strict';

  function escapeHTML(s) {
    return String(s)
      .replace(/&/g, '&' + 'amp;')
      .replace(/</g, '&' + 'lt;')
      .replace(/>/g, '&' + 'gt;')
      .replace(/"/g, '&' + 'quot;')
      .replace(/'/g, '&#39;');
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
    return '';
  }

  function initialOf(g) {
    const clean = (g.title || '').replace(/[^A-Za-zА-Яа-я0-9]/g, '');
    return (clean.charAt(0) || '?').toUpperCase();
  }

  function pluralVariants(n) {
    n = Math.abs(Number(n) || 0);
    var m = n % 100;
    var m1 = m % 10;
    if (m > 10 && m < 20) return n + ' вариантов';
    if (m1 > 1 && m1 < 5) return n + ' варианта';
    if (m1 === 1) return n + ' вариант';
    return n + ' вариантов';
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
    const count = translationCount(g);
    const favClass = isFav ? ' on' : '';
    const fullTitle = g.title + (g.subtitle ? ' ' + g.subtitle : '');
    const num = numPad((index || 0) + 1);
    const hasCover = !!g.cover;
    const coverCls = 'game-card-cover' + (hasCover ? ' has-cover' : '');
    const hasVoice = (g.translations || []).some(function (t) {
      return t.type === 'voice' || t.type === 'both';
    });
    const hasText = (g.translations || []).some(function (t) {
      return t.type === 'text' || t.type === 'both';
    });
    const badges = [];
    if (hasVoice) badges.push('<span class="card-badge voice">озвучка</span>');
    if (hasText) badges.push('<span class="card-badge text">текст</span>');
    return '<article class="game-card" data-id="' + g.id + '" tabindex="0" role="button" aria-label="' + escapeHTML(fullTitle) + '">' +
      '<button class="game-card-fav' + favClass + '" type="button" data-fav="' + g.id + '" aria-label="В избранное">★</button>' +
      '<div class="' + coverCls + '" data-letter="' + initialOf(g) + '" style="' + coverStyle(g) + '">' +
        (badges.length ? '<div class="card-badges">' + badges.join('') + '</div>' : '') +
      '</div>' +
      '<div class="game-card-body">' +
        '<div class="game-card-num">№ ' + num + ' · ' + escapeHTML(g.genre) + ' · ' + escapeHTML(g.year) + '</div>' +
        '<div class="game-card-title">' + highlight(fullTitle, query) + '</div>' +
        '<div class="game-card-meta">' + pluralVariants(count) + '</div>' +
      '</div>' +
      '</article>';
  }

  function miniCardHTML(g) {
    const coverCls = 'mini-cover' + (g.cover ? ' has-cover' : '');
    return '<button class="mini-card" type="button" data-id="' + g.id + '">' +
      '<span class="' + coverCls + '" style="' + coverStyle(g) + '">' + (g.cover ? '' : initialOf(g)) + '</span>' +
      '<span class="mini-title">' + escapeHTML(g.title) + '</span>' +
      '</button>';
  }

  function translationHTML(t) {
    return '<article class="translation-card">' +
      '<div class="t-head">' +
        '<div class="t-name">' + escapeHTML(t.name || '') + '</div>' +
      '</div>' +
      '<div class="t-badges">' +
        '<span>' + escapeHTML(t.author || '') + '</span>' +
        '<span class="status-' + escapeHTML(t.status) + '">' + escapeHTML(statusLabel(t.status)) + '</span>' +
        '<span class="type-badge">' + escapeHTML(typeLabel(t.type)) + '</span>' +
        (t.version ? '<span>' + escapeHTML(t.version) + '</span>' : '') +
        (t.updated ? '<span>' + escapeHTML(t.updated) + '</span>' : '') +
      '</div>' +
      '<div class="t-body">' + (t.body || '') + '</div>' +
      '<div class="t-links">' + (t.links || '') + '</div>' +
      '</article>';
  }

  function statsHTML() {
    let withVoice = 0, done = 0;
    games.forEach(function (g) {
      if (g.translations.some(function (t) { return t.type === 'voice' || t.type === 'both'; })) withVoice++;
      done += g.translations.filter(function (t) { return t.status === 'done'; }).length;
    });
    return '<div class="stat"><span class="stat-num">' + games.length + '</span><span class="stat-label">игр в каталоге</span></div>' +
      '<div class="stat"><span class="stat-num">' + withVoice + '</span><span class="stat-label">с озвучкой</span></div>' +
      '<div class="stat"><span class="stat-num">' + done + '</span><span class="stat-label">готовых вариантов</span></div>';
  }

  window.GV = {
    coverStyle: coverStyle,
    cardHTML: cardHTML,
    miniCardHTML: miniCardHTML,
    translationHTML: translationHTML,
    statsHTML: statsHTML,
    translationCount: translationCount,
    pluralVariants: pluralVariants,
    lastUpdated: lastUpdated,
    escapeHTML: escapeHTML
  };
})();
