import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import NavSidebar from '../components/NavSidebar';
import ChatListPanel from '../components/ChatListPanel';
import ChatWindow from '../components/ChatWindow';
import GroupWindow from '../components/GroupWindow';
import AnnouncementList from '../components/AnnouncementList';
import ProfileSettings from '../components/ProfileSettings';
import ConfessionsPage from '../pages/ConfessionsPage';
import EventsPage from '../pages/EventsPage';
import { SocketProvider } from '../context/SocketContext';

const Dashboard = () => {
  const location = useLocation();
  const isHomeView = location.pathname === '/dashboard' || location.pathname === '/dashboard/groups/null' || location.pathname === '/dashboard/groups';
  
  return (
    <SocketProvider>
      <div className="flex h-[100dvh] overflow-hidden bg-slate-950 font-sans selection:bg-primary-500/30">
        <NavSidebar className={isHomeView ? "flex" : "hidden md:flex"} />
        <ChatListPanel className={isHomeView ? "flex" : "hidden md:flex"} />
        
        <main className={`flex-1 flex col h-full overflow-hidden bg-[#0A0F1D] ${isHomeView ? 'hidden md:flex' : 'flex'}`}>
          <Routes>
            <Route path="chat/:id" element={<ChatWindow />} />
            <Route path="groups/:id" element={<GroupWindow />} />
            <Route path="announcements" element={<AnnouncementList />} />
            <Route path="confessions" element={<ConfessionsPage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="profile" element={<ProfileSettings />} />
            <Route path="/" element={
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                <div className="relative group cursor-default">
                   <div className="absolute -inset-4 bg-primary-500/20 rounded-full blur-2xl group-hover:bg-primary-500/30"></div>
                   <div className="relative w-32 h-32 rounded-[2.5rem] bg-slate-900 flex items-center justify-center mb-8 border border-slate-800 shadow-2xl">
                    <span className="text-5xl">💬</span>
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Stay Connected</h2>
                <p className="max-w-xs text-center text-slate-400 text-lg leading-relaxed">
                  Join the campus conversation. Select a chat or group and start sharing.
                </p>
                
                <div className="mt-12 flex gap-4">
                  <div className="px-5 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 text-sm font-medium flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    Real-time updates
                  </div>
                </div>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </SocketProvider>
  );
};

export default Dashboard;
