import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  Users, 
  Megaphone, 
  User, 
  LogOut, 
  Search, 
  Plus,
  Settings,
  MoreVertical,
  ChevronLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { clsx } from 'clsx';
import { getMediaUrl } from '../utils/imageUrl';

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggle }) => {
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
      "h-full bg-slate-900 border-r border-slate-800 flex flex-col",
      isOpen ? "w-80" : "w-20"
    )}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-slate-800/50">
        {isOpen ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center font-bold text-lg text-white">
              C
            </div>
            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              CampusChat
            </span>
          </div>
        ) : (
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center mx-auto font-bold text-lg text-white">
            C
          </div>
        )}
      </div>

      {/* Tabs */}
      {isOpen && (
        <div className="px-4 py-3 flex gap-2">
          <button 
            onClick={() => setActiveTab('chats')}
            className={clsx(
              "flex-1 py-1.5 px-3 rounded-lg text-sm font-medium",
              activeTab === 'chats' ? "bg-primary-500/10 text-primary-400" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
            )}
          >
            Chats
          </button>
          <button 
            onClick={() => setActiveTab('groups')}
            className={clsx(
              "flex-1 py-1.5 px-3 rounded-lg text-sm font-medium",
              activeTab === 'groups' ? "bg-primary-500/10 text-primary-400" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search conversations..."
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg py-2 pl-9 pr-3 text-sm focus:ring-1 focus:ring-primary-500 outline-none"
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
                  "flex items-center gap-3 p-3 rounded-xl group",
                  isActive ? "bg-primary-500/10 text-primary-400" : "hover:bg-slate-800 text-slate-400"
                )}
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-700 overflow-hidden">
                    <img src={getMediaUrl(conv.participants[0].profile_picture) || `https://ui-avatars.com/api/?name=${conv.participants[0].name}`} alt="" />
                  </div>
                  {conv.participants[0].status === 'online' && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>
                  )}
                </div>
                {isOpen && (
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h4 className="font-semibold truncate text-slate-200">{conv.participants[0].name}</h4>
                      <span className="text-[10px] text-slate-500">{new Date(conv.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-sm truncate text-slate-500">{conv.last_message?.message_text || 'No messages yet'}</p>
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
                  "flex items-center gap-3 p-3 rounded-xl group",
                  isActive ? "bg-primary-500/10 text-primary-400" : "hover:bg-slate-800 text-slate-400"
                )}
              >
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-lg font-bold border-2 border-slate-700">
                  {group.group_name[0]}
                </div>
                {isOpen && (
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate text-slate-200">{group.group_name}</h4>
                    <p className="text-sm truncate text-slate-500">{group.members.length} members</p>
                  </div>
                )}
              </NavLink>
            ))
          )}
        </div>
      </div>

      {/* Footer / Navigation */}
      <div className="p-4 border-t border-slate-800/50 space-y-2">
        <NavLink 
          to="/dashboard/announcements" 
          aria-label="Campus Announcements"
          className={({ isActive }) => clsx(
            "flex items-center gap-3 p-3 rounded-xl",
            isActive ? "bg-amber-500/10 text-amber-500" : "hover:bg-slate-800 text-slate-500"
          )}
        >
          <Megaphone className="w-6 h-6" />
          {isOpen && <span className="font-medium">Announcements</span>}
        </NavLink>
        
        <div className="pt-2 flex items-center justify-between">
          {isOpen ? (
            <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800 cursor-pointer flex-1 group" onClick={() => navigate('/dashboard/profile')}>
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-500/30">
                <img src={getMediaUrl(user?.profile_picture) || `https://ui-avatars.com/api/?name=${user?.name}`} alt="" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-slate-200">{user?.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                aria-label="Logout"
                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 w-full">
              <div 
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-500/30 cursor-pointer" 
                onClick={() => navigate('/dashboard/profile')}
                role="button"
                aria-label="View Profile"
              >
                <img src={getMediaUrl(user?.profile_picture) || `https://ui-avatars.com/api/?name=${user?.name}`} alt="" />
              </div>
              <button 
                onClick={handleLogout} 
                aria-label="Logout"
                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl"
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
