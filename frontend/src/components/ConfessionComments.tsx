import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Send } from 'lucide-react';

interface ConfessionCommentsProps {
  confessionId: string;
  onComment: () => void;
}

const ConfessionComments: React.FC<ConfessionCommentsProps> = ({ confessionId, onComment }) => {
  const [comments, setComments] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get(`/api/confessions/${confessionId}/comments`).then(r => setComments(r.data)).catch(() => {});
  }, [confessionId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/api/confessions/${confessionId}/comments`, { text });
      setComments(prev => [...prev, { text, createdAt: new Date().toISOString(), _id: Date.now() }]);
      setText('');
      onComment();
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-slate-800/60">
      {/* Existing comments */}
      <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
        {comments.length === 0 && (
          <p className="text-[13px] text-slate-600 text-center py-2">No comments yet. Be the first!</p>
        )}
        {comments.map((c, i) => (
          <div key={c._id || i} className="flex gap-2.5">
            <div className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-xs">
              👤
            </div>
            <div className="bg-slate-800/60 rounded-xl px-3 py-2 flex-1">
              <p className="text-[11px] font-semibold text-slate-500 mb-0.5">Anonymous</p>
              <p className="text-[13px] text-slate-300 leading-snug">{c.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Add comment */}
      <form onSubmit={submit} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          placeholder="Add a comment…"
          value={text}
          onChange={e => setText(e.target.value)}
          maxLength={300}
          className="flex-1 bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-primary-500/50"
        />
        <button
          type="submit"
          disabled={!text.trim() || submitting}
          aria-label="Submit comment"
          className="p-2.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded-xl"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default ConfessionComments;
