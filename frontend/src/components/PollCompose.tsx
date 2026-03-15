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
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto hide-scrollbar">
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-slate-50 p-8 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Create a Poll</h2>
            <p className="text-xs text-slate-400 mt-1 font-medium">Ask the community a question</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors" title="Close">
            <X className="w-5 h-5" />
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
              className="w-full bg-slate-50 border-none rounded-3xl px-5 py-4 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-sky-500/20 resize-none shadow-inner shadow-slate-200/50"
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
                    className="flex-1 bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-sky-500/20"
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
                className="mt-4 w-full py-3.5 border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-2xl text-slate-400 hover:text-sky-500 hover:border-sky-200 hover:bg-sky-50/50 transition-colors flex items-center justify-center gap-2 text-xs font-black tracking-widest uppercase"
              >
                <Plus className="w-4 h-4" /> Add Option
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
                  className="peer shrink-0 w-5 h-5 appearance-none rounded border-2 border-slate-200 checked:bg-sky-500 checked:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all cursor-pointer"
                />
                <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-[13px] font-medium text-slate-500 group-hover:text-slate-700 transition-colors">Make this poll anonymous</span>
            </label>

            <label className="flex items-center gap-4 cursor-pointer group">
              <div className="relative flex items-center justify-center shrink-0">
                <input
                  type="checkbox"
                  checked={hideResults}
                  onChange={(e) => setHideResults(e.target.checked)}
                  className="peer shrink-0 w-5 h-5 appearance-none rounded border-2 border-slate-200 checked:bg-sky-500 checked:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all cursor-pointer"
                />
                <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-[13px] font-medium text-slate-500 group-hover:text-slate-700 transition-colors">Hide results until user votes</span>
            </label>

            <div className="pt-2">
              <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest mb-2">Expiration (Optional)</label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full bg-white border border-slate-100 rounded-2xl px-4 py-3 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-sky-500/20 shadow-sm"
                placeholder="Select expiration date and time"
                title="Expiration date and time"
              />
            </div>
          </div>

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
              disabled={loading}
              className="flex-1 py-4 rounded-2xl bg-sky-500 text-white text-sm font-black tracking-widest uppercase shadow-lg shadow-sky-200 hover:bg-sky-600 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Poll'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PollCompose;
