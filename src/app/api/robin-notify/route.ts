export const runtime = 'edge';

const ADMIN_EMAIL = 'mazinghas0@gmail.com';
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'pocket-mission';
const FCM_ENDPOINT = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

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

async function getServiceAccessToken(): Promise<string> {
  const privateKeyPem = (process.env.FCM_PRIVATE_KEY ?? '').replace(/\\n/g, '\n');
  const clientEmail = process.env.FCM_CLIENT_EMAIL ?? '';
  if (!privateKeyPem || !clientEmail) throw new Error('FCM 환경변수 미설정');

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
    scope: 'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/firebase.messaging',
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

interface FirestoreDoc {
  documents?: Array<{
    fields?: Record<string, { stringValue?: string }>;
  }>;
}

async function getAdminFcmToken(accessToken: string): Promise<string | null> {
  const adminUid = process.env.ADMIN_UID ?? '';

  if (adminUid) {
    const res = await fetch(`${FIRESTORE_BASE}/users/${adminUid}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) {
      const doc = await res.json() as { fields?: Record<string, { stringValue?: string }> };
      return doc.fields?.fcmToken?.stringValue ?? null;
    }
  }

  const query = {
    structuredQuery: {
      from: [{ collectionId: 'users' }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'role' },
          op: 'EQUAL',
          value: { stringValue: 'parent' },
        },
      },
      limit: 50,
    },
  };

  const res = await fetch(`${FIRESTORE_BASE}:runQuery`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(query),
  });

  const results = await res.json() as Array<{ document?: { name?: string; fields?: Record<string, { stringValue?: string }> } }>;

  for (const result of results) {
    const fields = result.document?.fields;
    if (!fields) continue;
    const fcmToken = fields.fcmToken?.stringValue;
    if (fcmToken) return fcmToken;
  }

  return null;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const secret = request.headers.get('x-internal-secret');
    if (secret !== (process.env.NOTIFY_SECRET ?? '')) {
      return Response.json({ ok: false, error: '인증 실패' }, { status: 401 });
    }

    const { title, body } = await request.json() as { title: string; body: string };
    if (!title) {
      return Response.json({ ok: false, error: 'title 필수' }, { status: 400 });
    }

    const accessToken = await getServiceAccessToken();
    const fcmToken = await getAdminFcmToken(accessToken);
    if (!fcmToken) {
      return Response.json({ ok: false, error: '관리자 FCM 토큰 없음' }, { status: 404 });
    }

    const fcmRes = await fetch(FCM_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        message: {
          token: fcmToken,
          notification: { title, body },
        },
      }),
    });

    if (!fcmRes.ok) {
      const errBody = await fcmRes.text();
      return Response.json({ ok: false, error: `FCM ${fcmRes.status}: ${errBody}` }, { status: 502 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : '알림 발송 실패';
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
