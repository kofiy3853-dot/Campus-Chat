import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import axios from 'axios';

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
      const { data } = await axios.post('/api/confessions', { text: text.trim() });
      onPosted(data);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white">Share a Confession</h2>
            <p className="text-xs text-slate-500 mt-0.5">Your identity will never be revealed publicly</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 text-slate-600 hover:text-white rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-5">
          {/* Rules */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Community Rules</span>
            </div>
            <ul className="space-y-1.5">
              {RULES.map((rule, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] text-slate-400">
                  <span className="text-amber-500 mt-0.5 shrink-0">•</span>
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
              className="w-full bg-slate-800/60 border border-slate-700/50 rounded-2xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-primary-500/50 resize-none"
            />
            <span className={`absolute bottom-3 right-4 text-[11px] ${text.length > MAX * 0.9 ? 'text-amber-400' : 'text-slate-600'}`}>
              {text.length}/{MAX}
            </span>
          </div>

          {/* Agree checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-violet-500 shrink-0"
            />
            <span className="text-[13px] text-slate-400">
              I agree to the community rules and understand that violations may result in removal or a ban.
            </span>
          </label>

          {error && <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2">{error}</p>}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-slate-700 text-slate-400 text-sm font-medium hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !text.trim()}
              className="flex-1 py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-bold shadow-lg shadow-violet-600/20"
            >
              {submitting ? 'Posting…' : 'Post Anonymously'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfessionCompose;
