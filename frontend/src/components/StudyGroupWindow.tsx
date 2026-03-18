import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, MessageSquare, BookOpen, Calendar, Users as UsersIcon } from 'lucide-react';
import api from '../services/api';
import GroupWindow from './GroupWindow';
import ResourcesTab from './ResourcesTab';
import SessionsTab from './SessionsTab';
import { clsx } from 'clsx';

const StudyGroupWindow = () => {
  const { id } = useParams();
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'resources' | 'sessions' | 'members'>('chat');

  const fetchGroup = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/groups');
      const currentGroup = data.find((g: any) => g._id === id);
      setGroup(currentGroup);
    } catch (error) {
      console.error('Error fetching group:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
        <p className="text-xs font-black text-slate-300 uppercase tracking-[0.2em]">Synchronizing Lab...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'resources', label: 'Resources', icon: BookOpen },
    { id: 'sessions', label: 'Sessions', icon: Calendar },
    { id: 'members', label: 'Members', icon: UsersIcon },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      {/* Header / Tabs */}
      <div className="px-6 pt-8 pb-4 border-b border-slate-100 bg-slate-50/30">
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-indigo-200">
                {group?.group_name?.[0]}
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">{group?.group_name}</h2>
                <p className="text-xs text-indigo-500 font-bold uppercase tracking-widest">{group?.subject || 'Direct Hub'}</p>
              </div>
           </div>
        </div>

        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={clsx(
                "flex items-center gap-3 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all",
                activeTab === tab.id 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
                  : "text-slate-400 hover:bg-white hover:text-slate-600"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' && <GroupWindow />}
        {activeTab === 'resources' && <ResourcesTab groupId={id!} resources={group?.resources || []} onUpdate={fetchGroup} />}
        {activeTab === 'sessions' && <SessionsTab groupId={id!} sessions={group?.study_sessions || []} onUpdate={fetchGroup} isAdmin={group?.admins?.includes(group?.created_by)} />}
        {activeTab === 'members' && (
          <div className="p-10 space-y-6 overflow-y-auto h-full scrollbar-hide">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest pl-1">Research Assistants ({group?.members?.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group?.members?.map((member: any) => (
                <div key={member._id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-[1.5rem] border border-transparent hover:border-indigo-100 transition-all">
                  <img 
                    src={member.profile_picture || `https://ui-avatars.com/api/?name=${member.name}`} 
                    className="w-12 h-12 rounded-xl object-cover" 
                    alt="" 
                  />
                  <div>
                    <p className="text-sm font-black text-slate-800">{member.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{member.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyGroupWindow;
