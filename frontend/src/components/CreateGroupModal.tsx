import React, { useState, useEffect } from 'react';
import { Search, X, Users, MessageSquare, Plus, UserPlus, Trash2, Check, Loader2 } from 'lucide-react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { getMediaUrl } from '../utils/imageUrl';
import { clsx } from 'clsx';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose }) => {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      setLoading(true);
      try {
        const { data } = await api.get(`/api/auth/search?query=${searchQuery}`);
        // Filter out already selected members
        const filteredResults = data.filter(
          (user: any) => !selectedMembers.some((m) => m._id === user._id)
        );
        setSearchResults(filteredResults);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedMembers]);

  const addMember = (user: any) => {
    setSelectedMembers([...selectedMembers, user]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeMember = (userId: string) => {
    setSelectedMembers(selectedMembers.filter((m) => m._id !== userId));
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      alert('Please enter a group name');
      return;
    }

    setCreating(true);
    try {
      const memberIds = selectedMembers.map((m) => m._id);
      const { data } = await api.post('/api/groups/create', {
        group_name: groupName,
        description,
        members: memberIds,
      });

      navigate(`/dashboard/groups/${data._id}`);
      onClose();
      // Reset state
      setGroupName('');
      setDescription('');
      setSelectedMembers([]);
    } catch (error: any) {
      console.error('Error creating group:', error);
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
            <div className="w-12 h-12 rounded-2xl bg-sky-500 flex items-center justify-center text-white shadow-lg shadow-sky-200">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Create New Group</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Connect with your peers</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            title="Close"
            className="p-3 hover:bg-white hover:shadow-sm rounded-2xl text-slate-400 transition-all active:scale-95"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scrollbar-hide">
          {/* Group Details */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="groupName" className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Group Name *</label>
              <input 
                id="groupName"
                type="text" 
                placeholder="e.g. Computer Science Cohort 2026"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-base font-medium text-slate-700 placeholder:text-slate-300 focus:bg-white focus:ring-4 focus:ring-sky-500/5 focus:border-sky-500/20 transition-all outline-none"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
              <textarea 
                id="description"
                placeholder="What's this group about?"
                rows={3}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-base font-medium text-slate-700 placeholder:text-slate-300 focus:bg-white focus:ring-4 focus:ring-sky-500/5 focus:border-sky-500/20 transition-all outline-none resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Member Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Add Members</label>
              <span className="text-[10px] font-bold text-slate-300">{selectedMembers.length} selected</span>
            </div>

            {/* Selected Members Chips */}
            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedMembers.map((member) => (
                  <div 
                    key={member._id}
                    className="flex items-center gap-2 bg-sky-50 border border-sky-100 rounded-full py-1.5 pl-1.5 pr-3 group animate-in fade-in zoom-in duration-200"
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden border border-sky-200">
                      <img 
                        src={getMediaUrl(member.profile_picture) || `https://ui-avatars.com/api/?name=${member.name}`} 
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-xs font-bold text-sky-700">{member.name.split(' ')[0]}</span>
                    <button 
                      onClick={() => removeMember(member._id)}
                      title="Remove member"
                      className="p-0.5 hover:bg-sky-200/50 rounded-full transition-colors"
                    >
                      <X className="w-3 h-3 text-sky-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search Input */}
            <div className="relative group/search">
              <div className="absolute inset-0 bg-sky-500/5 blur-xl group-focus-within/search:opacity-100 opacity-0 transition-opacity rounded-3xl"></div>
              <div className="relative flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus-within:bg-white focus-within:border-sky-200 transition-all duration-300">
                <Search className={clsx("w-5 h-5 mr-3 transition-colors", loading ? "text-sky-500 animate-pulse" : "text-slate-400 group-focus-within/search:text-sky-500")} />
                <input 
                  type="text" 
                  placeholder="Search students to invite..."
                  className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-slate-700 placeholder:text-slate-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Search Results Dropdown */}
              {searchQuery.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto scrollbar-hide animate-in slide-in-from-top-2 duration-300">
                  {loading ? (
                    <div className="p-8 text-center">
                      <Loader2 className="w-6 h-6 text-sky-500 animate-spin mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Searching...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="p-2 space-y-1">
                      {searchResults.map((user) => (
                        <button
                          key={user._id}
                          onClick={() => addMember(user)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors group/item"
                        >
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-100 group-hover/item:border-sky-200">
                            <img src={getMediaUrl(user.profile_picture) || `https://ui-avatars.com/api/?name=${user.name}`} alt="" />
                          </div>
                          <div className="flex-1 text-left">
                            <h4 className="text-sm font-bold text-slate-700">{user.name}</h4>
                            <p className="text-[10px] text-slate-400 font-medium">{user.student_id} • {user.department}</p>
                          </div>
                          <div className="p-1.5 bg-slate-50 group-hover/item:bg-sky-500 rounded-lg transition-colors">
                            <UserPlus className="w-4 h-4 text-slate-300 group-hover/item:text-white" />
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No students found</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 md:p-8 bg-slate-50/50 border-t border-slate-100">
          <button 
            disabled={creating || !groupName.trim()}
            onClick={handleCreate}
            className="w-full bg-slate-800 hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed text-white py-5 rounded-[1.5rem] font-black uppercase tracking-[0.15em] text-sm shadow-xl shadow-slate-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
          >
            {creating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Group...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Launch Group
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;
