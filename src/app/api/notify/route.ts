export const runtime = 'edge';

const PROJECT_ID = 'pocket-mission';
const FCM_ENDPOINT = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const base64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');
  const binary = atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    view[i] = binary.charCodeAt(i);
  }
  return buffer;
}

function toBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function getAccessToken(): Promise<string> {
  const privateKeyPem = (process.env.FCM_PRIVATE_KEY ?? '').replace(/\\n/g, '\n');
  const clientEmail = process.env.FCM_CLIENT_EMAIL ?? '';

  if (!privateKeyPem || !clientEmail) throw new Error('FCM 서비스 계정 환경변수 미설정');

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(privateKeyPem),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const now = Math.floor(Date.now() / 1000);
  const encoder = new TextEncoder();

  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payload = btoa(JSON.stringify({
    iss: clientEmail,
    sub: clientEmail,
    aud: TOKEN_ENDPOINT,
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
  })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const signingInput = `${header}.${payload}`;
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(signingInput),
  );

  const jwt = `${signingInput}.${toBase64Url(signature)}`;

  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const data = await res.json() as { access_token?: string };
  if (!data.access_token) throw new Error('액세스 토큰 발급 실패');
  return data.access_token;
}

async function sendFcmMessage(token: string, title: string, body: string): Promise<void> {
  const accessToken = await getAccessToken();
  const res = await fetch(FCM_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      message: {
        token,
        notification: { title, body },
      },
    }),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`FCM ${res.status}: ${errBody}`);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const { tokens, title, body } = await request.json() as {
      tokens: string[];
      title: string;
      body: string;
    };

    if (!tokens?.length || !title) {
      return Response.json({ ok: false, error: '필수 파라미터 누락' }, { status: 400 });
    }

    const results = await Promise.allSettled(tokens.map(t => sendFcmMessage(t, title, body)));
    const failures = results
      .map((r, i) => r.status === 'rejected' ? { token: tokens[i].slice(0, 20), error: (r as PromiseRejectedResult).reason?.message } : null)
      .filter(Boolean);
    return Response.json({ ok: true, failures });
  } catch (err) {
    const message = err instanceof Error ? err.message : '알림 발송 실패';
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
