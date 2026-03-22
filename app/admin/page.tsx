'use client';
import { useState, useEffect } from 'react';
import { Users, Lock, Eye, EyeOff, CheckCircle, Ban, RotateCcw, ToggleLeft, ToggleRight, ArrowLeft, Loader2 } from 'lucide-react';
import { auth } from '@/app/lib/firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';

const ADMIN_EMAIL = 'shakilxvs@gmail.com';

interface UserRow {
  id: string;
  email: string;
  displayName: string;
  status: string;
  createdAt: any;
  lastActive: any;
  provider: string;
}

interface Stats {
  total: number;
  approved: number;
  pending: number;
  banned: number;
  conversations: number;
}

export default function AdminPage() {
  const [step, setStep] = useState<'auth' | 'password' | 'dashboard'>('auth');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [authErr, setAuthErr] = useState('');
  const [idToken, setIdToken] = useState('');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoApprove, setAutoApprove] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [noteText, setNoteText] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [activityUser, setActivityUser] = useState<UserRow | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [convLoading, setConvLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'banned'>('all');

  // Check if already logged in as admin
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user?.email === ADMIN_EMAIL) {
        const token = await user.getIdToken();
        setIdToken(token);
        setStep('password');
      }
    });
    return unsub;
  }, []);

  const api = async (action: string, extra = {}) => {
    const token = idToken || await auth.currentUser?.getIdToken() || '';
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, adminEmail: ADMIN_EMAIL, password, idToken: token, ...extra }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Request failed');
    return data;
  };

  const handleGoogleSignIn = async () => {
    setAuthErr('');
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      if (cred.user.email !== ADMIN_EMAIL) {
        setAuthErr('Access restricted. You are not authorized.');
        await auth.signOut();
        return;
      }
      const token = await cred.user.getIdToken();
      setIdToken(token);
      setStep('password');
    } catch (e: any) {
      if (e?.code !== 'auth/popup-closed-by-user') setAuthErr('Sign in failed.');
    }
  };

  const handlePasswordSubmit = async () => {
    setAuthErr('');
    if (!password) { setAuthErr('Enter password'); return; }
    try {
      await api('verify');
      setStep('dashboard');
      loadData();
    } catch (e: any) {
      setAuthErr(e.message?.includes('Invalid') ? 'Wrong password' : e.message ?? 'Error');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, statsData, settingsData] = await Promise.allSettled([
        api('getUsers'),
        api('getStats'),
        api('getAutoApprove'),
      ]);
      if (usersData.status === 'fulfilled') setUsers(usersData.value.users ?? []);
      if (statsData.status === 'fulfilled') setStats(statsData.value);
      if (settingsData.status === 'fulfilled') setAutoApprove(settingsData.value.autoApprove ?? false);
    } catch {}
    setLoading(false);
  };

  const [userProfile, setUserProfile] = useState<any>(null);

  const loadConversations = async (u: UserRow) => {
    setActivityUser(u);
    setConvLoading(true);
    setConversations([]);
    setUserProfile(null);
    try {
      const [convsData, profileData] = await Promise.allSettled([
        api('getConversations', { uid: u.id }),
        api('getUserProfile', { uid: u.id }),
      ]);
      if (convsData.status === 'fulfilled') setConversations(convsData.value.conversations ?? []);
      if (profileData.status === 'fulfilled') setUserProfile(profileData.value.profile ?? null);
    } catch {}
    setConvLoading(false);
  };

  const updateStatus = async (uid: string, status: string, note?: string) => {
    setActionLoading(uid);
    try {
      await api('updateStatus', { uid, status, note });
      setUsers(prev => prev.map(u => u.id === uid ? { ...u, status } : u));
      setSelectedUser(null);
    } catch (e: any) {
      alert('Error: ' + (e.message ?? 'Failed'));
    }
    setActionLoading('');
  };

  const toggleAutoApprove = async () => {
    const next = !autoApprove;
    setAutoApprove(next);
    try { await api('setAutoApprove', { autoApprove: next }); }
    catch { setAutoApprove(!next); }
  };

  const filteredUsers = users.filter(u => filter === 'all' || u.status === filter);

  const statusColor: Record<string, string> = {
    approved: '#34d399', pending: '#fbbf24', banned: '#ef4444', rejected: '#f87171',
  };

  const timeAgo = (val: any) => {
    if (!val) return 'Never';
    try {
      const date = typeof val === 'string' ? new Date(val) : val?.toDate?.() ?? new Date(val);
      const diff = (Date.now() - date.getTime()) / 1000;
      if (diff < 60) return 'Just now';
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    } catch { return '—'; }
  };

  // Step 1: Google Sign In
  if (step === 'auth') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#05050a' }}>
        <div className="w-full max-w-[360px] p-8 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}>
              <Lock size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">XVSai Admin</h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Admin access only</p>
          </div>
          {authErr && <p className="text-sm mb-3 text-center" style={{ color: '#f87171' }}>{authErr}</p>}
          <button onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-medium text-white mb-3"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
            Sign in with Google
          </button>
          <div className="text-center">
            <a href="/" className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>← Back to XVSai</a>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Password
  if (step === 'password') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#05050a' }}>
        <div className="w-full max-w-[360px] p-8 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}>
              <Lock size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">XVSai Admin</h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Enter admin password</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Lock size={15} style={{ color: 'rgba(255,255,255,0.3)' }} />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Admin password"
                className="flex-1 bg-transparent outline-none text-white placeholder-white/30"
                style={{ fontSize: '16px' }}
                onKeyDown={e => e.key === 'Enter' && handlePasswordSubmit()}
                autoFocus
              />
              <button onClick={() => setShowPass(!showPass)} style={{ color: 'rgba(255,255,255,0.3)' }}>
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {authErr && <p className="text-sm" style={{ color: '#f87171' }}>{authErr}</p>}
            <button onClick={handlePasswordSubmit}
              className="w-full py-3 rounded-xl text-white font-semibold"
              style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}>
              Access Dashboard
            </button>
            <div className="text-center">
              <a href="/" className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>← Back to XVSai</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Dashboard
  return (
    <div className="min-h-screen" style={{ background: '#05050a', color: '#e2e2ea' }}>
      <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(5,5,10,0.95)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-1.5 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <ArrowLeft size={14} /> XVSai
          </a>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>/</span>
          <span className="text-sm font-semibold text-white">Admin Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={toggleAutoApprove} className="flex items-center gap-2 text-sm">
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>Auto-approve</span>
            {autoApprove
              ? <ToggleRight size={22} style={{ color: '#34d399' }} />
              : <ToggleLeft size={22} style={{ color: 'rgba(255,255,255,0.2)' }} />}
          </button>
          <button onClick={loadData} className="text-sm px-3 py-1.5 rounded-lg" style={{ color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total Users', value: stats.total, color: '#818cf8' },
              { label: 'Approved', value: stats.approved, color: '#34d399' },
              { label: 'Pending', value: stats.pending, color: '#fbbf24' },
              { label: 'Banned', value: stats.banned, color: '#ef4444' },
            ].map(s => (
              <div key={s.label} className="p-4 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {(['all', 'pending', 'approved', 'banned'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize"
              style={filter === f
                ? { background: '#6366f120', color: '#818cf8', border: '1px solid #6366f140' }
                : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.07)' }
              }>
              {f} {f !== 'all' && `(${users.filter(u => u.status === f).length})`}
            </button>
          ))}
        </div>

        {/* Users list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin" style={{ color: '#818cf8' }} />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'rgba(255,255,255,0.3)' }}>No users found</div>
        ) : (
          <div className="space-y-2">
            {filteredUsers.map(u => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer hover:bg-white/[0.05] transition-all" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }} onClick={() => loadConversations(u)}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}>
                  {(u.displayName || u.email || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{u.displayName || '—'}</p>
                  <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{u.email}</p>
                </div>
                <div className="hidden md:block text-xs text-right" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  <p>Joined {timeAgo(u.createdAt)}</p>
                  <p>Active {timeAgo(u.lastActive)}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 capitalize"
                  style={{ background: `${statusColor[u.status] ?? '#818cf8'}20`, color: statusColor[u.status] ?? '#818cf8', border: `1px solid ${statusColor[u.status] ?? '#818cf8'}40` }}>
                  {u.status}
                </span>
                <div className="flex gap-1 flex-shrink-0">
                  {u.status !== 'approved' && (
                    <button onClick={() => updateStatus(u.id, 'approved')} disabled={actionLoading === u.id}
                      className="p-1.5 rounded-lg hover:bg-white/[0.06]" title="Approve" style={{ color: '#34d399' }}>
                      {actionLoading === u.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                    </button>
                  )}
                  {u.status === 'banned' ? (
                    <button onClick={() => updateStatus(u.id, 'approved')}
                      className="p-1.5 rounded-lg hover:bg-white/[0.06]" title="Unban" style={{ color: '#fbbf24' }}>
                      <RotateCcw size={14} />
                    </button>
                  ) : (
                    <button onClick={() => { setSelectedUser(u); setNoteText(''); }}
                      className="p-1.5 rounded-lg hover:bg-white/[0.06]" title="Ban" style={{ color: '#ef4444' }}>
                      <Ban size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity modal */}
      {activityUser && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4" style={{ background: 'rgba(0,0,0,0.75)' }} onClick={() => setActivityUser(null)}>
          <div className="w-full md:max-w-[500px] max-h-[80vh] flex flex-col rounded-t-2xl md:rounded-2xl" style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <div>
                <h3 className="text-base font-semibold text-white">{activityUser.displayName || 'User'}</h3>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{activityUser.email} · {conversations.length} conversations</p>
              </div>
              <button onClick={() => setActivityUser(null)} style={{ color: 'rgba(255,255,255,0.4)' }}>✕</button>
            </div>
            <div className="overflow-y-auto flex-1 p-3 space-y-3">
              {/* Profile info */}
              {userProfile && (
                <div className="px-3 py-3 rounded-xl" style={{ background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.15)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#818cf8' }}>Profile Info</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {[
                      ['Name', userProfile.displayName],
                      ['Email', userProfile.email],
                      ['Phone', userProfile.phone],
                      ['Gender', userProfile.gender],
                      ['DOB', userProfile.dob],
                      ['Provider', userProfile.provider],
                      ['Status', userProfile.status],
                      ['Address', userProfile.address],
                    ].filter(([, v]) => v).map(([label, value]) => (
                      <div key={label as string}>
                        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</p>
                        <p className="text-xs text-white truncate">{value as string}</p>
                      </div>
                    ))}
                  </div>
                  {userProfile.bio && (
                    <div className="mt-2">
                      <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Bio</p>
                      <p className="text-xs text-white">{userProfile.bio}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Conversations */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Conversations ({conversations.length})
                </p>
                {convLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={20} className="animate-spin" style={{ color: '#818cf8' }} />
                  </div>
                ) : conversations.length === 0 ? (
                  <p className="text-center py-6 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>No conversations yet</p>
                ) : (
                  <div className="space-y-2">
                    {conversations.map((c: any) => (
                      <div key={c.id} className="px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="text-sm text-white truncate">{c.title}</p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-xs capitalize px-2 py-0.5 rounded-full" style={{ background: 'rgba(129,140,248,0.15)', color: '#818cf8' }}>{c.mode}</span>
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>{c.msgCount} messages</span>
                          {c.updatedAt && <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>{new Date(c.updatedAt).toLocaleDateString()}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ban modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }} onClick={() => setSelectedUser(null)}>
          <div className="w-full max-w-[360px] p-6 rounded-2xl" style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-white mb-1">Take Action</h3>
            <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>{selectedUser.email}</p>
            <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
              placeholder="Message to show the user (optional)"
              rows={3} className="w-full bg-transparent outline-none resize-none text-white text-sm px-3 py-2 rounded-xl mb-4 placeholder-white/25"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
            <div className="flex gap-2">
              <button onClick={() => updateStatus(selectedUser.id, 'rejected', noteText)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}>
                Reject
              </button>
              <button onClick={() => updateStatus(selectedUser.id, 'banned', noteText)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                Ban
              </button>
              <button onClick={() => setSelectedUser(null)}
                className="px-4 py-2.5 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
