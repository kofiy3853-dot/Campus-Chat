import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  MessageSquare, 
  Users, 
  Megaphone, 
  Settings, 
  LogOut,
  User as UserIcon,
  Bell,
  Ghost,
  Search,
  Home,
  Compass,
  Trophy
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUnread } from '../context/UnreadContext';
import { clsx } from 'clsx';
import { getMediaUrl } from '../utils/imageUrl';
import ExploreMenu from './ExploreMenu';

interface NavSidebarProps {
  className?: string;
}

const NavSidebar: React.FC<NavSidebarProps> = ({ className }) => {
  const { user, logout } = useAuth();
  const { unread } = useUnread();
  const [isExploreOpen, setIsExploreOpen] = React.useState(false);

  const navItems = [
    { icon: Home, label: 'Home', to: '/dashboard' },
    { icon: Search, label: 'Discover', to: '/dashboard/discover' },
    { icon: Trophy, label: 'Leaderboard', to: '/dashboard/leaderboard' },
    { icon: MessageSquare, label: 'Chats', to: '/dashboard/chats' },
    { icon: UserIcon, label: 'Profile', to: '/dashboard/profile' },
  ];

  return (
    <aside className={clsx(
      "bg-white border-gray-100 z-50",
      "fixed bottom-0 left-0 right-0 border-t flex flex-row items-center px-4 h-20 justify-around",
      "md:relative md:w-20 md:border-r md:border-t-0 md:flex-col md:py-6 md:h-full md:px-0 md:justify-start",
      className
    )}>
      {/* Logo */}
      <div className="hidden md:flex w-12 h-12 bg-sky-400 rounded-2xl items-center justify-center font-bold text-white text-xl mb-10 shrink-0">
        C
      </div>

      {/* Nav Items */}
      <nav className="flex-1 flex flex-row md:flex-col items-center justify-around md:justify-start w-full px-2 md:px-0 gap-2 md:gap-6">
        {navItems.map((item) => (
          <React.Fragment key={item.label}>
            <NavLink
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) => clsx(
                "flex flex-col items-center gap-1 group relative",
                "p-2 rounded-2xl md:p-3",
                isActive 
                  ? "text-sky-500 md:bg-sky-50" 
                  : "text-gray-400 hover:text-sky-500 md:hover:bg-gray-50"
              )}
            >
              <div className="relative">
                <item.icon className="w-6 h-6" />
                {item.label === 'Chats' && unread > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold md:hidden">{item.label}</span>
              <div className="hidden md:block absolute left-full ml-4 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-none">
                {item.label}
              </div>
            </NavLink>

            {/* Inject Explore button between Discover and Chats */}
            {item.label === 'Discover' && (
              <button
                onClick={() => setIsExploreOpen(true)}
                className={clsx(
                  "flex flex-col items-center gap-1 group relative",
                  "p-2 rounded-2xl md:p-3 text-gray-400 hover:text-sky-500 md:hover:bg-gray-50"
                )}
              >
                <div className="relative">
                  <Compass className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold md:hidden">Explore</span>
                <div className="hidden md:block absolute left-full ml-4 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-none">
                  Explore
                </div>
              </button>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="hidden md:flex flex-col items-center gap-6 mt-auto shrink-0">
        <NavLink
          to="/dashboard/profile"
          className={({ isActive }) => clsx(
            "p-3 rounded-2xl relative group transition-none",
            isActive 
              ? "bg-sky-50 text-sky-500" 
              : "text-gray-400 hover:text-sky-500 hover:bg-gray-50"
          )}
          title="Profile Settings"
        >
          <Settings className="w-6 h-6" />
        </NavLink>

        <NavLink
          to="/dashboard/profile"
          className={({ isActive }) => clsx(
            "w-10 h-10 rounded-full border-2 overflow-hidden cursor-pointer transition-none",
            isActive ? "border-sky-400" : "border-gray-100 hover:border-sky-200"
          )}
        >
          <img src={getMediaUrl(user?.profile_picture) || `https://ui-avatars.com/api/?name=${user?.name}`} alt="User Profile" className="w-full h-full object-cover" />
        </NavLink>

        <button
          onClick={logout}
          className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl w-12 h-12 flex items-center justify-center group relative transition-none"
          title="Logout"
        >
          <LogOut className="w-6 h-6" />
          <div className="absolute left-full ml-4 px-2 py-1 bg-red-500 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-none">
            Logout
          </div>
        </button>
      </div>
      <ExploreMenu isOpen={isExploreOpen} onClose={() => setIsExploreOpen(false)} />
    </aside>
  );
};

export default NavSidebar;
