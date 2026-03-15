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
  const [connectedUsers, setConnectedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSuggested, setLoadingSuggested] = useState(false);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConnected = async () => {
      setLoadingSuggested(true);
      try {
        const { data } = await api.get('/api/connections/accepted');
        setConnectedUsers(data);
      } catch (error) {
        console.error('Error fetching connections:', error);
      } finally {
        setLoadingSuggested(false);
      }
    };
    if (isOpen) fetchConnected();
  }, [isOpen]);

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
    if (selectedMembers.some(m => m._id === user._id)) return;
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
          <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Add Members</label>
              <span className="text-[10px] font-bold text-slate-300">{selectedMembers.length} selected</span>
            </div>

            {/* Selected Members Chips */}
            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2 p-1">
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

            {/* Suggested Contacts (Users user is chatting with) */}
            {connectedUsers.length > 0 && !searchQuery && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-1">Suggested from your chats</h4>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-1 px-1">
                  {connectedUsers.filter(u => !selectedMembers.some(m => m._id === u._id)).map((connectedUser) => (
                    <button
                      key={connectedUser._id}
                      onClick={() => addMember(connectedUser)}
                      className="flex flex-col items-center gap-2 group shrink-0"
                    >
                      <div className="relative">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-slate-100 group-hover:border-sky-500 transition-all p-0.5">
                          <img 
                            src={getMediaUrl(connectedUser.profile_picture) || `https://ui-avatars.com/api/?name=${connectedUser.name}`} 
                            alt="" 
                            className="w-full h-full object-cover rounded-[0.8rem]"
                          />
                        </div>
                        <div className="absolute -top-1 -right-1 bg-sky-500 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                          <Plus className="w-3 h-3" />
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 max-w-[60px] truncate">{connectedUser.name.split(' ')[0]}</span>
                    </button>
                  ))}
                  {connectedUsers.filter(u => !selectedMembers.some(m => m._id === u._id)).length === 0 && (
                    <p className="text-[10px] text-slate-300 font-bold uppercase py-4">All contacts added</p>
                  )}
                </div>
              </div>
            )}

            {/* Search Input */}
            <div className="relative group/search">
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-slate-100 group-focus-within/search:bg-sky-500 transition-colors"></div>
              <div className="relative flex items-center py-4 focus-within:bg-white transition-all duration-300">
                <Search className={clsx("w-5 h-5 mr-3 transition-colors", loading ? "text-sky-500 animate-pulse" : "text-slate-400 group-focus-within/search:text-sky-500")} />
                <input 
                  type="text" 
                  placeholder="Search and add other students..."
                  className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-slate-700 placeholder:text-slate-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Search Results Dropdown */}
              {searchQuery.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-100 rounded-[2rem] shadow-2xl z-50 overflow-hidden max-h-72 overflow-y-auto scrollbar-hide animate-in slide-in-from-top-2 duration-300">
                  {loading ? (
                    <div className="p-10 text-center">
                      <Loader2 className="w-8 h-8 text-sky-500 animate-spin mx-auto mb-3" />
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Searching Database...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="p-3 space-y-1">
                      {searchResults.map((user) => (
                        <button
                          key={user._id}
                          onClick={() => addMember(user)}
                          className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-all group/item"
                        >
                          <div className="w-12 h-12 rounded-2xl overflow-hidden border border-slate-100 group-hover/item:border-sky-200 transition-colors">
                            <img src={getMediaUrl(user.profile_picture) || `https://ui-avatars.com/api/?name=${user.name}`} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-black text-slate-700">{user.name}</h4>
                              {user.connection_status === 'accepted' && (
                                <span className="text-[8px] bg-sky-100 text-sky-600 px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider">Connected</span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{user.student_id} • {user.department}</p>
                          </div>
                          <div className="w-10 h-10 flex items-center justify-center bg-slate-50 group-hover/item:bg-sky-500 group-hover/item:text-white rounded-xl transition-all text-slate-300">
                            <Plus className="w-5 h-5" />
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-10 text-center">
                      <p className="text-xs font-black text-slate-300 uppercase tracking-widest">No students matched your search</p>
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
            disabled={creating || !groupName.trim() || selectedMembers.length === 0}
            onClick={handleCreate}
            className="w-full bg-slate-900 shadow-xl shadow-slate-200 hover:bg-black disabled:opacity-20 disabled:cursor-not-allowed text-white py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-3"
          >
            {creating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Hub...
              </>
            ) : (
              <>
                <Users className="w-5 h-5" />
                Establish Group
              </>
            )}
          </button>
          <p className="text-center text-[10px] text-slate-300 font-bold uppercase tracking-widest mt-4">
            Members will receive an invitation to join
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;
