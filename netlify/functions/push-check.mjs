// Weather checker: runs every 30 minutes, looks at the forecast for everyone signed up
// and sends an alert when something is about to change. Runs on Netlify's servers,
// so it never triggers a site deploy.
import { getStore } from '@netlify/blobs';
import webpush from 'web-push';
import { STORE, summarise, decide, pruneSent } from './lib/alerts.mjs';

const BATCH = 40; // locations per Open-Meteo request

async function fetchBatch(locs) {
  const q = new URLSearchParams({
    latitude: locs.map(l => l.lat).join(','),
    longitude: locs.map(l => l.lon).join(','),
    current: 'temperature_2m,weather_code,wind_gusts_10m',
    hourly: 'temperature_2m,weather_code,precipitation_probability',
    daily: 'temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,wind_speed_10m_max',
    timezone: 'auto', forecast_days: '2'
  });
  const r = await fetch('https://api.open-meteo.com/v1/forecast?' + q, { signal: AbortSignal.timeout(10000) });
  if (!r.ok) throw new Error('open-meteo ' + r.status);
  const d = await r.json();
  return Array.isArray(d) ? d : [d];
}

export default async () => {
  const pub = Netlify.env.get('VAPID_PUBLIC_KEY'), priv = Netlify.env.get('VAPID_PRIVATE_KEY');
  if (!pub || !priv) { console.log('push-check: VAPID keys missing'); return; }
  webpush.setVapidDetails(Netlify.env.get('VAPID_SUBJECT') || 'https://weather.nomansskyhub.app', pub, priv);

  const store = getStore(STORE);
  const keys = [];
  for await (const page of store.list({ paginate: true })) for (const b of page.blobs) keys.push(b.key);
  if (!keys.length) { console.log('push-check: no subscribers'); return; }

  const subs = (await Promise.all(keys.map(async k => ({ k, rec: await store.get(k, { type: 'json' }) })))).filter(x => x.rec);

  // one forecast per rounded location, not per person
  const locMap = new Map();
  for (const s of subs) { const id = s.rec.lat + ',' + s.rec.lon; if (!locMap.has(id)) locMap.set(id, { lat: s.rec.lat, lon: s.rec.lon }); }
  const locs = [...locMap.entries()];
  const wxById = new Map();
  for (let i = 0; i < locs.length; i += BATCH) {
    const slice = locs.slice(i, i + BATCH);
    try {
      const res = await fetchBatch(slice.map(([, l]) => l));
      slice.forEach(([id], j) => { if (res[j] && res[j].current) wxById.set(id, summarise(res[j])); });
    } catch (e) { console.log('push-check: forecast failed', e.message); }
  }

  const now = new Date(), utcDate = now.toISOString().slice(0, 10), utcHour = now.getUTCHours();
  let sentCount = 0, removed = 0;
  await Promise.all(subs.map(async ({ k, rec }) => {
    const s = wxById.get(rec.lat + ',' + rec.lon);
    if (!s) return;
    const alerts = decide(s, rec, utcDate, utcHour);
    if (!alerts.length) return;
    let changed = false, gone = false;
    rec.sent = pruneSent(rec.sent);
    for (const a of alerts) {
      try {
        await webpush.sendNotification(rec.sub, JSON.stringify({ title: a.title, body: a.body, tag: a.tag, url: '/' }), { TTL: 3600, urgency: a.tag === 'atlas-severe' ? 'high' : 'normal' });
        rec.sent[a.key] = Date.now(); changed = true; sentCount++;
      } catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) { gone = true; break; } // phone unsubscribed or app removed
        console.log('push-check: send failed', e.statusCode || e.message);
      }
    }
    if (gone) { await store.delete(k); removed++; }
    else if (changed) await store.setJSON(k, rec);
  }));
  console.log(`push-check: ${subs.length} subscribers, ${locs.length} locations, ${sentCount} alerts sent, ${removed} removed`);
};

export const config = { schedule: '*/30 * * * *' };
