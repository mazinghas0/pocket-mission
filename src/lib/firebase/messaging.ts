import { getMessaging, getToken, onMessage } from 'firebase/messaging';
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

function playNotificationSound(): void {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.4);
  } catch {
    // 자동재생 정책으로 실패 시 무시
  }
}

export function setupForegroundNotifications(): () => void {
  if (typeof window === 'undefined') return () => {};
  if (!('Notification' in window)) return () => {};
  if (Notification.permission !== 'granted') return () => {};

  try {
    const messaging = getMessaging(app);
    const unsubscribe = onMessage(messaging, (payload) => {
      const title = payload.notification?.title ?? '포켓미션';
      const body = payload.notification?.body ?? '';
      new Notification(title, {
        body,
        icon: '/icons/icon-192.png',
      });
      playNotificationSound();
    });
    return unsubscribe;
  } catch {
    return () => {};
  }
}
