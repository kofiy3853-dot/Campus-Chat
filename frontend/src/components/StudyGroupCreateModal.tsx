import React, { useState } from 'react';
import { X, BookOpen, Calendar, Shield, ShieldOff, Plus, Loader2 } from 'lucide-react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';

interface StudyGroupCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const StudyGroupCreateModal: React.FC<StudyGroupCreateModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    group_name: '',
    subject: '',
    description: '',
    schedule: '',
    max_members: 50,
    visibility: 'public' as 'public' | 'private'
  });
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async () => {
    if (!formData.group_name.trim()) {
      alert('Please enter a group name');
      return;
    }

    setCreating(true);
    try {
      const { data } = await api.post('/api/groups/create', formData);
      navigate(`/dashboard/study-groups/${data._id}`);
      onClose();
      setFormData({
        group_name: '',
        subject: '',
        description: '',
        schedule: '',
        max_members: 50,
        visibility: 'public'
      });
    } catch (error: any) {
      console.error('Error creating study group:', error);
      alert(error.response?.data?.message || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
      />
      
      <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">New Study Group</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Collaborative Learning Space</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            aria-label="Close modal"
            className="p-3 hover:bg-white hover:shadow-sm rounded-2xl text-slate-400 transition-all active:scale-95"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 scrollbar-hide">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Group Name */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1" htmlFor="group_name">Group Name *</label>
              <input 
                id="group_name"
                type="text" 
                placeholder="e.g. Advanced Networking"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-base font-medium text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all"
                value={formData.group_name}
                onChange={(e) => setFormData({...formData, group_name: e.target.value})}
              />
            </div>

            {/* Course/Subject */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1" htmlFor="subject">Course / Subject</label>
              <input 
                id="subject"
                type="text" 
                placeholder="e.g. CS302"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-base font-medium text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all"
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
              />
            </div>

            {/* Schedule */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1" htmlFor="schedule">Meeting Schedule</label>
              <div className="relative">
                <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                <input 
                  id="schedule"
                  type="text" 
                  placeholder="e.g. Mon, Wed @ 4PM"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-base font-medium text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all"
                  value={formData.schedule}
                  onChange={(e) => setFormData({...formData, schedule: e.target.value})}
                />
              </div>
            </div>

            {/* Max Members */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1" htmlFor="max_members">Max Members</label>
              <input 
                id="max_members"
                type="number" 
                min="2"
                max="200"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-base font-medium text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all"
                value={formData.max_members}
                onChange={(e) => setFormData({...formData, max_members: parseInt(e.target.value)})}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1" htmlFor="description">Description</label>
            <textarea 
              id="description"
              placeholder="What will you study? Any prerequisites?"
              rows={3}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-base font-medium text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all resize-none"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          {/* Visibility Toggle */}
          <div className="space-y-4">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Group Visibility</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({...formData, visibility: 'public'})}
                className={clsx(
                  "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left",
                  formData.visibility === 'public' 
                    ? "border-indigo-500 bg-indigo-50/50" 
                    : "border-slate-100 bg-slate-50 hover:border-slate-200"
                )}
              >
                <div className={clsx(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                  formData.visibility === 'public' ? "bg-indigo-500 text-white" : "bg-slate-200 text-slate-400"
                )}>
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-700">Public</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Anyone can discover & join</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({...formData, visibility: 'private'})}
                className={clsx(
                  "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left",
                  formData.visibility === 'private' 
                    ? "border-purple-500 bg-purple-50/50" 
                    : "border-slate-100 bg-slate-50 hover:border-slate-200"
                )}
              >
                <div className={clsx(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                  formData.visibility === 'private' ? "bg-purple-500 text-white" : "bg-slate-200 text-slate-400"
                )}>
                  <ShieldOff className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-700">Private</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Membership by invitation only</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 md:p-8 bg-slate-50/50 border-t border-slate-100">
          <button 
            disabled={creating || !formData.group_name.trim()}
            onClick={handleCreate}
            className="w-full bg-slate-900 shadow-xl shadow-slate-200 hover:bg-black disabled:opacity-20 disabled:cursor-not-allowed text-white py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-3"
          >
            {creating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Space...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Establish Study Group
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudyGroupCreateModal;
