
import React, { useState, useRef, useMemo } from 'react';
import { AppData, HorizonPotential, Task } from '../types';
import { Calendar, Cloud, BookOpen, Lightbulb, ClipboardList, X, Compass, Wind, Zap, ChevronRight, BarChart2, CalendarDays } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface ForecastProps {
  data: AppData;
  addPotential: (p: HorizonPotential) => void;
  convertPotential?: (id: string) => void;
  dismissPotential?: (id: string) => void;
}

export const Forecast: React.FC<ForecastProps> = ({ data, addPotential, convertPotential, dismissPotential }) => {
  const [input, setInput] = useState('');
  const [category, setCategory] = useState<'learning' | 'idea' | 'admin' | 'task'>('task');
  
  const dateInputRef = useRef<HTMLInputElement>(null);

  const getTodayString = () => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  };

  const getTomorrowString = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const today = getTodayString();
  const tomorrowStr = getTomorrowString();
  
  // State for the manual target date selection
  const [targetDate, setTargetDate] = useState(tomorrowStr); 

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return 'Select Date';
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const handlePlantSeed = () => {
    if (!input.trim()) return;
    
    let linkedTopicId = undefined;
    
    const topics = data.topics || [];
    if (category === 'learning') {
       const match = topics.find(t => t?.title?.toLowerCase().includes(input.toLowerCase()) || input.toLowerCase().includes(t?.title?.toLowerCase()));
       if (match) linkedTopicId = match.id;
    }

    const newPotential: HorizonPotential = {
      id: uuidv4(),
      title: input,
      targetDate: targetDate || tomorrowStr,
      category: category,
      status: 'ready',
      linkedTopicId: linkedTopicId,
      createdAt: new Date().toISOString()
    };

    addPotential(newPotential);
    setInput('');
  };

  const handleNurtureSeed = (id: string) => {
    if (convertPotential) {
      convertPotential(id);
    }
  };

  const getIcon = (cat: string) => {
    switch(cat) {
      case 'learning': return <BookOpen size={16} className="text-purple-400"/>;
      case 'idea': return <Lightbulb size={16} className="text-yellow-400"/>;
      case 'admin': return <ClipboardList size={16} className="text-slate-400"/>;
      default: return <Zap size={16} className="text-blue-400"/>;
    }
  };

  const getCategoryColor = (cat: string) => {
    switch(cat) {
      case 'learning': return 'border-purple-500/30 bg-purple-500/5 text-purple-400';
      case 'idea': return 'border-yellow-500/30 bg-yellow-500/5 text-yellow-400';
      case 'admin': return 'border-slate-500/30 bg-slate-500/5 text-slate-400';
      default: return 'border-blue-500/30 bg-blue-500/5 text-blue-400';
    }
  };

  const allPotentials = (data.potentials || []).filter(p => p?.status === 'ready');
  
  // Temporal Mapping (14 Day Load)
  const densityMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (let i = 0; i < 14; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const ds = d.toISOString().split('T')[0];
        map[ds] = allPotentials.filter(p => p?.targetDate === ds).length;
    }
    return Object.entries(map);
  }, [allPotentials]);

  const timelineItems = useMemo(() => {
    return allPotentials
      .filter(p => p?.targetDate && p.targetDate >= today)
      .sort((a,b) => (a.targetDate || '').localeCompare(b.targetDate || ''));
  }, [allPotentials, today]);

  return (
    <div className="animate-fade-in space-y-12 max-w-6xl mx-auto pb-32">
      
      {/* Immersive Branding */}
      <div className="relative pt-12 text-center">
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <Compass size={400} className="text-primary animate-[spin_120s_linear_infinite]" />
        </div>
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.3em]">
            Temporal Forecasting
          </div>
          <h2 className="text-5xl font-black text-white tracking-tighter italic">Bloom Horizon</h2>
          <p className="text-slate-400 max-w-lg mx-auto leading-relaxed text-sm font-medium">
            Project your intentions into the future. They will automatically germinate into tasks when their date arrives.
          </p>
        </div>
      </div>

      {/* Visual Density Chart */}
      <div className="bg-cardBg/40 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-3">
                <BarChart2 size={16} className="text-teal-400" /> Planned Density (14 Days)
            </h3>
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Load Metrics</span>
        </div>
        <div className="flex items-end gap-2 h-24 px-2">
            {densityMap.map(([date, count]) => (
                <div key={date} className="flex-1 flex flex-col items-center gap-3 group cursor-pointer" onClick={() => setTargetDate(date)}>
                    <div 
                      className={`w-full rounded-t-xl transition-all duration-500 ${count > 0 ? 'bg-primary' : 'bg-slate-800'} ${count > 2 ? 'bg-teal-400 shadow-[0_0_20px_rgba(45,212,191,0.3)]' : ''} ${targetDate === date ? 'ring-2 ring-white scale-y-110' : ''}`}
                      style={{ height: `${Math.max(8, Math.min(100, (count / 5) * 100))}%` }}
                    />
                    <div className={`text-[8px] font-black uppercase tracking-tighter transition-colors ${date === today ? 'text-primary' : 'text-slate-700 group-hover:text-slate-400'}`}>
                        {date === today ? 'NOW' : date.split('-')[2]}
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Simplified Manual Planter */}
      <div className="sticky top-24 z-30 bg-bgDark/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-2 shadow-2xl">
        <div className="bg-cardBg/90 rounded-[2rem] p-6">
           <div className="flex flex-col lg:flex-row gap-6 items-center w-full">
              <div className="flex-1 w-full">
                 <input 
                   value={input}
                   onChange={e => setInput(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && handlePlantSeed()}
                   placeholder="I intend to..."
                   className="w-full bg-transparent text-2xl font-black placeholder:text-slate-800 focus:outline-none text-white px-2"
                 />
                 <div className="flex flex-wrap gap-2.5 mt-4 px-2">
                   {(['task', 'learning', 'idea', 'admin'] as const).map(cat => {
                     const isSelected = category === cat;
                     return (
                       <button
                         key={cat}
                         onClick={() => setCategory(cat)}
                         className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                           isSelected 
                             ? 'bg-primary/20 border-primary text-primary shadow-lg shadow-primary/10' 
                             : 'bg-white/5 border-transparent text-slate-500 hover:text-slate-300'
                         }`}
                       >
                         {cat === 'learning' ? '📚 Learn' : cat === 'idea' ? '💡 Idea' : cat === 'admin' ? '📋 Admin' : '⚡ Task'}
                       </button>
                     );
                   })}
                 </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                 {/* INTEGRATED DATE INPUT */}
                 <div className="bg-bgDark/80 border border-white/5 rounded-2xl flex items-center px-4 h-16 hover:border-primary/50 transition-colors w-full sm:w-auto">
                    <CalendarDays size={18} className="text-primary mr-3 shrink-0" />
                    <input 
                       type="date" 
                       value={targetDate}
                       min={today}
                       onChange={e => setTargetDate(e.target.value)}
                       className="bg-transparent text-sm font-bold text-white uppercase focus:outline-none cursor-pointer w-full"
                       style={{ colorScheme: 'dark' }}
                    />
                 </div>

                 <button 
                   onClick={handlePlantSeed}
                   disabled={!input.trim()}
                   className="bg-primary hover:bg-primary-hover text-white px-10 h-16 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all shadow-xl shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-4 w-full sm:w-auto active:scale-95"
                 >
                   <Wind size={18} />
                   Plant Seed
                 </button>
              </div>
           </div>
        </div>
      </div>

      {/* Timeline of Potentials */}
      <div className="space-y-8">
        <div className="flex items-center gap-4">
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-slate-600">Active Sprouting Timeline</h3>
            <div className="flex-1 h-px bg-white/5"></div>
        </div>

        {timelineItems.length === 0 ? (
            <div className="text-center py-24 border-2 border-dashed border-white/5 rounded-[3rem] bg-white/2">
               <Cloud size={64} className="text-slate-800 mx-auto mb-6" />
               <h3 className="text-xl font-bold text-slate-600 italic">Horizon is clear.</h3>
               <p className="text-slate-700 text-xs mt-2 uppercase font-black tracking-widest">Future items bloom into tasks on their chosen dates.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {timelineItems.map(p => {
                    const daysAway = p?.targetDate ? Math.floor((new Date(p.targetDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)) : 0;
                    const isToday = p?.targetDate === today;
                    
                    return (
                        <div key={p.id} className={`group relative p-7 rounded-[2.5rem] border transition-all hover:translate-y-[-6px] overflow-hidden ${getCategoryColor(p.category)} border-white/5 backdrop-blur-sm`}>
                            <div className={`absolute -top-12 -right-12 w-32 h-32 blur-3xl rounded-full opacity-10 transition-all group-hover:opacity-30 ${daysAway <= 1 ? 'bg-teal-400' : 'bg-primary'}`} />
                            
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 bg-white/5 rounded-xl">
                                          {getIcon(p.category)}
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{p.category}</span>
                                    </div>
                                    <div className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${isToday ? 'bg-primary text-white' : daysAway === 1 ? 'bg-teal-500/20 text-teal-400' : 'bg-white/5 text-slate-500'}`}>
                                        {isToday ? 'Germinating' : daysAway === 1 ? 'Tomorrow' : `${daysAway} days`}
                                    </div>
                                </div>
                                
                                <h4 className="text-xl font-bold text-white mb-8 leading-tight group-hover:text-primary transition-colors h-14 line-clamp-2">{p.title}</h4>
                                
                                <div className="flex items-center justify-between mt-auto pt-5 border-t border-white/5">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        <Calendar size={12}/> {formatDateDisplay(p.targetDate)}
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleNurtureSeed(p.id)}
                                            className="p-3 bg-white/5 hover:bg-primary/20 hover:text-primary rounded-xl transition-all group/nurture relative"
                                            title="Bloom Sprout: Convert into task"
                                        >
                                            <ChevronRight size={18} />
                                            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-bgDark border border-white/10 text-[9px] font-black px-3 py-1.5 rounded-lg opacity-0 group-hover/nurture:opacity-100 transition-opacity whitespace-nowrap shadow-2xl">BLOOM</span>
                                        </button>
                                        <button 
                                            onClick={() => dismissPotential && dismissPotential(p.id)}
                                            className="p-3 bg-white/5 hover:bg-red-500/20 hover:text-red-400 rounded-xl transition-all"
                                            title="Dismiss Sprout"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>

      {/* Dynamic Summary */}
      <div className="bg-gradient-to-br from-teal-500/10 via-bgDark/40 to-primary/10 border border-white/5 rounded-[3rem] p-10 flex flex-col md:flex-row items-center gap-10 shadow-inner">
         <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-teal-400 shrink-0 shadow-2xl">
            <Calendar size={40} />
         </div>
         <div className="text-center md:text-left space-y-2">
            <h4 className="font-black text-white text-xl tracking-tight">Temporal Wisdom</h4>
            <p className="text-slate-400 leading-relaxed text-sm max-w-2xl">
                Manual date selection allows you to balance future load. If a date shows high density, consider staggering your intentions to protect your attention span.
            </p>
         </div>
      </div>
    </div>
  );
};
