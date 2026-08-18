import React, { useState, useEffect, useRef, memo } from 'react';
import { Task } from '../types';
import { Plus, Trash2, CheckCircle2, Circle, Clock, Tag, Calendar, Play, MapPin, AlertTriangle, ArrowDownAZ, Zap, History, X, Edit2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface TaskManagerProps {
  tasks: Task[];
  addTask: (task: Task) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  startMomentum?: (id: string) => void;
  selectedDate: string;
  updateTask?: (id: string, updates: Partial<Task>) => void;
}

export const TaskManager = memo<TaskManagerProps>(({ tasks, addTask, toggleTask, deleteTask, startMomentum, selectedDate, updateTask }) => {
  const [viewScope, setViewScope] = useState<'day' | 'all'>('day');
  const [sortBy, setSortBy] = useState<'priority' | 'date' | 'time'>('priority');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const [manualTitle, setManualTitle] = useState('');
  const [manualTime, setManualTime] = useState('09:00');
  const [manualDate, setManualDate] = useState(selectedDate);
  const [manualPriority, setManualPriority] = useState<'high' | 'medium' | 'low'>('medium');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Sync the quick add date with the global selection
  useEffect(() => {
    setManualDate(selectedDate);
  }, [selectedDate]);

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const activeTasks = viewScope === 'day' ? tasks.filter(t => t.date === selectedDate) : tasks; 

  const filteredTasks = activeTasks.filter(t => {
    if (priorityFilter === 'all') return true;
    return t.priority === priorityFilter;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (sortBy === 'priority') {
      const pMap = { high: 3, medium: 2, low: 1 };
      return (pMap[b.priority || 'medium']) - (pMap[a.priority || 'medium']);
    }
    if (sortBy === 'date') return a.date.localeCompare(b.date);
    return a.time.localeCompare(b.time);
  });

  const handleManualAdd = () => {
    if (!manualTitle.trim()) return;
    addTask({
      id: uuidv4(),
      title: manualTitle,
      time: manualTime,
      date: manualDate,
      completed: false,
      type: 'task',
      priority: manualPriority
    });
    setManualTitle('');
    setManualPriority('medium');
  };



  const startEditing = (task: Task) => {
    setEditingId(task.id);
    setEditingTitle(task.title);
  };

  const saveEdit = (id: string) => {
    if (editingTitle.trim() && updateTask) {
      updateTask(id, { title: editingTitle });
    }
    setEditingId(null);
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold flex items-center gap-2">
             <Calendar className="text-primary" /> Protocol Ledger
           </h2>
           <p className="text-slate-400 text-sm">{viewScope === 'day' ? `Active for ${formatDateDisplay(selectedDate)}` : 'Full History'}</p>
        </div>
        
        <div className="flex bg-cardBg rounded-xl p-1 border border-cardBorder h-11">
            <button onClick={() => setViewScope('day')} className={`px-5 rounded-lg text-xs font-bold transition-all ${viewScope === 'day' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white'}`}>Active</button>
            <button onClick={() => setViewScope('all')} className={`px-5 rounded-lg text-xs font-bold transition-all ${viewScope === 'all' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white'}`}>Archive</button>
        </div>
      </div>

      <div className="max-w-xl mx-auto bg-cardBg border border-cardBorder rounded-[2rem] p-7 shadow-2xl space-y-5">
         <h3 className="font-bold text-[10px] text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3"><Plus size={16} className="text-primary"/> Quick Add</h3>
         <input 
            type="text" 
            value={manualTitle} 
            onChange={(e) => setManualTitle(e.target.value)} 
            placeholder="What is the next protocol?" 
            className="w-full bg-bgDark border border-cardBorder rounded-2xl px-5 py-4 text-sm text-white focus:border-primary outline-none transition-all placeholder:text-slate-700" 
            onKeyDown={(e) => e.key === 'Enter' && handleManualAdd()} 
         />
         
         <div className="grid grid-cols-2 gap-4">
            <div className="relative group h-14">
               <div className="absolute inset-0 bg-bgDark border border-cardBorder rounded-2xl px-4 py-3 flex items-center gap-3 group-hover:border-primary transition-colors pointer-events-none">
                  <Calendar size={16} className="text-primary" />
                  <span className="text-xs text-slate-300 font-bold truncate uppercase tracking-tighter">{formatDateDisplay(manualDate)}</span>
               </div>
               <input 
                 type="date" 
                 value={manualDate} 
                 onChange={e => e.target.value && setManualDate(e.target.value)} 
                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                 style={{ colorScheme: 'dark' }}
               />
            </div>

            <div className="relative group h-14">
               <div className="absolute inset-0 bg-bgDark border border-cardBorder rounded-2xl px-4 py-3 flex items-center gap-3 group-hover:border-primary transition-colors pointer-events-none">
                  <Clock size={16} className="text-primary" />
                  <span className="text-xs text-slate-300 font-bold">{manualTime}</span>
               </div>
               <input 
                 type="time" 
                 value={manualTime} 
                 onChange={e => e.target.value && setManualTime(e.target.value)} 
                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                 style={{ colorScheme: 'dark' }}
               />
            </div>
         </div>

         <div className="space-y-2">
           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Priority</label>
           <div className="flex gap-2">
             {(['low', 'medium', 'high'] as const).map(p => (
               <button
                 key={p}
                 onClick={() => setManualPriority(p)}
                 className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all ${manualPriority === p ? 'bg-primary/20 border-primary text-primary' : 'bg-bgDark/30 border-white/5 text-slate-500 hover:text-slate-300'}`}
               >
                 {p}
               </button>
             ))}
           </div>
         </div>

         <button onClick={handleManualAdd} className="w-full bg-primary hover:bg-primary-hover text-white py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 transition-all active:scale-[0.98]">Confirm Protocol</button>
      </div>

      {/* Filtering and Sorting Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-cardBg border border-cardBorder rounded-[2rem] p-6 shadow-xl">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Filter:</span>
          {(['all', 'low', 'medium', 'high'] as const).map(f => (
            <button
              key={f}
              onClick={() => setPriorityFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${priorityFilter === f ? 'bg-primary/20 text-primary border border-primary/30 shadow-lg shadow-primary/10' : 'text-slate-400 hover:text-white border border-transparent'}`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <ArrowDownAZ size={14} /> Sort By:
          </span>
          <div className="flex bg-bgDark/50 rounded-xl p-1 border border-white/5">
            {(['priority', 'time', 'date'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${sortBy === s ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {sortedTasks.map(task => (
          <div key={task.id} className={`group flex items-center gap-5 bg-cardBg border border-cardBorder p-5 rounded-3xl transition-all hover:border-primary/50 shadow-lg ${task.completed ? 'opacity-30 grayscale-[0.5]' : ''}`}>
             <button onClick={() => toggleTask(task.id)} className={`transition-all active:scale-90 ${task.completed ? 'text-emerald-500' : 'text-slate-500 hover:text-primary'}`}>
                {task.completed ? <CheckCircle2 size={28} /> : <Circle size={28} />}
             </button>
             <div className="flex-1 min-w-0">
               {editingId === task.id ? (
                 <div className="flex items-center gap-2 mr-2">
                   <input
                     autoFocus
                     type="text"
                     value={editingTitle}
                     onChange={e => setEditingTitle(e.target.value)}
                     onBlur={() => saveEdit(task.id)}
                     onKeyDown={e => {
                       if (e.key === 'Enter') saveEdit(task.id);
                       if (e.key === 'Escape') setEditingId(null);
                     }}
                     className="w-full bg-bgDark border border-primary rounded-xl px-4 py-2 text-sm text-white focus:outline-none"
                   />
                   <button onClick={() => saveEdit(task.id)} className="bg-primary text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-primary-hover">Save</button>
                 </div>
               ) : (
                 <div className="flex items-center gap-2 group/title">
                   <h4 
                     className={`font-bold text-lg truncate ${task.completed ? 'line-through text-slate-600' : 'text-slate-100'}`}
                     onDoubleClick={() => startEditing(task)}
                   >
                     {task.title}
                   </h4>
                   <button 
                     onClick={() => startEditing(task)}
                     className="opacity-0 group-hover/title:opacity-100 text-slate-500 hover:text-primary transition-all p-1"
                     title="Edit Protocol"
                   >
                     <Edit2 size={14} />
                   </button>
                 </div>
               )}
               <div className="flex items-center gap-3 mt-1.5">
                  <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{task.time} • {formatDateDisplay(task.date)}</div>
                  {task.priority && (
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-tighter border ${
                      task.priority === 'high' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                      task.priority === 'low' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                      'bg-slate-500/10 border-slate-500/20 text-slate-400'
                    }`}>
                      {task.priority}
                    </span>
                  )}
                  {task.nextBridge && (
                    <div className="bg-blue-500/10 text-blue-400 text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-tighter border border-blue-500/20">Resume Context Available</div>
                  )}
               </div>
             </div>
             <div className="flex items-center gap-2">
                <button onClick={() => startMomentum && startMomentum(task.id)} className="p-3 bg-primary/10 text-primary rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-white" title="Momentum Session">
                   <Zap size={18} fill="currentColor" />
                </button>
                <button onClick={() => deleteTask(task.id)} className="p-3 text-slate-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                   <Trash2 size={20} />
                </button>
             </div>
          </div>
        ))}
        {sortedTasks.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed border-cardBorder rounded-[3rem] text-slate-700 font-bold italic text-sm">
            Current temporal slice is empty.
          </div>
        )}
      </div>
    </div>
  );
});
