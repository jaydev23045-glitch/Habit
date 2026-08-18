import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, CheckSquare, GraduationCap, Sprout, Settings, 
  Menu, X, Brain, Calendar, Sunset, BarChart3, Zap, Timer 
} from 'lucide-react';
import { ViewName } from '../types';
import { audioService } from '../services/audioService';

interface MobileNavProps {
  currentView: ViewName;
  setView: (view: ViewName) => void;
}

const NavIcon = ({ view, icon: Icon, active, onClick, label }: { view: ViewName, icon: any, active: boolean, onClick: () => void, label?: string }) => (
  <button
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={`flex flex-col items-center justify-center flex-1 py-2 transition-all active:scale-95 ${
      active ? 'text-primary' : 'text-slate-500 hover:text-slate-300'
    }`}
  >
    <div className={`relative p-1 rounded-xl transition-all ${active ? 'bg-primary/10' : ''}`}>
        <Icon size={24} strokeWidth={active ? 2.5 : 2} />
        {active && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></div>}
    </div>
    <span className={`text-[9px] font-black uppercase tracking-tighter mt-1 ${active ? 'opacity-100 text-primary' : 'opacity-60'}`}>
      {label || (view === 'learning' ? 'Learn' : view)}
    </span>
  </button>
);

const MenuItem = ({ view, icon: Icon, label, active, onClick }: { view: ViewName, icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
      active 
        ? 'bg-primary/20 border-primary text-primary shadow-lg shadow-primary/10' 
        : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10 hover:text-white'
    }`}
  >
    <Icon size={28} className="mb-2" />
    <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

export const MobileNav: React.FC<MobileNavProps> = ({ currentView, setView }) => {
  const [isOpen, setIsOpen] = useState(false);
  const touchStartYRef = useRef<number | null>(null);

  // Background scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleNav = (view: ViewName) => {
    audioService.playAction();
    setView(view);
    setIsOpen(false);
  };

  const toggleMenu = () => {
    audioService.playAction();
    setIsOpen(!isOpen);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartYRef.current === null) return;
    const currentY = e.touches[0].clientY;
    const diffY = currentY - touchStartYRef.current;
    if (diffY > 80) { // Swipe down threshold
      setIsOpen(false);
      touchStartYRef.current = null;
    }
  };

  const handleTouchEnd = () => {
    touchStartYRef.current = null;
  };

  return (
    <>
      {/* Expanded Menu Overlay */}
      {isOpen && (
        <div 
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="fixed inset-0 z-40 bg-bgDarker/95 backdrop-blur-2xl animate-fade-in flex flex-col p-6 pb-24 overflow-y-auto"
        >
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-primary/20 text-primary rounded-xl flex items-center justify-center">
                 <Zap size={20} fill="currentColor" />
               </div>
               <span className="text-xl font-black text-white italic tracking-tight">System Menu</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-3 bg-white/5 rounded-full text-slate-400 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 pl-1">Core Modules</h4>
              <div className="grid grid-cols-2 gap-3">
                <MenuItem view="dashboard" label="Dashboard" icon={LayoutDashboard} active={currentView === 'dashboard'} onClick={() => handleNav('dashboard')} />
                <MenuItem view="tasks" label="Task Ledger" icon={CheckSquare} active={currentView === 'tasks'} onClick={() => handleNav('tasks')} />
                <MenuItem view="focus" label="Focus Mode" icon={Brain} active={currentView === 'focus'} onClick={() => handleNav('focus')} />
                <MenuItem view="habits" label="Habits" icon={Sprout} active={currentView === 'habits'} onClick={() => handleNav('habits')} />
                <MenuItem view="work" label="Work Tracker" icon={Timer} active={currentView === 'work'} onClick={() => handleNav('work')} />
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 pl-1">Knowledge & Growth</h4>
              <div className="grid grid-cols-2 gap-3">
                <MenuItem view="learning" label="Learning" icon={GraduationCap} active={currentView === 'learning'} onClick={() => handleNav('learning')} />
                <MenuItem view="forecast" label="Forecast" icon={Calendar} active={currentView === 'forecast'} onClick={() => handleNav('forecast')} />
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 pl-1">Analysis & Config</h4>
              <div className="grid grid-cols-3 gap-3">
                <MenuItem view="review" label="Review" icon={Sunset} active={currentView === 'review'} onClick={() => handleNav('review')} />
                <MenuItem view="reports" label="Reports" icon={BarChart3} active={currentView === 'reports'} onClick={() => handleNav('reports')} />
                <MenuItem view="settings" label="Settings" icon={Settings} active={currentView === 'settings'} onClick={() => handleNav('settings')} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav 
        className="lg:hidden fixed bottom-0 left-0 w-full bg-bgDarker/90 backdrop-blur-xl border-t border-white/5 px-2 z-50 flex items-center justify-around h-[calc(4rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
      >
        {/* Direct Access Slots */}
        <NavIcon view="dashboard" icon={LayoutDashboard} active={currentView === 'dashboard'} onClick={() => handleNav('dashboard')} />
        <NavIcon view="tasks" icon={CheckSquare} active={currentView === 'tasks'} onClick={() => handleNav('tasks')} />
        
        {/* Center Floating Action Button Style for Menu */}
        <div className="relative -top-5">
           <button 
             onClick={toggleMenu}
             className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-95 border border-white/10 ${isOpen ? 'bg-white text-bgDarker rotate-90' : 'bg-primary text-white shadow-primary/30'}`}
           >
             {isOpen ? <X size={24} strokeWidth={3} /> : <Menu size={24} strokeWidth={3} />}
           </button>
        </div>

        <NavIcon view="review" label="Review" icon={Sunset} active={currentView === 'review'} onClick={() => handleNav('review')} />
        <NavIcon view="reports" label="Report" icon={BarChart3} active={currentView === 'reports'} onClick={() => handleNav('reports')} />
      </nav>
    </>
  );
};
