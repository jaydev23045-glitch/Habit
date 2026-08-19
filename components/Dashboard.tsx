
import React from 'react';
import { AppData, ViewName, HorizonPotential } from '../types';
import { CheckCircle2, Circle, ArrowRight, CloudSun, ArrowDownRight, BookOpen, Lightbulb, ClipboardList, Wind, Zap, CalendarClock, Clock } from 'lucide-react';
import { StatsRadar } from './StatsRadar';
import { useCharacter } from '../hooks/useCharacter';
import { SystemBriefing } from './SystemBriefing';
import { getFlowDate } from '../services/dateService';

interface DashboardProps {
  data: AppData;
  toggleTask: (id: string) => void;
  toggleHabit: (id: string) => void;
  switchView: (view: ViewName) => void;
  selectedDate: string;
  convertPotential?: (id: string) => void; 
  dismissPotential?: (id: string) => void; 
}

export const Dashboard: React.FC<DashboardProps> = ({ data, toggleTask, toggleHabit, switchView, selectedDate, convertPotential, dismissPotential }) => {
  const today = new Date().toISOString().split('T')[0];
  const isPast = selectedDate < today;

  const { level, progressPercent } = useCharacter(data.user);

  // Filter tasks for the SELECTED DATE - with safe defaults and safe access
  const tasks = data?.tasks || [];
  const habits = data?.habits || [];
  const topics = data?.topics || [];
  const potentials = data?.potentials || [];

  const activeTasks = tasks.filter(t => t?.date === selectedDate);
  const completedTasksCount = activeTasks.filter(t => t?.completed).length;
  const totalTasksCount = activeTasks.length; 
  const taskProgress = totalTasksCount === 0 ? 0 : (completedTasksCount / totalTasksCount) * 100;
  const pendingCount = totalTasksCount - completedTasksCount;

  const completedHabitsCount = habits.filter(h => h?.completed).length;
  const totalHabitsCount = habits.length;
  const habitProgress = totalHabitsCount === 0 ? 0 : (completedHabitsCount / totalHabitsCount) * 100;
  
  const topicsDue = topics.filter(t => t?.status === 'active' && t?.nextReviewDate && t.nextReviewDate <= today).length;

  // HORIZON ARRIVALS (Includes missed items drifting forward)
  const arrivals = potentials.filter(p => p?.status === 'ready' && p?.targetDate && p.targetDate <= selectedDate);

  const getArrivalIcon = (cat: string) => {
    switch(cat) {
        case 'learning': return <BookOpen size={16} className="text-purple-400"/>;
        case 'idea': return <Lightbulb size={16} className="text-yellow-400"/>;
        case 'admin': return <ClipboardList size={16} className="text-slate-400"/>;
        default: return <CloudSun size={16} className="text-blue-400"/>;
    }
  };

  return (
    <div className="grid gap-6 animate-fade-in pb-12">
      
      {selectedDate !== today && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 p-4 rounded-xl flex items-center justify-center font-bold text-sm gap-3">
              <Wind size={16} className="animate-pulse" /> Viewing {selectedDate} — {isPast ? 'History Vault' : 'Future Forecast'}
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CHARACTER STATS (RADAR) */}
        <div className="lg:col-span-1 bg-cardBg border border-cardBorder rounded-[2rem] p-6 relative overflow-hidden flex flex-col items-center justify-center shadow-2xl">
           <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-primary to-emerald-500 opacity-50"></div>
           <div className="w-full flex justify-between items-center mb-4 px-2">
              <div>
                 <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Operator Level</div>
                 <div className="text-3xl font-black text-white italic tracking-tighter">Lvl {level}</div>
              </div>
              <div className="text-right">
                 <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{Math.round(progressPercent)}% to Next</div>
                 <div className="w-20 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${progressPercent}%` }}></div>
                 </div>
              </div>
           </div>
           
           <div className="w-full h-56">
              <StatsRadar stats={data.user.stats} />
           </div>
        </div>

        {/* System Briefing / Cortex Module */}
        <div className="lg:col-span-2 bg-gradient-to-br from-teal-500/10 to-primary/10 border border-primary/20 rounded-[2rem] p-8">
           <SystemBriefing user={data.user} tasks={activeTasks} />
        </div>
      </div>

      {/* HORIZON ARRIVALS SECTION */}
      {arrivals.length > 0 && selectedDate === today && (
         <div className="bg-indigo-900/10 border border-indigo-500/20 rounded-[2rem] p-8 animate-slide-in relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Wind size={80} />
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
                <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400">
                    <CloudSun size={32} />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-white italic">Horizon Arrivals</h3>
                    <p className="text-sm text-indigo-300/70">These potentials have landed today. Commit to the plan or let them drift back to the horizon.</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {arrivals.map((p, index) => (
                    <div key={p?.id || `potential-arrival-${index}`} className="bg-bgDark/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between group hover:border-indigo-500/40 transition-all backdrop-blur-sm">
                        <div className="flex items-center gap-4">
                             <div className="p-2.5 bg-white/5 rounded-xl">
                                 {getArrivalIcon(p?.category || 'task')}
                             </div>
                             <div>
                                 <div className="font-bold text-slate-200 text-sm">{p?.title || 'Untitled'}</div>
                                 <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">{p?.category || 'task'}</span>
                                    {p?.targetDate && p.targetDate < today && (
                                      <span className="text-[9px] font-black uppercase text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded tracking-tighter">Drifted Item</span>
                                    )}
                                 </div>
                             </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                            <button 
                                onClick={() => dismissPotential && p?.id && dismissPotential(p.id)}
                                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                            >
                                Drift
                            </button>
                            <button 
                                onClick={() => convertPotential && p?.id && convertPotential(p.id)}
                                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                            >
                                Engage <Zap size={12} fill="currentColor"/>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
         </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-cardBg border border-cardBorder rounded-[2rem] p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-xs uppercase tracking-[0.3em] text-slate-500 flex items-center gap-3">
              <CalendarClock className="text-primary" size={16}/> Daily Agenda
            </h3>
            <button onClick={() => switchView('tasks')} className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-all">Expand View</button>
          </div>
          <div className="space-y-4">
            {activeTasks.length === 0 ? (
              <div className="text-slate-500 text-sm italic py-8 text-center border-2 border-dashed border-white/5 rounded-2xl">
                No active protocols for {selectedDate}.
              </div>
            ) : (
              activeTasks.slice(0, 6).map(task => (
                <div key={task.id} className={`flex items-start gap-4 p-4 rounded-2xl transition-all ${task.completed ? 'opacity-40' : 'bg-bgDark/40 hover:bg-white/5'}`}>
                  <button onClick={() => toggleTask(task.id)} className="mt-1 text-slate-400 hover:text-primary transition-all active:scale-90">
                     {task.completed ? <CheckCircle2 className="text-emerald-500" /> : <Circle />}
                  </button>
                  <div className="flex-1 min-w-0">
                     <div className={`font-bold text-sm truncate ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>{task.title}</div>
                     <div className="flex gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                        <span className="flex items-center gap-1"><Clock size={10}/> {task.time}</span>
                        <span className="text-primary-hover">{task.priority || 'General'}</span>
                     </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-cardBg border border-cardBorder rounded-[2rem] p-8">
          <div className="flex items-center justify-between mb-8">
             <h3 className="font-black text-xs uppercase tracking-[0.3em] text-slate-500 flex items-center gap-3">
               <Zap className="text-orange-400" size={16}/> Protocol Check
             </h3>
             <button onClick={() => switchView('habits')} className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-all">View Analytics</button>
          </div>
          <div className="space-y-3">
            {habits.length === 0 ? (
              <div className="text-slate-500 text-sm italic py-8 text-center border-2 border-dashed border-white/5 rounded-2xl">
                No active habits in logic.
              </div>
            ) : (
              habits.slice(0, 5).map(habit => {
                const flowToday = getFlowDate();
                const isDoneToday = !!(habit.history && habit.history[flowToday]);
                return (
                  <div key={habit.id} className="flex items-center justify-between p-4 bg-bgDark/40 rounded-2xl border border-transparent hover:border-white/5 transition-all">
                      <span className="text-sm font-bold text-slate-300">{habit.title}</span>
                      <button 
                        onClick={() => toggleHabit(habit.id)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isDoneToday ? 'bg-teal-500 text-bgDarker' : 'bg-white/5 text-slate-500 hover:text-white border border-white/5'}`}
                      >
                        {isDoneToday ? 'Verified' : 'Log Entry'}
                      </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
