(function () {
  'use strict';
  var STEAM = {
    cyberpunk: 1091500, bg3: 1086940, hogwarts: 990080, stalker2: 1643320
  };
  function apply() {
    if (typeof games === 'undefined') return;
    games.forEach(function (g) {
      var sid = STEAM[g.id] || g.steamId;
      if (!sid) return;
      var base = 'https://cdn.cloudflare.steamstatic.com/steam/apps/' + sid;
      if (!g.cover) g.cover = base + '/library_600x900.jpg';
      if (!g.heroImage) g.heroImage = base + '/library_hero.jpg';
      if (!g.steamId) g.steamId = sid;
    });
  }
  apply();
})();
