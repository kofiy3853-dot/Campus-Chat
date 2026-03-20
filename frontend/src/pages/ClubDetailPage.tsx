import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Loader2, 
  MessageSquare, 
  Megaphone, 
  Calendar, 
  Users as UsersIcon, 
  Globe, 
  ArrowLeft, 
  Plus, 
  Sparkles,
  Heart,
  ShieldCheck,
  MapPin,
  Trash2
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { clsx } from 'clsx';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import CreatePostModal from '../components/CreatePostModal';
import CreateEventModal from '../components/CreateEventModal';

const ClubDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const { showToast } = useToast();
  
  const [club, setClub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'hub' | 'chat' | 'events' | 'members'>('hub');
  
  // Hub State
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  
  // Chat State
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Events State
  const [events, setEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  
  // Modals
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  const fetchClubDetails = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/api/clubs/${id}`);
      setClub(data);
    } catch (error) {
      console.error('Error fetching club:', error);
      showToast('error', 'Error', 'Failed to load club details');
      navigate('/dashboard/clubs');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showToast]);

  const fetchPosts = useCallback(async () => {
    try {
      setPostsLoading(true);
      const { data } = await api.get(`/api/clubs/${id}/posts`);
      setPosts(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setPostsLoading(false);
    }
  }, [id]);

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await api.delete(`/api/clubs/${id}/posts/${postId}`);
      setPosts(prev => prev.filter(p => p._id !== postId));
      showToast('success', 'Deleted', 'Post removed successfully');
    } catch (error: any) {
      showToast('error', 'Error', error.response?.data?.message || 'Failed to delete post');
    }
  };

  const fetchMessages = useCallback(async () => {
    try {
      setMessagesLoading(true);
      const { data } = await api.get(`/api/clubs/${id}/messages`);
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  }, [id]);

  const fetchEvents = useCallback(async () => {
    try {
      setEventsLoading(true);
      const { data } = await api.get(`/api/clubs/${id}/events`);
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setEventsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchClubDetails();
  }, [fetchClubDetails]);

  useEffect(() => {
    if (activeTab === 'hub') fetchPosts();
    if (activeTab === 'chat') fetchMessages();
    if (activeTab === 'events') fetchEvents();
  }, [activeTab, fetchPosts, fetchMessages, fetchEvents]);

  useEffect(() => {
    if (!socket || !id) return;

    // Join club room for chat
    socket.emit('join_room', id);

    const postHandler = (post: any) => {
      if (activeTab === 'hub') setPosts(prev => [post, ...prev]);
      showToast('info', 'New Update', `New post in ${club?.name}`);
    };

    const deletePostHandler = ({ postId }: { postId: string }) => {
      setPosts(prev => prev.filter(p => p._id !== postId));
    };

    const messageHandler = (message: any) => {
      setMessages(prev => {
        if (prev.some(m => m._id === message._id)) return prev;
        return [...prev, message];
      });
    };

    const eventHandler = (event: any) => {
      setEvents(prev => [event, ...prev]);
      showToast('success', 'New Event', `A new event has been scheduled in ${club?.name}`);
    };

    socket.on(`new_club_post_${id}`, postHandler);
    socket.on(`delete_club_post_${id}`, deletePostHandler);
    socket.on('receive_club_message', messageHandler);
    socket.on(`new_club_event_${id}`, eventHandler);

    return () => {
      socket.off(`new_club_post_${id}`, postHandler);
      socket.off(`delete_club_post_${id}`, deletePostHandler);
      socket.off('receive_club_message', messageHandler);
      socket.off(`new_club_event_${id}`, eventHandler);
    };
  }, [socket, id, activeTab, club?.name, showToast]);

  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const handleSendMessage = async (text: string, mediaUrl?: string, mediaType?: string) => {
    try {
      const { data } = await api.post(`/api/clubs/${id}/messages`, {
        message_text: text,
        message_type: mediaType || 'text',
        media_url: mediaUrl
      });
      // socket.emit('send_club_message', { ...data, roomId: id }); // Handled by backend emission
      setMessages(prev => [...prev, data]);
    } catch {
      showToast('error', 'Failed', 'Could not send message');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white">
        <Loader2 className="w-12 h-12 animate-spin text-green-500 mb-4" />
        <p className="text-xs font-black text-slate-300 uppercase tracking-[0.3em]">Connecting to Community...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'hub', label: 'Hub', icon: Megaphone },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'members', label: 'Members', icon: UsersIcon },
  ];

  const HubTab = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
      {/* Create Post Action */}
      <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex items-center gap-4">
        <img src={user?.profile_picture || `https://ui-avatars.com/api/?name=${user?.name}`} className="w-12 h-12 rounded-xl" alt="" />
        <button 
          onClick={() => setIsPostModalOpen(true)}
          className="flex-1 bg-slate-50 hover:bg-slate-100 text-left px-6 py-4 rounded-2xl text-slate-400 font-medium transition-colors"
        >
          What's on your mind, {user?.name?.split(' ')[0]}?
        </button>
      </div>

      {postsLoading ? (
        <div className="flex flex-col items-center py-20">
           <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        </div>
      ) : posts.length > 0 ? (
        posts.map(post => {
          const canDeletePost = post.posted_by?._id === user?._id || club?.admins?.some((a: any) => a._id === user?._id) || user?.email === 'nharnahyhaw19@gmail.com';
          return (
            <div key={post._id} className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-green-500/5 transition-all">
              <div className="p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={post.posted_by?.profile_picture || `https://ui-avatars.com/api/?name=${post.posted_by?.name}`} className="w-10 h-10 rounded-xl" alt="" />
                    <div>
                      <h4 className="font-black text-slate-800 text-sm">{post.posted_by?.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        {new Date(post.createdAt).toLocaleDateString([], { month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {post.type === 'announcement' && (
                      <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-amber-100">
                        Announcement
                      </span>
                    )}
                    {canDeletePost && (
                      <button
                        onClick={() => handleDeletePost(post._id)}
                        title="Delete post"
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                <h3 className="text-xl font-black text-slate-800 tracking-tight">{post.title}</h3>
                <p className="text-slate-600 leading-relaxed font-medium">{post.content}</p>
                
                {post.image && (
                  <div className="rounded-3xl overflow-hidden border border-slate-100">
                    <img src={post.image} alt="" className="w-full h-auto object-cover max-h-[400px]" />
                  </div>
                )}

                <div className="flex items-center gap-6 pt-4 border-t border-slate-50">
                  <button className="flex items-center gap-2 text-slate-400 hover:text-red-500 transition-colors">
                    <Heart className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase tracking-widest">Support</span>
                  </button>
                  <button className="flex items-center gap-2 text-slate-400 hover:text-green-500 transition-colors">
                    <MessageSquare className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase tracking-widest">React</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100">
          <Sparkles className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No posts yet</p>
          <p className="text-slate-300 text-sm mt-2">Start the conversation in your new hub!</p>
        </div>
      )}
    </div>
  );

  const MembersTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
      {club?.members?.map((member: any) => (
        <div key={member._id} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center gap-4 hover:border-green-200 transition-all group">
          <img 
            src={member.profile_picture || `https://ui-avatars.com/api/?name=${member.name}`} 
            className="w-14 h-14 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform" 
            alt={member.name} 
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-black text-slate-800 text-sm truncate">{member.name}</h4>
            <div className="flex items-center gap-2">
              <div className={clsx("w-2 h-2 rounded-full", member.status === 'online' ? "bg-emerald-500" : "bg-slate-300")} />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">{member.status}</p>
            </div>
          </div>
          {club.admins.some((a: any) => a._id === member._id) && (
            <div className="p-2 bg-green-50 rounded-xl" title="Club Admin">
              <ShieldCheck className="w-4 h-4 text-green-500" />
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const EventsTab = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
      {club.admins.some((a: any) => a._id === user?._id) && (
        <button 
          onClick={() => setIsEventModalOpen(true)}
          className="w-full py-6 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50/30 transition-all font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3"
        >
          <Plus className="w-5 h-5" />
          Schedule New Event
        </button>
      )}

      {eventsLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : events.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {events.map(event => (
            <div key={event._id} className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 flex flex-col md:flex-row shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all">
               {event.image && (
                 <div className="w-full md:w-48 h-48 shrink-0">
                   <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                 </div>
               )}
               <div className="p-8 flex-1 space-y-4">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-600">
                      <Calendar className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {new Date(event.date).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <MapPin className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{event.location}</span>
                    </div>
                 </div>
                 <h3 className="text-xl font-black text-slate-800">{event.title}</h3>
                 <p className="text-slate-600 font-medium line-clamp-2">{event.description}</p>
                 <button className="text-blue-500 font-black text-[10px] uppercase tracking-widest hover:underline">
                   View Details & RSVP
                 </button>
               </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100">
          <Calendar className="w-16 h-16 text-slate-100 mx-auto mb-6" />
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">No Events Planned</h3>
          <p className="text-slate-400 font-medium max-w-sm mx-auto mt-2">Check back later for exciting meetups and workshops!</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Dynamic Header */}
      <div className="relative bg-white pt-[var(--safe-area-inset-top)] border-b border-slate-100">
        <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-green-500/10 to-transparent pointer-none" />
        
        <div className="relative px-6 py-8 md:px-10">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-end justify-between">
            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
              <button 
                onClick={() => navigate('/dashboard/clubs')}
                title="Back to Clubs"
                className="p-3 bg-white shadow-xl shadow-slate-200 rounded-2xl text-slate-400 hover:text-green-600 transition-all border border-slate-100"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-6">
                 <div className="w-24 h-24 rounded-[2.5rem] bg-slate-100 border-4 border-white shadow-2xl overflow-hidden">
                   {club.profile_image ? (
                     <img src={club.profile_image} alt={club.name} className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-slate-300">
                       <Globe className="w-10 h-10" />
                     </div>
                   )}
                 </div>
                 <div className="space-y-1">
                   <div className="flex items-center gap-3">
                     <h1 className="text-3xl font-black text-slate-800 tracking-tight">{club.name}</h1>
                     <span className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                       {club.category}
                     </span>
                   </div>
                   <p className="text-slate-400 font-medium max-w-xl line-clamp-2 italic">"{club.description}"</p>
                 </div>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-3xl border border-slate-100">
               <div className="px-4 text-center">
                 <p className="text-lg font-black text-slate-800">{club.members.length}</p>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Founders</p>
               </div>
               <div className="w-px h-10 bg-slate-200" />
               <div className="px-4 text-center">
                 <p className="text-lg font-black text-slate-800">{posts.length}</p>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Announcements</p>
               </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-10 flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={clsx(
                  "flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.1em] transition-all whitespace-nowrap",
                  activeTab === tab.id 
                    ? "bg-slate-900 text-white shadow-xl shadow-slate-200 scale-105" 
                    : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                )}
              >
                <tab.icon className="w-4 h-4 font-bold" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 scrollbar-hide">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          {activeTab === 'hub' && <HubTab />}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm h-full max-h-[70vh]">
              <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide bg-slate-50/30">
                {messagesLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((msg, i) => (
                    <ChatMessage 
                      key={msg._id || i} 
                      message={msg} 
                      isMe={msg.sender_id?._id === user?._id || msg.sender_id === user?._id} 
                    />
                  ))
                ) : (
                  <div className="text-center py-20">
                    <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Encryption Active. Start the thread.</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <ChatInput onSend={handleSendMessage} onTyping={() => {}} />
            </div>
          )}
          {activeTab === 'events' && <EventsTab />}
          {activeTab === 'members' && <MembersTab />}
        </div>
      </div>

      <CreatePostModal 
        isOpen={isPostModalOpen} 
        onClose={() => setIsPostModalOpen(false)} 
        clubId={id!} 
        onSuccess={fetchPosts} 
      />
      
      <CreateEventModal 
        isOpen={isEventModalOpen} 
        onClose={() => setIsEventModalOpen(false)} 
        clubId={id!} 
        onSuccess={fetchEvents} 
      />
    </div>
  );
};

export default ClubDetailPage;
