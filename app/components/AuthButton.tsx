'use client';
import { useState, useRef, useEffect } from 'react';
import { LogIn, LogOut, User, Settings, Loader2 } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';

interface Props {
  user: FirebaseUser | null;
  loading: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  onProfile?: () => void;
}

export default function AuthButton({ user, loading, onSignIn, onSignOut, onProfile }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (loading) {
    return <Loader2 size={16} className="animate-spin" style={{ color: 'rgba(255,255,255,0.3)' }} />;
  }

  if (!user) {
    return (
      <button onClick={onSignIn}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all hover:bg-white/[0.06]"
        style={{ color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <LogIn size={13} strokeWidth={1.75} /> Sign in
      </button>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(p => !p)} className="flex items-center gap-2 rounded-lg p-1 transition-all hover:bg-white/[0.06]">
        {user.photoURL ? (
          <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full" />
        ) : (
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}>
            {(user.displayName || user.email || '?').charAt(0).toUpperCase()}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-48 rounded-xl overflow-hidden z-50"
          style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          <div className="px-3 py-2.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
            <p className="text-[13px] font-medium text-white truncate">{user.displayName || 'User'}</p>
            <p className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>{user.email}</p>
          </div>
          {onProfile && (
            <button onClick={() => { setOpen(false); onProfile(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-[13px] transition-all hover:bg-white/[0.05]"
              style={{ color: 'rgba(255,255,255,0.6)' }}>
              <User size={14} strokeWidth={1.75} /> Edit Profile
            </button>
          )}
          {user.email === 'shakilxvs@gmail.com' && (
            <a href="/admin"
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-[13px] transition-all hover:bg-white/[0.05]"
              style={{ color: 'rgba(255,255,255,0.6)' }}>
              <Settings size={14} strokeWidth={1.75} /> Admin Dashboard
            </a>
          )}
          <button onClick={() => { setOpen(false); onSignOut(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-[13px] transition-all hover:bg-white/[0.05] border-t"
            style={{ color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <LogOut size={14} strokeWidth={1.75} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
