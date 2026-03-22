'use client';
import { Clock, Ban, CheckCircle, LogOut } from 'lucide-react';
import { ModeConfig, UserStatus } from '@/app/lib/types';

interface Props {
  status: UserStatus;
  rejectionNote?: string;
  currentMode: ModeConfig;
  onLogout: () => void;
  userEmail?: string;
}

export default function ApprovalGate({ status, rejectionNote, currentMode, onLogout, userEmail }: Props) {
  const isPending = status === 'pending';
  const isBanned = status === 'banned';
  const isRejected = status === 'rejected';

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#05050a' }}>
      <div className="fixed inset-0 pointer-events-none dot-grid" />
      <div className="fixed inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 60% 50% at 50% 0%, ${currentMode.glow} 0%, transparent 100%)` }} />

      <div className="relative z-10 w-full max-w-[400px] text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: isPending ? 'rgba(251,191,36,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${isPending ? 'rgba(251,191,36,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
          {isPending
            ? <Clock size={28} style={{ color: '#fbbf24' }} />
            : <Ban size={28} style={{ color: '#ef4444' }} />
          }
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">
          {isPending ? 'Waiting for Approval' : 'Access Denied'}
        </h1>

        <p className="text-base leading-relaxed mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {isPending
            ? 'Your account is pending approval. The admin will review your request shortly.'
            : isBanned
              ? 'Your account has been banned from XVSai.'
              : 'Your access request was not approved.'
          }
        </p>

        {(rejectionNote) && (
          <div className="mt-4 px-4 py-3 rounded-xl text-left" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <p className="text-sm font-medium mb-1" style={{ color: '#f87171' }}>Note from admin:</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{rejectionNote}</p>
          </div>
        )}

        {userEmail && (
          <p className="text-xs mt-4" style={{ color: 'rgba(255,255,255,0.2)' }}>Signed in as {userEmail}</p>
        )}

        <button onClick={onLogout}
          className="mt-6 flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
          style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </div>
  );
}
