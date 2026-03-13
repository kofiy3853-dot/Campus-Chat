import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Megaphone, 
  Ghost, 
  Calendar, 
  Search, 
  Bell, 
  User, 
  Plus, 
  Trash2, 
  MessageSquare, 
  Users, 
  Home,
  Package
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getMediaUrl } from '../utils/imageUrl';
import { clsx } from 'clsx';

const LandingDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentChats, setRecentChats] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [chatsRes, groupsRes] = await Promise.all([
          api.get('/api/chat/conversations'),
          api.get('/api/groups')
        ]);
        setRecentChats(chatsRes.data.slice(0, 5));
        setGroups(groupsRes.data.slice(0, 5));
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const features = [
    { 
      id: 'announcements', 
      title: 'Announcements', 
      desc: 'Campus updates and official notices.', 
      icon: Megaphone, 
      color: 'bg-blue-50 text-sky-500',
      to: '/dashboard/announcements' 
    },
    { 
      id: 'confessions', 
      title: 'Campus Confessions', 
      desc: 'Anonymous student confessions.', 
      icon: Ghost, 
      color: 'bg-purple-50 text-purple-500',
      to: '/dashboard/confessions' 
    },
    { 
      id: 'events', 
      title: 'Campus Events', 
      desc: 'Discover upcoming campus events.', 
      icon: Calendar, 
      color: 'bg-green-50 text-green-500',
      to: '/dashboard/events' 
    },
    { 
      id: 'lost-found', 
      title: 'Lost & Found', 
      desc: 'Report or find lost items.', 
      icon: Package, 
      color: 'bg-orange-50 text-orange-500',
      to: '/dashboard/lost-found' 
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white text-[#333333]">
      {/* Main Content */}
      <main className="flex-1 pb-24 px-4 overflow-y-auto pt-8">
        {/* Feature Grid */}
        <section className="mb-8">
          <div className="grid grid-cols-2 gap-4">
            {features.map((f) => (
              <button 
                key={f.id} 
                onClick={() => navigate(f.to)}
                className="flex flex-col items-start p-4 bg-white border border-gray-100 rounded-3xl text-left hover:border-sky-200 transition-none"
              >
                <div className={clsx("p-3 rounded-2xl mb-4 transition-none", f.color)}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-sm mb-1">{f.title}</h3>
                <p className="text-[10px] text-gray-400 leading-tight">{f.desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Groups Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Groups</h2>
            <button onClick={() => navigate('/dashboard/groups')} className="text-sky-500 text-sm font-bold flex items-center gap-1">
              See All
            </button>
          </div>
          <div className="space-y-3">
            {groups.map((group) => (
              <div key={group._id} className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-2xl border border-transparent hover:border-sky-100 transition-none">
                <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center text-sky-500 font-bold text-lg transition-none">
                  {group.group_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm truncate text-gray-800">{group.group_name}</h4>
                  <p className="text-[10px] text-gray-500 truncate">{group.members.length} members • {group.last_message?.message_text || 'No messages'}</p>
                </div>
                {group.owner === user?._id && (
                  <button title="Delete Group" className="p-2 text-gray-300 hover:text-red-500 transition-none">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button 
              onClick={() => navigate('/dashboard/groups/new')} 
              title="Create New Group"
              className="fixed bottom-24 right-6 w-14 h-14 bg-sky-400 text-white rounded-full flex items-center justify-center shadow-lg shadow-sky-200 z-50 active:scale-95 transition-none"
            >
              <Plus className="w-8 h-8" />
            </button>
          </div>
        </section>

        {/* Recent Chats Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Recent Chats</h2>
            <button onClick={() => navigate('/dashboard/chats')} className="text-sky-500 text-sm font-bold">See All</button>
          </div>
          <div className="space-y-4">
            {recentChats.map((chat) => {
              const otherUser = chat.participants.find((p: any) => p._id !== user?._id);
              return (
                <button 
                  key={chat._id} 
                  onClick={() => navigate(`/dashboard/chat/${chat._id}`)}
                  className="w-full flex items-center gap-3 text-left"
                >
                  <div className="relative">
                    <img 
                      src={getMediaUrl(otherUser?.profile_picture) || `https://ui-avatars.com/api/?name=${otherUser?.name}`} 
                      alt={otherUser?.name} 
                      className="w-12 h-12 rounded-full object-cover border border-gray-100 transition-none"
                    />
                    {otherUser?.status === 'online' && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white transition-none"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 transition-none">
                    <div className="flex justify-between items-baseline mb-0.5 transition-none">
                      <h4 className="font-bold text-sm truncate text-gray-800">{otherUser?.name}</h4>
                      <span className="text-[10px] text-gray-400">{chat.last_message_time ? new Date(chat.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                    </div>
                    <div className="flex justify-between items-center transition-none">
                      <p className="text-xs text-gray-500 truncate">{chat.last_message?.message_text || 'Start conversation'}</p>
                      {chat.unread_count > 0 && (
                        <span className="bg-sky-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center transition-none">
                          {chat.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingDashboard;
