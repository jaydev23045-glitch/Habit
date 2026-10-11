
import React from 'react';
import { LayoutDashboard, Brain, CheckSquare, GraduationCap, Sprout, Calendar, Sunset, BarChart3, Settings, Circle, Timer } from 'lucide-react';
import { ViewName } from '../types';

interface SidebarProps {
  currentView: ViewName;
  setView: (view: ViewName) => void;
}

const NavItem = ({ 
  view, 
  label, 
  icon: Icon, 
  active, 
  onClick, 
  hotkey 
}: { 
  view: ViewName; 
  label: string; 
  icon: any; 
  active: boolean; 
  onClick: () => void; 
  hotkey?: string; 
}) => (
  <button
    onClick={onClick}
    className={`group w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 relative ${
      active 
        ? 'bg-gradient-to-r from-primary/20 via-primary/10 to-transparent text-white border border-primary/30 shadow-[0_0_20px_rgba(139,92,246,0.15)]' 
        : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200 border border-transparent'
    }`}
  >
    {active && (
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary rounded-r-full shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
    )}
    <Icon size={17} strokeWidth={active ? 2.4 : 1.9} className={active ? 'text-primary' : 'text-slate-500 group-hover:text-slate-300 transition-colors'} />
    <span className="tracking-tight">{label}</span>
    {hotkey && (
      <span className={`ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded border transition-colors ${
        active 
          ? 'bg-primary/20 border-primary/30 text-primary-hover font-bold' 
          : 'bg-white/[0.03] border-white/[0.05] text-slate-500 group-hover:text-slate-400'
      }`}>
        {hotkey}
      </span>
    )}
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-bgDarker/95 backdrop-blur-2xl border-r border-cardBorder hidden lg:flex flex-col p-6 z-50 shadow-2xl">
      <div className="flex items-center gap-3.5 mb-8 relative">
        <div className="w-10 h-10 bg-gradient-to-br from-primary via-indigo-600 to-purple-700 rounded-xl flex items-center justify-center font-bold text-white text-lg shadow-[0_0_25px_rgba(139,92,246,0.4)] border border-white/10">
          ⚡
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-black tracking-tight text-white">Flow OS</span>
            <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 tracking-widest">PRO</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
            <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Local Neural Engine</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto pr-1 -mr-1">
        <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] mb-3 px-2">Navigation</div>
        <NavItem view="dashboard" label="Dashboard" icon={LayoutDashboard} active={currentView === 'dashboard'} onClick={() => setView('dashboard')} hotkey="⌘1" />
        <NavItem view="focus" label="Focus Mode" icon={Brain} active={currentView === 'focus'} onClick={() => setView('focus')} hotkey="⌘2" />
        <NavItem view="work" label="Work Tracker" icon={Timer} active={currentView === 'work'} onClick={() => setView('work')} hotkey="⌘3" />
        <NavItem view="tasks" label="Task Ledger" icon={CheckSquare} active={currentView === 'tasks'} onClick={() => setView('tasks')} hotkey="⌘4" />
        <NavItem view="learning" label="Learning SRS" icon={GraduationCap} active={currentView === 'learning'} onClick={() => setView('learning')} hotkey="⌘5" />
        <NavItem view="habits" label="Habit Engine" icon={Sprout} active={currentView === 'habits'} onClick={() => setView('habits')} hotkey="⌘6" />
        <NavItem view="forecast" label="Forecast" icon={Calendar} active={currentView === 'forecast'} onClick={() => setView('forecast')} hotkey="⌘7" />
        <NavItem view="review" label="Day Review" icon={Sunset} active={currentView === 'review'} onClick={() => setView('review')} hotkey="⌘8" />
        <NavItem view="reports" label="Analytics" icon={BarChart3} active={currentView === 'reports'} onClick={() => setView('reports')} />
      </nav>

      <div className="mt-4 pt-4 border-t border-white/[0.06]">
        <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] mb-2 px-2">Core System</div>
        <NavItem view="settings" label="Settings & Keys" icon={Settings} active={currentView === 'settings'} onClick={() => setView('settings')} hotkey="⌘," />
      </div>
      
      <div className="mt-4 p-3.5 bg-white/[0.02] border border-white/[0.06] rounded-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center gap-2 mb-1.5">
            <Circle size={6} fill="currentColor" className="text-emerald-400 animate-pulse" />
            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Zero-Knowledge Vault</span>
        </div>
        <div className="text-[9px] text-slate-400 leading-relaxed font-medium">
            AES-256 local encrypted storage. 100% private to this browser.
        </div>
      </div>
    </aside>
  );
};
