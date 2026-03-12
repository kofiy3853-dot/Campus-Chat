import React, { useState, useEffect } from 'react';
import { Search, X, MessageSquare, User } from 'lucide-react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

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

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4">
          <div 
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />
          
          <div
            className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-4 border-b border-slate-800 flex items-center gap-4">
              <Search className="w-5 h-5 text-slate-500" />
              <input
                autoFocus
                id="user-search-input"
                aria-label="Search users by name or ID"
                type="text"
                placeholder="Search users by name or ID..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-white text-lg placeholder:text-slate-600"
              />
              <button title="Close Search" onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-hide">
              {loading ? (
                <div className="p-12 flex flex-col items-center gap-4">
                  <p className="text-slate-500 font-medium">Searching the campus...</p>
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-1">
                  {results.map((user) => (
                    <button
                      key={user._id}
                      onClick={() => startConversation(user._id)}
                      className="w-full flex items-center gap-4 p-4 hover:bg-slate-800/50 rounded-2xl group"
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-800 group-hover:border-primary-500/50">
                        <img src={user.profile_picture || `https://ui-avatars.com/api/?name=${user.name}`} alt="" />
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className="font-bold text-white group-hover:text-primary-400">{user.name}</h4>
                        <p className="text-sm text-slate-500">{user.student_id} • {user.department || 'No department'}</p>
                      </div>
                      <MessageSquare className="w-5 h-5 text-slate-600 group-hover:text-primary-500" />
                    </button>
                  ))}
                </div>
              ) : query.length >= 2 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-slate-600" />
                  </div>
                  <p className="text-slate-400 font-medium">No students found matching "{query}"</p>
                  <p className="text-slate-600 text-sm mt-1">Try searching by their full name or ID</p>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <p className="text-sm">Start typing to search for people...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserSearchModal;
