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
  Calendar,
  BarChart3,
  Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { clsx } from 'clsx';



interface NavSidebarProps {
  className?: string;
}

const NavSidebar: React.FC<NavSidebarProps> = ({ className }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { icon: MessageSquare, label: 'Chats', to: '/dashboard' },
    { icon: Users, label: 'Groups', to: '/dashboard/groups/null' },
    { icon: Megaphone, label: 'Announcements', to: '/dashboard/announcements' },
    { icon: Ghost, label: 'Confessions', to: '/dashboard/confessions' },
    { icon: Calendar, label: 'Events', to: '/dashboard/events' },
    { icon: BarChart3, label: 'Polls', to: '/dashboard/polls' },
    { icon: Search, label: 'Lost & Found', to: '/dashboard/lost-found' },
    { icon: UserIcon, label: 'Profile', to: '/dashboard/profile' },
  ];

  return (
    <aside className={clsx(
      "bg-slate-900 border-slate-800 z-50 overflow-x-auto no-scrollbar",
      "fixed bottom-0 left-0 right-0 border-t flex flex-row items-center py-3 px-2 h-16",
      "md:relative md:w-20 md:border-r md:border-t-0 md:flex-col md:py-6 md:h-full md:px-0 md:justify-start md:overflow-x-visible",
      className
    )}>
      {/* Logo */}
      <div className="hidden md:flex w-12 h-12 bg-primary-600 rounded-2xl items-center justify-center font-bold text-white text-xl mb-10 shadow-lg shadow-primary-900/20 shrink-0">
        C
      </div>

      {/* Nav Items */}
      <nav className="flex-1 flex flex-row md:flex-col items-center justify-start md:justify-start gap-1 md:gap-6 min-w-max md:min-w-0 w-full px-2 md:px-0">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.to === '/dashboard'}
            className={({ isActive }) => clsx(
              "p-3 rounded-2xl relative group",
              isActive 
                ? "bg-primary-500/10 text-primary-500 shadow-inner" 
                : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
            )}
            title={item.label}
          >
            <item.icon className="w-6 h-6 md:w-6 md:h-6" />
            <div className="hidden md:block absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
              {item.label}
            </div>
          </NavLink>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="hidden md:flex flex-col items-center gap-6 mt-auto shrink-0">
        <NavLink
          to="/dashboard/profile"
          className={({ isActive }) => clsx(
            "p-3 rounded-2xl relative group",
            isActive 
              ? "bg-primary-500/10 text-primary-500 shadow-inner" 
              : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
          )}
          title="Profile Settings"
        >
          <Settings className="w-6 h-6" />
        </NavLink>

        <NavLink
          to="/dashboard/profile"
          className={({ isActive }) => clsx(
            "w-10 h-10 rounded-full border-2 overflow-hidden cursor-pointer",
            isActive ? "border-primary-500 shadow-lg shadow-primary-500/20" : "border-slate-700 hover:border-slate-500"
          )}
        >
          <img src={user?.profile_picture || `https://ui-avatars.com/api/?name=${user?.name}`} alt="User Profile" className="w-full h-full object-cover" />
        </NavLink>

        <button
          onClick={logout}
          className="p-3 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-2xl w-12 h-12 flex items-center justify-center group relative"
          title="Logout"
        >
          <LogOut className="w-6 h-6" />
          <div className="absolute left-full ml-4 px-2 py-1 bg-red-900/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
            Logout
          </div>
        </button>
      </div>
    </aside>
  );
};

export default NavSidebar;
