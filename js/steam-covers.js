(function () {
  'use strict';
  var STEAM = {
    cyberpunk: 1091500, bg3: 1086940, hogwarts: 990080, eldenring: 1245620,
    starfield: 1716740, stalker2: 1643320, godofwar: 1593500,
    resident4: 2050650, horizon2: 2420110, alanswake2: 1902960, metaphor: 2679460,
    hades2: 1145350
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
