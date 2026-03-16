import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Users, 
  UserPlus, 
  TrendingUp, 
  Globe, 
  MessageSquare,
  ChevronRight,
  Filter,
  Users2,
  CheckCircle2,
  Sparkles,
  SearchX,
  Plus,
  Bell,
  Clock,
  ShoppingBag,
  Package
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { clsx } from 'clsx';
import Skeleton from '../components/Skeleton';
import { getMediaUrl } from '../utils/imageUrl';
import CreateGroupModal from '../components/CreateGroupModal';
import ConnectionRequests from '../components/ConnectionRequests';

interface Group {
  _id: string;
  group_name: string;
  description: string;
  members: any[];
  last_message_time?: string;
  createdAt: string;
}

const EmptyGroups: React.FC<{ onCreate: () => void, onBrowse: () => void }> = ({ onCreate, onBrowse }) => (
  <div className="col-span-full py-16 px-6 text-center bg-white border border-dashed border-slate-200 rounded-[3rem] animate-in fade-in zoom-in duration-500">
    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-slate-100 shadow-sm">
      <SearchX className="w-10 h-10 text-slate-300" />
    </div>
    <h3 className="text-xl font-black text-slate-800 mb-2">No groups found</h3>
    <p className="text-sm text-slate-400 font-medium max-w-xs mx-auto mb-10 leading-relaxed">
      We couldn't find any groups matching your search. Create your own community or explore what's trending!
    </p>

    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
      <button 
        onClick={onCreate}
        className="w-full sm:w-auto px-8 py-4 bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-sky-500 hover:shadow-sky-200 transition-all flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" /> Create Group
      </button>
      <button 
        onClick={onBrowse}
        className="w-full sm:w-auto px-8 py-4 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:border-sky-500 hover:text-sky-500 transition-all flex items-center justify-center gap-2"
      >
        <TrendingUp className="w-4 h-4" /> Browse Trending
      </button>
    </div>
  </div>
);

const DiscoverPage: React.FC = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [trendingGroups, setTrendingGroups] = useState<Group[]>([]);
  const [marketplaceItems, setMarketplaceItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'groups' | 'people'>('all');
  const [searching, setSearching] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isRequestsOpen, setIsRequestsOpen] = useState(false);
  const [requestCount, setRequestCount] = useState(0);

  const fetchRequestCount = async () => {
    try {
      const { data } = await api.get('/api/connections/incoming');
      setRequestCount(data.length);
    } catch (error) {
      console.error('Error fetching request count:', error);
    }
  };

  const fetchDiscoveryData = async () => {
    try {
      setLoading(true);
      const [groupsRes, peopleRes, marketRes] = await Promise.all([
        api.get('/api/groups/discover'),
        api.get('/api/auth/search?query=a'), // Initial general search for people
        api.get('/api/marketplace')
      ]);
      setGroups(groupsRes.data || []);
      setTrendingGroups((groupsRes.data || []).slice(0, 3)); // Use top 3 as trending for now
      setPeople((peopleRes.data || []).slice(0, 6));
      setMarketplaceItems((marketRes.data || []).slice(0, 3));
    } catch (error) {
      console.error('Error fetching discovery data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      fetchDiscoveryData();
      return;
    }

    try {
      setSearching(true);
      const [groupsRes, peopleRes] = await Promise.all([
        api.get(`/api/groups/search?query=${query}`),
        api.get(`/api/auth/search?query=${query}`)
      ]);
      setGroups(groupsRes.data || []);
      setPeople(peopleRes.data || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    fetchDiscoveryData();
    fetchRequestCount();
  }, []);

  const joinGroup = async (groupId: string) => {
    try {
      await api.post('/api/groups/join', { groupId });
      // Remove from discover list after joining
      setGroups(prev => prev.filter(g => g._id !== groupId));
      // Optionally navigate to group or show success
      navigate(`/dashboard/groups/${groupId}`);
    } catch (error) {
      console.error('Error joining group:', error);
    }
  };

  const handleConnect = async (userId: string) => {
    try {
      setSearching(true);
      await api.post('/api/connections/request', { recipientId: userId });
      // Update local state to show pending
      setPeople(prev => prev.map(p => 
        p._id === userId ? { ...p, connection_status: 'pending', is_sender: true } : p
      ));
    } catch (error: any) {
      console.error('Error connecting:', error);
      alert(error.response?.data?.message || 'Failed to send connect request');
    } finally {
      setSearching(false);
    }
  };

  const startChat = async (userId: string, connectionStatus: string) => {
    if (connectionStatus !== 'accepted') {
      alert('You must be connected with this student before you can message them.');
      return;
    }
    try {
      const { data } = await api.post('/api/chat/conversations', { participantId: userId });
      navigate(`/dashboard/chat/${data._id}`);
    } catch (error: any) {
      console.error('Error starting chat:', error);
      alert(error.response?.data?.message || 'Failed to start chat');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      {/* Search Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-6 z-30">
        <div className="max-w-4xl mx-auto w-full">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                Discover <Sparkles className="w-5 h-5 text-sky-500 fill-sky-500" />
              </h1>
              <p className="text-sm text-slate-400 font-medium">Find groups and people on campus</p>
            </div>
            <div className="hidden md:flex items-center gap-2">
                <button 
                  onClick={() => setIsRequestsOpen(true)}
                  title="Connection Requests"
                  className="relative p-2.5 bg-white border border-slate-100 text-slate-400 hover:text-sky-500 hover:border-sky-100 rounded-xl transition-all mr-2"
                >
                  <Bell className="w-5 h-5" />
                  {requestCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white">
                      {requestCount}
                    </span>
                  )}
                </button>
                <div className="w-px h-6 bg-slate-100 mx-2"></div>
                <button 
                  onClick={() => setActiveFilter('all')}
                  title="Show all"
                  aria-label="Show all"
                  className={clsx(
                    "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                    activeFilter === 'all' ? "bg-slate-800 text-white shadow-lg shadow-slate-200" : "bg-white border border-slate-100 text-slate-400 hover:border-sky-200"
                  )}
                >
                  All
                </button>
                <button 
                  onClick={() => setActiveFilter('groups')}
                  title="Show groups"
                  aria-label="Show groups"
                  className={clsx(
                    "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                    activeFilter === 'groups' ? "bg-slate-800 text-white shadow-lg shadow-slate-200" : "bg-white border border-slate-100 text-slate-400 hover:border-sky-200"
                  )}
                >
                  Groups
                </button>
                <button 
                  onClick={() => setActiveFilter('people')}
                  title="Show people"
                  aria-label="Show people"
                  className={clsx(
                    "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                    activeFilter === 'people' ? "bg-slate-800 text-white shadow-lg shadow-slate-200" : "bg-white border border-slate-100 text-slate-400 hover:border-sky-200"
                  )}
                >
                  People
                </button>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-sky-500/5 blur-xl group-focus-within:blur-2xl transition-all rounded-3xl opacity-0 group-focus-within:opacity-100"></div>
            <div className="relative flex items-center bg-white border border-slate-100 rounded-[2rem] px-6 py-4 shadow-sm group-focus-within:border-sky-200 transition-all duration-300">
              <Search className={clsx("w-6 h-6 mr-4 transition-colors", searching ? "text-sky-500 animate-pulse" : "text-slate-400 group-focus-within:text-sky-500")} />
              <input 
                type="text" 
                placeholder="Search groups, interests, or students..."
                className="flex-1 bg-transparent border-none outline-none text-base font-medium text-slate-700 placeholder:text-slate-400"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              {searchQuery && (
                <button 
                  onClick={() => handleSearch('')} 
                  title="Clear search"
                  aria-label="Clear search"
                  className="p-1 hover:bg-slate-50 rounded-full transition-colors"
                >
                   <SearchX className="w-5 h-5 text-slate-300" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-12 pb-32">
          
          {/* Recommended Groups Section */}
          {(activeFilter === 'all' || activeFilter === 'groups') && (
            <section>
              <div className="flex items-center justify-between mb-6 px-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center border border-orange-100">
                    <Users2 className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Recommended Groups</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Suggested for you</p>
                  </div>
                </div>
                <button 
                  title="Filter options"
                  aria-label="Filter options"
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Filter className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loading ? (
                  [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-44 rounded-[2.5rem]" />)
                ) : groups.length > 0 ? (
                  groups.map((group) => (
                    <div 
                      key={group._id} 
                      className="group bg-white border border-slate-100 p-6 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:shadow-sky-500/5 hover:border-sky-100 transition-all duration-300 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-500 border border-sky-100 flex items-center justify-center font-black text-2xl shadow-sm group-hover:bg-sky-500 group-hover:text-white">
                            {group.group_name[0]}
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#10B981] bg-[#10B981]/10 px-2.5 py-1 rounded-full mb-1 flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" /> Popular
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                              <Globe className="w-3 h-3" /> Public
                            </span>
                          </div>
                        </div>
                        <h3 className="text-lg font-black text-slate-800 mb-2 truncate">{group.group_name}</h3>
                        <p className="text-sm text-slate-400 line-clamp-2 font-medium leading-relaxed mb-6">{group.description || 'Join this group to connect with other students and stay updated on campus life.'}</p>
                      </div>

                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex -space-x-2">
                          {(group.members || []).slice(0, 3).map((m: any, idx: number) => (
                            <img 
                              key={idx} 
                              src={getMediaUrl(m.profile_picture) || `https://ui-avatars.com/api/?name=${m.name || 'U'}`} 
                              alt="" 
                              loading="lazy"
                            />
                          ))}
                          {(group.members?.length || 0) > 3 && (
                            <div className="w-8 h-8 rounded-full bg-slate-50 border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-400">
                              +{(group.members?.length || 0) - 3}
                            </div>
                          )}
                        </div>
                        <button 
                          onClick={() => joinGroup(group._id)}
                          className="px-6 py-2.5 bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-slate-200 hover:bg-sky-500 hover:shadow-sky-200 transition-all"
                        >
                          Join Group
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyGroups 
                    onCreate={() => setIsCreateGroupOpen(true)} 
                    onBrowse={() => handleSearch('')} 
                  />
                )}
              </div>
            </section>
          )}

          {/* Connect with Students Section */}
          {(activeFilter === 'all' || activeFilter === 'people') && (
            <section>
              <div className="flex items-center justify-between mb-6 px-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-50 flex items-center justify-center border border-sky-100">
                    <UserPlus className="w-5 h-5 text-sky-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Connect with Students</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Find your peers</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {loading ? (
                    [1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-3xl" />)
                ) : people.length > 0 ? (
                  people.map((person) => (
                    <div 
                      key={person._id}
                      className="group bg-white border border-slate-100 p-5 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-sky-500/5 transition-all text-center"
                    >
                      <div className="relative w-20 h-20 mx-auto mb-4">
                        <div className="absolute inset-0 bg-sky-500/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-all"></div>
                        <img 
                          src={getMediaUrl(person.profile_picture) || `https://ui-avatars.com/api/?name=${person.name}&background=0EA5E9&color=fff`} 
                          alt={person.name}
                          className="relative w-full h-full object-cover rounded-full border-2 border-slate-50 group-hover:border-sky-300"
                          loading="lazy"
                        />
                        {person.status === 'online' && (
                          <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-4 border-white"></div>
                        )}
                      </div>
                      <h4 className="font-black text-slate-800 truncate mb-1 px-2">{person.name}</h4>
                      <p className="text-[10px] text-sky-500 font-black uppercase tracking-widest mb-4 truncate px-2">
                        {person.department || 'Student'}
                      </p>
                      
                      <div className="flex flex-col gap-2">
                        {person.connection_status === 'none' ? (
                          <button 
                            onClick={() => handleConnect(person._id)}
                            className="w-full py-2.5 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-sky-500 hover:shadow-lg hover:shadow-sky-200 transition-all"
                          >
                            <UserPlus className="w-3 h-3" /> Connect
                          </button>
                        ) : person.connection_status === 'pending' ? (
                          <button 
                            disabled
                            className="w-full py-2.5 bg-slate-100 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-default"
                          >
                            <Clock className="w-3 h-3" /> Pending
                          </button>
                        ) : person.connection_status === 'accepted' ? (
                          <div className="w-full py-2.5 bg-green-50 text-green-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-3 h-3" /> Connected
                          </div>
                        ) : (
                           <button 
                            onClick={() => handleConnect(person._id)}
                            className="w-full py-2.5 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-sky-500 hover:shadow-lg hover:shadow-sky-200 transition-all"
                          >
                            <UserPlus className="w-3 h-3" /> Reconnect
                          </button>
                        )}

                        <button 
                          onClick={() => startChat(person._id, person.connection_status)}
                          className={clsx(
                            "w-full py-2.5 border rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all",
                            person.connection_status === 'accepted' 
                              ? "bg-white border-sky-100 text-sky-500 hover:bg-sky-50" 
                              : "bg-slate-50 border-transparent text-slate-300 cursor-not-allowed"
                          )}
                        >
                          <MessageSquare className="w-3 h-3" /> Message
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                    <div className="col-span-full py-12 text-center bg-white border border-dashed border-slate-200 rounded-[2.5rem]">
                        <SearchX className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <h4 className="text-slate-400 font-bold uppercase tracking-widest text-sm">No students found</h4>
                    </div>
                )}
              </div>
            </section>
          )}

          {/* Campus Marketplace Section */}
          {(activeFilter === 'all') && (
            <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
              <div className="flex items-center justify-between mb-6 px-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-green-50 flex items-center justify-center border border-green-100">
                    <ShoppingBag className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Campus Marketplace</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">New listings near you</p>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/dashboard/marketplace')}
                  className="text-green-600 text-xs font-black uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all"
                >
                  View All <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {loading ? (
                   [1, 2, 3].map(i => <Skeleton key={i} className="h-64 rounded-[2.5rem]" />)
                ) : marketplaceItems.length > 0 ? (
                  marketplaceItems.map((item) => (
                    <div 
                      key={item._id}
                      onClick={() => navigate('/dashboard/marketplace')}
                      className="group bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:shadow-green-500/5 hover:border-green-100 transition-all cursor-pointer overflow-hidden p-4"
                    >
                      <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-4 relative bg-slate-50">
                        <img 
                          src={getMediaUrl(item.image_url)} 
                          alt={item.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur px-3 py-1 rounded-xl text-xs font-black text-slate-800 shadow-sm leading-none border border-slate-100">
                          ${item.price}
                        </div>
                      </div>
                      <h4 className="font-black text-slate-800 truncate mb-1 px-2">{item.title}</h4>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest px-2 mb-2">
                        {item.category}
                      </p>
                    </div>
                  ))
                ) : (
                    <div className="col-span-full py-12 text-center bg-white border border-dashed border-slate-200 rounded-[2.5rem]">
                        <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <h4 className="text-slate-400 font-bold uppercase tracking-widest text-sm">No items found</h4>
                    </div>
                )}
              </div>
            </section>
          )}

          {/* Trending Groups Section - Always Visible */}
          <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <div className="flex items-center gap-3 mb-8 px-1">
              <div className="w-12 h-12 rounded-[1.25rem] bg-amber-50 flex items-center justify-center border border-amber-100 shadow-sm shadow-amber-100/50">
                <TrendingUp className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Trending Communities</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Don't miss out on the buzz</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                [1, 2, 3].map(i => <Skeleton key={i} className="h-56 rounded-[2.5rem]" />)
              ) : trendingGroups.length > 0 ? (
                trendingGroups.map((group) => (
                  <div 
                    key={group._id}
                    className="group relative bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:shadow-orange-500/10 hover:border-orange-100 transition-all duration-500 overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50/50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-orange-500/10 transition-colors"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-orange-200 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                          {group.group_name[0]}
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-black text-orange-500 bg-orange-50 px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-orange-100/50">
                            <Sparkles className="w-3 h-3 fill-orange-500" /> Trending
                          </span>
                        </div>
                      </div>

                      <h3 className="text-lg font-black text-slate-800 mb-2 group-hover:text-orange-600 transition-colors">{group.group_name}</h3>
                      <p className="text-xs text-slate-500 font-medium mb-6 line-clamp-2 leading-relaxed">
                        {group.description || "Join this buzzing community of students and stay ahead of the game."}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {(group.members || []).slice(0, 3).map((m: any, idx: number) => (
                              <div key={idx} className="w-7 h-7 rounded-full border-2 border-white ring-1 ring-slate-100 overflow-hidden">
                                <img src={getMediaUrl(m.profile_picture) || `https://ui-avatars.com/api/?name=${m.name || 'U'}`} alt="" className="w-full h-full object-cover" loading="lazy" />
                              </div>
                            ))}
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {group.members?.length || 0} active members
                          </span>
                        </div>
                        <button 
                          onClick={() => joinGroup(group._id)}
                          title={`Join ${group.group_name}`}
                          aria-label={`Join ${group.group_name}`}
                          className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-orange-500 hover:scale-110 active:scale-95 transition-all duration-300 shadow-lg shadow-slate-200 hover:shadow-orange-200"
                        >
                          <UserPlus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-[2.5rem]">
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Looking for trending groups...</p>
                </div>
              )}
            </div>
          </section>

        </div>
      </main>

      <CreateGroupModal 
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
      />

      <ConnectionRequests 
        isOpen={isRequestsOpen}
        onClose={() => setIsRequestsOpen(false)}
        onUpdate={() => {
          fetchRequestCount();
          fetchDiscoveryData();
        }}
      />
    </div>
  );
};

export default DiscoverPage;
