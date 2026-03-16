import React from 'react';
import { 
  Users, 
  Calendar, 
  Briefcase, 
  Globe, 
  Sparkles, 
  Trophy, 
  X,
  ChevronRight
} from 'lucide-react';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';

interface ExploreMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const EXPLORE_OPTIONS = [
  { icon: Users, label: 'Study Groups', description: 'Find study partners', color: 'bg-blue-50 text-blue-500', to: '/dashboard/discover' },
  { icon: Calendar, label: 'Campus Events', description: 'What\'s happening now', color: 'bg-purple-50 text-purple-500', to: '/dashboard/events' },
  { icon: Briefcase, label: 'Internships', description: 'Career opportunities', color: 'bg-orange-50 text-orange-500', to: '/dashboard/discover' },
  { icon: Globe, label: 'Clubs & Communities', description: 'Join student orgs', color: 'bg-green-50 text-green-500', to: '/dashboard/discover' },
  { icon: Sparkles, label: 'AI Study Assistant', description: 'Your academic helper', color: 'bg-sky-50 text-sky-500', to: '/dashboard/chat/ai' },
  { icon: Trophy, label: 'Leaderboard', description: 'Campus top performers', color: 'bg-amber-50 text-amber-500', to: '/dashboard/discover' },
];

const ExploreMenu: React.FC<ExploreMenuProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/40 backdrop-blur-md transition-all duration-300 animate-in fade-in">
      <div 
        className="fixed inset-0 cursor-pointer" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full md:slide-in-from-bottom-20 duration-500">
        {/* Handle for mobile */}
        <div className="md:hidden w-12 h-1.5 bg-slate-100 rounded-full mx-auto mt-4 mb-2" />
        
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Explore Campus</h2>
              <p className="text-sm text-slate-400 font-medium">Everything you need in one place</p>
            </div>
            <button 
              onClick={onClose}
              title="Close explore menu"
              className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {EXPLORE_OPTIONS.map((option) => (
              <button
                key={option.label}
                onClick={() => {
                  navigate(option.to);
                  onClose();
                }}
                className="flex items-center gap-4 p-4 rounded-3xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group text-left"
              >
                <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110", option.color)}>
                  <option.icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800 text-sm group-hover:text-sky-600 transition-colors">{option.label}</h4>
                  <p className="text-xs text-slate-400 font-medium truncate">{option.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-50 text-center">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Powered by Campus Connect</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExploreMenu;
