import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import api from '../services/api';

interface ConfessionComposeProps {
  onClose: () => void;
  onPosted: (confession: any) => void;
}

const RULES = [
  'No bullying or harassment of individuals',
  'No hate speech or discriminatory language',
  'No personal attacks or revealing private identities',
  'Keep it respectful — you are still responsible for what you post',
];

const ConfessionCompose: React.FC<ConfessionComposeProps> = ({ onClose, onPosted }) => {
  const [text, setText] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const MAX = 500;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) return setError('You must agree to the community rules before posting.');
    if (text.trim().length < 5) return setError('Please write at least 5 characters.');
    setError('');
    setSubmitting(true);
    try {
      const { data } = await api.post('/api/confessions', { text: text.trim() });
      onPosted(data);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-4 border-b border-slate-50">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Share a Confession</h2>
            <p className="text-xs text-slate-400 mt-1 font-medium">Your identity will never be revealed</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="p-8 space-y-6">
          {/* Rules */}
          <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100/50">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-[11px] font-black text-amber-500 uppercase tracking-widest">Community Rules</span>
            </div>
            <ul className="space-y-2">
              {RULES.map((rule, i) => (
                <li key={i} className="flex items-start gap-2 text-xs font-medium text-slate-600">
                  <span className="text-amber-400 mt-0.5 shrink-0">•</span>
                  {rule}
                </li>
              ))}
            </ul>
          </div>

          {/* Textarea */}
          <div className="relative">
            <textarea
              value={text}
              onChange={e => setText(e.target.value.slice(0, MAX))}
              rows={4}
              placeholder="What's on your mind? Share anonymously…"
              className="w-full bg-slate-50 border-none rounded-3xl px-6 py-5 text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-violet-500/20 resize-none shadow-inner shadow-slate-200/50"
            />
            <div className={`absolute bottom-4 right-6 text-[11px] font-black tracking-widest px-2 py-1 rounded-full ${text.length > MAX * 0.9 ? 'text-amber-500 bg-amber-50' : 'text-slate-400 bg-white shadow-sm'}`}>
              {text.length}/{MAX}
            </div>
          </div>

          {/* Agree checkbox */}
          <label className="flex items-start gap-4 cursor-pointer group">
            <div className="relative flex items-center justify-center mt-0.5 shrink-0">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="peer shrink-0 w-5 h-5 appearance-none rounded border-2 border-slate-200 checked:bg-violet-500 checked:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all cursor-pointer"
              />
              <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-[13px] font-medium text-slate-500 group-hover:text-slate-700 transition-colors leading-relaxed">
              I agree to the community rules and understand that violations may result in removal or a ban.
            </span>
          </label>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-xs text-red-600 font-semibold animate-pulse flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></div>
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl border border-transparent bg-slate-50 text-slate-500 hover:text-slate-700 text-sm font-black tracking-widest uppercase hover:bg-slate-100 transition-all flex items-center justify-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !text.trim()}
              className="flex-1 py-4 rounded-2xl bg-violet-500 text-white text-sm font-black tracking-widest uppercase shadow-lg shadow-violet-200 hover:bg-violet-600 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50"
            >
              {submitting ? 'Posting…' : 'Share Anonymously'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfessionCompose;
