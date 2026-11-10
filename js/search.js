/* Поиск: нормализация, транслит и сопоставление с запросом.
   Транслит нужен, чтобы «киберпанк» находил «Cyberpunk». */

const TRANSLIT = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh',
  щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

export function translit(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[а-яё]/g, (ch) => TRANSLIT[ch] ?? ch);
}

export function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/** Слова, по которым ищем: нормализованные + транслитерированные. */
export function variants(text) {
  const base = normalize(text);
  const alt = translit(text);
  return alt && alt !== base ? [base, alt] : [base];
}

/**
 * «Скелет» слова: без гласных и с приведёнными звуками.
 * Нужен, чтобы «киберпанк» находил «Cyberpunk»: kbrpnk = kbrpnk.
 */
export function skeleton(text) {
  return translit(text)
    .replace(/sch|sh|ch/g, 'S')
    .replace(/[^a-z0-9]/g, '')
    .replace(/[aeiouy]/g, '')
    .replace(/c/g, 'k')
    .replace(/x/g, 'ks')
    .replace(/q/g, 'k')
    .replace(/w/g, 'v')
    .replace(/S/g, 's');
}

/** Все слова запроса: пользователь может писать «cyberpunk 2077». */
export function queryTokens(query) {
  const out = new Set();
  for (const v of variants(query)) {
    for (const part of v.split(' ')) if (part) out.add(part);
  }
  return [...out];
}

/** Индекс игры: по нему ищем без повторного обхода. */
export function buildIndex(games) {
  return games.map((g) => {
    const parts = [
      g.title, g.subtitle, g.developer, g.genre, g.year, g.id,
      ...(g.tags || []),
      ...(g.translations || []).flatMap((t) => [t.name, t.author]),
    ].filter(Boolean);

    const words = new Set();
    const bones = new Set();
    for (const part of parts) {
      for (const v of variants(part)) {
        for (const w of v.split(' ')) {
          if (!w) continue;
          words.add(w);
          const bone = skeleton(w);
          if (bone.length >= 4) bones.add(bone);
        }
      }
    }
    return { game: g, words, bones, haystack: normalize(parts.join(' ')) };
  });
}

export function matches(entry, tokens) {
  if (!tokens.length) return true;
  return tokens.every((token) => {
    if (entry.words.has(token) || entry.haystack.includes(token)) return true;
    const bone = skeleton(token);
    if (bone.length < 4) return false;
    for (const candidate of entry.bones) {
      if (candidate === bone) return true;
      if (candidate.length >= 5 && bone.length >= 5 && (candidate.startsWith(bone) || bone.startsWith(candidate))) return true;
    }
    return false;
  });
}

export function escapeHTML(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Подсветка совпадений в безопасном HTML. */
export function highlight(text, query) {
  const safe = escapeHTML(text);
  const tokens = queryTokens(query);
  if (!tokens.length) return safe;
  const pattern = tokens
    .sort((a, b) => b.length - a.length)
    .map((t) => escapeRegExp(t))
    .join('|');
  if (!pattern) return safe;
  try {
    return safe.replace(new RegExp('(' + pattern + ')', 'gi'), '<mark>$1</mark>');
  } catch {
    return safe;
  }
}
