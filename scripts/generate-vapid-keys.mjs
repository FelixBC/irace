import webpush from 'web-push';

const keys = webpush.generateVAPIDKeys();
console.log('Add these to .env (and Vercel when you enable push):\n');
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log(`VITE_VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log('\nAlso set VAPID_SUBJECT=mailto:your@email.com (must be a mailto: or https: URL).');
