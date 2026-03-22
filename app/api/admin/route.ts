import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const ADMIN_EMAIL = 'shakilxvs@gmail.com';
const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

async function firestoreRequest(path: string, method = 'GET', body?: any, idToken?: string) {
  const base = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Firestore ${res.status}: ${await res.text()}`);
  return res.json();
}

function parseFirestoreDoc(doc: any): any {
  if (!doc?.fields) return {};
  const result: Record<string, any> = { id: doc.name?.split('/').pop() };
  for (const [key, val] of Object.entries(doc.fields as Record<string, any>)) {
    result[key] = parseValue(val);
  }
  return result;
}

function parseValue(val: any): any {
  if (!val) return null;
  if ('nullValue' in val) return null;
  if ('booleanValue' in val) return val.booleanValue;
  if ('integerValue' in val) return parseInt(val.integerValue);
  if ('doubleValue' in val) return val.doubleValue;
  if ('stringValue' in val) return val.stringValue;
  if ('timestampValue' in val) return val.timestampValue;
  if ('arrayValue' in val) return (val.arrayValue?.values ?? []).map(parseValue);
  if ('mapValue' in val) {
    const obj: Record<string, any> = {};
    for (const [k, v] of Object.entries(val.mapValue?.fields ?? {})) obj[k] = parseValue(v);
    return obj;
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, adminEmail, password, uid, idToken } = body;

    // Step 1: Verify admin email
    if (adminEmail !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Step 2: Verify password directly against env var — NO Firestore call needed
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword || password !== adminPassword) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // Step 3: For 'verify' action — just confirm password is correct
    if (action === 'verify') {
      return NextResponse.json({ success: true });
    }

    // All other actions need idToken for Firestore
    if (!idToken) {
      return NextResponse.json({ error: 'No auth token' }, { status: 401 });
    }

    if (action === 'getUsers') {
      try {
        const data = await firestoreRequest('/users?pageSize=100', 'GET', undefined, idToken);
        const users = (data.documents ?? []).map(parseFirestoreDoc);
        return NextResponse.json({ users });
      } catch (e: any) {
        return NextResponse.json({ users: [], error: e.message });
      }
    }

    if (action === 'getStats') {
      try {
        const data = await firestoreRequest('/users?pageSize=500', 'GET', undefined, idToken);
        const users = (data.documents ?? []).map(parseFirestoreDoc);
        const total = users.length;
        const approved = users.filter((u: any) => u.status === 'approved').length;
        const pending = users.filter((u: any) => u.status === 'pending').length;
        const banned = users.filter((u: any) => u.status === 'banned').length;
        return NextResponse.json({ total, approved, pending, banned, conversations: 0 });
      } catch {
        return NextResponse.json({ total: 0, approved: 0, pending: 0, banned: 0, conversations: 0 });
      }
    }

    if (action === 'updateStatus') {
      const { status, note } = body;
      const fields: Record<string, any> = {
        status: { stringValue: status },
        rejectionNote: { stringValue: note ?? '' },
        updatedAt: { timestampValue: new Date().toISOString() },
      };
      await firestoreRequest(
        `/users/${uid}?updateMask.fieldPaths=status&updateMask.fieldPaths=rejectionNote&updateMask.fieldPaths=updatedAt`,
        'PATCH', { fields }, idToken
      );
      return NextResponse.json({ success: true });
    }

    if (action === 'getAutoApprove') {
      try {
        const data = await firestoreRequest('/admin/settings', 'GET', undefined, idToken);
        const doc = parseFirestoreDoc(data);
        return NextResponse.json({ autoApprove: doc.autoApprove ?? false });
      } catch {
        return NextResponse.json({ autoApprove: false });
      }
    }

    if (action === 'setAutoApprove') {
      const fields = { autoApprove: { booleanValue: body.autoApprove } };
      try {
        await firestoreRequest(
          '/admin/settings?updateMask.fieldPaths=autoApprove',
          'PATCH', { fields }, idToken
        );
      } catch {}
      return NextResponse.json({ success: true });
    }

    if (action === 'getConversations') {
      // Query ALL conversations and filter by uid
      try {
        const data = await firestoreRequest(
          `/conversations?pageSize=200`,
          'GET', undefined, idToken
        );
        const all = (data.documents ?? []).map(parseFirestoreDoc);
        const userConvs = all
          .filter((c: any) => c.uid === uid)
          .map((c: any) => ({
            id: c.id,
            title: c.title ?? 'Untitled',
            mode: c.mode ?? 'chat',
            updatedAt: c.updatedAt ?? null,
            msgCount: Array.isArray(c.messages) ? c.messages.length : 0,
          }));
        return NextResponse.json({ conversations: userConvs });
      } catch (e: any) {
        return NextResponse.json({ conversations: [], error: e.message });
      }
    }

    if (action === 'getUserProfile') {
      try {
        const data = await firestoreRequest(`/users/${uid}`, 'GET', undefined, idToken);
        return NextResponse.json({ profile: parseFirestoreDoc(data) });
      } catch {
        return NextResponse.json({ profile: null });
      }
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Admin error' }, { status: 500 });
  }
}
