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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Create a Poll</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Question */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Poll Question</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What do you want to ask?"
              maxLength={200}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 resize-none"
              rows={3}
            />
            <p className="text-xs text-slate-400 mt-1">{question.length}/200</p>
          </div>

          {/* Options */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">Answer Options (2-5)</label>
            <div className="space-y-2">
              {options.map((option, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                    maxLength={100}
                    className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {options.length < 5 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="mt-3 w-full py-2 border border-dashed border-slate-600 rounded-lg text-slate-400 hover:text-slate-300 hover:border-slate-500 transition flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Option
              </button>
            )}
          </div>

          {/* Settings */}
          <div className="space-y-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700/30">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 cursor-pointer"
              />
              <span className="text-sm text-slate-300">Make this poll anonymous</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hideResults}
                onChange={(e) => setHideResults(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 cursor-pointer"
              />
              <span className="text-sm text-slate-300">Hide results until user votes</span>
            </label>

            <div>
              <label className="text-sm font-medium text-slate-300 block mb-2">Expiration (Optional)</label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium rounded-lg transition"
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
