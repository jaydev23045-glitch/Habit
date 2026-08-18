
import React, { useState, memo } from 'react';
import { Habit, Attribute } from '../types';
import { Plus, Zap, Clock, Dumbbell, Brain, Shield, Heart } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { HabitCard } from './HabitCard';

interface HabitTrackerProps {
  habits: Habit[];
  addHabit: (habit: Habit) => void;
  toggleHabit: (id: string) => void;
  deleteHabit: (id: string) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
}

export const HabitTracker = memo<HabitTrackerProps>(({ habits, addHabit, toggleHabit, deleteHabit, updateHabit }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitTime, setNewHabitTime] = useState('08:00');
  const [newAttribute, setNewAttribute] = useState<Attribute>('WIL');

  const handleAdd = () => {
    if (!newHabitName.trim()) {
      setIsAdding(false);
      return;
    }
    addHabit({
      id: uuidv4(),
      title: newHabitName,
      streak: 0,
      completed: false,
      type: 'habit',
      reminderTime: newHabitTime || undefined,
      history: {},
      velocity: 0,
      attribute: newAttribute,
      baseXp: 10
    });
    setNewHabitName('');
    setIsAdding(false);
  };

  const getAttrIcon = (attr: Attribute) => {
    switch(attr) {
      case 'STR': return <Dumbbell size={14} />;
      case 'INT': return <Brain size={14} />;
      case 'WIL': return <Shield size={14} />;
      case 'FOC': return <Zap size={14} />;
      case 'REC': return <Heart size={14} />;
    }
  };

  const getAttrColor = (attr: Attribute) => {
    switch(attr) {
        case 'STR': return 'text-rose-400';
        case 'INT': return 'text-sky-400';
        case 'WIL': return 'text-amber-400';
        case 'FOC': return 'text-violet-400';
        case 'REC': return 'text-emerald-400';
    }
  };

  return (
    <div className="animate-fade-in space-y-8 pb-24">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold flex items-center gap-2">
             <Zap className="text-orange-400" /> Consistency Engine
           </h2>
           <p className="text-slate-400 text-sm font-medium">Auto-renewing daily protocols with RPG attribute tracking.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Add Button */}
        <div 
          onClick={() => !isAdding && setIsAdding(true)}
          className={`
            min-h-[340px] border-2 border-dashed border-cardBorder rounded-[2rem] flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:border-primary hover:bg-primary/5 group
            ${isAdding ? 'border-primary bg-cardBg shadow-2xl shadow-primary/10' : ''}
          `}
        >
          {isAdding ? (
            <div className="w-full px-6 flex flex-col gap-4 animate-fade-in">
              <div className="text-[10px] font-black text-primary uppercase tracking-[0.3em] text-center">New Protocol</div>
              
              <input
                autoFocus
                type="text"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                placeholder="Protocol Name..."
                className="w-full bg-bgDark border border-cardBorder rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-primary transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Daily Reminder</label>
                <div className="relative group/time h-10">
                   <div className="absolute inset-0 bg-bgDark border border-cardBorder rounded-xl px-4 flex items-center gap-3 group-hover/time:border-primary transition-all pointer-events-none">
                      <Clock size={16} className="text-primary" />
                      <span className="text-xs text-slate-300 font-bold uppercase tracking-widest">{newHabitTime || 'No Time'}</span>
                   </div>
                   <input 
                     type="time" 
                     value={newHabitTime} 
                     onChange={e => setNewHabitTime(e.target.value)} 
                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                     style={{ colorScheme: 'dark' }}
                   />
                </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Attribute Bond</label>
                 <div className="grid grid-cols-5 gap-1">
                    {(['STR', 'INT', 'WIL', 'FOC', 'REC'] as Attribute[]).map(attr => (
                        <button
                          key={attr}
                          onClick={(e) => { e.stopPropagation(); setNewAttribute(attr); }}
                          className={`h-10 rounded-lg flex items-center justify-center border transition-all ${
                             newAttribute === attr 
                             ? `bg-white/10 ${getAttrColor(attr)} border-white/20 shadow-lg scale-105` 
                             : 'bg-bgDark border-cardBorder text-slate-600 hover:text-slate-400'
                          }`}
                          title={attr}
                        >
                           {getAttrIcon(attr)}
                        </button>
                    ))}
                 </div>
                 <div className={`text-center text-[10px] font-black uppercase tracking-widest mt-1 ${getAttrColor(newAttribute)}`}>
                    Linked: {newAttribute}
                 </div>
              </div>

              <div className="flex gap-3 w-full mt-2">
                <button onClick={handleAdd} className="flex-1 bg-primary text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-95">Deploy</button>
                <button onClick={(e) => { e.stopPropagation(); setIsAdding(false); }} className="flex-1 bg-white/5 text-slate-500 text-[10px] font-black uppercase tracking-widest py-3 rounded-xl hover:text-white transition-all">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-cardBg border border-cardBorder flex items-center justify-center text-slate-500 mb-4 group-hover:text-primary group-hover:border-primary/50 group-hover:scale-110 transition-all duration-300">
                <Plus size={28} />
              </div>
              <span className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">Initialize Protocol</span>
            </>
          )}
        </div>

        {/* Habit Cards */}
        {habits.map(habit => (
          <HabitCard 
             key={habit.id} 
             habit={habit} 
             toggleHabit={toggleHabit} 
             deleteHabit={deleteHabit} 
             updateHabit={updateHabit} 
          />
        ))}
      </div>
    </div>
  );
});
