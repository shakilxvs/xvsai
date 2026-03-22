'use client';
import { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Chrome, ArrowRight, RotateCcw } from 'lucide-react';
import { ModeConfig } from '@/app/lib/types';

type AuthView = 'login' | 'register' | 'reset';

interface Props {
  currentMode: ModeConfig;
  onGoogleSignIn: () => void;
  onEmailSignIn: (email: string, password: string) => Promise<void>;
  onEmailRegister: (email: string, password: string, name: string) => Promise<void>;
  onResetPassword: (email: string) => Promise<void>;
  error?: string;
}

export default function AuthScreen({ currentMode, onGoogleSignIn, onEmailSignIn, onEmailRegister, onResetPassword, error }: Props) {
  const [view, setView] = useState<AuthView>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [err, setErr] = useState('');

  const handleSubmit = async () => {
    setErr('');
    setMessage('');
    if (!email) { setErr('Email is required'); return; }
    setLoading(true);
    try {
      if (view === 'login') {
        if (!password) { setErr('Password is required'); setLoading(false); return; }
        await onEmailSignIn(email, password);
      } else if (view === 'register') {
        if (!name) { setErr('Name is required'); setLoading(false); return; }
        if (!password || password.length < 6) { setErr('Password must be at least 6 characters'); setLoading(false); return; }
        await onEmailRegister(email, password, name);
        setMessage('Account created! Please verify your email, then wait for approval.');
      } else {
        await onResetPassword(email);
        setMessage('Password reset email sent! Check your inbox.');
      }
    } catch (e: any) {
      const msg = e?.message ?? 'Something went wrong';
      if (msg.includes('email-already-in-use')) setErr('Email already registered. Try logging in.');
      else if (msg.includes('wrong-password') || msg.includes('invalid-credential')) setErr('Wrong email or password.');
      else if (msg.includes('user-not-found')) setErr('No account with this email.');
      else setErr(msg);
    }
    setLoading(false);
  };



  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#05050a' }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 60% 50% at 50% 0%, ${currentMode.glow} 0%, transparent 100%)` }} />
      <div className="fixed inset-0 pointer-events-none dot-grid" />

      <div className="relative z-10 w-full max-w-[380px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white mx-auto mb-4" style={{ background: currentMode.gradient }}>X</div>
          <h1 className="text-2xl font-bold text-white">XVSai</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {view === 'login' ? 'Welcome back' : view === 'register' ? 'Create account' : 'Reset password'}
          </p>
        </div>

        <div className="space-y-3">
          {/* Google */}
          {view !== 'reset' && (
            <button onClick={onGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <Chrome size={18} />
              Continue with Google
            </button>
          )}

          {view !== 'reset' && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>or</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            </div>
          )}

          {/* Fields */}
          {view === 'register' && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <User size={16} style={{ color: 'rgba(255,255,255,0.35)' }} />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Full name"
                className="flex-1 bg-transparent outline-none text-white placeholder-white/30"
                style={{ fontSize: '16px' }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>
          )}
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Mail size={16} style={{ color: 'rgba(255,255,255,0.35)' }} />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email address"
              className="flex-1 bg-transparent outline-none text-white placeholder-white/30"
              style={{ fontSize: '16px' }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          {view !== 'reset' && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Lock size={16} style={{ color: 'rgba(255,255,255,0.35)' }} />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                className="flex-1 bg-transparent outline-none text-white placeholder-white/30"
                style={{ fontSize: '15px' }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
              <button onClick={() => setShowPass(!showPass)} style={{ color: 'rgba(255,255,255,0.3)' }}>
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          )}

          {(err || error) && (
            <p className="text-sm px-1" style={{ color: '#f87171' }}>{err || error}</p>
          )}
          {message && (
            <p className="text-sm px-1" style={{ color: '#34d399' }}>{message}</p>
          )}

          <button onClick={handleSubmit} disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white transition-all disabled:opacity-50 active:scale-[0.98]"
            style={{ background: loading ? 'rgba(255,255,255,0.1)' : currentMode.gradient }}>
            {loading ? 'Please wait…' : view === 'login' ? 'Sign In' : view === 'register' ? 'Create Account' : 'Send Reset Email'}
            {!loading && <ArrowRight size={16} />}
          </button>

          {/* Switchers */}
          <div className="flex flex-col items-center gap-2 pt-2">
            {view === 'login' && (
              <>
                <button onClick={() => { setView('register'); setErr(''); setMessage(''); }} className="text-sm" style={{ color: currentMode.accent }}>
                  Don't have an account? Register
                </button>
                <button onClick={() => { setView('reset'); setErr(''); setMessage(''); }} className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Forgot password?
                </button>
              </>
            )}
            {view === 'register' && (
              <button onClick={() => { setView('login'); setErr(''); setMessage(''); }} className="text-sm" style={{ color: currentMode.accent }}>
                Already have an account? Sign in
              </button>
            )}
            {view === 'reset' && (
              <button onClick={() => { setView('login'); setErr(''); setMessage(''); }} className="flex items-center gap-1 text-sm" style={{ color: currentMode.accent }}>
                <RotateCcw size={13} /> Back to login
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
