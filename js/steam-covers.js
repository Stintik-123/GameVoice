/* Обложки Steam для игр, у которых в каталоге нет своей картинки. */

const STEAM_APPS = {
  cyberpunk: 1091500,
  bg3: 1086940,
  hogwarts: 990080,
  stalker2: 1643320,
  expedition33: 1903340,
  dispatch: 2592160,
  alanswake2: 1902960,
  eldenring: 1245620,
  sh2: 2124490,
  kcd2: 1771300,
  rdr2: 1174180,
  gtav: 271590,
  hl2: 220,
};

/** Подставляет обложку и фон-герой, если у игры их ещё нет. */
export function applyCovers(games) {
  for (const game of games) {
    const appId = STEAM_APPS[game.id] || game.steamId;
    if (!appId) continue;
    const base = 'https://cdn.cloudflare.steamstatic.com/steam/apps/' + appId;
    if (!game.cover) game.cover = base + '/library_600x900.jpg';
    if (!game.heroImage) game.heroImage = base + '/library_hero.jpg';
    if (!game.steamId) game.steamId = appId;
  }
  return games;
}
