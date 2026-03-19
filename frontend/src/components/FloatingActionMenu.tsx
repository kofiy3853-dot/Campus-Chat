import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Plus, 
  MessageSquare, 
  Ghost, 
  Calendar, 
  Package, 
  Megaphone,
  X,
  BookOpen
} from 'lucide-react';
import { clsx } from 'clsx';

const FloatingActionMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isMarketplace = location.pathname.includes('/marketplace');

  const options = [
    { 
      label: 'New Study Group', 
      icon: BookOpen, 
      color: 'bg-indigo-50 text-indigo-600',
      action: () => {
        navigate('/dashboard/study-groups');
        setIsOpen(false);
      }
    },
    { 
      label: 'Start New Chat', 
      icon: MessageSquare, 
      color: 'bg-sky-50 text-sky-600',
      action: () => {
        navigate('/dashboard/chats');
        setIsOpen(false);
      }
    },
    { 
      label: 'Post Confession', 
      icon: Ghost, 
      color: 'bg-purple-50 text-purple-600',
      action: () => {
        navigate('/dashboard/confessions?compose=true');
        setIsOpen(false);
      }
    },
    { 
      label: 'Create Event', 
      icon: Calendar, 
      color: 'bg-green-50 text-green-600',
      action: () => {
        navigate('/dashboard/events?compose=true');
        setIsOpen(false);
      }
    },
    { 
      label: 'Post Announcement', 
      icon: Megaphone, 
      color: 'bg-amber-50 text-amber-600',
      action: () => {
        navigate('/dashboard/announcements?compose=true');
        setIsOpen(false);
      }
    },
    { 
      label: 'Report Lost Item', 
      icon: Package, 
      color: 'bg-orange-50 text-orange-600',
      action: () => {
        navigate('/dashboard/lost-found');
        setIsOpen(false);
      }
    },
  ];

  return (
    <>
      {/* FAB Button */}
      <div className="fixed bottom-24 right-6 z-[60] md:bottom-10 md:right-10">
        <button
          onClick={() => setIsOpen(!isOpen)}
          title={isOpen ? "Close menu" : "Open menu"}
          className={clsx(
            "w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 active:scale-90",
            isMarketplace ? "shadow-[#6A35FF]/40" : "shadow-sky-200",
            isOpen 
              ? "bg-slate-800 text-white rotate-45" 
              : isMarketplace 
                ? "bg-[#6A35FF] text-white" 
                : "bg-sky-500 text-white"
          )}
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          <Plus className="w-8 h-8" />
        </button>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[55] animate-in fade-in duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Menu Modal */}
      <div 
        className={clsx(
          "fixed inset-x-0 bottom-0 z-[58] bg-white rounded-t-[2.5rem] px-6 pt-8 pb-32 transition-transform duration-500 ease-out transform shadow-2xl md:max-w-md md:left-auto md:right-10 md:bottom-28 md:rounded-3xl md:pb-8",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="flex items-center justify-between mb-8 md:hidden">
          <h3 className="text-xl font-black text-slate-800">Quick Actions</h3>
          <button 
            onClick={() => setIsOpen(false)}
            title="Close"
            aria-label="Close"
            className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {options.map((option, idx) => (
            <button
              key={idx}
              onClick={option.action}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:border-sky-200 hover:shadow-md transition-all group"
            >
              <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", option.color)}>
                <option.icon className="w-6 h-6" />
              </div>
              <span className="font-bold text-slate-700 tracking-tight">{option.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default FloatingActionMenu;
