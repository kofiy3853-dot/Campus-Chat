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
  SearchX
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { clsx } from 'clsx';
import Skeleton from '../components/Skeleton';
import { getMediaUrl } from '../utils/imageUrl';

interface Group {
  _id: string;
  group_name: string;
  description: string;
  members: any[];
  last_message_time?: string;
  createdAt: string;
}

const DiscoverPage: React.FC = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'groups' | 'people'>('all');
  const [searching, setSearching] = useState(false);

  const fetchDiscoveryData = async () => {
    try {
      setLoading(true);
      const [groupsRes, peopleRes] = await Promise.all([
        api.get('/api/groups/discover'),
        api.get('/api/auth/search?query=a') // Initial general search for people
      ]);
      setGroups(groupsRes.data || []);
      setPeople((peopleRes.data || []).slice(0, 6));
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

  const startChat = async (userId: string) => {
    try {
      const { data } = await api.post('/api/chat/conversations', { participantId: userId });
      navigate(`/dashboard/chat/${data._id}`);
    } catch (error) {
      console.error('Error starting chat:', error);
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

      <main className="flex-1 overflow-y-auto px-6 py-8 scrollbar-hide">
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
                          <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-500 border border-sky-100 flex items-center justify-center font-black text-2xl shadow-sm group-hover:scale-110 group-hover:bg-sky-500 group-hover:text-white transition-all duration-500">
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
                        <h3 className="text-lg font-black text-slate-800 mb-2 truncate group-hover:text-sky-500 transition-colors">{group.group_name}</h3>
                        <p className="text-sm text-slate-400 line-clamp-2 font-medium leading-relaxed mb-6">{group.description || 'Join this group to connect with other students and stay updated on campus life.'}</p>
                      </div>

                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex -space-x-2">
                          {(group.members || []).slice(0, 3).map((m: any, idx: number) => (
                            <img 
                              key={idx} 
                              src={getMediaUrl(m.profile_picture) || `https://ui-avatars.com/api/?name=${m.name || 'U'}`} 
                              alt="" 
                              className="w-8 h-8 rounded-full border-2 border-white ring-2 ring-transparent group-hover:ring-sky-50 transition-all"
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
                          className="px-6 py-2.5 bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-slate-200 hover:bg-sky-500 hover:shadow-sky-200 hover:-translate-y-1 active:translate-y-0 transition-all"
                        >
                          Join Group
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center bg-white border border-dashed border-slate-200 rounded-[2.5rem]">
                    <SearchX className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <h4 className="text-slate-400 font-bold uppercase tracking-widest text-sm">No groups found</h4>
                    <p className="text-xs text-slate-300 mt-1 uppercase font-bold">Try a different search term</p>
                  </div>
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
                          className="relative w-full h-full object-cover rounded-full border-2 border-slate-50 group-hover:border-sky-300 transition-all duration-500"
                        />
                        {person.status === 'online' && (
                          <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-4 border-white"></div>
                        )}
                      </div>
                      <h4 className="font-black text-slate-800 truncate mb-1 px-2">{person.name}</h4>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-4 truncate px-2">{person.student_id}</p>
                      
                      <button 
                        onClick={() => startChat(person._id)}
                        className="w-full py-2 bg-sky-50 text-sky-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-sky-500 hover:text-white transition-all"
                      >
                        <MessageSquare className="w-3 h-3" /> Message
                      </button>
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

        </div>
      </main>
    </div>
  );
};

export default DiscoverPage;
