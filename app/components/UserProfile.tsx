'use client';
import { useState, useEffect } from 'react';
import { User, Phone, Calendar, MapPin, FileText, X, Save, Loader2 } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { ModeConfig } from '@/app/lib/types';

interface Props {
  uid: string;
  currentMode: ModeConfig;
  onClose: () => void;
}

export default function UserProfile({ uid, currentMode, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    displayName: '',
    phone: '',
    dob: '',
    gender: '',
    address: '',
    bio: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) {
          const d = snap.data();
          setForm({
            displayName: d.displayName ?? '',
            phone: d.phone ?? '',
            dob: d.dob ?? '',
            gender: d.gender ?? '',
            address: d.address ?? '',
            bio: d.bio ?? '',
          });
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, [uid]);

  const save = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', uid), { ...form });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  };

  const field = (label: string, key: keyof typeof form, icon: React.ReactNode, type = 'text', opts?: string[]) => (
    <div>
      <label className="text-xs font-medium mb-1.5 block" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</label>
      {opts ? (
        <select
          value={form[key]}
          onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
          className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <option value="">Select {label}</option>
          {opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>{icon}</span>
          <input
            type={type}
            value={form[key]}
            onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
            className="flex-1 bg-transparent outline-none text-white text-sm placeholder-white/25"
            placeholder={label}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="w-full max-w-[420px] max-h-[90vh] overflow-y-auto rounded-2xl" style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,0.08)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <h2 className="text-base font-semibold text-white">Edit Profile</h2>
          <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.4)' }}><X size={18} /></button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={22} className="animate-spin" style={{ color: currentMode.accent }} />
          </div>
        ) : (
          <div className="p-5 space-y-3">
            {field('Full Name', 'displayName', <User size={14} />)}
            {field('Phone Number', 'phone', <Phone size={14} />, 'tel')}
            {field('Date of Birth', 'dob', <Calendar size={14} />, 'date')}
            {field('Gender', 'gender', <User size={14} />, 'text', ['Male', 'Female', 'Non-binary', 'Prefer not to say'])}
            {field('Address', 'address', <MapPin size={14} />)}
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'rgba(255,255,255,0.4)' }}>Bio</label>
              <textarea
                value={form.bio}
                onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                rows={3}
                placeholder="Tell us about yourself…"
                className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none resize-none placeholder-white/25"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}
              />
            </div>
            <button onClick={save} disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white mt-2"
              style={{ background: saved ? '#34d39920' : currentMode.gradient, border: saved ? '1px solid #34d39940' : 'none' }}>
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saved ? 'Saved!' : saving ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
