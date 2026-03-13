import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  MessageSquare, 
  Users, 
  Megaphone, 
  Ghost, 
  Calendar, 
  BarChart3, 
  Package, 
  User as UserIcon,
  LogOut,
  Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { clsx } from 'clsx';
import { getMediaUrl } from '../utils/imageUrl';

interface NavbarProps {
  className?: string;
}

const Navbar: React.FC<NavbarProps> = ({ className }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { icon: Home, label: 'Home', to: '/dashboard' },
    { icon: MessageSquare, label: 'Chats', to: '/dashboard/chats' },
    { icon: Users, label: 'Groups', to: '/dashboard/groups' },
    { icon: Megaphone, label: 'Notices', to: '/dashboard/announcements' },
    { icon: Ghost, label: 'Ghost', to: '/dashboard/confessions' },
    { icon: Calendar, label: 'Events', to: '/dashboard/events' },
    { icon: BarChart3, label: 'Polls', to: '/dashboard/polls' },
    { icon: Package, label: 'Items', to: '/dashboard/lost-found' },
    { icon: UserIcon, label: 'Profile', to: '/dashboard/profile' },
  ];

  return (
    <aside className={clsx(
      "bg-white border-slate-100 z-[100] transition-none shadow-xl lg:shadow-none",
      "fixed bottom-0 left-0 right-0 border-t flex flex-row items-center px-2 h-20 justify-around",
      "lg:relative lg:w-24 lg:border-r lg:border-t-0 lg:flex-col lg:py-8 lg:h-full lg:px-0 lg:justify-start lg:gap-8",
      className
    )}>
      {/* Logo - Desktop only */}
      <div className="hidden lg:flex w-12 h-12 bg-slate-950 rounded-2xl items-center justify-center font-black text-white text-xl shadow-lg shadow-slate-200 shrink-0">
        C
      </div>

      {/* Nav Items */}
      <nav className="flex-1 flex flex-row lg:flex-col items-center justify-around lg:justify-start w-full lg:px-0 gap-1 lg:gap-4 overflow-x-auto lg:overflow-x-visible scrollbar-hide py-2 lg:py-0">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.to === '/dashboard'}
            className={({ isActive }) => clsx(
              "flex flex-col items-center gap-1.5 group shrink-0 relative px-3 py-2 lg:px-0 lg:py-0",
              isActive 
                ? "text-primary-600 lg:text-slate-950" 
                : "text-slate-400 hover:text-slate-600 lg:hover:text-slate-950"
            )}
          >
            <div className={clsx(
              "p-2 lg:p-3 rounded-2xl transition-all active:scale-95",
              "group-hover:bg-slate-50 lg:group-hover:bg-slate-50"
            )}>
              <item.icon className={clsx(
                "w-6 h-6 lg:w-7 lg:h-7",
                "transition-none"
              )} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-bold lg:hidden tracking-tight uppercase">{item.label}</span>
            
            {/* Tooltip for Desktop */}
            <div className="hidden lg:block absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[110] transition-none uppercase tracking-widest shadow-lg">
              {item.label}
            </div>
            
            {/* Active Indicator for Desktop */}
            <div className={clsx(
                "hidden lg:block absolute left-0 w-1 bg-slate-950 rounded-r-full transition-all top-1/2 -translate-y-1/2 h-0",
                "group-[.active]:h-8"
              )} />
          </NavLink>
        ))}
      </nav>

      {/* Bottom Actions - Desktop only */}
      <div className="hidden lg:flex flex-col items-center gap-6 mt-auto shrink-0 pb-2">
        <button
          onClick={logout}
          className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl group relative transition-none"
          title="Logout"
        >
          <LogOut className="w-7 h-7" strokeWidth={2.5} />
          <div className="absolute left-full ml-4 px-3 py-1.5 bg-red-500 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[110] transition-none uppercase tracking-widest shadow-lg">
            Logout
          </div>
        </button>

        <NavLink
          to="/dashboard/profile"
          className={({ isActive }) => clsx(
            "w-12 h-12 rounded-2xl border-2 p-0.5 overflow-hidden transition-all active:scale-95",
            isActive ? "border-slate-950 shadow-md" : "border-slate-100 hover:border-slate-300"
          )}
        >
          <img 
            src={getMediaUrl(user?.profile_picture) || `https://ui-avatars.com/api/?name=${user?.name}`} 
            alt="Profile" 
            className="w-full h-full object-cover rounded-[14px]" 
          />
        </NavLink>
      </div>
    </aside>
  );
};

export default Navbar;
