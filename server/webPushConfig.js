import webpush from 'web-push';

let configured = false;

export function ensureWebPushConfigured() {
  if (configured) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) {
    throw new Error(
      'Web Push not configured: set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT (e.g. mailto:you@domain.com)'
    );
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export { webpush };
