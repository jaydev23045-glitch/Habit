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
    className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-all active:scale-90 ${
      active ? 'text-white' : 'text-slate-500 hover:text-slate-300'
    }`}
  >
    <div className={`relative p-1.5 rounded-xl transition-all ${active ? 'bg-primary/20 text-primary shadow-[0_0_15px_rgba(139,92,246,0.3)]' : ''}`}>
        <Icon size={20} strokeWidth={active ? 2.5 : 1.8} className={active ? 'text-primary' : ''} />
        {active && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_6px_rgba(139,92,246,0.9)]"></div>}
    </div>
    <span className={`text-[8px] font-black uppercase tracking-wider mt-0.5 transition-colors ${active ? 'text-primary font-bold' : 'text-slate-500'}`}>
      {label || (view === 'learning' ? 'Learn' : view)}
    </span>
  </button>
);

const MenuItem = ({ view, icon: Icon, label, active, onClick }: { view: ViewName, icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all active:scale-95 ${
      active 
        ? 'bg-primary/20 border-primary/40 text-white shadow-lg shadow-primary/20' 
        : 'bg-white/[0.03] border-white/[0.06] text-slate-400 hover:bg-white/[0.06] hover:text-white'
    }`}
  >
    <Icon size={24} className={`mb-1.5 ${active ? 'text-primary' : 'text-slate-400'}`} />
    <span className="text-[9px] font-black uppercase tracking-wider">{label}</span>
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
          className="fixed inset-0 z-[150] bg-[#06080c]/95 backdrop-blur-3xl animate-fade-in flex flex-col p-5 sm:p-6 pt-[max(env(safe-area-inset-top),1.5rem)] pb-[calc(5.5rem+env(safe-area-inset-bottom))] overflow-y-auto select-none"
        >
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-primary/20 text-primary rounded-2xl flex items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                 <Zap size={20} fill="currentColor" />
               </div>
               <div>
                 <span className="text-xl font-black text-white italic tracking-tight block">Flow OS</span>
                 <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">System Menu</span>
               </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-3 bg-white/[0.05] hover:bg-white/[0.1] rounded-2xl text-slate-400 hover:text-white transition-colors"
            >
              <X size={22} />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-3 pl-1">Daily Operations</h4>
              <div className="grid grid-cols-2 gap-2.5">
                <MenuItem view="dashboard" label="Dashboard" icon={LayoutDashboard} active={currentView === 'dashboard'} onClick={() => handleNav('dashboard')} />
                <MenuItem view="tasks" label="Task Ledger" icon={CheckSquare} active={currentView === 'tasks'} onClick={() => handleNav('tasks')} />
                <MenuItem view="focus" label="Focus Mode" icon={Brain} active={currentView === 'focus'} onClick={() => handleNav('focus')} />
                <MenuItem view="habits" label="Habits" icon={Sprout} active={currentView === 'habits'} onClick={() => handleNav('habits')} />
                <MenuItem view="work" label="Work Tracker" icon={Timer} active={currentView === 'work'} onClick={() => handleNav('work')} />
                <MenuItem view="forecast" label="Forecast" icon={Calendar} active={currentView === 'forecast'} onClick={() => handleNav('forecast')} />
              </div>
            </div>

            <div>
              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-3 pl-1">Knowledge & Reviews</h4>
              <div className="grid grid-cols-2 gap-2.5">
                <MenuItem view="learning" label="Learning SRS" icon={GraduationCap} active={currentView === 'learning'} onClick={() => handleNav('learning')} />
                <MenuItem view="review" label="Day Review" icon={Sunset} active={currentView === 'review'} onClick={() => handleNav('review')} />
              </div>
            </div>

            <div>
              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-3 pl-1">Analytics & Config</h4>
              <div className="grid grid-cols-2 gap-2.5">
                <MenuItem view="reports" label="Reports" icon={BarChart3} active={currentView === 'reports'} onClick={() => handleNav('reports')} />
                <MenuItem view="settings" label="Settings" icon={Settings} active={currentView === 'settings'} onClick={() => handleNav('settings')} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav 
        className="lg:hidden fixed bottom-0 left-0 w-full bg-[#06080c]/90 backdrop-blur-2xl border-t border-white/[0.08] px-2 z-50 flex items-center justify-around h-[calc(4rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_40px_rgba(0,0,0,0.7)]"
      >
        {/* Direct Access Slots */}
        <NavIcon view="dashboard" icon={LayoutDashboard} active={currentView === 'dashboard'} onClick={() => handleNav('dashboard')} />
        <NavIcon view="tasks" icon={CheckSquare} active={currentView === 'tasks'} onClick={() => handleNav('tasks')} />
        
        {/* Center Floating Action Button Style for Menu */}
        <div className="relative -top-5">
           <button 
             onClick={toggleMenu}
             className={`w-13 h-13 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-90 border border-white/20 ${isOpen ? 'bg-white text-bgDarker rotate-90 shadow-white/20' : 'bg-gradient-to-tr from-primary to-primary-hover text-white shadow-[0_0_25px_rgba(139,92,246,0.5)]'}`}
           >
             {isOpen ? <X size={22} strokeWidth={2.8} /> : <Menu size={22} strokeWidth={2.8} />}
           </button>
        </div>

        <NavIcon view="review" label="Review" icon={Sunset} active={currentView === 'review'} onClick={() => handleNav('review')} />
        <NavIcon view="reports" label="Report" icon={BarChart3} active={currentView === 'reports'} onClick={() => handleNav('reports')} />
      </nav>
    </>
  );
};
