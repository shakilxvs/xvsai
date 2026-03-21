'use client';
import { LogIn, LogOut, Loader2 } from 'lucide-react';
import { User } from 'firebase/auth';

interface Props {
  user: User | null;
  loading: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
}

export default function AuthButton({ user, loading, onSignIn, onSignOut }: Props) {
  if (loading) {
    return (
      <div className="w-8 h-8 flex items-center justify-center">
        <Loader2 size={14} className="animate-spin" style={{ color: 'rgba(255,255,255,0.3)' }} />
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        {/* Avatar */}
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName ?? 'User'}
            className="w-7 h-7 rounded-full border"
            style={{ borderColor: 'rgba(255,255,255,0.15)' }}
          />
        ) : (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            {user.displayName?.[0]?.toUpperCase() ?? 'U'}
          </div>
        )}

        {/* Sign out */}
        <button
          onClick={onSignOut}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] transition-colors hover:bg-white/[0.06]"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          <LogOut size={12} strokeWidth={1.75} />
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onSignIn}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all hover:bg-white/[0.08]"
      style={{
        color: 'rgba(255,255,255,0.6)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <LogIn size={13} strokeWidth={1.75} />
      Sign in
    </button>
  );
}
