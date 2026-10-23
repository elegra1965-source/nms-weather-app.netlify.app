// Shared helpers for the weather push alerts.
// Pure logic only (no network, no storage) so it can be tested on its own.

import { texts, pickLine, group, cleanLang } from './alert-text.mjs';
export { cleanLang };

export const STORE = 'weather-push';

// Push services a real browser subscription can point at. Anything else is refused,
// so nobody can make our server send requests to an address of their choosing.
const PUSH_HOSTS = [
  /^fcm\.googleapis\.com$/,
  /^android\.googleapis\.com$/,
  /^updates\.push\.services\.mozilla\.com$/,
  /^push\.services\.mozilla\.com$/,
  /(^|\.)push\.apple\.com$/,
  /(^|\.)notify\.windows\.com$/,
  /(^|\.)push\.samsunginternet\.com$/
];

export function validEndpoint(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && PUSH_HOSTS.some(rx => rx.test(u.hostname));
  } catch (e) { return false; }
}

export async function keyFor(endpoint) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// Round to 0.1 degree (about 11 km) so we never keep anyone's exact position.
export const roundCoord = n => Math.round(Number(n) * 10) / 10;

export const DEFAULT_PREFS = { rain: true, severe: true, temp: true, daily: false, tomorrow: false, survey: false, expNew: false, expEnd: false };

export function cleanPrefs(p) {
  const out = {};
  for (const k of Object.keys(DEFAULT_PREFS)) out[k] = p && typeof p[k] === 'boolean' ? p[k] : DEFAULT_PREFS[k];
  return out;
}

export function cleanPlace(s) {
  return String(s || '').replace(/[<>]/g, '').slice(0, 60).trim() || 'your area';
}

// ---------- weather wording (matches the app) ----------
export const WMO = { 0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog', 48: 'Freezing fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle', 56: 'Freezing drizzle', 57: 'Freezing drizzle', 61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 66: 'Freezing rain', 67: 'Freezing rain', 71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains', 80: 'Rain showers', 81: 'Rain showers', 82: 'Violent showers', 85: 'Snow showers', 86: 'Heavy snow showers', 95: 'Thunderstorm', 96: 'Thunderstorm, hail', 99: 'Thunderstorm, hail' };
const isSnow = c => (c >= 71 && c <= 77) || c === 85 || c === 86;
const isRain = c => (c >= 51 && c <= 67) || (c >= 80 && c <= 82);
const SEVERE = [65, 67, 75, 82, 86, 95, 96, 99];
const pad = n => String(n).padStart(2, '0');

function units(unit) {
  const F = unit === 'F';
  return {
    deg: t => Math.round(F ? t * 9 / 5 + 32 : t) + '°',
    spd: k => (F ? Math.round(k * 0.621) + ' mph' : Math.round(k) + ' km/h')
  };
}

// Turn one Open-Meteo response into the few numbers the alerts need.
export function summarise(wx) {
  const H = wx.hourly, C = wx.current, D = wx.daily;
  const nowHour = C.time.slice(0, 13); // "YYYY-MM-DDTHH" in local time
  let i0 = H.time.findIndex(t => t.slice(0, 13) === nowHour);
  if (i0 < 0) i0 = 0;
  const hours = [];
  for (let j = i0; j < Math.min(H.time.length, i0 + 6); j++) {
    hours.push({ hr: parseInt(H.time[j].slice(11, 13), 10), temp: H.temperature_2m[j], code: H.weather_code[j], pop: H.precipitation_probability[j] || 0 });
  }
  return {
    localDate: C.time.slice(0, 10),
    localHour: parseInt(C.time.slice(11, 13), 10),
    temp: C.temperature_2m, code: C.weather_code, gust: C.wind_gusts_10m || 0,
    hours,
    today: D ? { hi: D.temperature_2m_max[0], lo: D.temperature_2m_min[0], code: D.weather_code[0] } : null,
    tomorrow: D && D.time && D.time.length > 1 ? { hi: D.temperature_2m_max[1], lo: D.temperature_2m_min[1], code: D.weather_code[1],
      pop: (D.precipitation_probability_max || [])[1] || 0, wind: (D.wind_speed_10m_max || [])[1] || 0 } : null
  };
}

// A small helper that builds alerts in the subscriber's language and adds one NMS-style
// line from the right pool, never repeating the line used last time for that pool.
// Each alert carries { pool, idx } so the caller can remember which line went out.
function adder(sub, out, rnd) {
  const X = texts(sub.lang), sent = sub.sent || {}, last = Object.assign({}, sub.lines || {});
  const add = (key, title, body, tag, pool, extra) => {
    if (sent[key]) return;
    const ln = pool ? pickLine(X.lang, pool, last[pool] ?? -1, rnd) : { text: '', idx: -1 };
    if (pool) last[pool] = ln.idx; // two alerts in one run don't repeat either
    out.push(Object.assign({ key, title, body: ln.text ? body + ' ' + ln.text : body, tag, pool, idx: ln.idx }, extra || {}));
  };
  return { X, add, W: c => X.wmo(c) || WMO[c] || '' };
}

// Decide which alerts one subscriber should get right now.
// Returns [{ key, title, body, tag, pool, idx }]. `sent` holds keys already delivered.
export function decide(s, sub, utcDate, utcHour, rnd = Math.random) {
  const out = [];
  const P = sub.prefs || DEFAULT_PREFS, u = units(sub.unit);
  const { X, add, W } = adder(sub, out, rnd), place = X.place(sub.place);
  const quiet = s.localHour >= 23 || s.localHour < 7; // no rain/temperature nudges overnight
  const H = s.hours, d = s.localDate;

  if (P.severe) {
    for (let i = 0; i < Math.min(4, H.length); i++) {
      if (SEVERE.includes(H[i].code)) {
        const w = W(H[i].code);
        add(d + '|sev|' + H[i].code, X.t.severe, i === 0 ? X.b.sevNow(w, place) : X.b.sevAt(w, place, pad(H[i].hr)), 'atlas-severe', group(H[i].code));
        break;
      }
    }
    if (s.gust >= 70) add(d + '|gale', X.t.gale, X.b.gale(u.spd(s.gust), place), 'atlas-severe', 'gale');
    if (s.temp >= 35) add(d + '|heat', X.t.heat, X.b.at(u.deg(s.temp), place), 'atlas-severe', 'heat');
    if (s.temp <= -5) add(d + '|frost', X.t.frost, X.b.at(u.deg(s.temp), place), 'atlas-severe', 'frost');
  }
  if (P.rain && !quiet && !isRain(s.code) && !isSnow(s.code) && H[1] && (H[1].pop >= 55 || ((isRain(H[1].code) || isSnow(H[1].code)) && H[1].pop >= 35))) { // never on a low chance: the forecast's weather code and its % can disagree
    const sn = isSnow(H[1].code), wet = isRain(H[1].code) || sn;
    add(d + '|rain|' + H[1].hr, sn ? X.t.snow : X.t.rain,
      X.b.rain(W(wet ? H[1].code : 63), place, H[1].pop), 'atlas-rain', sn ? 'snow' : 'rain');
  }
  if (P.temp && !quiet && H[3]) {
    const dlt = H[3].temp - s.temp;
    if (Math.abs(dlt) >= 5) add(d + '|temp|' + H[3].hr, dlt < 0 ? X.t.drop : X.t.rise,
      X.b.temp(u.deg(s.temp), u.deg(H[3].temp), pad(H[3].hr), place), 'atlas-temp', dlt < 0 ? 'cold' : 'warm');
  }
  if (P.daily && s.today && s.localHour >= 7 && s.localHour < 10) {
    add(d + '|daily', X.t.morning(X.placeT(sub.place)), X.b.day(W(s.today.code) || '—', u.deg(s.today.hi), u.deg(s.today.lo)), 'atlas-daily', group(s.today.code));
  }
  if (P.tomorrow && s.tomorrow && s.localHour >= 18 && s.localHour < 21) {
    add(d + '|tmrw', X.t.tomorrow(X.placeT(sub.place)), tomorrowText(s.tomorrow, u, sub.lang), 'atlas-tomorrow', group(s.tomorrow.code));
  }
  if (P.survey && utcHour === 0) {
    add(utcDate + '|survey', X.t.survey, X.b.survey, 'atlas-survey', 'survey');
  }
  return out;
}

// Evening outlook wording: "Partly cloudy. High 14°, low 7°. 40% chance of rain. Windy, up to 45 km/h."
export function tomorrowText(t, u, lang) {
  const X = texts(lang);
  let s = X.b.day(X.wmo(t.code) || WMO[t.code] || '—', u.deg(t.hi), u.deg(t.lo));
  if (t.pop >= 30) s += ' ' + X.b.pop(t.pop, isSnow(t.code));
  if (t.wind >= 30) s += ' ' + X.b.wind(u.spd(t.wind));
  return s;
}

// Forget delivered-alert keys once they can't matter: two days for weather and expeditions,
// 8 days for Map trending (one week's board), a year for Theme Pack news.
export function pruneSent(sent, now = Date.now()) {
  const out = {};
  for (const [k, t] of Object.entries(sent || {})) {
    const keep = k.startsWith('theme|') ? 366 : k.startsWith('trend|') ? 8 : 2;
    if (t >= now - keep * 86400e3) out[k] = t;
  }
  return out;
}

// Which app a subscription belongs to. Weather is the original; the others only get their own alerts.
export const APPS = ['weather', 'hub', 'atlas', 'map', 'theme'];
const APP_PREFS = { hub: { expNew: true, expEnd: true }, atlas: { expNew: true, expEnd: true }, map: { trend: true }, theme: { theme: true } };
export function cleanApp(a) { return APPS.includes(a) ? a : 'weather'; }
export function cleanPrefsFor(app, p) {
  if (app === 'weather') return cleanPrefs(p);
  const def = APP_PREFS[app], out = {};
  for (const k of Object.keys(def)) out[k] = p && typeof p[k] === 'boolean' ? p[k] : def[k];
  return out;
}
export const APP_URL = { weather: '/', hub: 'https://nomansskyhub.app/', atlas: 'https://atlas.nomansskyhub.app/', map: 'https://map.nomansskyhub.app/', theme: 'https://theme.nomansskyhub.app/' };

// ---------- Expedition alerts (same wiki table ATLAS reads) ----------
// "List of Expeditions": number | decal | title | start | end | description. Dates are days;
// expeditions go live around 14:00 UTC.
export function parseWikiExpeditions(wt) {
  const rows = [];
  for (const chunk of String(wt || '').split(/\n\|-/)) {
    const cells = chunk.split('\n').filter(l => /^\|(?!\})/.test(l)).map(l => l.replace(/^\|\s*/, '').trim());
    if (cells.length < 4 || !/^\d+$/.test(cells[0])) continue;
    const ti = cells.findIndex(c => /\[\[\s*Expedition\s+\d+\s*:/i.test(c));
    if (ti < 0) continue;
    const tm = cells[ti].match(/\[\[\s*Expedition\s+\d+\s*:\s*([^|\]]+)/i);
    const day = c => { const m = String(c || '').match(/^(\d{4}-\d{2}-\d{2})/); return m ? m[1] : null; };
    const start = day(cells[ti + 1]);
    if (!tm || !start) continue;
    rows.push({ num: parseInt(cells[0], 10), title: tm[1].trim(), start: Date.parse(start + 'T14:00:00Z'), end: day(cells[ti + 2]) ? Date.parse(day(cells[ti + 2]) + 'T14:00:00Z') : null });
  }
  return rows.sort((a, b) => a.num - b.num);
}

const ATLAS_URL = 'https://atlas.nomansskyhub.app/';
// Alerts for one subscriber: a new expedition in its first 24 h, and the last 24 h of the current one.
// `url` is where a tap goes: ATLAS for Weather subscribers, the subscriber's own app otherwise.
export function expeditionAlerts(rows, sub, now = Date.now(), rnd = Math.random, url = ATLAS_URL) {
  const out = [], P = (sub && sub.prefs) || {};
  if (!rows || !rows.length) return out;
  const live = rows.filter(r => r.start <= now && (!r.end || r.end > now));
  const cur = live[live.length - 1];
  if (!cur) return out;
  const { X, add } = adder(sub || {}, out, rnd);
  const name = 'Expedition ' + cur.num + ': ' + cur.title;
  if (P.expNew && now - cur.start < 24 * 3600e3) add('exp|new|' + cur.num, X.t.expNew, X.b.expNew(name), 'atlas-exp', 'expNew', { url });
  if (P.expEnd && cur.end && cur.end - now <= 24 * 3600e3) {
    const h = Math.max(1, Math.round((cur.end - now) / 3600e3));
    add('exp|end|' + cur.num, X.t.expEnd(X.hours(h)), X.b.expEnd(name), 'atlas-exp', 'expEnd', { url });
  }
  return out;
}

// Galactic Map: "your system is #N this week". `trend` = the Map's /trending reply.
// Fires once per week per system when it first reaches the top 10, and again for each
// better top-3 place. Matches on the Traveller ID name the subscriber gave.
export function trendAlerts(trend, sub, rnd = Math.random) {
  const out = [], name = String((sub && sub.name) || '').trim().toLowerCase();
  if (!name || !trend || trend.mode !== 'week' || !Array.isArray(trend.top)) return out;
  const { X, add } = adder(sub, out, rnd);
  for (const x of trend.top.slice(0, 10)) {
    if (String(x.editor || '').trim().toLowerCase() !== name) continue;
    const step = x.rank <= 3 ? x.rank : 'top10', medal = ['🥇 ', '🥈 ', '🥉 '][x.rank - 1] || '🔥 ';
    const sys = String(x.name || '').replace(/<[^>]*>/g, '').trim() || x.address;
    // a better place later in the week is a new key; a worse one isn't (no "you dropped" alerts)
    const before = Object.keys(sub.sent || {}).filter(k => k.startsWith('trend|' + trend.week + '|' + x.key + '|')).map(k => k.split('|').pop());
    if (before.length && (x.rank > 3 || before.some(b => b !== 'top10' && +b <= x.rank))) continue;
    add('trend|' + trend.week + '|' + x.key + '|' + step, medal + X.t.trend(x.rank), X.b.trend(sys, x.rank), 'nms-trend', 'trend',
      { url: 'https://map.nomansskyhub.app/?arrival=1&galaxy=' + x.galaxy + '&addr=' + encodeURIComponent(x.address) });
  }
  return out;
}

// Theme Pack: anything new listed in theme.nomansskyhub.app/updates.json since this person signed up.
// updates.json = [{ id, date: "YYYY-MM-DD", en: "...", es: "...", ... }] (only en is needed).
export function themeAlerts(updates, sub, rnd = Math.random) {
  const out = [];
  if (!Array.isArray(updates) || !sub) return out;
  const { X, add } = adder(sub, out, rnd), since = sub.created || 0;
  const fresh = updates.filter(x => x && x.id && Date.parse(x.date + 'T23:59:59Z') >= since).slice(-1); // newest only, dated on/after sign-up day
  for (const x of fresh) add('theme|' + x.id, X.t.theme, String(x[X.lang] || (X.lang === 'en' && x.en) || X.b.theme).slice(0, 160), 'nms-theme', 'theme', { url: 'https://theme.nomansskyhub.app/' });
  return out;
}
