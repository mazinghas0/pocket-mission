import { getMessaging, getToken } from 'firebase/messaging';
import app from './client';

const VAPID_KEY = 'BMRs8r6cbtdf7nd5-SLUthv6oRY0PuaQHRVuiQLfYSpTJSihU0qVd91Yjj1ag4FycYs4B9IHWRyvA1qXEPT_I3g';

export async function requestFcmToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (!('Notification' in window)) return null;
  if (!('serviceWorker' in navigator)) return null;
  if (!VAPID_KEY) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    return token ?? null;
  } catch {
    return null;
  }
}
