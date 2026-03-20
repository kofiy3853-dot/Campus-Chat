import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import api from '../services/api';

interface PollComposeProps {
  isOpen: boolean;
  onClose: () => void;
  onPollCreated?: (poll: any) => void;
}

const PollCompose: React.FC<PollComposeProps> = ({ isOpen, onClose, onPollCreated }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [hideResults, setHideResults] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddOption = () => {
    if (options.length < 5) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }

    if (options.some((opt) => !opt.trim())) {
      setError('All options must have text');
      return;
    }

    const uniqueOptions = new Set(options.map((opt) => opt.toLowerCase().trim()));
    if (uniqueOptions.size !== options.length) {
      setError('Duplicate options are not allowed');
      return;
    }

    if (expiresAt && new Date(expiresAt) <= new Date()) {
      setError('Expiration date must be in the future');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/api/polls', {
        question: question.trim(),
        options: options.map((opt) => opt.trim()),
        is_anonymous: isAnonymous,
        hide_results_until_voted: hideResults,
        expires_at: expiresAt || null,
      });

      onPollCreated?.(response.data);
      
      // Reset form
      setQuestion('');
      setOptions(['', '']);
      setIsAnonymous(false);
      setHideResults(false);
      setExpiresAt('');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create poll');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto hide-scrollbar relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-purple-50 p-8 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-black text-[#4c1d95] tracking-tight">Launch a Poll</h2>
            <p className="text-[10px] text-slate-400 mt-1 font-black uppercase tracking-widest">Gather campus insights</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-[#6d28d9] hover:bg-purple-50 rounded-xl transition-colors" title="Close">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-xs text-red-600 font-semibold animate-pulse flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></div>
              {error}
            </div>
          )}

          {/* Question */}
          <div className="relative">
            <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest mb-2">Poll Question</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What do you want to ask?"
              maxLength={200}
              className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] px-6 py-5 text-sm font-bold text-slate-800 placeholder:text-slate-300 focus:border-[#6d28d9] focus:ring-4 focus:ring-purple-500/5 outline-none resize-none transition-all"
              rows={3}
            />
            <div className={`absolute bottom-4 right-4 text-[11px] font-black tracking-widest px-2 py-1 rounded-full ${question.length > 180 ? 'text-amber-500 bg-amber-50' : 'text-slate-400 bg-white shadow-sm'}`}>
              {question.length}/200
            </div>
          </div>

          {/* Options */}
          <div>
            <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest mb-3">Answer Options (2-5)</label>
            <div className="space-y-3">
              {options.map((option, idx) => (
                <div key={idx} className="flex gap-2 items-center group">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                    maxLength={100}
                    className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-800 placeholder:text-slate-300 focus:border-[#6d28d9] focus:ring-4 focus:ring-purple-500/5 outline-none transition-all"
                  />
                  {options.length > 2 ? (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="p-3 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Remove option"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  ) : (
                    <div className="w-11"></div> /* Spacer to keep alignment when delete button is not present */
                  )}
                </div>
              ))}
            </div>

            {options.length < 5 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="mt-4 w-full py-4 border-2 border-dashed border-slate-200 bg-white rounded-[1.5rem] text-slate-400 hover:text-[#6d28d9] hover:border-purple-200 hover:bg-purple-50/50 transition-all flex items-center justify-center gap-2 text-[10px] font-black tracking-widest uppercase"
              >
                <Plus className="w-4 h-4" /> Add Logic Option
              </button>
            )}
          </div>

          {/* Settings */}
          <div className="space-y-4 p-5 bg-slate-50/80 rounded-3xl border border-slate-100/50">
            <label className="flex items-center gap-4 cursor-pointer group">
              <div className="relative flex items-center justify-center shrink-0">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="peer shrink-0 w-6 h-6 appearance-none rounded-xl border-2 border-slate-200 checked:bg-[#6d28d9] checked:border-[#6d28d9] focus:ring-4 focus:ring-purple-500/5 transition-all cursor-pointer"
                />
                <svg className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm font-bold text-slate-500 group-hover:text-slate-800 transition-colors">Broadcast Anonymously</span>
            </label>

            <label className="flex items-center gap-4 cursor-pointer group">
              <div className="relative flex items-center justify-center shrink-0">
                <input
                  type="checkbox"
                  checked={hideResults}
                  onChange={(e) => setHideResults(e.target.checked)}
                  className="peer shrink-0 w-6 h-6 appearance-none rounded-xl border-2 border-slate-200 checked:bg-[#6d28d9] checked:border-[#6d28d9] focus:ring-4 focus:ring-purple-500/5 transition-all cursor-pointer"
                />
                <svg className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm font-bold text-slate-500 group-hover:text-slate-800 transition-colors">Freeze Results until Vote</span>
            </label>

            <div className="pt-2">
              <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest mb-2">Expiration (Optional)</label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full bg-white border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-800 focus:border-[#6d28d9] focus:ring-4 focus:ring-purple-500/5 shadow-sm outline-none transition-all"
                placeholder="Select expiration date and time"
                title="Expiration date and time"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-5 rounded-[2rem] bg-slate-100 text-slate-500 hover:text-slate-800 text-[10px] font-black tracking-widest uppercase hover:bg-slate-200 transition-all active:scale-95"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-5 rounded-[2rem] bg-[#6d28d9] text-white text-[10px] font-black tracking-widest uppercase shadow-xl shadow-purple-200 hover:bg-[#5b21b6] active:scale-95 transition-all flex items-center justify-center disabled:opacity-50"
            >
              {loading ? 'Transmitting...' : 'Deploy Poll'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PollCompose;
