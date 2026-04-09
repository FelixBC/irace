import { getApiBaseUrl } from '../config/urls';
import { jsonBearerHeaders, readJsonOrNull } from './apiClient';
import { createLogger } from './logger';

const log = createLogger('webPush');

export function isWebPushConfigured(): boolean {
  return Boolean(import.meta.env.VITE_VAPID_PUBLIC_KEY?.trim());
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerWebPushServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  } catch (e) {
    log.warn('service worker registration failed', e);
    return null;
  }
}

export async function enableWebPush(bearerToken: string, baseUrl = getApiBaseUrl()): Promise<boolean> {
  const key = import.meta.env.VITE_VAPID_PUBLIC_KEY?.trim();
  if (!key) return false;

  const reg = await registerWebPushServiceWorker();
  if (!reg) return false;

  const ready = await navigator.serviceWorker.ready;
  const sub = await ready.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(key),
  });
  const json = sub.toJSON();

  const res = await fetch(`${baseUrl}/push/subscribe`, {
    method: 'POST',
    headers: jsonBearerHeaders(bearerToken),
    body: JSON.stringify(json),
  });

  return res.ok;
}

export async function disableWebPush(bearerToken: string, baseUrl = getApiBaseUrl()): Promise<void> {
  const reg = await navigator.serviceWorker.getRegistration('/');
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;

  const endpoint = sub.endpoint;
  await fetch(`${baseUrl}/push/unsubscribe`, {
    method: 'POST',
    headers: jsonBearerHeaders(bearerToken),
    body: JSON.stringify({ endpoint }),
  });
  await sub.unsubscribe();
}

export async function sendTestPushNotification(
  bearerToken: string,
  baseUrl = getApiBaseUrl()
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`${baseUrl}/push/test`, {
    method: 'POST',
    headers: jsonBearerHeaders(bearerToken),
    body: JSON.stringify({ title: 'iRace', body: 'Push is working.' }),
  });
  if (!res.ok) {
    const data = await readJsonOrNull<{ error?: unknown }>(res);
    return {
      ok: false,
      error: typeof data?.error === 'string' ? data.error : 'Request failed',
    };
  }
  return { ok: true };
}
