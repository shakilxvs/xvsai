'use client';
import { useState, useEffect } from 'react';
import { Users, Activity, BarChart3, Lock, Eye, EyeOff, CheckCircle, XCircle, Ban, RotateCcw, MessageSquare, ToggleLeft, ToggleRight, ArrowLeft, Loader2 } from 'lucide-react';

const ADMIN_EMAIL = 'shakilxvs@gmail.com';

interface UserRow {
  id: string;
  email: string;
  displayName: string;
  status: string;
  createdAt: any;
  lastActive: any;
  provider: string;
  photoURL?: string;
}

interface Stats {
  total: number;
  approved: number;
  pending: number;
  banned: number;
  conversations: number;
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [authErr, setAuthErr] = useState('');
  const [tab, setTab] = useState<'users' | 'stats'>('users');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoApprove, setAutoApprove] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [noteText, setNoteText] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'banned'>('all');

  const api = async (action: string, extra = {}) => {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, adminEmail: ADMIN_EMAIL, password, ...extra }),
    });
    if (!res.ok) throw new Error('Request failed');
    return res.json();
  };

  const handleLogin = async () => {
    setAuthErr('');
    try {
      await api('getStats');
      setAuthed(true);
      loadData();
    } catch {
      setAuthErr('Wrong password');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, statsData, settingsData] = await Promise.all([
        api('getUsers'),
        api('getStats'),
        api('getAutoApprove'),
      ]);
      setUsers(usersData.users ?? []);
      setStats(statsData);
      setAutoApprove(settingsData.autoApprove ?? false);
    } catch {}
    setLoading(false);
  };

  const updateStatus = async (uid: string, status: string, note?: string) => {
    setActionLoading(uid);
    try {
      await api('updateStatus', { uid, status, note });
      setUsers(prev => prev.map(u => u.id === uid ? { ...u, status } : u));
      if (stats) {
        setStats(prev => prev ? { ...prev } : null);
      }
      setSelectedUser(null);
    } catch {}
    setActionLoading('');
  };

  const toggleAutoApprove = async () => {
    const next = !autoApprove;
    setAutoApprove(next);
    try { await api('setAutoApprove', { autoApprove: next }); } catch { setAutoApprove(!next); }
  };

  const filteredUsers = users.filter(u => filter === 'all' || u.status === filter);

  const statusColor: Record<string, string> = {
    approved: '#34d399', pending: '#fbbf24', banned: '#ef4444', rejected: '#f87171',
  };

  const timeAgo = (val: any) => {
    if (!val) return 'Never';
    const date = val?.toDate ? val.toDate() : new Date(val);
    const diff = (Date.now() - date.getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
  };

  if (!authed) {
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
                className="flex-1 bg-transparent outline-none text-white placeholder-white/30 text-[15px]"
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
              <button onClick={() => setShowPass(!showPass)} style={{ color: 'rgba(255,255,255,0.3)' }}>
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {authErr && <p className="text-sm" style={{ color: '#f87171' }}>{authErr}</p>}
            <button onClick={handleLogin}
              className="w-full py-3 rounded-xl text-white font-semibold"
              style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}>
              Access Dashboard
            </button>
            <div className="text-center pt-1">
              <a href="/" className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>← Back to XVSai</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#05050a', color: '#e2e2ea' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(5,5,10,0.9)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-1.5 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <ArrowLeft size={14} /> XVSai
          </a>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>/</span>
          <span className="text-sm font-semibold text-white">Admin Dashboard</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleAutoApprove} className="flex items-center gap-2 text-sm">
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>Auto-approve</span>
            {autoApprove ? <ToggleRight size={22} style={{ color: '#34d399' }} /> : <ToggleLeft size={22} style={{ color: 'rgba(255,255,255,0.2)' }} />}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {[
              { label: 'Total Users', value: stats.total, color: '#818cf8' },
              { label: 'Approved', value: stats.approved, color: '#34d399' },
              { label: 'Pending', value: stats.pending, color: '#fbbf24' },
              { label: 'Banned', value: stats.banned, color: '#ef4444' },
              { label: 'Conversations', value: stats.conversations, color: '#c084fc' },
            ].map(s => (
              <div key={s.label} className="p-4 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4">
          {(['all', 'pending', 'approved', 'banned'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
              style={filter === f
                ? { background: '#6366f120', color: '#818cf8', border: '1px solid #6366f140' }
                : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.07)' }
              }>
              {f} {f !== 'all' && `(${users.filter(u => u.status === f).length})`}
            </button>
          ))}
          <button onClick={loadData} className="ml-auto px-3 py-1.5 rounded-lg text-xs" style={{ color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <RotateCcw size={12} />
          </button>
        </div>

        {/* Users table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin" style={{ color: '#818cf8' }} />
          </div>
        ) : (
          <div className="space-y-2">
            {filteredUsers.length === 0 && (
              <div className="text-center py-12" style={{ color: 'rgba(255,255,255,0.3)' }}>No users found</div>
            )}
            {filteredUsers.map(u => (
              <div key={u.id} className="flex items-center gap-4 px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}>
                  {u.displayName?.charAt(0)?.toUpperCase() ?? '?'}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{u.displayName}</p>
                  <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{u.email}</p>
                </div>
                {/* Meta */}
                <div className="hidden md:flex flex-col items-end text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  <span>Joined {timeAgo(u.createdAt)}</span>
                  <span>Active {timeAgo(u.lastActive)}</span>
                </div>
                {/* Status badge */}
                <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                  style={{ background: `${statusColor[u.status] ?? '#818cf8'}20`, color: statusColor[u.status] ?? '#818cf8', border: `1px solid ${statusColor[u.status] ?? '#818cf8'}40` }}>
                  {u.status}
                </span>
                {/* Actions */}
                <div className="flex gap-1.5 flex-shrink-0">
                  {u.status !== 'approved' && (
                    <button onClick={() => updateStatus(u.id, 'approved')}
                      disabled={actionLoading === u.id}
                      className="p-1.5 rounded-lg transition-all hover:bg-white/[0.06]"
                      title="Approve" style={{ color: '#34d399' }}>
                      {actionLoading === u.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                    </button>
                  )}
                  {u.status !== 'banned' && (
                    <button onClick={() => { setSelectedUser(u); setNoteText(''); }}
                      className="p-1.5 rounded-lg transition-all hover:bg-white/[0.06]"
                      title="Ban/Reject" style={{ color: '#ef4444' }}>
                      <Ban size={14} />
                    </button>
                  )}
                  {u.status === 'banned' && (
                    <button onClick={() => updateStatus(u.id, 'approved')}
                      className="p-1.5 rounded-lg transition-all hover:bg-white/[0.06]"
                      title="Unban" style={{ color: '#fbbf24' }}>
                      <RotateCcw size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ban/Reject modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setSelectedUser(null)}>
          <div className="w-full max-w-[380px] p-6 rounded-2xl" style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-1">Ban or Reject User</h3>
            <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>{selectedUser.email}</p>
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Note to show the user (optional)"
              rows={3}
              className="w-full bg-transparent outline-none resize-none text-white placeholder-white/30 text-sm px-3 py-2 rounded-xl mb-4"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            <div className="flex gap-2">
              <button onClick={() => updateStatus(selectedUser.id, 'rejected', noteText)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}>
                Reject
              </button>
              <button onClick={() => updateStatus(selectedUser.id, 'banned', noteText)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                Ban
              </button>
              <button onClick={() => setSelectedUser(null)}
                className="px-4 py-2.5 rounded-xl text-sm"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
