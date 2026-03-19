import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { clsx } from 'clsx';
import { getMediaUrl } from '../utils/imageUrl';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeTab, setActiveTab] = useState<'chats' | 'groups'>('chats');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [convs, grps] = await Promise.all([
          api.get('/api/chat/conversations'),
          api.get('/api/groups')
        ]);
        setConversations(convs.data);
        setGroups(grps.data);
      } catch (err) {
        console.error('Error fetching sidebar data:', err);
      }
    };
    if (user) fetchData();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={clsx(
      "h-full bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-gray-800 flex flex-col transition-none",
      isOpen ? "w-80" : "w-20"
    )}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-50 dark:border-gray-800">
        {isOpen ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-400 rounded-xl flex items-center justify-center font-bold text-lg text-white">
              N
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-800 dark:text-gray-200">
              Campus-Networking
            </span>
          </div>
        ) : (
          <div className="w-10 h-10 bg-sky-400 rounded-xl flex items-center justify-center mx-auto font-bold text-lg text-white">
            N
          </div>
        )}
      </div>

      {/* Tabs */}
      {isOpen && (
        <div className="px-4 py-3 flex gap-2">
          <button 
            onClick={() => setActiveTab('chats')}
            className={clsx(
              "flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-none",
              activeTab === 'chats' ? "bg-sky-50 text-sky-500" : "text-gray-400 hover:text-sky-500 hover:bg-gray-50"
            )}
          >
            Chats
          </button>
          <button 
            onClick={() => setActiveTab('groups')}
            className={clsx(
              "flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-none",
              activeTab === 'groups' ? "bg-sky-50 text-sky-500" : "text-gray-400 hover:text-sky-500 hover:bg-gray-50"
            )}
          >
            Groups
          </button>
        </div>
      )}

      {/* Search */}
      {isOpen && (
        <div className="px-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search conversations..."
              className="w-full bg-gray-50 border border-gray-100 rounded-lg py-2 pl-9 pr-3 text-sm focus:ring-1 focus:ring-sky-400 outline-none transition-none"
            />
          </div>
        </div>
      )}

      {/* List Area */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="px-2 space-y-1">
          {activeTab === 'chats' ? (
            conversations.map((conv: any) => (
              <NavLink 
                key={conv._id}
                to={`/dashboard/chat/${conv._id}`}
                className={({ isActive }) => clsx(
                  "flex items-center gap-3 p-3 rounded-xl group transition-none",
                  isActive ? "bg-sky-50 text-sky-500" : "hover:bg-gray-50 text-gray-400"
                )}
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gray-100 border-2 border-gray-50 overflow-hidden">
                    <img src={getMediaUrl(conv.participants[0].profile_picture) || `https://ui-avatars.com/api/?name=${conv.participants[0].name}`} alt="" />
                  </div>
                  {conv.participants[0].status === 'online' && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                {isOpen && (
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h4 className="font-semibold truncate text-gray-800">{conv.participants[0].name}</h4>
                      <span className="text-[10px] text-gray-400">{new Date(conv.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-sm truncate text-gray-400">{conv.last_message?.message_text || 'No messages yet'}</p>
                  </div>
                )}
              </NavLink>
            ))
          ) : (
            groups.map((group: any) => (
              <NavLink 
                key={group._id}
                to={`/dashboard/groups/${group._id}`}
                className={({ isActive }) => clsx(
                  "flex items-center gap-3 p-3 rounded-xl group transition-none",
                  isActive ? "bg-sky-50 text-sky-500" : "hover:bg-gray-50 text-gray-400"
                )}
              >
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-lg font-bold border-2 border-gray-50 text-sky-400">
                  {group.group_name[0]}
                </div>
                {isOpen && (
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate text-gray-800">{group.group_name}</h4>
                    <p className="text-sm truncate text-gray-400">{group.members.length} members</p>
                  </div>
                )}
              </NavLink>
            ))
          )}
        </div>
      </div>

      {/* Footer / Navigation */}
      <div className="p-4 border-t border-gray-100 space-y-2">
        
        <div className="pt-2 flex items-center justify-between">
          {isOpen ? (
            <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer flex-1 group transition-none">
              <div className="flex-1 min-w-0 transition-none">
                <p className="text-sm font-semibold truncate text-gray-800 dark:text-gray-200">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 w-full transition-none">
              <button 
                onClick={handleLogout} 
                aria-label="Logout"
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-none"
              >
                <LogOut className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
