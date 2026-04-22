/**
 * One-time (or rare) Strava push subscription setup.
 * Requires: STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, FRONTEND_URL (or VITE_APP_ORIGIN), STRAVA_WEBHOOK_VERIFY_TOKEN
 *
 * Usage (from repo root, with env loaded):
 *   node scripts/register-strava-webhook.mjs
 *
 * @see https://developers.strava.com/docs/webhooks/
 */

const clientId = process.env.STRAVA_CLIENT_ID;
const clientSecret = process.env.STRAVA_CLIENT_SECRET;
const verifyToken = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN?.trim();
const base =
  (process.env.FRONTEND_URL || process.env.VITE_APP_ORIGIN || '').replace(/\/$/, '');

if (!clientId || !clientSecret || !verifyToken || !base) {
  console.error(
    'Missing env: STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_WEBHOOK_VERIFY_TOKEN, and FRONTEND_URL (or VITE_APP_ORIGIN)'
  );
  process.exit(1);
}

const callbackUrl = `${base}/api/strava/webhook`;
if (callbackUrl.length > 255) {
  console.error('callback_url exceeds 255 characters — use a shorter FRONTEND_URL');
  process.exit(1);
}

async function listSubscriptions() {
  const url = new URL('https://www.strava.com/api/v3/push_subscriptions');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('client_secret', clientSecret);
  const res = await fetch(url);
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`List subscriptions failed: ${res.status} ${t}`);
  }
  return res.json();
}

async function deleteSubscription(id) {
  const url = new URL(`https://www.strava.com/api/v3/push_subscriptions/${id}`);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('client_secret', clientSecret);
  const res = await fetch(url, { method: 'DELETE' });
  if (res.status !== 204 && !res.ok) {
    const t = await res.text();
    throw new Error(`Delete subscription failed: ${res.status} ${t}`);
  }
}

async function createSubscription() {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    callback_url: callbackUrl,
    verify_token: verifyToken,
  });
  const res = await fetch('https://www.strava.com/api/v3/push_subscriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Create subscription failed: ${res.status} ${text}`);
  }
  try {
    return JSON.parse(text);
  } catch (jsonParseError) {
    console.warn('createSubscription: response was not JSON; returning raw text', jsonParseError);
    return text;
  }
}

const existing = await listSubscriptions();
const subs = Array.isArray(existing) ? existing : existing ? [existing] : [];

for (const s of subs) {
  if (s?.id != null) {
    console.log('Deleting existing subscription id:', s.id);
    await deleteSubscription(s.id);
  }
}

console.log('Creating subscription with callback:', callbackUrl);
const created = await createSubscription();
console.log('OK:', created);
