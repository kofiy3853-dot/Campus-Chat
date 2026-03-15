import React, { useState } from 'react';
import { X, Lock, Loader2 } from 'lucide-react';
import api from '../services/api';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      await api.put('/api/auth/password', {
        currentPassword,
        newPassword
      });
      setSuccess('Password changed successfully');
      setTimeout(() => {
        onClose();
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSuccess('');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-slate-50 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
              <Lock className="w-5 h-5 text-sky-500" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Change Password</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-xs text-red-600 font-semibold flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></div>
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-xs text-green-600 font-semibold flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></div>
              {success}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest mb-2">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-sky-500/20"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-sky-500/20"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest mb-2">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-sky-500/20"
                required
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl border border-transparent bg-slate-50 text-slate-500 hover:text-slate-700 text-sm font-black tracking-widest uppercase hover:bg-slate-100 transition-all flex items-center justify-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !!success}
              className="flex-1 py-4 rounded-2xl bg-sky-500 text-white text-sm font-black tracking-widest uppercase shadow-lg shadow-sky-200 hover:bg-sky-600 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
