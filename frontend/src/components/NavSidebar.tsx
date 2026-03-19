import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  MessageSquare, 
  Settings, 
  LogOut,
  User as UserIcon,
  Search,
  Home,
  Compass,
  Shield
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
    { icon: MessageSquare, label: 'Chats', to: '/dashboard/chats' },
  ];

  return (
    <aside className={clsx(
      "bg-white dark:bg-slate-900 border-gray-100 dark:border-gray-800 z-50",
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
                      <span className="absolute top-0 right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </div>
                  <span className={clsx("text-[9px] font-bold uppercase tracking-widest transition-colors", isActive ? "text-[#8444e2]" : "text-slate-400 group-hover:text-[#8444e2]")}>
                    {item.label}
                  </span>
                  <div className="hidden md:block absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                  </div>
                </>
              )}
            </NavLink>

            {/* Inject Explore button between Discover and Chats */}
            {item.label === 'Discover' && (
              <button
                onClick={() => setIsExploreOpen(true)}
                className="group relative flex flex-col items-center gap-1"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-[1.2rem] transition-all text-slate-400 hover:bg-purple-50 group-hover:text-[#8444e2]">
                  <Compass className="w-6 h-6" />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-[#8444e2] transition-colors">
                  Explore
                </span>
                <div className="hidden md:block absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                  Explore
                </div>
              </button>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="hidden md:flex flex-col items-center gap-6 mt-auto shrink-0">
        <button
          onClick={logout}
          className="p-2 rounded-2xl md:p-3 text-gray-400 hover:text-red-500 md:hover:bg-red-50 transition-colors"
          title="Logout"
        >
          <LogOut className="w-6 h-6" />
          <div className="absolute left-full ml-4 px-2 py-1 bg-red-500 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-none">
            Logout
          </div>
        </button>
      </div>

      {/* Mobile Bottom Actions */}
      <div className="flex md:hidden items-center gap-4">
        <button
          onClick={logout}
          className="p-2 rounded-2xl text-gray-400 hover:text-red-500 transition-colors"
          title="Logout"
        >
          <LogOut className="w-6 h-6" />
        </button>
      </div>
      <ExploreMenu isOpen={isExploreOpen} onClose={() => setIsExploreOpen(false)} />
    </aside>
  );
};

export default NavSidebar;
