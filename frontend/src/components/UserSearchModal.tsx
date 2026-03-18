import React, { useState, useEffect } from 'react';
import { Search, X, MessageSquare, User, GraduationCap, ChevronRight } from 'lucide-react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { getMediaUrl } from '../utils/imageUrl';

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserSearchModal: React.FC<UserSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const search = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const { data } = await api.get(`/api/auth/search?query=${query}`);
        setResults(data);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const startConversation = async (userId: string) => {
    try {
      const { data } = await api.post('/api/chat/conversations', { participantId: userId });
      navigate(`/dashboard/chat/${data._id}`);
      onClose();
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4 bg-slate-900/40 backdrop-blur-md">
      <div 
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      
      <div
        className="relative w-full max-w-xl bg-white border border-slate-100 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[75vh] animate-in fade-in zoom-in duration-300"
      >
        <div className="p-6 border-b border-slate-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center border border-sky-100 shrink-0">
            <Search className="w-6 h-6 text-sky-500" />
          </div>
          <input
            autoFocus
            id="user-search-input"
            type="text"
            placeholder="Search students by name or ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-lg font-bold text-slate-800 placeholder:text-slate-300"
          />
          <button 
            onClick={onClose}
            title="Close"
            className="p-2.5 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-16 h-16 border-4 border-sky-100 border-t-sky-500 rounded-full animate-spin" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Finding your peers...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {results.map((user) => (
                <button
                  key={user._id}
                  onClick={() => startConversation(user._id)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 rounded-3xl group border border-transparent hover:border-slate-100 transition-all text-left"
                >
                  <div className="relative w-14 h-14 shrink-0">
                    <img 
                      src={getMediaUrl(user.profile_picture) || `https://ui-avatars.com/api/?name=${user.name}&background=0EA5E9&color=fff`} 
                      className="w-full h-full rounded-2xl object-cover border-2 border-white shadow-sm ring-1 ring-slate-100 group-hover:ring-sky-200"
                      alt={user.name} 
                    />
                    {user.status === 'online' && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-slate-800 group-hover:text-sky-600 truncate">{user.name}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                      <GraduationCap className="w-3 h-3" />
                      <span className="truncate">{user.department || 'Student'} • {user.student_id}</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:bg-sky-50 group-hover:text-sky-500 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </button>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-slate-100">
                <User className="w-10 h-10 text-slate-200" />
              </div>
              <h3 className="text-slate-800 font-black text-lg mb-1">No students found</h3>
              <p className="text-slate-400 text-sm font-medium mb-1">We couldn't find anyone matching "{query}"</p>
              <p className="text-slate-300 text-xs font-bold uppercase tracking-widest">Try a full name or Student ID</p>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-sky-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-sky-100">
                <MessageSquare className="w-10 h-10 text-sky-200" />
              </div>
              <h3 className="text-slate-800 font-black text-lg mb-2">New Message</h3>
              <p className="text-slate-400 text-sm font-medium">Search for students across campus to start a new private conversation.</p>
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-slate-50 bg-slate-50/50">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-center">Find your community on Campus Connect</p>
        </div>
      </div>
    </div>
  );
};

export default UserSearchModal;
