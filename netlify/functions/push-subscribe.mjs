// Sign-up store for weather alerts that arrive while the app is closed.
// POST   /api/push-subscribe  { sub, lat, lon, place, prefs, unit }  -> save or update
// DELETE /api/push-subscribe  { endpoint }                            -> remove for good
import { getStore } from '@netlify/blobs';
import { STORE, validEndpoint, keyFor, roundCoord, cleanPrefs, cleanPlace } from './lib/alerts.mjs';

const MAX_SUBS = 5000;
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export default async (req) => {
  if (req.method !== 'POST' && req.method !== 'DELETE') return json({ error: 'method' }, 405);
  const text = await req.text();
  if (text.length > 4000) return json({ error: 'too large' }, 413);
  let data;
  try { data = JSON.parse(text); } catch (e) { return json({ error: 'bad json' }, 400); }

  // Without both VAPID keys the 30-minute checker can't send anything. Say so, so the app
  // keeps its own open-app alerts running instead of believing the server has it covered.
  if (req.method === 'POST' && !(Netlify.env.get('VAPID_PUBLIC_KEY') && Netlify.env.get('VAPID_PRIVATE_KEY'))) {
    console.log('push-subscribe: VAPID keys missing, refusing sign-up');
    return json({ error: 'push not configured' }, 503);
  }

  const store = getStore(STORE);

  if (req.method === 'DELETE') {
    const endpoint = data && data.endpoint;
    if (!validEndpoint(endpoint)) return json({ error: 'bad endpoint' }, 400);
    await store.delete(await keyFor(endpoint));
    return json({ ok: true, removed: true });
  }

  const sub = data && data.sub;
  if (!sub || !validEndpoint(sub.endpoint) || !sub.keys || typeof sub.keys.p256dh !== 'string' || typeof sub.keys.auth !== 'string'
    || sub.keys.p256dh.length > 200 || sub.keys.auth.length > 100) return json({ error: 'bad subscription' }, 400);
  const lat = Number(data.lat), lon = Number(data.lon);
  if (!isFinite(lat) || !isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return json({ error: 'bad location' }, 400);

  const key = await keyFor(sub.endpoint);
  const existing = await store.get(key, { type: 'json' });
  if (!existing) {
    let count = 0;
    for await (const page of store.list({ paginate: true })) { count += page.blobs.length; if (count >= MAX_SUBS) break; }
    if (count >= MAX_SUBS) return json({ error: 'full' }, 503);
  }
  const now = Date.now();
  const record = {
    sub: { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } },
    lat: roundCoord(lat), lon: roundCoord(lon),
    place: cleanPlace(data.place),
    prefs: cleanPrefs(data.prefs),
    unit: data.unit === 'F' ? 'F' : 'C',
    created: existing ? existing.created : now,
    updated: now,
    // keep delivered-alert history if only prefs moved; reset it when the place changes
    sent: existing && existing.lat === roundCoord(lat) && existing.lon === roundCoord(lon) ? (existing.sent || {}) : {}
  };
  await store.setJSON(key, record);
  return json({ ok: true });
};

export const config = { path: '/api/push-subscribe' };
