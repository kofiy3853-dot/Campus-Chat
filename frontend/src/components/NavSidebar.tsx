import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  MessageSquare, 
  Settings, 
  LogOut,
  Search,
  Home,
  Compass,
  Shield,
  User as UserIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUnread } from '../context/UnreadContext';
import { clsx } from 'clsx';
import { getMediaUrl } from '../utils/imageUrl';


interface NavSidebarProps {
  className?: string;
}

const NavSidebar: React.FC<NavSidebarProps> = ({ className }) => {
  const { user, logout } = useAuth();
  const { unread } = useUnread();

  const navItems = [
    { icon: Home, label: 'Home', to: '/dashboard' },
    { icon: Search, label: 'Discover', to: '/dashboard/discover' },
    { icon: Compass, label: 'Explore', to: '/dashboard/explore' },
    { icon: MessageSquare, label: 'Chats', to: '/dashboard/chats' },
    { icon: UserIcon, label: 'Profile', to: '/dashboard/profile' },
  ];

  return (
    <aside className={clsx(
      "bg-white dark:bg-slate-900 border-gray-100 dark:border-gray-800 z-50",
      "fixed bottom-0 left-0 right-0 border-t flex flex-row items-center px-4 h-20 justify-around",
      "md:relative md:w-20 md:border-r md:border-t-0 md:flex-col md:py-6 md:h-full md:px-0 md:justify-start",
      className
    )}>
      {/* Logo Section removed as per user request */}

      {/* Nav Items */}
      <nav className="flex-1 flex flex-row md:flex-col items-center justify-around md:justify-start w-full px-2 md:px-0 gap-2 md:gap-6">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.to === '/dashboard'}
            className="group relative flex flex-col items-center gap-1"
          >
            {({ isActive }) => (
              <>
                <div className={clsx(
                  "flex items-center justify-center w-12 h-12 rounded-[1.2rem] transition-all",
                  isActive ? "bg-[#8444e2] text-white shadow-md shadow-[#8444e2]/30" : "text-slate-400 hover:bg-purple-50 group-hover:text-[#8444e2]"
                )}>
                  <item.icon className="w-6 h-6" />
                  {item.label === 'Chats' && unread > 0 && (
                    <span className="absolute top-0 right-2 bg-red-500 text-white text-[0.65rem] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                      {unread > 99 ? '99+' : unread}
                    </span>
                  )}
                </div>
                <span className={clsx("text-[0.6rem] font-bold uppercase tracking-widest transition-colors", isActive ? "text-[#8444e2]" : "text-slate-400 group-hover:text-[#8444e2]")}>
                  {item.label}
                </span>
                <div className="hidden md:block absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </div>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Actions removed as per user request */}
    </aside>
  );
};

export default NavSidebar;
