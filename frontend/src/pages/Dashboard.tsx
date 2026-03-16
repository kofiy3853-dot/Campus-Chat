import React, { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import NavSidebar from '../components/NavSidebar';
import ChatListPanel from '../components/ChatListPanel';

// Lazy load components and pages
import ChatWindow from '../components/ChatWindow';
import GroupWindow from '../components/GroupWindow';
const AnnouncementList = lazy(() => import('../components/AnnouncementList'));
const ProfileSettings = lazy(() => import('../components/ProfileSettings'));
const ConfessionsPage = lazy(() => import('../pages/ConfessionsPage'));
const EventsPage = lazy(() => import('../pages/EventsPage'));
const PollsPage = lazy(() => import('../pages/PollsPage'));
const LostFoundPage = lazy(() => import('../pages/LostFoundPage'));
const LandingDashboard = lazy(() => import('../components/LandingDashboard'));
const NotificationsPage = lazy(() => import('../pages/NotificationsPage'));
const DiscoverPage = lazy(() => import('../pages/DiscoverPage'));
const MarketplacePage = lazy(() => import('../pages/MarketplacePage'));

import FloatingActionMenu from '../components/FloatingActionMenu';
import { clsx } from 'clsx';

const Dashboard = () => {
  const location = useLocation();
  const isConversation = location.pathname.includes('/chat/') || (location.pathname.includes('/groups/') && !location.pathname.endsWith('/null') && location.pathname !== '/dashboard/groups');
  const isListView = location.pathname === '/dashboard/chats' || location.pathname === '/dashboard/groups' || location.pathname.endsWith('/null');
  const isLanding = location.pathname === '/dashboard' || location.pathname === '/dashboard/';
  const isProfileOrNotifications = location.pathname === '/dashboard/profile' || location.pathname === '/dashboard/notifications' || location.pathname === '/dashboard/discover' || location.pathname === '/dashboard/marketplace';

  return (
    <div className="flex h-[100dvh] min-h-screen overflow-hidden bg-white font-sans selection:bg-sky-500/30">
      {/* NavSidebar is now persistent across all dashboard views */}
      <NavSidebar className={isConversation ? "hidden md:flex" : "flex"} />
      
      {/* Chat list panel - visible on list views, hidden on mobile during conversation, hidden on landing/profile/notifications */}
      {(!isLanding && !isProfileOrNotifications) && (
        <ChatListPanel className={isListView ? "flex w-full md:w-80" : "hidden md:flex md:w-80"} />
      )}
      
      <main className={clsx(
        "flex-1 flex flex-col h-full overflow-hidden bg-white",
        (isListView && !isLanding && !isProfileOrNotifications) ? 'hidden md:flex' : 'flex w-full'
      )}>
        <Suspense fallback={null}>
          <Routes>
            <Route path="chat/:id" element={<ChatWindow />} />
            <Route path="groups/:id" element={<GroupWindow />} />
            <Route path="announcements" element={<AnnouncementList />} />
            <Route path="confessions" element={<ConfessionsPage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="polls" element={<PollsPage />} />
            <Route path="lost-found" element={<LostFoundPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="discover" element={<DiscoverPage />} />
            <Route path="marketplace" element={<MarketplacePage />} />
            <Route path="profile" element={<ProfileSettings />} />
            <Route path="chats" element={<div className="flex-1 flex items-center justify-center text-gray-400 font-medium">Select a conversation to start chatting</div>} />
            <Route path="/" element={<LandingDashboard />} />
          </Routes>
        </Suspense>
      </main>
      {!isConversation && <FloatingActionMenu />}
    </div>
  );
};

export default Dashboard;
