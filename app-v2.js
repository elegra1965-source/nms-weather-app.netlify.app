/* ATLAS Weather Station v4.0 — plain JS (no React/Babel). elegra1965 */
(function () {
  'use strict';

  // ---------- small helpers ----------
  var $ = function (id) { return document.getElementById(id); };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var toastT;
  function toast(msg) { var t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, 2600); }
  function status(msg, err) { var s = $('status'); s.textContent = msg || ''; s.classList.toggle('err', !!err); }

  // ---------- assets ----------
  var HD = function (k) { return '/hd/hd-' + k + '.jpg'; };
  var CARD = function (k) { return '/hd/card-' + k + '.jpg'; };
  var WX_ICON = { sun: '/icons/32.png', moon: '/icons/31.png', cloud: '/icons/26.png', partly: '/icons/30.png', rain: '/icons/12.png', storm: '/icons/4.png', snow: '/icons/14.png', fog: '/icons/26.png' };
  var HAZ_ICON = { heat: '/icons/hz-tile-heat.webp', cold: '/icons/hz-tile-cold.webp', rad: '/icons/hz-tile-radioactive.webp', tox: '/icons/hz-tile-toxic.webp' };
  var RES = {
    'Star Bulb': '/plant-star-bulb-hot.webp', 'Faecium': '/plant-star-bulb.webp', 'Frost Crystal': '/plant-frost-crystal.webp', 'Frozen Tubers': '/plant-frozen-tubers.webp',
    'Fungal Mould': '/plant-fungal-mould.webp', 'Solanium': '/plant-solanium.webp', 'Gamma Root': '/plant-gamma-root.webp', 'Kelp Sac': '/plant-kelp-sac.webp',
    'Lava Bloom': '/plant-lava-bloom.webp', 'Dead Flora': '/plant-dead-flora.webp', 'Fuscium': '/fuscium.png', 'Plutonium': '/plutonium.webp',
    'Cactus Flesh': '/plant-cactus-flesh.webp', 'Marrow Bulb': '/plant-marrow-bulb.webp', 'NipNip Buds': '/plant-nipnip.webp'
  };
  ['Ammonia', 'Carbon', 'Chromatic Metal', 'Cobalt', 'Copper', 'Dioxite', 'Ferrite Dust', 'Fireberry', 'Grahberry', 'Indium', 'Jade Peas', 'Magnetised Ferrite', 'Nitrogen', 'Paraffinium', 'Phosphorus', 'Pyrite', 'Rusted Metal', 'Salt', 'Silver', 'Sodium', 'Uranium']
    .forEach(function (n) { RES[n] = '/icons/wiki/res-' + n.replace(/ /g, '_') + '.webp'; });
  RES['Activated Copper'] = RES.Copper; RES['Activated Indium'] = RES.Indium; RES['Basalt'] = RES.Pyrite;
  var RACE = { 'Gek': ['/race-gek.png', 'rgba(110,220,120,.6)'], 'Korvax': ['/race-korvax.png', 'rgba(150,140,255,.6)'], "Vy'keen": ['/race-vykeen.png', 'rgba(230,140,110,.6)'] };
  var STAR = { Yellow: '#f0c040', Red: '#ff5a3c', Green: '#3cff8a', Blue: '#5ab4ff', Purple: '#b07cff' };
  var CONF = { Low: '#00ff88', Medium: '#f0a500', High: '#ff8c00', Pirate: '#ff3322' };

  // ---------- state ----------
  var S = {
    unit: lsGet('atlas-unit', 'C'), metric: 'temp', fx: lsGet('atlas-fx', !window.matchMedia('(prefers-reduced-motion: reduce)').matches),
    loc: lsGet('atlas-last-loc', null), wx: null, aqi: null, updated: null, worlds: [], world: 0,
    prefs: Object.assign({ rain: true, severe: true, temp: true, daily: false, survey: false }, lsGet('atlas-alert-prefs-v2', {})),
    alertsOn: lsGet('atlas-alerts-on', false)
  };

  // ---------- weather codes ----------
  var WMO = { 0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog', 48: 'Freezing fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle', 56: 'Freezing drizzle', 57: 'Freezing drizzle', 61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 66: 'Freezing rain', 67: 'Freezing rain', 71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains', 80: 'Rain showers', 81: 'Rain showers', 82: 'Violent showers', 85: 'Snow showers', 86: 'Heavy snow showers', 95: 'Thunderstorm', 96: 'Thunderstorm, hail', 99: 'Thunderstorm, hail' };
  var isStorm = function (c) { return c >= 95; };
  var isSnow = function (c) { return (c >= 71 && c <= 77) || c === 85 || c === 86; };
  var isRain = function (c) { return (c >= 51 && c <= 67) || (c >= 80 && c <= 82); };
  var isFog = function (c) { return c === 45 || c === 48; };
  var SEVERE = [65, 67, 75, 82, 86, 95, 96, 99];
  function iconKind(c, day) {
    if (isStorm(c)) return 'storm'; if (isSnow(c)) return 'snow'; if (isRain(c)) return 'rain'; if (isFog(c)) return 'fog';
    if (c === 3) return 'cloud'; if (c === 2) return day ? 'partly' : 'cloud'; return day ? 'sun' : 'moon';
  }

  // ---------- units ----------
  var F = function () { return S.unit === 'F'; };
  var cv = function (t) { return Math.round(F() ? t * 9 / 5 + 32 : t); };
  var deg = function (t) { return cv(t) + '°'; };
  var spd = function (k) { return F() ? Math.round(k * 0.621) : Math.round(k); };
  var spdU = function () { return F() ? 'mph' : 'km/h'; };

  // ---------- biome translation ----------
  function translate(w, aqi) {
    var c = w.code, t = w.temp, day = w.isDay;
    var k;
    if (isStorm(c) || w.gust >= 75) k = 'storm';
    else if (isSnow(c) || t <= 0) k = 'frozen';
    else if (aqi != null && aqi >= 60) k = 'toxic';
    else if (isRain(c) || isFog(c)) k = 'marsh';
    else if (t >= 30) k = 'scorched';
    else if (day && w.uv >= 8) k = 'radioactive';
    else if (!day) k = 'night';
    else k = 'lush';
    var B = {
      storm: { img: 'volcanic', title: 'Extreme weather', desc: 'Electrical storms, heavy rain, strong winds', cls: 'VOLATILE', glow: 'rgba(255,140,0,.40)', sky: 'radial-gradient(70% 80% at 75% 15%, rgba(255,140,0,.16) 0%, rgba(7,11,17,0) 60%), linear-gradient(180deg,#1b1812 0%,#10141a 55%,#070b11 100%)', fx: 'rain storm' },
      frozen: { img: 'frozen', title: 'Frozen world', desc: isSnow(c) ? 'Sub-zero, steady snowfall' : 'Sub-zero, frost and ice', cls: 'GLACIAL', glow: 'rgba(200,235,255,.40)', sky: 'radial-gradient(70% 90% at 80% 35%, rgba(200,235,255,.20) 0%, rgba(7,11,17,0) 65%), linear-gradient(180deg,#1a2a38 0%,#0f1a24 55%,#070b11 100%)', fx: isSnow(c) ? 'snow' : '' },
      toxic: { img: 'toxic', title: 'Toxic world', desc: 'Poor air quality, polluted atmosphere', cls: 'CONTAMINATED', glow: 'rgba(120,255,80,.35)', sky: 'radial-gradient(70% 90% at 80% 35%, rgba(150,255,80,.16) 0%, rgba(7,11,17,0) 65%), linear-gradient(180deg,#18220f 0%,#10180e 55%,#070b11 100%)', fx: isRain(c) ? 'rain' : '' },
      marsh: { img: 'marsh', title: 'Marsh world', desc: isFog(c) ? 'Thick fog, damp air' : 'Humid, frequent rainfall, low mist', cls: 'HUMID', glow: 'rgba(130,190,220,.40)', sky: 'radial-gradient(70% 90% at 80% 35%, rgba(130,180,210,.20) 0%, rgba(7,11,17,0) 65%), linear-gradient(180deg,#15242f 0%,#0d1822 55%,#070b11 100%)', fx: isRain(c) ? 'rain' : '' },
      scorched: { img: 'scorched', title: 'Scorched world', desc: 'Extreme heat, high UV, dry air', cls: 'SCORCHED', glow: 'rgba(255,140,0,.50)', sky: 'radial-gradient(70% 90% at 80% 35%, rgba(255,140,0,.30) 0%, rgba(204,26,26,.10) 40%, rgba(7,11,17,0) 70%), linear-gradient(180deg,#2a1a0e 0%,#1a1210 55%,#070b11 100%)', fx: '' },
      radioactive: { img: 'radioactive', title: 'Radioactive world', desc: 'Intense UV radiation, clear skies', cls: 'IRRADIATED', glow: 'rgba(255,170,60,.45)', sky: 'radial-gradient(70% 90% at 80% 35%, rgba(255,170,60,.24) 0%, rgba(7,11,17,0) 65%), linear-gradient(180deg,#24190c 0%,#151210 55%,#070b11 100%)', fx: '' },
      night: { img: 'dead', title: 'Barren world', desc: 'Calm, cold and dark. Good for stargazing', cls: 'CALM', glow: 'rgba(120,160,230,.40)', sky: 'radial-gradient(60% 80% at 80% 25%, rgba(90,130,210,.18) 0%, rgba(7,11,17,0) 60%), linear-gradient(180deg,#060d1c 0%,#070b14 60%,#070b11 100%)', fx: c <= 2 ? 'stars' : '' },
      lush: { img: 'lush', title: 'Lush world', desc: 'Temperate, low hazard', cls: 'PARADISE', glow: 'rgba(0,229,255,.45)', sky: 'radial-gradient(70% 90% at 80% 40%, rgba(0,229,255,.26) 0%, rgba(0,150,168,.10) 40%, rgba(7,11,17,0) 70%), linear-gradient(180deg,#0a3046 0%,#0b1d2c 55%,#070b11 100%)', fx: '' }
    };
    var r = B[k]; r.key = k; return r;
  }

  function atlasLine(w, b, aqi) {
    var place = w.city || 'your location';
    var rainSoon = w.hourly.slice(1, 4).some(function (h) { return h.pop >= 55; });
    if (b.key === 'storm') return 'Storm cell over ' + place + '. Gusts up to ' + spd(w.gust) + ' ' + spdU() + '. Find shelter until the front passes.';
    if (b.key === 'frozen') return 'Sub-zero conditions over ' + place + '. Cold protection draining faster than usual. Wrap up warm, Traveller.';
    if (b.key === 'toxic') return 'Air quality is poor over ' + place + ' (index ' + aqi + '). Limit long exposure outdoors.';
    if (b.key === 'marsh') return (isFog(w.code) ? 'Visibility is low in the fog. ' : 'Wet conditions over ' + place + '. ') + 'No threat to your exosuit. Take a coat.';
    if (b.key === 'scorched') return 'Extreme heat over ' + place + '. Heat protection draining fast. Stay hydrated and keep to the shade.';
    if (b.key === 'radioactive') return 'UV index ' + w.uv + '. Radiation exposure high around midday. Cover up and use sunscreen.';
    if (b.key === 'night') return 'Night over ' + place + '. No hazards detected. ' + (w.code <= 2 ? 'Clear skies for stargazing. ' : '') + 'Sunrise at ' + w.sunrise + '.';
    return (rainSoon ? 'Rain likely within the next few hours. ' : 'Conditions steady over ' + place + '. ') + 'Hazard protection holding. A good day to be outside, Traveller.';
  }

  // ---------- data fetch ----------
  function fetchWeather(lat, lon, city) {
    var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon +
      '&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,dew_point_2m' +
      '&hourly=temperature_2m,weather_code,precipitation_probability,precipitation,wind_speed_10m,visibility,uv_index,surface_pressure,is_day' +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max' +
      '&timezone=auto&past_days=1&forecast_days=8';
    return fetch(url).then(function (r) { if (!r.ok) throw new Error('wx ' + r.status); return r.json(); }).then(function (d) {
      var c = d.current, H = d.hourly, D = d.daily;
      var nowStr = c.time.slice(0, 13); // YYYY-MM-DDTHH
      var si = 0; for (var i = 0; i < H.time.length; i++) { if (H.time[i].slice(0, 13) === nowStr) { si = i; break; } }
      var hourly = [];
      for (var j = si; j < Math.min(H.time.length, si + 25); j++) {
        hourly.push({ time: H.time[j], hr: parseInt(H.time[j].slice(11, 13), 10), temp: H.temperature_2m[j], code: H.weather_code[j], pop: H.precipitation_probability[j] || 0, wind: H.wind_speed_10m[j], day: !!H.is_day[j] });
      }
      var p24 = 0; for (var k = Math.max(0, si - 24); k < si; k++) p24 += H.precipitation[k] || 0;
      var presTrend = (H.surface_pressure[si] || 0) - (H.surface_pressure[Math.max(0, si - 3)] || 0);
      var ti = D.time.indexOf(c.time.slice(0, 10)); if (ti < 0) ti = 1;
      var fmt = function (iso) { return iso ? iso.slice(11, 16) : '--:--'; };
      var days = [];
      for (var q = ti; q < Math.min(D.time.length, ti + 7); q++) days.push({ date: D.time[q], hi: D.temperature_2m_max[q], lo: D.temperature_2m_min[q], code: D.weather_code[q], pop: D.precipitation_probability_max[q] || 0 });
      return {
        city: city, lat: lat, lon: lon, tzOffset: d.utc_offset_seconds, localTime: c.time,
        temp: c.temperature_2m, feels: c.apparent_temperature, hum: c.relative_humidity_2m, dew: c.dew_point_2m,
        code: c.weather_code, isDay: !!c.is_day, wind: c.wind_speed_10m, dir: c.wind_direction_10m, gust: c.wind_gusts_10m || c.wind_speed_10m,
        pres: Math.round(c.surface_pressure), presTrend: presTrend, precipNow: c.precipitation, precip24: Math.round(p24 * 10) / 10,
        vis: Math.round((H.visibility[si] || 10000) / 1000), uv: Math.round(H.uv_index[si] != null ? H.uv_index[si] : (D.uv_index_max[ti] || 0)),
        uvMax: Math.round(D.uv_index_max[ti] || 0),
        sunrise: fmt(D.sunrise[ti]), sunset: fmt(D.sunset[ti]), riseH: hfrac(D.sunrise[ti]), setH: hfrac(D.sunset[ti]),
        hourly: hourly, days: days
      };
    });
  }
  function hfrac(iso) { if (!iso) return 0; return parseInt(iso.slice(11, 13), 10) + parseInt(iso.slice(14, 16), 10) / 60; }
  function fetchAQI(lat, lon) {
    return fetch('https://air-quality-api.open-meteo.com/v1/air-quality?latitude=' + lat + '&longitude=' + lon + '&current=european_aqi')
      .then(function (r) { return r.json(); }).then(function (d) { return d.current ? Math.round(d.current.european_aqi) : null; }).catch(function () { return null; });
  }
  function omGeocode(q) {
    return fetch('https://geocoding-api.open-meteo.com/v1/search?count=1&language=en&format=json&name=' + encodeURIComponent(q))
      .then(function (r) { return r.json(); })
      .then(function (d) { var g = d && d.results && d.results[0]; return g ? { lat: g.latitude, lon: g.longitude, city: g.name, country: g.country || '' } : null; });
  }
  function timeout(p, ms) { return Promise.race([p, new Promise(function (_, rej) { setTimeout(function () { rej(new Error('timeout')); }, ms); })]); }
  function forwardGeocode(q) {
    return timeout(nominatimGeocode(q), 6000).then(function (g) { return g || omGeocode(q); }).catch(function () { return omGeocode(q); });
  }
  function nominatimGeocode(q) {
    return fetch('https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(q) + '&format=json&limit=1&addressdetails=1', { headers: { 'Accept-Language': 'en' } })
      .then(function (r) { return r.json(); })
      .then(function (d) { if (!d || !d.length) return null; var a = d[0].address || {}; return { lat: +d[0].lat, lon: +d[0].lon, city: (a.city || a.town || a.village || a.county || d[0].display_name.split(',')[0]), country: a.country || '' }; });
  }
  function reverseGeocode(lat, lon) {
    return fetch('https://nominatim.openstreetmap.org/reverse?lat=' + lat + '&lon=' + lon + '&format=json', { headers: { 'Accept-Language': 'en' } })
      .then(function (r) { return r.json(); })
      .then(function (d) { var a = d.address || {}; return { city: a.city || a.town || a.village || a.county || (d.display_name || 'Unknown').split(',')[0], country: a.country || '' }; });
  }

  // ---------- load & locate ----------
  var busy = false, pending = null;
  function load(loc, quiet) {
    if (busy) { pending = [loc, quiet]; return Promise.resolve(); } busy = true;
    if (!quiet) status('◈ ACQUIRING SIGNAL…');
    return Promise.all([fetchWeather(loc.lat, loc.lon, loc.city), fetchAQI(loc.lat, loc.lon)]).then(function (res) {
      S.wx = res[0]; S.wx.country = loc.country || ''; S.aqi = res[1]; S.loc = loc; S.updated = Date.now();
      lsSet('atlas-last-loc', loc);
      render(); status(''); checkAlerts(); syncPush();
    }).catch(function (e) { console.warn(e); status('SIGNAL LOST — check your connection and try again', true); })
      .then(function () { busy = false; if (pending) { var p = pending; pending = null; load(p[0], p[1]); } });
  }
  function search(q) {
    status('◈ SCANNING FOR "' + q.toUpperCase() + '"…');
    forwardGeocode(q).then(function (g) { if (!g) { status('LOCATION NOT FOUND — try a city name', true); return; } $('loc').value = ''; load(g); })
      .catch(function () { status('SIGNAL LOST — try again', true); });
  }
  function ipLocate() {
    return fetch('https://ipapi.co/json/').then(function (r) { return r.json(); }).then(function (d) {
      if (d && d.latitude) return load({ lat: d.latitude, lon: d.longitude, city: d.city || d.region || 'Your area', country: d.country_name || '' });
      throw new Error('ip');
    });
  }
  function locate() {
    if (!navigator.geolocation) { ipLocate().catch(function () { status('Could not find you — type a city instead', true); }); return; }
    status('◈ LOCATING…');
    navigator.geolocation.getCurrentPosition(function (p) {
      var lat = +p.coords.latitude.toFixed(3), lon = +p.coords.longitude.toFixed(3);
      reverseGeocode(lat, lon).then(function (g) { load({ lat: lat, lon: lon, city: g.city, country: g.country }); })
        .catch(function () { load({ lat: lat, lon: lon, city: 'Your location', country: '' }); });
    }, function () { ipLocate().catch(function () { status('Location blocked — type a city instead', true); }); }, { timeout: 10000, maximumAge: 600000 });
  }

  // ---------- render ----------
  function render() {
    var w = S.wx; if (!w) return;
    var b = translate(w, S.aqi);
    var hero = $('hero');
    hero.style.background = b.sky;
    hero.setAttribute('data-fx', S.fx ? b.fx : '');
    var orb = $('orb');
    orb.style.backgroundImage = "url('" + HD(b.img) + "')";
    orb.style.boxShadow = 'inset -45px -32px 90px rgba(0,0,0,.9), inset 14px 10px 30px rgba(255,255,255,.18), 0 0 60px ' + b.glow;
    $('halo').style.background = 'radial-gradient(circle, transparent 58%, ' + b.glow + ' 64%, transparent 74%)';
    $('tempNow').style.textShadow = '0 0 40px ' + b.glow;
    var place = w.city + (w.country ? ', ' + w.country : '');
    $('locLabel').textContent = 'Live · ' + place;
    $('tempNow').textContent = cv(w.temp); $('tempUnit').textContent = F() ? '°F' : '°C';
    var kind = iconKind(w.code, w.isDay);
    $('condIcon').src = WX_ICON[kind]; $('condIcon').alt = '';
    $('condLabel').textContent = WMO[w.code] || '—';
    var d0 = w.days[0] || { hi: w.temp, lo: w.temp };
    $('hiLo').textContent = 'H ' + deg(d0.hi) + ' · L ' + deg(d0.lo) + ' · FEELS ' + deg(w.feels);
    $('biomeTitle').textContent = b.title; $('biomeDesc').textContent = b.desc;
    $('atlasLine').textContent = atlasLine(w, b, S.aqi);
    $('tagClass').textContent = 'CLASS · ' + b.cls;
    document.title = cv(w.temp) + '° ' + (WMO[w.code] || '') + ' · ' + w.city + ' — Atlas Weather Station';
    renderRing(w); renderHazards(w); renderHourly(); renderDays(w); renderTiles(w); renderStorm(w); renderShare(w);
    updateClockAndAge();
  }

  function ringPt(h, r) { var a = (90 + h / 24 * 360) * Math.PI / 180; return [50 + r * Math.cos(a), 50 + r * Math.sin(a)]; }
  function renderRing(w) {
    var len = Math.max(0, w.setH - w.riseH);
    var arc = $('dayArc'); arc.setAttribute('stroke-dasharray', len.toFixed(2) + ' 24'); arc.setAttribute('stroke-dashoffset', (-w.riseH).toFixed(2));
    var r = ringPt(w.riseH, 51), s = ringPt(w.setH, 51);
    var rt = $('riseTxt'); rt.setAttribute('x', r[0].toFixed(1)); rt.setAttribute('y', r[1].toFixed(1)); rt.textContent = '▲ ' + w.sunrise;
    var st = $('setTxt'); st.setAttribute('x', s[0].toFixed(1)); st.setAttribute('y', s[1].toFixed(1)); st.textContent = w.sunset + ' ▼';
    var nh = localHour(); var n = ringPt(nh, 47), nl = ringPt(nh, 53.5);
    $('nowDot').setAttribute('cx', n[0].toFixed(1)); $('nowDot').setAttribute('cy', n[1].toFixed(1));
    $('nowTxt').setAttribute('x', nl[0].toFixed(1)); $('nowTxt').setAttribute('y', (nl[1] + 1.2).toFixed(1));
  }
  function localHour() { // hour-of-day at the forecast location
    if (!S.wx) return new Date().getHours();
    var d = new Date(Date.now() + S.wx.tzOffset * 1000);
    return d.getUTCHours() + d.getUTCMinutes() / 60;
  }

  function hazWord(v) { return v < 25 ? ['SAFE', '#00ff88', 'rgba(0,255,136,.35)'] : v < 50 ? ['MILD', '#f0a500', 'rgba(240,165,0,.35)'] : v < 75 ? ['HIGH', '#ff8c00', 'rgba(255,140,0,.4)'] : ['EXTREME', '#ff3322', 'rgba(255,51,34,.45)']; }
  function renderHazards(w) {
    var heat = clamp(Math.round((w.temp - 22) * 5.5), 0, 100);
    var cold = clamp(Math.round((12 - w.feels) * 4.5), 0, 100);
    var rad = clamp(Math.round(Math.max(w.uv, w.isDay ? 0 : 0) / 11 * 100), 0, 100);
    var tox = S.aqi == null ? 10 : clamp(Math.round(S.aqi), 0, 100);
    var rows = [
      ['Heat', 'Temperature ' + deg(w.temp), heat, HAZ_ICON.heat],
      ['Cold', 'Wind chill ' + deg(w.feels), cold, HAZ_ICON.cold],
      ['Radiation', 'UV index ' + w.uv + (w.isDay ? '' : ' (night)'), rad, HAZ_ICON.rad],
      ['Toxic', 'Air quality ' + (S.aqi == null ? '—' : S.aqi), tox, HAZ_ICON.tox]
    ];
    $('hazRows').innerHTML = rows.map(function (r) {
      var hw = hazWord(r[2]);
      return '<div class="haz-row"><img class="haz-ic" src="' + r[3] + '" alt="" aria-hidden="true">' +
        '<div style="grid-area:nm;line-height:1.2;min-width:0"><div style="font-family:var(--disp);font-size:12px;font-weight:700;letter-spacing:1.5px;color:var(--white);text-transform:uppercase">' + r[0] + '</div><div style="font-size:13.5px;color:var(--text-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(r[1]) + '</div></div>' +
        '<div class="haz-bar"><div style="width:' + Math.max(4, r[2]) + '%;background:repeating-linear-gradient(90deg,' + hw[1] + ' 0 8px,transparent 8px 10px);box-shadow:0 0 10px ' + hw[1] + '"></div></div>' +
        '<div class="mono" style="grid-area:wd;font-size:13px;letter-spacing:1px;color:' + hw[1] + ';text-align:right">' + hw[0] + ' <span style="color:var(--text-dim)">' + r[2] + '%</span></div></div>';
    }).join('');
    var worst = Math.max(heat, cold, rad, tox), pw = hazWord(worst), protect = Math.round(100 - worst * 0.45);
    $('protect').textContent = protect;
    var arc = $('shieldArc'); arc.setAttribute('stroke', pw[1]); arc.setAttribute('stroke-dasharray', protect + ' 100'); arc.style.filter = 'drop-shadow(0 0 6px ' + pw[1] + ')';
    var pwEl = $('protectWord'); pwEl.textContent = pw[0] === 'SAFE' ? 'ALL SYSTEMS NOMINAL' : pw[0] + ' EXPOSURE'; pwEl.style.color = pw[1];
  }

  function renderHourly() {
    var w = S.wx; if (!w) return;
    var pts = [], cells = '';
    var steps = []; for (var i = 0; i < 24 && i < w.hourly.length; i += 2) steps.push(w.hourly[i]);
    var vals = steps.map(function (h) { return S.metric === 'rain' ? h.pop : S.metric === 'wind' ? spd(h.wind) : cv(h.temp); });
    steps.forEach(function (h, i) {
      var v = vals[i], lab = S.metric === 'rain' ? v + '%' : S.metric === 'wind' ? String(v) : v + '°';
      cells += '<div class="hcell' + (i === 0 ? ' now' : '') + '"><span class="t">' + (i === 0 ? 'NOW' : pad(h.hr) + ':00') + '</span><img src="' + WX_ICON[iconKind(h.code, h.day)] + '" alt=""><span class="v">' + lab + '</span></div>';
    });
    $('hgrid').innerHTML = cells;
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    if (S.metric === 'rain') { lo = 0; hi = 100; }
    var span = (hi - lo) || 1, n = vals.length;
    vals.forEach(function (v, i) { pts.push([((i + 0.5) / n) * 1000, 18 + (1 - (v - lo) / span) * 112]); });
    var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (var k = 1; k < pts.length; k++) { var mx = (pts[k - 1][0] + pts[k][0]) / 2; d += ' C' + mx.toFixed(1) + ' ' + pts[k - 1][1].toFixed(1) + ' ' + mx.toFixed(1) + ' ' + pts[k][1].toFixed(1) + ' ' + pts[k][0].toFixed(1) + ' ' + pts[k][1].toFixed(1); }
    var col = S.metric === 'rain' ? '#00e5ff' : S.metric === 'wind' ? '#eaf6ff' : '#f0a500';
    $('linePath').setAttribute('d', d); $('linePath').setAttribute('stroke', col); $('linePath').style.filter = 'drop-shadow(0 0 6px ' + col + ')';
    $('areaPath').setAttribute('d', d + ' L' + pts[n - 1][0].toFixed(1) + ' 150 L' + pts[0][0].toFixed(1) + ' 150 Z');
    $('areaTop').setAttribute('stop-color', col); $('areaBot').setAttribute('stop-color', col);
    // sunrise / sunset marker
    var start = steps[0].hr, nowFrac = localHour();
    var target = null, label = '';
    [[w.setH, 'SUNSET ' + w.sunset], [w.riseH, 'SUNRISE ' + w.sunrise], [w.riseH + 24, 'SUNRISE ' + w.sunrise], [w.setH + 24, 'SUNSET ' + w.sunset]].forEach(function (m) {
      var off = m[0] - nowFrac; if (off > 0 && off < 23 && (target == null || off < target)) { target = off; label = m[1]; }
    });
    var sm = $('sunmark');
    if (target != null) { sm.style.display = 'block'; sm.style.left = (((target + (nowFrac - start)) / 2 + 0.5) / n * 100).toFixed(1) + '%'; $('sunmarkTxt').textContent = label; } else sm.style.display = 'none';
    // summary
    var wet = w.hourly.slice(0, 24).filter(function (h) { return h.pop >= 50; });
    var peak = w.hourly.slice(0, 24).reduce(function (a, h) { return h.temp > a.temp ? h : a; }, w.hourly[0]);
    $('hourSummary').textContent = wet.length ? 'Rain likely around ' + pad(wet[0].hr) + ':00. Peaks at ' + deg(peak.temp) + ' around ' + pad(peak.hr) + ':00.' : 'Dry for the next 24 hours. Peaks at ' + deg(peak.temp) + ' around ' + pad(peak.hr) + ':00.';
    document.querySelectorAll('.tabs button').forEach(function (bt) { bt.setAttribute('aria-selected', bt.getAttribute('data-m') === S.metric ? 'true' : 'false'); });
  }

  var DAYN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  function renderDays(w) {
    var mn = Math.min.apply(null, w.days.map(function (d) { return d.lo; })), mx = Math.max.apply(null, w.days.map(function (d) { return d.hi; })), sp = (mx - mn) || 1;
    $('weekRange').textContent = 'WEEK ' + deg(mn) + ' – ' + deg(mx);
    $('days').innerHTML = w.days.map(function (d, i) {
      var left = (d.lo - mn) / sp * 100, width = Math.max((d.hi - d.lo) / sp * 100, 6);
      var gs = (100 / width * 100).toFixed(0) + '%', gp = (left / Math.max(100 - width, 1) * 100).toFixed(0) + '%';
      var dot = i === 0 ? '<i style="left:' + (clamp((w.temp - d.lo) / ((d.hi - d.lo) || 1), 0, 1) * 100).toFixed(0) + '%"></i>' : '';
      var name = i === 0 ? 'TODAY' : DAYN[new Date(d.date + 'T12:00:00Z').getUTCDay()];
      return '<div class="drow' + (i === 0 ? ' today' : '') + '"><span class="d">' + name + '</span><img src="' + WX_ICON[iconKind(d.code, true)] + '" alt=""><span class="mono" style="font-size:13px;color:var(--cyan)">' + (d.pop >= 20 ? d.pop + '%' : '') + '</span><span class="mono" style="font-size:15px;color:var(--text-dim);text-align:right">' + deg(d.lo) + '</span><div class="rbar"><div style="left:' + left.toFixed(1) + '%;width:' + width.toFixed(1) + '%;background-size:' + gs + ' 100%;background-position:' + gp + ' 0"></div>' + dot + '</div><span style="font-family:var(--disp);font-size:15px;font-weight:700;color:var(--white)">' + deg(d.hi) + '</span></div>';
    }).join('');
  }

  function tile(a, hex, icon, name, stat, body, scan) {
    return '<div class="tile" style="--a:' + a + '"><div class="th"><span class="l"><span class="chip" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="' + icon + '"/></svg></span><span class="n">' + name + '</span></span><span class="s">' + stat + '</span></div>' + body + '<div class="scanline">▸ ' + esc(scan) + '</div></div>';
  }
  function renderTiles(w) {
    var comp = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(w.dir / 45) % 8];
    var bf = w.wind < 6 ? 'Light air' : w.wind < 12 ? 'Light breeze' : w.wind < 20 ? 'Gentle breeze' : w.wind < 29 ? 'Moderate breeze' : w.wind < 39 ? 'Fresh breeze' : w.wind < 50 ? 'Strong wind' : w.wind < 75 ? 'Gale' : 'Storm force';
    var uvW = w.uv <= 2 ? ['LOW', '0,255,136', '#00ff88', 'No protection needed'] : w.uv <= 5 ? ['MODERATE', '240,165,0', '#f0a500', 'Sunscreen advised at midday'] : w.uv <= 7 ? ['HIGH', '255,140,0', '#ff8c00', 'Cover up, seek shade 11:00–15:00'] : ['VERY HIGH', '255,51,34', '#ff3322', 'Avoid the sun at midday'];
    var nh = localHour(), sunUp = nh >= w.riseH && nh <= w.setH, f = clamp((nh - w.riseH) / ((w.setH - w.riseH) || 1), 0, 1), ang = Math.PI * (1 - f);
    var dl = Math.max(0, w.setH - w.riseH), dlh = Math.floor(dl), dlm = Math.round((dl - dlh) * 60);
    var fd = Math.round(w.feels - w.temp);
    var pct = function (t) { return (clamp((t + 10) / 50, 0, 1) * 100).toFixed(1) + '%'; };
    var comfort = w.dew < 10 ? 'DRY' : w.dew < 16 ? 'COMFORTABLE' : w.dew < 20 ? 'MUGGY' : 'OPPRESSIVE';
    var presAngle = clamp((w.pres - 1013) * 3, -80, 80);
    var trend = w.presTrend <= -1 ? '▼ FALLING' : w.presTrend >= 1 ? '▲ RISING' : '● STEADY';
    var presWord = w.pres < 1000 ? 'Low pressure · unsettled, stormy' : w.pres < 1010 ? 'Below average · changeable' : w.pres > 1020 ? 'High pressure · settled' : 'Near average · steady';
    var visKm = w.vis, visV = F() ? Math.round(visKm * 0.621) : visKm;
    var next = w.hourly[1] || w.hourly[0];
    var precipNext = next.pop >= 30 ? 'Next hour: ' + next.pop + '% chance of ' + (isSnow(next.code) ? 'snow' : 'rain') : 'No rain expected in the next hour';
    var precipWord = w.precip24 === 0 ? 'DRY' : w.precip24 < 5 ? 'LIGHT' : w.precip24 < 15 ? 'MODERATE' : 'HEAVY';
    var MONO = "font-family:'Share Tech Mono',monospace";
    var html = '';
    html += tile('0,229,255', '#00e5ff', 'M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h8', 'WIND', comp,
      '<div class="wbx" style="display:flex;align-items:center;gap:14px"><div style="position:relative;width:92px;height:92px;flex-shrink:0"><div class="radar" aria-hidden="true"></div><svg width="92" height="92" viewBox="0 0 96 96" aria-hidden="true" style="position:relative"><circle cx="48" cy="48" r="42" fill="rgba(0,229,255,.03)" stroke="rgba(0,229,255,.35)"/><circle cx="48" cy="48" r="30" fill="none" stroke="rgba(0,229,255,.12)" stroke-dasharray="2 3"/><path d="M48 6v6M48 84v6M6 48h6M84 48h6" stroke="rgba(0,229,255,.5)" stroke-width="1.5"/><text x="48" y="22" text-anchor="middle" font-family="Orbitron" font-weight="700" font-size="9" fill="#00e5ff">N</text><text x="77" y="51" text-anchor="middle" font-family="Orbitron" font-size="8" fill="rgba(207,224,240,.55)">E</text><text x="48" y="80" text-anchor="middle" font-family="Orbitron" font-size="8" fill="rgba(207,224,240,.55)">S</text><text x="19" y="51" text-anchor="middle" font-family="Orbitron" font-size="8" fill="rgba(207,224,240,.55)">W</text><g transform="rotate(' + (w.dir + 180) + ' 48 48)"><path d="M48 24 L55 52 L48 47 L41 52 Z" fill="#00e5ff" style="filter:drop-shadow(0 0 4px #00e5ff)"/><path d="M48 47 L48 72" stroke="rgba(0,229,255,.55)" stroke-width="2"/></g></svg></div><div><div class="big" style="font-size:34px">' + spd(w.wind) + '</div><div style="' + MONO + ';font-size:13px;margin-top:4px">' + spdU() + ' from ' + comp + '</div><div style="font-size:14px;color:rgba(207,224,240,.65)">Gusts ' + spd(w.gust) + ' ' + spdU() + '</div></div></div>', bf);
    html += tile(uvW[1], uvW[2], 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4', 'UV · RADIATION', uvW[0],
      '<svg width="100%" height="96" viewBox="0 0 120 70" aria-hidden="true"><defs><linearGradient id="uvg" x1="0" x2="1"><stop offset="0" stop-color="#00ff88"/><stop offset=".45" stop-color="#f0a500"/><stop offset=".75" stop-color="#ff8c00"/><stop offset="1" stop-color="#ff3322"/></linearGradient></defs><path d="M14 62 A46 46 0 0 1 106 62" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="10" stroke-linecap="round"/><path d="M14 62 A46 46 0 0 1 106 62" fill="none" stroke="url(#uvg)" stroke-width="10" stroke-linecap="round" pathLength="100" stroke-dasharray="' + clamp(w.uv / 11 * 100, 2, 100).toFixed(0) + ' 100" style="filter:drop-shadow(0 0 5px ' + uvW[2] + ')"/><path d="M14 62 A46 46 0 0 1 106 62" fill="none" stroke="#070b11" stroke-width="10" pathLength="11" stroke-dasharray=".06 .94"/><text x="60" y="56" text-anchor="middle" font-family="Orbitron" font-weight="900" font-size="26" fill="#eaf6ff">' + w.uv + '</text><text x="12" y="70" font-family="Share Tech Mono" font-size="7" fill="rgba(207,224,240,.5)">0</text><text x="102" y="70" font-family="Share Tech Mono" font-size="7" fill="rgba(207,224,240,.5)">11+</text></svg>', uvW[3] + (w.isDay ? '' : ' · today’s peak ' + w.uvMax));
    html += tile('240,165,0', '#f0a500', 'M12 3v2M5.6 5.6l1.4 1.4M3 12h2M19 12h2M17 7l1.4-1.4M7 16a5 5 0 0 1 10 0M3 20h18', 'STAR CYCLE', sunUp ? 'DAYTIME' : 'NIGHT',
      '<svg width="100%" height="96" viewBox="0 0 120 70" aria-hidden="true"><defs><linearGradient id="dayfill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0a500" stop-opacity=".3"/><stop offset="1" stop-color="#f0a500" stop-opacity="0"/></linearGradient></defs><path d="M10 60 A50 50 0 0 1 110 60 Z" fill="url(#dayfill)"/><path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="rgba(240,165,0,.6)" stroke-width="1.5" stroke-dasharray="3 3"/><line x1="2" y1="60" x2="118" y2="60" stroke="rgba(207,224,240,.25)"/>' +
      (sunUp ? '<circle cx="' + (60 + 50 * Math.cos(ang)).toFixed(1) + '" cy="' + (60 - 50 * Math.sin(ang)).toFixed(1) + '" r="10" fill="rgba(240,165,0,.25)"/><circle cx="' + (60 + 50 * Math.cos(ang)).toFixed(1) + '" cy="' + (60 - 50 * Math.sin(ang)).toFixed(1) + '" r="5.5" fill="#ffc94d" style="filter:drop-shadow(0 0 6px #f0a500)"/>' : '') +
      '</svg><div style="display:flex;justify-content:space-between;' + MONO + ';font-size:13px;color:var(--white)"><span><span style="color:var(--gold)">▲</span> ' + w.sunrise + '</span><span>' + w.sunset + ' <span style="color:var(--gold)">▼</span></span></div>', 'Daylight ' + dlh + 'h ' + dlm + 'm');
    html += tile('255,140,0', '#ff8c00', 'M14 14.8V5a2 2 0 1 0-4 0v9.8a4 4 0 1 0 4 0z', 'FEELS LIKE', fd === 0 ? '= REAL' : (fd > 0 ? '+' : '') + Math.round(F() ? fd * 9 / 5 : fd) + '° VS REAL',
      '<div class="big" style="font-size:40px">' + deg(w.feels) + '</div><div style="position:relative;height:34px;margin-top:4px"><div style="position:absolute;left:0;right:0;top:10px;height:8px;border-radius:4px;background:linear-gradient(90deg,#4fb7ff,#00e5ff 30%,#00ff88 50%,#f0a500 70%,#ff3322)"></div><span style="position:absolute;top:4px;left:' + pct(w.temp) + ';width:3px;height:20px;margin-left:-1.5px;background:rgba(234,246,255,.6);border-radius:2px"></span><span style="position:absolute;top:6px;left:' + pct(w.feels) + ';width:16px;height:16px;margin-left:-8px;border-radius:50%;background:#eaf6ff;border:3px solid #070b11;box-shadow:0 0 10px #ff8c00"></span><span style="position:absolute;top:24px;left:0;' + MONO + ';font-size:10px;color:rgba(207,224,240,.5)">' + deg(-10) + '</span><span style="position:absolute;top:24px;right:0;' + MONO + ';font-size:10px;color:rgba(207,224,240,.5)">' + deg(40) + '</span></div>',
      fd <= -2 ? 'Wind makes it feel colder than it is' : fd >= 2 ? 'Humidity makes it feel warmer' : 'Close to the real temperature');
    html += tile('0,229,255', '#00e5ff', 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z', 'HUMIDITY', comfort,
      '<div style="display:flex;align-items:center;gap:14px"><svg width="58" height="74" viewBox="0 0 48 62" aria-hidden="true" style="flex-shrink:0"><defs><clipPath id="drop"><path d="M24 2C24 2 4 24 4 39a20 20 0 0 0 40 0C44 24 24 2 24 2z"/></clipPath><linearGradient id="dropg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#00e5ff"/><stop offset="1" stop-color="#0096a8"/></linearGradient></defs><path d="M24 2C24 2 4 24 4 39a20 20 0 0 0 40 0C44 24 24 2 24 2z" fill="rgba(0,229,255,.06)" stroke="rgba(0,229,255,.5)" stroke-width="1.5"/><rect x="0" y="' + (2 + (1 - w.hum / 100) * 58).toFixed(1) + '" width="48" height="62" fill="url(#dropg)" clip-path="url(#drop)" opacity=".85"/></svg><div><div class="big" style="font-size:40px">' + Math.round(w.hum) + '<span style="font-size:18px;color:var(--cyan)">%</span></div><div style="font-size:14px;color:rgba(207,224,240,.65);margin-top:4px">Dew point ' + deg(w.dew) + '</div></div></div>',
      w.hum >= 85 ? 'Saturated air. Expect mist and damp' : w.hum >= 60 ? 'Moist air' : w.hum >= 30 ? 'Pleasant air' : 'Very dry air');
    html += tile('0,229,255', '#00e5ff', 'M12 21a9 9 0 1 1 9-9M12 12l4-4M12 3v2M3 12h2', 'PRESSURE', trend,
      '<svg width="100%" height="92" viewBox="0 0 120 70" aria-hidden="true"><defs><linearGradient id="presg" x1="0" x2="1"><stop offset="0" stop-color="#ff8c00"/><stop offset=".5" stop-color="#00e5ff"/><stop offset="1" stop-color="#00ff88"/></linearGradient></defs><path d="M16 62 A44 44 0 0 1 104 62" fill="none" stroke="url(#presg)" stroke-width="4" opacity=".55"/><path d="M16 62 A44 44 0 0 1 104 62" fill="none" stroke="rgba(207,224,240,.4)" stroke-width="7" pathLength="20" stroke-dasharray=".08 .92"/><g transform="rotate(' + presAngle + ' 60 62)"><line x1="60" y1="62" x2="60" y2="24" stroke="#eaf6ff" stroke-width="2.5" stroke-linecap="round" style="filter:drop-shadow(0 0 4px #00e5ff)"/></g><circle cx="60" cy="62" r="5" fill="#070b11" stroke="#00e5ff" stroke-width="2"/><text x="14" y="70" font-family="Share Tech Mono" font-size="7" fill="rgba(207,224,240,.55)">LOW</text><text x="96" y="70" font-family="Share Tech Mono" font-size="7" fill="rgba(207,224,240,.55)">HIGH</text></svg><div style="text-align:center"><span class="big" style="font-size:24px">' + w.pres + '</span> <span style="' + MONO + ';font-size:12px;color:var(--text-dim)">hPa</span></div>', presWord);
    html += tile('234,246,255', '#eaf6ff', 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z', 'VISIBILITY', visKm >= 10 ? 'EXCELLENT' : visKm >= 5 ? 'MODERATE' : 'POOR',
      '<div style="display:flex;align-items:center;gap:14px"><svg width="86" height="86" viewBox="0 0 100 100" aria-hidden="true" style="flex-shrink:0"><circle cx="50" cy="50" r="46" fill="none" stroke="rgba(234,246,255,.12)"/><circle cx="50" cy="50" r="32" fill="none" stroke="rgba(234,246,255,.12)"/><circle cx="50" cy="50" r="18" fill="none" stroke="rgba(234,246,255,.12)"/><circle cx="50" cy="50" r="' + (6 + clamp(visKm / 20, 0, 1) * 40).toFixed(1) + '" fill="rgba(234,246,255,.1)" stroke="#eaf6ff" stroke-width="1.5" style="filter:drop-shadow(0 0 4px rgba(234,246,255,.6))"/><circle cx="50" cy="50" r="3" fill="#00e5ff"/></svg><div><div class="big" style="font-size:40px">' + visV + '<span style="font-size:18px;color:var(--cyan)"> ' + (F() ? 'mi' : 'km') + '</span></div><div style="font-size:14px;color:rgba(207,224,240,.65);margin-top:4px">Scan range</div></div></div>',
      visKm >= 10 ? 'Clear view to the horizon' : visKm >= 5 ? 'Slight haze' : 'Poor. Take care travelling');
    html += tile('0,229,255', '#00e5ff', 'M7 15h10a4 4 0 0 0 .4-8A6 6 0 0 0 6 8.5 3.5 3.5 0 0 0 7 15zM8 18l-1 3M12 18l-1 3M16 18l-1 3', 'PRECIPITATION', precipWord,
      '<div style="display:flex;align-items:center;gap:14px"><div aria-hidden="true" style="position:relative;width:54px;height:80px;flex-shrink:0;border-radius:8px 8px 12px 12px;border:1.5px solid rgba(0,229,255,.5);overflow:hidden;background:rgba(0,229,255,.04)"><div style="position:absolute;left:0;right:0;bottom:0;height:' + (Math.min(w.precip24 / 20, 1) * 85 + (w.precip24 > 0 ? 8 : 3)).toFixed(0) + '%;background:linear-gradient(180deg,rgba(0,229,255,.85),rgba(0,150,168,.85))"><div style="position:absolute;top:-6px;left:0;right:0;height:8px;background-image:radial-gradient(circle at 10px 8px,rgba(0,229,255,.85) 8px,transparent 8.5px);background-size:20px 8px;animation:wave 2.5s linear infinite"></div></div><div style="position:absolute;inset:0;background:repeating-linear-gradient(180deg,transparent 0 15px,rgba(207,224,240,.18) 15px 16px)"></div></div><div><div class="big" style="font-size:40px">' + w.precip24 + '<span style="font-size:18px;color:var(--cyan)"> mm</span></div><div style="font-size:14px;color:rgba(207,224,240,.65);margin-top:4px">Last 24 hours</div></div></div>', precipNext);
    var aq = S.aqi, aqW = aq == null ? ['NO DATA', '207,224,240', 'Air quality unavailable here'] : aq <= 20 ? ['GOOD', '0,255,136', 'Clean air. Breathe easy'] : aq <= 40 ? ['FAIR', '0,229,255', 'Fine for everyone'] : aq <= 60 ? ['MODERATE', '240,165,0', 'Sensitive people may notice it'] : aq <= 80 ? ['POOR', '255,140,0', 'Limit long exertion outdoors'] : ['VERY POOR', '255,51,34', 'Avoid long exposure outdoors'];
    html += tile(aqW[1], '', 'M3 12h4l2-6 4 12 2-6h6', 'AIR QUALITY', aqW[0],
      '<div class="big" style="font-size:40px">' + (aq == null ? '—' : aq) + '<span style="font-size:14px;color:var(--text-dim);font-family:var(--mono)"> EU AQI</span></div><div style="position:relative;height:30px;margin-top:4px"><div style="position:absolute;left:0;right:0;top:8px;height:8px;border-radius:4px;background:linear-gradient(90deg,#00ff88,#00e5ff 25%,#f0a500 50%,#ff8c00 75%,#ff3322)"></div>' + (aq == null ? '' : '<span style="position:absolute;top:4px;left:' + clamp(aq, 0, 100) + '%;width:16px;height:16px;margin-left:-8px;border-radius:50%;background:#eaf6ff;border:3px solid #070b11;box-shadow:0 0 10px rgb(' + aqW[1] + ')"></span>') + '<span style="position:absolute;top:20px;left:0;' + MONO + ';font-size:10px;color:rgba(207,224,240,.5)">0</span><span style="position:absolute;top:20px;right:0;' + MONO + ';font-size:10px;color:rgba(207,224,240,.5)">100+</span></div>', aqW[2] + ' · feeds the Toxic hazard');
    $('tiles').innerHTML = html;
  }

  // storm banner: severe now or within 6h
  var stormEnd = null;
  function renderStorm(w) {
    var now = w.hourly[0], ban = $('stormBanner');
    var severeNow = SEVERE.indexOf(w.code) !== -1 || w.gust >= 70;
    var startIdx = -1;
    for (var i = 0; i < Math.min(7, w.hourly.length); i++) if (SEVERE.indexOf(w.hourly[i].code) !== -1) { startIdx = i; break; }
    if (!severeNow && startIdx < 0) { ban.classList.remove('show'); stormEnd = null; return; }
    var startH = severeNow ? 0 : startIdx, endH = startH;
    while (endH < w.hourly.length - 1 && SEVERE.indexOf(w.hourly[endH + 1].code) !== -1) endH++;
    var desc = WMO[w.hourly[startH].code] || 'Severe weather';
    $('stormText').textContent = (severeNow ? desc + ' over ' + w.city + ' now.' : desc + ' expected from ' + pad(w.hourly[startH].hr) + ':00.') + ' Gusts up to ' + spd(Math.max(w.gust, 0)) + ' ' + spdU() + '.';
    $('stormWhen').textContent = severeNow ? 'EXPECTED TO EASE IN' : 'ARRIVES IN';
    var into = (localHour() % 1) * 60; // minutes into the current hour at the location
    stormEnd = Date.now() + ((severeNow ? (endH + 1) * 60 : startH * 60) - into) * 60e3;
    ban.classList.add('show');
  }

  function renderShare(w) {
    var url = location.origin + '/?city=' + encodeURIComponent(w.city);
    var txt = '◈ ATLAS WEATHER — ' + w.city.toUpperCase() + ' · ' + deg(w.temp) + ' ' + (WMO[w.code] || '') + ' · My weather as a No Man\'s Sky planet: ' + translate(w, S.aqi).title;
    $('shareX').href = 'https://x.com/intent/tweet?text=' + encodeURIComponent(txt) + '&url=' + encodeURIComponent(url);
    $('shareReddit').href = 'https://reddit.com/submit?url=' + encodeURIComponent(url) + '&title=' + encodeURIComponent(txt);
    $('copyLink').onclick = function () { copy(url, '✓ Forecast link copied'); };
  }
  function copy(text, msg) {
    var done = function () { toast(msg); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(fallback); else fallback();
    function fallback() { var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(ta); done(); }
  }

  // ---------- location name glyph flip ----------
  var lastFlip = null;
  function renderLocGlyph() {
    if (!S.wx) return;
    var english = Math.floor(Date.now() / 1000) % 9 >= 6;
    if (english === lastFlip) return; lastFlip = english;
    var name = (S.wx.city + ' EARTH').toUpperCase().replace(/[^A-Z0-9 ]/g, '');
    $('locGlyph').innerHTML = english
      ? '<span class="e glitch">' + esc(S.wx.city.toUpperCase()) + ' · EARTH <small>· DECODED</small></span>'
      : '<span class="g glitch" title="' + esc(S.wx.city) + ' · Earth, in the NMS alphabet" aria-label="' + esc(S.wx.city) + ', Earth">' + esc(name) + '</span>';
  }

  // ---------- clock / ages / countdowns (every second) ----------
  function updateClockAndAge() {
    var n = new Date();
    $('clock').textContent = 'LOCAL ' + pad(n.getHours()) + ':' + pad(n.getMinutes()) + ':' + pad(n.getSeconds()) + ' · UTC ' + pad(n.getUTCHours()) + ':' + pad(n.getUTCMinutes());
    if (S.updated) { var m = Math.floor((Date.now() - S.updated) / 60000); $('updated').textContent = m < 1 ? 'UPDATED JUST NOW' : 'UPDATED ' + m + ' MIN AGO'; }
    var mid = Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate() + 1), l = Math.max(0, Math.floor((mid - n.getTime()) / 1000));
    $('surveyCd').textContent = pad(Math.floor(l / 3600)) + ':' + pad(Math.floor(l % 3600 / 60)) + ':' + pad(l % 60);
    if (stormEnd) { var s = Math.max(0, Math.floor((stormEnd - Date.now()) / 1000)); $('stormCount').textContent = pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s % 3600 / 60)) + ':' + pad(s % 60); }
    renderLocGlyph();
    if (S.wx && n.getSeconds() === 0) renderRing(S.wx);
    if (S.worlds.length && l === 0) setTimeout(buildSurvey, 1500);
  }

  // ---------- daily survey (real Haven worlds) ----------
  var ORDER = ['Lush', 'Frozen', 'Toxic', 'Scorched', 'Radioactive', 'Volcanic', 'Dead', 'Marsh'];
  var IMGKEY = { Lush: 'lush', Frozen: 'frozen', Toxic: 'toxic', Scorched: 'scorched', Radioactive: 'radioactive', Volcanic: 'volcanic', Dead: 'dead', Marsh: 'marsh' };
  var HAVEN = null;
  function buildSurvey() {
    if (!HAVEN) return;
    var day = Math.floor(Date.now() / 86400000);
    S.worlds = ORDER.map(function (b, k) {
      var pool = HAVEN.P[b] || []; if (!pool.length) return null;
      var p = pool[(day + k * 5) % pool.length], s = HAVEN.sys[p[0]];
      return { biome: b, name: p[1], raw: p[2], weather: p[3], flora: p[4], fauna: p[5], res: p[6] ? p[6].split('|') : [], by: p[7], extreme: !!p[8],
        sys: s[0], galaxy: s[1], glyph: s[2], race: s[3], star: s[4], econ: s[5], conflict: s[6], gIndex: (HAVEN.meta.galaxies || {})[s[1]] || 0 };
    }).filter(Boolean);
    renderCards(); selectWorld(Math.min(S.world, S.worlds.length - 1));
  }
  function biomeLine(w) { return w.raw && w.raw !== w.biome && w.raw !== 'Swamp' ? w.biome + ' · ' + w.raw : w.biome; }
  function renderCards() {
    $('cards').innerHTML = S.worlds.map(function (w, i) {
      var ics = w.res.filter(function (r) { return RES[r]; }).slice(0, 3).map(function (r) { return '<img src="' + RES[r] + '" alt="">'; }).join('');
      return '<button type="button" class="wcard" role="option" aria-selected="' + (i === S.world) + '" data-i="' + i + '">' +
        '<div class="wimg" style="background-image:url(\'' + CARD(IMGKEY[w.biome]) + '\')"><span class="n">WORLD ' + (i + 1) + '/' + S.worlds.length + '</span>' + (w.extreme ? '<span class="x">⚠ EXTREME</span>' : '') +
        '<span class="sys"><span class="sdot" style="background:' + (STAR[w.star] || '#f0c040') + ';box-shadow:0 0 8px ' + (STAR[w.star] || '#f0c040') + '"></span>' + esc(w.sys) + '</span></div>' +
        '<div class="wbody"><span class="nm">' + esc(w.name) + '</span><span class="bm">' + esc(biomeLine(w)) + '</span><span class="wt">' + esc(w.weather) + '</span><span class="ft"><span class="by">by ' + esc(w.by) + '</span><span class="ics">' + ics + '</span></span></div></button>';
    }).join('');
  }
  function selectWorld(i) {
    S.world = i; var w = S.worlds[i]; if (!w) return;
    document.querySelectorAll('.wcard').forEach(function (c, k) { c.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
    var race = RACE[w.race], hd = HD(IMGKEY[w.biome]);
    var glyphs = w.glyph.split('').map(function (ch) { return '<span><img src="/glyphs/g-' + ch + '.webp" alt="' + ch + '" title="' + ch + '"></span>'; }).join('');
    var res = w.res.map(function (r) { return '<span>' + (RES[r] ? '<img src="' + RES[r] + '" alt="">' : '<i aria-hidden="true">◈</i>') + esc(r) + '</span>'; }).join('');
    var mapUrl = 'https://map.nomansskyhub.app/?arrival=1&addr=' + w.glyph + '&galaxy=' + w.gIndex;
    $('scan').innerHTML =
      '<div class="scan-img" id="scanImg"><div class="blur" style="background-image:url(\'' + hd + '\')"></div><div class="sharp" role="img" aria-label="' + esc(w.biome) + ' biome" style="background-image:url(\'' + hd + '\')"></div><div class="shade"></div><div class="bar" aria-hidden="true"></div>' +
      '<div class="st"><span class="s1">◈ SCANNING SURFACE…</span><span class="s2">✓ SCAN COMPLETE</span></div>' +
      '<div class="addr"><div style="display:flex;flex-wrap:wrap;gap:8px"><span style="padding:3px 10px;border-radius:6px;background:rgba(0,0,0,.7);border:1px solid rgba(240,165,0,.5);font-family:var(--disp);font-size:11px;font-weight:700;letter-spacing:2px;color:var(--gold);text-transform:uppercase">' + esc(biomeLine(w)) + '</span>' + (w.extreme ? '<span class="mono" style="padding:3px 10px;border-radius:6px;background:rgba(0,0,0,.7);border:1px solid rgba(255,140,0,.6);font-size:12px;letter-spacing:1.5px;color:var(--orange)">⚠ EXTREME WEATHER</span>' : '') + '</div>' +
      '<div class="addrbox"><div class="mono" style="display:flex;justify-content:space-between;gap:16px;font-size:10.5px;letter-spacing:2px;color:var(--text-dim)"><span>PORTAL ADDRESS · ' + esc(w.galaxy.toUpperCase()) + '</span><span>GLYPHS + HEX</span></div><div class="glyphs">' + glyphs + '</div><div class="hex">' + w.glyph + ' <button type="button" class="copy" id="copyAddr">COPY</button></div></div></div></div>' +
      '<div class="scan-info"><div><div class="mono" style="font-size:12px;letter-spacing:3px;color:var(--text-dim)">FULL SCAN · WORLD ' + (i + 1) + '/' + S.worlds.length + '</div><div style="font-family:var(--disp);font-weight:800;font-size:26px;letter-spacing:1px;color:var(--white);line-height:1.2">' + esc(w.name) + '</div><div style="font-size:15px;color:rgba(207,224,240,.7)">in the <span style="color:var(--white)">' + esc(w.sys) + '</span> system · <span style="color:' + (STAR[w.star] || '#f0c040') + '">' + esc(w.star) + ' star</span> · ' + esc(w.galaxy) + '</div></div>' +
      '<div class="cells"><div class="cell"><div class="k">WEATHER</div><div class="v">' + esc(w.weather) + '</div></div><div class="cell"><div class="k">FLORA · FAUNA</div><div class="v">' + esc(w.flora) + ' · ' + esc(w.fauna) + '</div></div>' +
      '<div class="cell withimg">' + (race ? '<img src="' + race[0] + '" alt="" style="filter:drop-shadow(0 0 8px ' + race[1] + ')">' : '') + '<div><div class="k">DOMINANT RACE</div><div class="v">' + esc(w.race) + '</div></div></div>' +
      '<div class="cell"><div class="k">ECONOMY · CONFLICT</div><div class="v">' + esc(w.econ) + ' · <span style="color:' + (CONF[w.conflict] || 'var(--text)') + '">' + esc(w.conflict) + '</span></div></div></div>' +
      (res ? '<div><div style="font-family:var(--disp);font-size:10px;letter-spacing:2px;color:var(--text-dim);margin-bottom:6px">RESOURCES</div><div class="res">' + res + '</div></div>' : '') +
      '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:auto"><a class="btn btn-primary" href="' + mapUrl + '" target="_blank" rel="noopener">◈ Show on Galactic Map →</a><button type="button" class="btn btn-ghost" id="nextWorld">Next world ▸</button></div>' +
      '<div class="mono" style="font-size:12px;color:var(--text-dim);line-height:1.5">Charted by <span style="color:var(--white)">' + esc(w.by) + '</span> · data via <a href="https://havenmap.online" target="_blank" rel="noopener" style="text-decoration:none">Voyager\'s Haven</a></div></div>';
    var si = $('scanImg'); void si.offsetWidth; si.classList.add('run');
    $('copyAddr').onclick = function () { copy(w.glyph, '✓ Portal address copied'); };
    $('nextWorld').onclick = function () { selectWorld((S.world + 1) % S.worlds.length); };
  }

  // ---------- alerts ----------
  var ALERT_ROWS = [
    ['rain', '🌧', 'Rain starting soon', 'A heads-up before rain or snow starts where you are'],
    ['severe', '⚠', 'Extreme weather', 'Thunderstorms, heavy rain or snow, gales, extreme heat or frost'],
    ['temp', '🌡', 'Big temperature change', 'When it is about to get 5° warmer or colder within 3 hours'],
    ['daily', '☀', 'Morning briefing', 'Today’s forecast and your biome match after 07:00'],
    ['survey', '◈', 'New planetary survey', 'When today’s 8 worlds refresh at 00:00 UTC']
  ];
  function renderAlertPanel() {
    $('alertRows').innerHTML = ALERT_ROWS.map(function (r) {
      return '<label class="al-row"><input type="checkbox" data-k="' + r[0] + '"' + (S.prefs[r[0]] ? ' checked' : '') + '><span class="al-ico" aria-hidden="true">' + r[1] + '</span><span style="min-width:0"><span class="al-t">' + r[2] + '</span><span class="al-d">' + r[3] + '</span></span></label>';
    }).join('');
    $('alertRows').querySelectorAll('input').forEach(function (inp) { inp.onchange = function () { S.prefs[inp.getAttribute('data-k')] = inp.checked; lsSet('atlas-alert-prefs-v2', S.prefs); syncPush(); }; });
    renderPerm();
  }
  function perm() { return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission; }
  function renderPerm() {
    var p = perm(), on = S.alertsOn && p === 'granted', pl = $('permLine');
    pl.textContent = on ? (S.pushOn ? '✓ ALERTS ACTIVE · EVEN WHEN ATLAS IS CLOSED' : '✓ ALERTS ACTIVE · WHILE ATLAS IS OPEN') : p === 'denied' ? '✕ BLOCKED BY YOUR BROWSER · allow notifications for this site in its settings' : p === 'unsupported' ? '✕ THIS BROWSER CANNOT SHOW NOTIFICATIONS' : '○ ALERTS ARE OFF · your browser will ask permission';
    pl.style.color = on ? 'var(--green)' : p === 'denied' || p === 'unsupported' ? 'var(--red)' : 'rgba(207,224,240,.7)';
    pl.style.borderColor = on ? 'rgba(0,255,136,.4)' : 'rgba(255,255,255,.1)';
    $('enableAlerts').textContent = on ? 'Turn alerts off' : '◈ Turn on alerts';
    $('alertsBtn').classList.toggle('on', on); $('alertsLabel').textContent = on ? 'ALERTS ON' : 'ALERTS';
  }
  function notify(title, body, tag) {
    if (perm() !== 'granted') return;
    var opt = { body: body, icon: '/icon-192.png', badge: '/icon-192.png', tag: tag || 'atlas' };
    if ('serviceWorker' in navigator) navigator.serviceWorker.ready.then(function (r) { r.showNotification(title, opt); }).catch(function () { try { new Notification(title, opt); } catch (e) {} });
    else try { new Notification(title, opt); } catch (e) {}
  }
  function once(key, fn) { var sent = lsGet('atlas-alert-sent', {}); if (sent[key]) return; fn(); sent[key] = Date.now(); var cut = Date.now() - 2 * 86400e3; Object.keys(sent).forEach(function (k) { if (sent[k] < cut) delete sent[k]; }); lsSet('atlas-alert-sent', sent); }
  function checkAlerts() {
    var w = S.wx; if (!w || !S.alertsOn || perm() !== 'granted') return;
    if (S.pushOn) return; // the server sends these now (even when ATLAS is closed)
    var city = w.city, today = w.localTime.slice(0, 10), P = S.prefs, H = w.hourly;
    if (P.severe) {
      for (var i = 0; i < Math.min(4, H.length); i++) {
        var hh = H[i];
        if (SEVERE.indexOf(hh.code) !== -1) { once(today + '|sev|' + city + '|' + hh.code, function () { notify('⚠ Extreme weather approaching', (WMO[hh.code] || 'Severe weather') + (i === 0 ? ' over ' + city + ' now.' : ' expected over ' + city + ' from ' + pad(hh.hr) + ':00.'), 'atlas-severe'); }); break; }
      }
      if (w.gust >= 70) once(today + '|gale|' + city, function () { notify('⚠ Gale warning', 'Gusts up to ' + spd(w.gust) + ' ' + spdU() + ' over ' + city + '.', 'atlas-severe'); });
      if (w.temp >= 35) once(today + '|heat|' + city, function () { notify('⚠ Extreme heat', deg(w.temp) + ' over ' + city + '. Stay hydrated, Traveller.', 'atlas-severe'); });
      if (w.temp <= -5) once(today + '|frost|' + city, function () { notify('⚠ Hard frost', deg(w.temp) + ' over ' + city + '. Watch for ice.', 'atlas-severe'); });
    }
    if (P.rain && !isRain(w.code) && !isSnow(w.code) && H[1] && (H[1].pop >= 55 || isRain(H[1].code) || isSnow(H[1].code))) {
      once(today + '|rain|' + city + '|' + H[1].hr, function () { var sn = isSnow(H[1].code); notify('◈ ' + (sn ? 'Snow' : 'Rain') + ' starting within the hour', (WMO[H[1].code] || (sn ? 'Snow' : 'Rain')) + ' likely over ' + city + ' (' + H[1].pop + '% chance). Take a coat, Traveller.', 'atlas-rain'); });
    }
    if (P.temp && H[3]) {
      var dlt = H[3].temp - w.temp;
      if (Math.abs(dlt) >= 5) once(today + '|temp|' + city + '|' + H[3].hr, function () { notify('🌡 ' + (dlt < 0 ? 'Temperature dropping' : 'Temperature rising'), 'From ' + deg(w.temp) + ' to ' + deg(H[3].temp) + ' by ' + pad(H[3].hr) + ':00 over ' + city + '.', 'atlas-temp'); });
    }
    if (P.daily && localHour() >= 7) {
      once(today + '|daily', function () { var d = w.days[0]; notify('☀ Morning briefing · ' + city, (WMO[d.code] || '') + '. High ' + deg(d.hi) + ', low ' + deg(d.lo) + '. Biome match: ' + translate(w, S.aqi).title + '.', 'atlas-daily'); });
    }
    if (P.survey) {
      var ud = new Date().toISOString().slice(0, 10);
      once(ud + '|survey', function () { if (S.worlds.length) notify('◈ New planetary survey', 'Today\'s 8 worlds are in, starting with ' + S.worlds[0].name + '.', 'atlas-survey'); });
    }
  }

  // ---------- closed-app push (alerts even when ATLAS is closed) ----------
  // Sign-up goes to our Netlify function; a scheduled function checks the forecast every 30 min.
  var VAPID_PUBLIC_KEY = 'BCdrW7jjy_MQDwt3V0rajNedogC0YsaYeny-QAdBMkH6g35-GhemfJSRJrF5yAI1R2MoUk8OefpT4t9dhoUzfGA';
  var PUSH_API = '/api/push-subscribe';
  S.pushOn = lsGet('atlas-push-on', false);
  var pushReady = VAPID_PUBLIC_KEY && 'serviceWorker' in navigator && 'PushManager' in window;
  function vapidBytes() {
    var k = VAPID_PUBLIC_KEY, p = '='.repeat((4 - k.length % 4) % 4), raw = atob((k + p).replace(/-/g, '+').replace(/_/g, '/')), arr = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return arr;
  }
  function pushSig(sub) { return JSON.stringify([sub.endpoint, Math.round(S.loc.lat * 10), Math.round(S.loc.lon * 10), S.loc.city || '', S.prefs, S.unit]); }
  function setPushOn(on) { S.pushOn = on; lsSet('atlas-push-on', on); if (!on) lsSet('atlas-push-sig', ''); renderPerm(); }
  function sendSub(sub) {
    if (!S.loc) return Promise.resolve(false);
    var body = { sub: sub.toJSON(), lat: S.loc.lat, lon: S.loc.lon, place: S.loc.city || '', prefs: S.prefs, unit: S.unit };
    return fetch(PUSH_API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { if (!r.ok) throw new Error('push-subscribe ' + r.status); lsSet('atlas-push-sig', pushSig(sub)); setPushOn(true); return true; });
  }
  function subscribePush() {
    if (!pushReady || !S.loc) return Promise.resolve(false);
    return navigator.serviceWorker.ready.then(function (r) { return r.pushManager.getSubscription().then(function (s) { return s || r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: vapidBytes() }); }); })
      .then(sendSub).catch(function (e) { console.warn('push', e); setPushOn(false); return false; });
  }
  // keep the server copy in step with your place, alert choices and units (only sends when something changed)
  var pushTimer = null;
  function syncPush() {
    if (!pushReady || !S.alertsOn || perm() !== 'granted' || !S.loc) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(function () {
      navigator.serviceWorker.ready.then(function (r) { return r.pushManager.getSubscription(); }).then(function (sub) {
        if (!sub) return subscribePush();
        if (S.pushOn && pushSig(sub) === lsGet('atlas-push-sig', '')) return;
        return sendSub(sub);
      }).catch(function (e) { console.warn('push sync', e); });
    }, 1500);
  }
  function unsubscribePush() {
    if (!pushReady) { setPushOn(false); return Promise.resolve(); }
    return navigator.serviceWorker.ready.then(function (r) { return r.pushManager.getSubscription(); }).then(function (sub) {
      if (!sub) return;
      return fetch(PUSH_API, { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }) })
        .catch(function () {}).then(function () { return sub.unsubscribe(); });
    }).catch(function () {}).then(function () { setPushOn(false); });
  }

  // ---------- wiring ----------
  function setUnit(u) { S.unit = u; lsSet('atlas-unit', u); syncPush(); $('unitC').setAttribute('aria-pressed', u === 'C'); $('unitF').setAttribute('aria-pressed', u === 'F'); render(); }
  function setFx(on) {
    S.fx = on; lsSet('atlas-fx', on); document.body.classList.toggle('no-fx', !on);
    $('fxBtn').classList.toggle('off', !on); $('fxBtn').setAttribute('aria-pressed', on); $('fxLabel').textContent = on ? 'EFFECTS ON' : 'EFFECTS OFF';
    if (S.wx) { var b = translate(S.wx, S.aqi); $('hero').setAttribute('data-fx', on ? b.fx : ''); }
  }
  $('searchForm').addEventListener('submit', function (e) {
    e.preventDefault(); var q = $('loc').value.trim();
    if (!q) { locate(); return; } // empty box: SCAN finds where you are
    $('loc').blur(); search(q);
  });
  $('locateBtn').onclick = locate;
  $('unitC').onclick = function () { setUnit('C'); };
  $('unitF').onclick = function () { setUnit('F'); };
  $('fxBtn').onclick = function () { setFx(!S.fx); };
  $('alertsBtn').onclick = function () { var p = $('alertPanel'), o = !p.classList.contains('open'); p.classList.toggle('open', o); $('alertsBtn').setAttribute('aria-expanded', o); if (o) renderAlertPanel(); };
  $('closeAlerts').onclick = function () { $('alertPanel').classList.remove('open'); $('alertsBtn').setAttribute('aria-expanded', 'false'); };
  $('enableAlerts').onclick = function () {
    if (S.alertsOn && perm() === 'granted') { S.alertsOn = false; lsSet('atlas-alerts-on', false); unsubscribePush(); renderPerm(); toast('Alerts turned off · your sign-up was deleted'); return; }
    if (perm() === 'unsupported') { toast('This browser cannot show notifications'); return; }
    Notification.requestPermission().then(function (p) {
      S.alertsOn = p === 'granted'; lsSet('atlas-alerts-on', S.alertsOn); renderPerm();
      if (S.alertsOn) { notify('◈ ATLAS alerts are on', 'You\'ll hear from us when the weather is about to change.', 'atlas-on'); subscribePush().then(function () { checkAlerts(); }); }
    });
  };
  $('testAlert').onclick = function () { if (perm() !== 'granted') { toast('Turn on alerts first'); return; } notify('◈ ATLAS test alert', 'Notifications are working. See you out there, Traveller.', 'atlas-test'); };
  document.querySelectorAll('.tabs button').forEach(function (bt) { bt.onclick = function () { S.metric = bt.getAttribute('data-m'); renderHourly(); }; });
  $('cards').addEventListener('click', function (e) { var c = e.target.closest('.wcard'); if (c) selectWorld(+c.getAttribute('data-i')); });

  // install prompt
  var deferred = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; $('installBtn').hidden = false; $('installBtn2').hidden = false; });
  function doInstall() { if (!deferred) return; deferred.prompt(); deferred.userChoice.finally(function () { deferred = null; $('installBtn').hidden = true; $('installBtn2').hidden = true; }); }
  $('installBtn').onclick = doInstall; $('installBtn2').onclick = doInstall;
  var standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if (!standalone && /iphone|ipad|ipod/i.test(navigator.userAgent)) { $('installBtn2').hidden = false; $('installBtn2').onclick = function () { toast('Tap Share ▸ Add to Home Screen'); }; }

  // refresh
  setInterval(function () { if (S.loc) load(S.loc, true); }, 15 * 60 * 1000);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible' && S.loc && S.updated && Date.now() - S.updated > 10 * 60 * 1000) load(S.loc, true); });
  setInterval(updateClockAndAge, 1000);

  // boot
  setFx(S.fx); setUnit(S.unit); renderPerm();
  fetch('/data/haven-worlds.json').then(function (r) { return r.json(); }).then(function (d) { HAVEN = d; buildSurvey(); })
    .catch(function () { $('cards').innerHTML = '<p class="sub">Survey data could not be loaded. Try refreshing.</p>'; });
  var qCity = new URLSearchParams(location.search).get('city');
  if (qCity) search(qCity);
  else if (S.loc) load(S.loc);
  else ipLocate().catch(function () { search('London'); });

  if ('serviceWorker' in navigator) window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function (e) { console.warn('SW', e); }); });
})();
