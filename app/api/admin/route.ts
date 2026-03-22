import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const ADMIN_EMAIL = 'shakilxvs@gmail.com';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, adminEmail, password, uid, note } = body;

    // Verify admin
    if (adminEmail !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword || password !== adminPassword) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // Import Firebase Admin (server-side)
    const { initializeApp, getApps, cert } = await import('firebase-admin/app');
    const { getFirestore } = await import('firebase-admin/firestore');

    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    }

    const adminDb = getFirestore();

    if (action === 'getUsers') {
      const snapshot = await adminDb.collection('users').orderBy('createdAt', 'desc').limit(100).get();
      const users = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      return NextResponse.json({ users });
    }

    if (action === 'updateStatus') {
      await adminDb.collection('users').doc(uid).update({
        status: body.status,
        rejectionNote: note ?? null,
        updatedAt: new Date(),
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'getStats') {
      const usersSnap = await adminDb.collection('users').get();
      const total = usersSnap.size;
      const approved = usersSnap.docs.filter(d => d.data().status === 'approved').length;
      const pending = usersSnap.docs.filter(d => d.data().status === 'pending').length;
      const banned = usersSnap.docs.filter(d => d.data().status === 'banned').length;
      const convsSnap = await adminDb.collection('conversations').get();
      return NextResponse.json({ total, approved, pending, banned, conversations: convsSnap.size });
    }

    if (action === 'getConversations') {
      const snap = await adminDb.collection('conversations').where('uid', '==', uid).orderBy('updatedAt', 'desc').limit(20).get();
      const convs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return NextResponse.json({ conversations: convs });
    }

    if (action === 'getAutoApprove') {
      const doc = await adminDb.collection('admin').doc('settings').get();
      return NextResponse.json({ autoApprove: doc.data()?.autoApprove ?? false });
    }

    if (action === 'setAutoApprove') {
      await adminDb.collection('admin').doc('settings').set({ autoApprove: body.autoApprove }, { merge: true });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Admin error' }, { status: 500 });
  }
}
