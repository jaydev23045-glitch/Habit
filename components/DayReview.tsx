import React, { useState, useEffect } from 'react';
import { AppData, Task, DayReflection } from '../types';
import { Save, Sunset, Star, Zap, Activity, CheckCircle2, Circle, ArrowRight, CalendarClock, TrendingUp, AlertCircle, RotateCcw, Smile, Battery, MessageSquare } from 'lucide-react';
import { subtractDays } from '../services/dateService';

interface DayReviewProps {
  data: AppData;
  updateTask: (id: string, updates: Partial<Task>) => void;
  selectedDate: string;
  onSaveReview?: (review: DayReflection) => void;
}

export const DayReview: React.FC<DayReviewProps> = ({ data, updateTask, selectedDate, onSaveReview }) => {
  // Reflection State
  const [quality, setQuality] = useState(7);
  const [mood, setMood] = useState('Good');
  const [energy, setEnergy] = useState('Medium');
  const [wins, setWins] = useState('');
  const [blockers, setBlockers] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // Date Logic
  const tomorrowStr = subtractDays(selectedDate, -1);

  // Data Aggregation
  const activeTasks = data.tasks.filter(t => t.date === selectedDate);
  const completedTasks = activeTasks.filter(t => t.completed);
  const incompleteTasks = activeTasks.filter(t => !t.completed);
  
  const completionRate = activeTasks.length > 0 ? (completedTasks.length / activeTasks.length) * 100 : 0;
  
  // Calculate Grade
  const getGrade = () => {
    if (activeTasks.length === 0) return 'N/A';
    const score = (completionRate * 0.7) + (quality * 3); // Weight completion and self-rated quality
    if (score >= 90) return 'S';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 50) return 'C';
    return 'D';
  };

  const grade = getGrade();

  // Focus Stats
  const focusMinutes = completedTasks.reduce((acc, t) => acc + (t.actualDuration || 30), 0); // Default 30 if not logged
  const intensityCounts = {
    high: completedTasks.filter(t => t.intensity === 'high').length,
    medium: completedTasks.filter(t => t.intensity === 'medium').length,
    low: completedTasks.filter(t => t.intensity === 'low').length,
  };

  useEffect(() => {
    setIsSaved(false); // Reset saved state
  }, [selectedDate]);

  const handleRescheduleAll = () => {
    incompleteTasks.forEach(task => {
      updateTask(task.id, { date: tomorrowStr });
    });
    alert(`${incompleteTasks.length} tasks moved to tomorrow.`);
  };

  const handleSaveDay = () => {
    setIsSaved(true);
    if (onSaveReview) {
      onSaveReview({
        date: selectedDate,
        wins,
        blockers,
        mood,
        energy,
        quality,
        summary: wins || blockers || ''
      });
    }
  };

  if (isSaved) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] animate-fade-in">
         <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 size={40} />
         </div>
         <h2 className="text-3xl font-bold text-white mb-2">Review Saved</h2>
         <p className="text-slate-400">Great work. Data logged for {selectedDate}.</p>
         <div className="mt-8 flex gap-8 text-center bg-cardBg/50 p-8 rounded-3xl border border-cardBorder">
            <div>
               <div className="text-2xl font-bold text-primary">{focusMinutes}m</div>
               <div className="text-[10px] uppercase text-slate-500 font-black tracking-widest mt-1">Focus</div>
            </div>
            <div className="w-px bg-white/10"></div>
            <div>
               <div className="text-2xl font-bold text-teal-400">{completedTasks.length}</div>
               <div className="text-[10px] uppercase text-slate-500 font-black tracking-widest mt-1">Tasks</div>
            </div>
            <div className="w-px bg-white/10"></div>
            <div>
               <div className="text-2xl font-bold text-purple-400">{grade}</div>
               <div className="text-[10px] uppercase text-slate-500 font-black tracking-widest mt-1">Grade</div>
            </div>
         </div>
         <button 
           onClick={() => setIsSaved(false)}
           className="mt-8 text-slate-500 hover:text-white text-sm underline font-bold uppercase tracking-widest"
         >
           Edit Review
         </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-fade-in pb-32">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-10 border-b border-cardBorder">
        <div>
           <div className="flex items-center gap-4 mb-3">
             <div className="p-3 bg-orange-500/10 rounded-2xl">
                <Sunset className="text-orange-400" size={32} />
             </div>
             <h1 className="text-4xl font-black text-white italic tracking-tight">Day Review</h1>
           </div>
           <p className="text-slate-400 font-medium ml-1">Archive the past, calibrate for the future.</p>
        </div>
        
        <div className="flex items-center gap-10 bg-cardBg border border-cardBorder rounded-3xl p-6 px-10 shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full"></div>
           <div className="text-center relative z-10">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Temporal Grade</div>
              <div className={`text-5xl font-black tracking-tighter ${
                grade === 'S' || grade === 'A' ? 'text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-orange-500' :
                grade === 'B' ? 'text-blue-400' : 'text-slate-400'
              }`}>{grade}</div>
           </div>
           <div className="w-px h-12 bg-white/5"></div>
           <div className="text-center relative z-10">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Completion</div>
              <div className="text-3xl font-black text-white tracking-tighter">{Math.round(completionRate)}%</div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         {/* Stats Panel */}
         <div className="space-y-8">
            <div className="bg-cardBg/40 border border-cardBorder rounded-[2.5rem] p-8 shadow-xl">
               <h3 className="font-black text-xs uppercase tracking-[0.3em] text-slate-500 mb-8 flex items-center gap-3">
                 <Activity size={16} className="text-primary"/> Performance
               </h3>
               
               <div className="grid grid-cols-2 gap-4 mb-10">
                  <div className="bg-bgDark/50 border border-white/5 p-5 rounded-2xl text-center shadow-inner">
                     <div className="text-3xl font-black text-white tracking-tighter">{focusMinutes}m</div>
                     <div className="text-[9px] uppercase text-slate-500 font-black tracking-widest mt-1">Deep Work</div>
                  </div>
                  <div className="bg-bgDark/50 border border-white/5 p-5 rounded-2xl text-center shadow-inner">
                     <div className="text-3xl font-black text-white tracking-tighter">{completedTasks.length}</div>
                     <div className="text-[9px] uppercase text-slate-500 font-black tracking-widest mt-1">Verified</div>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex justify-between">
                    <span>Effort Spectrum</span>
                    <span className="text-primary">AI Mapping</span>
                  </div>
                  {completedTasks.length > 0 ? (
                    <div className="flex gap-3 h-28 items-end px-2">
                        <div className="flex-1 bg-blue-500/10 rounded-t-xl relative group">
                            <div className="absolute bottom-0 w-full bg-blue-500 rounded-t-xl transition-all duration-700" style={{height: `${(intensityCounts.low / completedTasks.length) * 100}%`}}></div>
                            <div className="absolute -bottom-6 w-full text-center text-[8px] font-black text-slate-600">LOW</div>
                        </div>
                        <div className="flex-1 bg-orange-500/10 rounded-t-xl relative group">
                            <div className="absolute bottom-0 w-full bg-orange-500 rounded-t-xl transition-all duration-700" style={{height: `${(intensityCounts.medium / completedTasks.length) * 100}%`}}></div>
                            <div className="absolute -bottom-6 w-full text-center text-[8px] font-black text-slate-600">MED</div>
                        </div>
                        <div className="flex-1 bg-red-500/10 rounded-t-xl relative group">
                            <div className="absolute bottom-0 w-full bg-red-500 rounded-t-xl transition-all duration-700" style={{height: `${(intensityCounts.high / completedTasks.length) * 100}%`}}></div>
                            <div className="absolute -bottom-6 w-full text-center text-[8px] font-black text-slate-600">HIGH</div>
                        </div>
                    </div>
                  ) : (
                    <div className="text-center text-slate-700 font-bold italic text-sm py-10 bg-bgDark/20 rounded-2xl border-2 border-dashed border-white/5">
                      No data footprint.
                    </div>
                  )}
               </div>
            </div>

            <div className="bg-cardBg/40 border border-cardBorder rounded-[2.5rem] p-8">
               <h3 className="font-black text-xs uppercase tracking-[0.3em] text-slate-500 mb-6 flex items-center gap-3">
                 <AlertCircle size={16} className="text-red-400"/> Temporal Clean-up
               </h3>
               {incompleteTasks.length > 0 ? (
                 <div className="space-y-4">
                    <p className="text-xs text-slate-500 font-medium">You have <span className="text-white font-bold">{incompleteTasks.length}</span> unverified protocols remaining.</p>
                    <button 
                      onClick={handleRescheduleAll}
                      className="w-full py-4 bg-transparent border border-cardBorder hover:border-primary hover:text-white text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3"
                    >
                      <RotateCcw size={14} /> Reschedule All
                    </button>
                 </div>
               ) : (
                 <div className="text-emerald-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                   <CheckCircle2 size={14} /> Schedule Synchronized
                 </div>
               )}
            </div>
         </div>

         {/* Center Column: Manual Reflection */}
         <div className="lg:col-span-2 space-y-8">
            <div className="bg-cardBg/30 border border-cardBorder rounded-[3rem] p-10 space-y-10">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                     <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4 flex items-center gap-2">
                           <TrendingUp size={14} className="text-primary"/> Performance Rating
                        </label>
                        <input 
                           type="range" min="1" max="10" step="1"
                           value={quality}
                           onChange={e => setQuality(parseInt(e.target.value))}
                           className="w-full h-2 bg-bgDark rounded-full appearance-none cursor-pointer accent-primary border border-white/5"
                        />
                        <div className="flex justify-between mt-3 text-[10px] font-black text-slate-600 uppercase">
                           <span>Inefficient</span>
                           <span className="text-white text-sm">{quality}/10</span>
                           <span>Peak Flow</span>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block flex items-center gap-2"><Smile size={14} className="text-emerald-400"/> Mood</label>
                           <select 
                             value={mood} 
                             onChange={e => setMood(e.target.value)}
                             className="w-full bg-bgDark border border-cardBorder rounded-xl p-3 text-sm font-bold text-white focus:border-primary outline-none"
                           >
                             <option>Struggling</option>
                             <option>Tired</option>
                             <option>Neutral</option>
                             <option>Good</option>
                             <option>Excellent</option>
                           </select>
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block flex items-center gap-2"><Battery size={14} className="text-yellow-400"/> Energy</label>
                           <select 
                             value={energy} 
                             onChange={e => setEnergy(e.target.value)}
                             className="w-full bg-bgDark border border-cardBorder rounded-xl p-3 text-sm font-bold text-white focus:border-primary outline-none"
                           >
                             <option>Depleted</option>
                             <option>Low</option>
                             <option>Medium</option>
                             <option>High</option>
                             <option>Infinite</option>
                           </select>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block flex items-center gap-2"><Star size={14} className="text-orange-400"/> Key Victory</label>
                        <input 
                           type="text"
                           value={wins}
                           onChange={e => setWins(e.target.value)}
                           placeholder="What was your best moment?"
                           className="w-full bg-bgDark border border-cardBorder rounded-xl p-4 text-sm font-bold text-white focus:border-primary outline-none"
                        />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block flex items-center gap-2"><MessageSquare size={14} className="text-red-400"/> Friction Point</label>
                        <input 
                           type="text"
                           value={blockers}
                           onChange={e => setBlockers(e.target.value)}
                           placeholder="What slowed you down?"
                           className="w-full bg-bgDark border border-cardBorder rounded-xl p-4 text-sm font-bold text-white focus:border-primary outline-none"
                        />
                     </div>
                  </div>
               </div>

               <div className="pt-6">
                  <button 
                     onClick={handleSaveDay}
                     className="w-full py-5 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary-hover hover:to-indigo-500 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl shadow-primary/30 transition-all flex items-center justify-center gap-4 active:scale-95"
                  >
                     <Save size={20} /> Commit to Vault
                  </button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};