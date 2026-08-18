
import React from 'react';
import { LayoutDashboard, Brain, CheckSquare, GraduationCap, Sprout, Calendar, Sunset, BarChart3, Settings, Circle, Timer } from 'lucide-react';
import { ViewName } from '../types';

interface SidebarProps {
  currentView: ViewName;
  setView: (view: ViewName) => void;
}

const NavItem = ({ view, label, icon: Icon, active, onClick }: { view: ViewName, label: string, icon: any, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
      active 
        ? 'bg-primary/20 text-primary shadow-[inset_0_0_20px_rgba(124,58,237,0.1)] border-l-4 border-primary pl-3' 
        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
    }`}
  >
    <Icon size={19} strokeWidth={active ? 2.5 : 2} />
    <span>{label}</span>
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-bgDarker/95 backdrop-blur-xl border-r border-cardBorder hidden lg:flex flex-col p-6 z-50 shadow-2xl">
      <div className="flex items-center gap-4 mb-10 relative">
        <div className="w-12 h-12 bg-gradient-to-br from-primary via-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center font-bold text-white text-2xl shadow-[0_8px_20px_-5px_rgba(124,58,237,0.5)]">
          ⚡
        </div>
        <div>
          <span className="text-xl font-black tracking-tight block text-white">Flow OS</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
            <span className="text-[8px] font-black uppercase text-emerald-500 tracking-[0.2em] block">Live Engine</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto pr-2 -mr-2">
        <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4 px-3">Main Navigation</div>
        <NavItem view="dashboard" label="Dashboard" icon={LayoutDashboard} active={currentView === 'dashboard'} onClick={() => setView('dashboard')} />
        <NavItem view="focus" label="Focus Mode" icon={Brain} active={currentView === 'focus'} onClick={() => setView('focus')} />
        <NavItem view="work" label="Work Tracker" icon={Timer} active={currentView === 'work'} onClick={() => setView('work')} />
        <NavItem view="tasks" label="Tasks" icon={CheckSquare} active={currentView === 'tasks'} onClick={() => setView('tasks')} />
        <NavItem view="learning" label="Learning" icon={GraduationCap} active={currentView === 'learning'} onClick={() => setView('learning')} />
        <NavItem view="habits" label="Habits" icon={Sprout} active={currentView === 'habits'} onClick={() => setView('habits')} />
        <NavItem view="forecast" label="Forecast" icon={Calendar} active={currentView === 'forecast'} onClick={() => setView('forecast')} />
        <NavItem view="review" label="Day Review" icon={Sunset} active={currentView === 'review'} onClick={() => setView('review')} />
        <NavItem view="reports" label="Reports" icon={BarChart3} active={currentView === 'reports'} onClick={() => setView('reports')} />
      </nav>

      <div className="mt-8 pt-6 border-t border-cardBorder/50">
        <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4 px-3">Core System</div>
        <NavItem view="settings" label="Settings" icon={Settings} active={currentView === 'settings'} onClick={() => setView('settings')} />
      </div>
      
      <div className="mt-6 p-4 bg-primary/5 border border-primary/10 rounded-2xl">
        <div className="flex items-center gap-2 mb-2">
            <Circle size={8} fill="currentColor" className="text-emerald-500" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vault Link OK</span>
        </div>
        <div className="text-[9px] text-slate-500 leading-relaxed font-medium">
            Cloud Vault Synchronized with Supabase Database.
        </div>
      </div>
    </aside>
  );
};
