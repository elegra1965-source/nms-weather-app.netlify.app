// Shared helpers for the weather push alerts.
// Pure logic only (no network, no storage) so it can be tested on its own.

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

export const DEFAULT_PREFS = { rain: true, severe: true, temp: true, daily: false, survey: false };

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
    today: D ? { hi: D.temperature_2m_max[0], lo: D.temperature_2m_min[0], code: D.weather_code[0] } : null
  };
}

// Decide which alerts one subscriber should get right now.
// Returns [{ key, title, body, tag }]. `sent` holds keys already delivered.
export function decide(s, sub, utcDate, utcHour) {
  const out = [];
  const P = sub.prefs || DEFAULT_PREFS, place = sub.place || 'your area', u = units(sub.unit);
  const sent = sub.sent || {};
  const add = (key, title, body, tag) => { if (!sent[key]) out.push({ key, title, body, tag }); };
  const quiet = s.localHour >= 23 || s.localHour < 7; // no rain/temperature nudges overnight
  const H = s.hours, d = s.localDate;

  if (P.severe) {
    for (let i = 0; i < Math.min(4, H.length); i++) {
      if (SEVERE.includes(H[i].code)) {
        add(d + '|sev|' + H[i].code, '⚠ Extreme weather approaching',
          (WMO[H[i].code] || 'Severe weather') + (i === 0 ? ' over ' + place + ' now.' : ' expected over ' + place + ' from ' + pad(H[i].hr) + ':00.'), 'atlas-severe');
        break;
      }
    }
    if (s.gust >= 70) add(d + '|gale', '⚠ Gale warning', 'Gusts up to ' + u.spd(s.gust) + ' over ' + place + '.', 'atlas-severe');
    if (s.temp >= 35) add(d + '|heat', '⚠ Extreme heat', u.deg(s.temp) + ' over ' + place + '. Stay hydrated, Traveller.', 'atlas-severe');
    if (s.temp <= -5) add(d + '|frost', '⚠ Hard frost', u.deg(s.temp) + ' over ' + place + '. Watch for ice.', 'atlas-severe');
  }
  if (P.rain && !quiet && !isRain(s.code) && !isSnow(s.code) && H[1] && (H[1].pop >= 55 || ((isRain(H[1].code) || isSnow(H[1].code)) && H[1].pop >= 35))) { // never on a low chance: the forecast's weather code and its % can disagree
    const sn = isSnow(H[1].code);
    add(d + '|rain|' + H[1].hr, '◈ ' + (sn ? 'Snow' : 'Rain') + ' starting within the hour',
      (WMO[H[1].code] || (sn ? 'Snow' : 'Rain')) + ' likely over ' + place + ' (' + H[1].pop + '% chance). Take a coat, Traveller.', 'atlas-rain');
  }
  if (P.temp && !quiet && H[3]) {
    const dlt = H[3].temp - s.temp;
    if (Math.abs(dlt) >= 5) add(d + '|temp|' + H[3].hr, '🌡 ' + (dlt < 0 ? 'Temperature dropping' : 'Temperature rising'),
      'From ' + u.deg(s.temp) + ' to ' + u.deg(H[3].temp) + ' by ' + pad(H[3].hr) + ':00 over ' + place + '.', 'atlas-temp');
  }
  if (P.daily && s.today && s.localHour >= 7 && s.localHour < 10) {
    add(d + '|daily', '☀ Morning briefing · ' + place,
      (WMO[s.today.code] || 'Today') + '. High ' + u.deg(s.today.hi) + ', low ' + u.deg(s.today.lo) + '.', 'atlas-daily');
  }
  if (P.survey && utcHour === 0) {
    add(utcDate + '|survey', '◈ New planetary survey', 'Today’s 8 worlds are in. Tap to scan them, Traveller.', 'atlas-survey');
  }
  return out;
}

// Forget delivered-alert keys older than two days.
export function pruneSent(sent, now = Date.now()) {
  const cut = now - 2 * 86400e3, out = {};
  for (const [k, t] of Object.entries(sent || {})) if (t >= cut) out[k] = t;
  return out;
}
