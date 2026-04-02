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
    const now = ctx.currentTime;

    const playNote = (freq: number, startTime: number, duration: number, volume: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    playNote(784, now, 0.15, 0.25);
    playNote(1047, now + 0.12, 0.15, 0.25);
    playNote(1319, now + 0.24, 0.25, 0.2);
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
