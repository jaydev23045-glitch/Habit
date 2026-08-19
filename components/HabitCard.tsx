import React, { useState, useRef } from 'react';
import { Habit, Attribute } from '../types';
import { Trash2, Clock, Check, Dumbbell, Brain, Shield, Zap, Heart, Edit2 } from 'lucide-react';
import { audioService } from '../services/audioService';
import { getFlowDate } from '../services/dateService';

interface HabitCardProps {
  habit: Habit;
  toggleHabit: (id: string) => void;
  deleteHabit: (id: string) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
}

// RPG Attribute Mapping
const ATTR_CONFIG: Record<Attribute, { color: string, icon: any, label: string, border: string, bg: string }> = {
  STR: { color: 'text-rose-400', icon: Dumbbell, label: 'Strength', border: 'border-rose-500/30', bg: 'bg-rose-500/10' },
  INT: { color: 'text-sky-400', icon: Brain, label: 'Intellect', border: 'border-sky-500/30', bg: 'bg-sky-500/10' },
  WIL: { color: 'text-amber-400', icon: Shield, label: 'Willpower', border: 'border-amber-500/30', bg: 'bg-amber-500/10' },
  FOC: { color: 'text-violet-400', icon: Zap, label: 'Focus', border: 'border-violet-500/30', bg: 'bg-violet-500/10' },
  REC: { color: 'text-emerald-400', icon: Heart, label: 'Recovery', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
};

export const HabitCard: React.FC<HabitCardProps> = ({ habit, toggleHabit, deleteHabit, updateHabit }) => {
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  
  // Floating Text State
  const [floatAnim, setFloatAnim] = useState<{ show: boolean, text: string } | null>(null);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState(habit.title);
  const [editingAttribute, setEditingAttribute] = useState<Attribute>(habit.attribute || 'WIL');
  const [editingTime, setEditingTime] = useState(habit.reminderTime || '08:00');
  
  const startTime = useRef<number | null>(null);
  const requestRef = useRef<number | null>(null);
  const hasCompletedInThisTouch = useRef(false);

  const HOLD_DURATION = 600; // ms

  // Calculate today status dynamically
  const todayStr = getFlowDate();
  const isDoneToday = !!(habit.history && habit.history[todayStr]);

  // Calculate Consistency Color
  const getVelocityColor = (v: number) => {
    if (v >= 80) return 'text-emerald-400';
    if (v >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getVelocityStroke = (v: number) => {
    if (v >= 80) return '#34d399'; // emerald-400
    if (v >= 50) return '#facc15'; // yellow-400
    return '#f87171'; // red-400
  };

  // Circular Chart Logic
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const velocity = habit.velocity || 0;
  const strokeDashoffset = circumference - (velocity / 100) * circumference;

  const attr = ATTR_CONFIG[habit.attribute || 'WIL']; // Default to Willpower if missing

  // Press & Hold Logic
  const startHold = () => {
    if (isDoneToday) return; // Already done today
    hasCompletedInThisTouch.current = false; // Reset lock flag
    setIsHolding(true);
    startTime.current = Date.now();
    
    const animate = () => {
      if (!startTime.current) return;
      const elapsed = Date.now() - startTime.current;
      const progress = Math.min((elapsed / HOLD_DURATION) * 100, 100);
      setHoldProgress(progress);

      if (elapsed < HOLD_DURATION) {
        requestRef.current = requestAnimationFrame(animate);
      } else {
        triggerComplete();
      }
    };
    requestRef.current = requestAnimationFrame(animate);
  };

  const endHold = () => {
    if (hasCompletedInThisTouch.current) {
        // If the hold JUST completed the habit, lifting the finger shouldn't immediately undo it!
        hasCompletedInThisTouch.current = false; // reset for next interactions
        return;
    }

    if (isDoneToday) {
        // If tapping a previously completed habit, toggle it off (undo)
        toggleHabit(habit.id);
        return;
    }
    
    // Cancel hold
    setIsHolding(false);
    setHoldProgress(0);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    startTime.current = null;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    startHold();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    endHold();
  };

  const triggerComplete = () => {
    hasCompletedInThisTouch.current = true; // Lock the undo behavior for when the user lifts finger
    setIsHolding(false);
    setHoldProgress(100);
    
    // Trigger floating text
    setFloatAnim({ show: true, text: `+${habit.baseXp || 10} ${habit.attribute}` });

    audioService.playSuccess(); 
    if (navigator.vibrate) navigator.vibrate(50);

    // Actual Data Update
    toggleHabit(habit.id);
    
    // Reset visual state after delay
    setTimeout(() => {
        setHoldProgress(0);
        setFloatAnim(null);
    }, 2000);
  };

  const Icon = attr.icon;

  if (isEditing) {
    return (
      <div className="bg-cardBg border border-primary/50 rounded-[2rem] p-6 flex flex-col items-center text-center relative group min-h-[340px] justify-between transition-all duration-500 shadow-xl overflow-hidden w-full">
        <div className="w-full flex-1 flex flex-col gap-4 justify-center">
          <h3 className="font-bold text-[10px] text-slate-500 uppercase tracking-[0.3em]">Modify Protocol</h3>
          <input
            type="text"
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
            className="w-full bg-bgDark border border-cardBorder rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none font-bold"
            placeholder="Protocol Title"
            autoFocus
          />

          <div className="space-y-1.5 text-left">
            <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Reminder Time</span>
            <input 
              type="time" 
              value={editingTime} 
              onChange={e => setEditingTime(e.target.value)}
              className="w-full bg-bgDark border border-cardBorder rounded-xl px-4 py-2.5 text-xs text-white focus:border-primary outline-none font-bold"
              style={{ colorScheme: 'dark' }}
            />
          </div>

          <div className="space-y-1.5 text-left">
            <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Attribute Alignment</span>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {(['STR', 'INT', 'WIL', 'FOC', 'REC'] as Attribute[]).map(a => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setEditingAttribute(a)}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${editingAttribute === a ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-bgDark/40 border border-white/5 text-slate-500 hover:text-slate-300'}`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 w-full mt-4">
          <button
            onClick={() => setIsEditing(false)}
            className="flex-1 py-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-slate-400 text-xs font-bold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (editingTitle.trim()) {
                updateHabit(habit.id, { title: editingTitle, attribute: editingAttribute, reminderTime: editingTime });
                setIsEditing(false);
              }
            }}
            className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-lg shadow-primary/20"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-cardBg border rounded-[2rem] p-6 flex flex-col items-center text-center relative group min-h-[340px] justify-between transition-all duration-500 shadow-xl overflow-hidden ${isDoneToday ? 'border-emerald-500/30' : 'border-cardBorder hover:border-primary/50'}`}>
      
      {floatAnim && (
        <div 
           className={`absolute top-1/2 left-0 right-0 text-center font-black text-2xl z-50 pointer-events-none ${attr.color}`}
           style={{ animation: 'floatUp 1.5s ease-out forwards' }}
        >
           {floatAnim.text}
        </div>
      )}

      {/* Visual Flare */}
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent transition-opacity duration-500 ${isDoneToday ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}></div>

      <div className="absolute top-5 right-5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all z-20">
        <button 
          onClick={() => {
            setEditingTitle(habit.title);
            setEditingAttribute(habit.attribute || 'WIL');
            setEditingTime(habit.reminderTime || '08:00');
            setIsEditing(true);
          }}
          className="text-slate-700 hover:text-primary p-2 hover:bg-primary/10 rounded-xl"
          title="Edit Protocol"
        >
          <Edit2 size={16} />
        </button>
        <button 
          onClick={() => deleteHabit(habit.id)}
          className="text-slate-700 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-xl"
          title="Delete Protocol"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Attribute Badge */}
      <div className={`absolute top-5 left-5 px-2 py-1 rounded-lg border flex items-center gap-1.5 ${attr.border} ${attr.bg}`}>
         <Icon size={12} className={attr.color} />
         <span className={`text-[9px] font-black ${attr.color}`}>{habit.attribute}</span>
      </div>

      {/* Main Content */}
      <div className="w-full flex flex-col items-center flex-1 mt-8">
        <div className="flex items-center gap-2 mb-4">
            <span className={`text-[9px] font-black uppercase tracking-[0.3em] ${isDoneToday ? 'text-emerald-500' : 'text-slate-600'}`}>
                {isDoneToday ? 'Protocol Verified' : 'Protocol Active'}
            </span>
        </div>
        
        <h3 className={`text-xl font-black mb-5 line-clamp-2 min-h-[3.5rem] flex items-center justify-center text-white leading-tight ${isDoneToday ? 'opacity-60' : ''}`}>
          {habit.title}
        </h3>
        
        {/* Time Input */}
        <div className="mb-6 w-full space-y-2">
            <div className={`relative flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-300 ${habit.reminderTime ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-bgDark/50 border-white/5 text-slate-600 hover:border-slate-700 hover:text-slate-400'}`}>
              <Clock size={16} />
              <span className="text-xs font-black uppercase tracking-widest pointer-events-none">{habit.reminderTime || '--:--'}</span>
              <input 
                type="time"
                value={habit.reminderTime || ''}
                onChange={(e) => updateHabit(habit.id, { reminderTime: e.target.value })}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                style={{ colorScheme: 'dark' }}
              />
            </div>
        </div>
        
        {/* Consistency Engine (Circular Progress) */}
        <div className="flex items-center justify-center gap-4 mb-6 px-4 py-3 rounded-2xl bg-bgDark/30 border border-white/5">
           <div className="relative w-12 h-12 flex items-center justify-center">
              {/* Background Circle */}
              <svg className="transform -rotate-90 w-12 h-12">
                <circle
                  stroke="#1e293b"
                  strokeWidth="3"
                  fill="transparent"
                  r={radius}
                  cx="24"
                  cy="24"
                />
                <circle
                  stroke={getVelocityStroke(velocity)}
                  strokeWidth="3"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  r={radius}
                  cx="24"
                  cy="24"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className={`absolute text-[10px] font-black ${getVelocityColor(velocity)}`}>
                {Math.round(velocity)}%
              </div>
           </div>
           
           <div className="text-left">
              <div className="text-xl font-black leading-none text-white tracking-tighter">{habit.streak} <span className="text-xs text-slate-500 font-normal">days</span></div>
              <div className="text-[8px] text-slate-500 uppercase font-black tracking-widest mt-0.5">Current Streak</div>
           </div>
        </div>
      </div>

      {/* Press & Hold Button */}
      <div 
        className="w-full relative h-14 rounded-2xl overflow-hidden cursor-pointer touch-none select-none shadow-2xl"
        onMouseDown={startHold}
        onMouseUp={endHold}
        onMouseLeave={endHold}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={endHold}
      >
          {/* Background Layer */}
          <div className={`absolute inset-0 transition-colors duration-300 ${isDoneToday ? 'bg-emerald-500' : 'bg-white/5 hover:bg-white/10 border border-white/10'}`}></div>
          
          {/* Fill Layer (Animation) */}
          {!isDoneToday && (
              <div 
                className="absolute inset-0 bg-primary opacity-30 transition-transform duration-75 ease-linear origin-left"
                style={{ transform: `scaleX(${holdProgress / 100})` }}
              ></div>
          )}

          {/* Content Layer */}
          <div className="absolute inset-0 flex items-center justify-center gap-3 pointer-events-none">
             {isDoneToday ? (
                 <>
                   <Check size={20} className="text-bgDarker" strokeWidth={4} /> 
                   <span className="font-black text-[10px] uppercase tracking-[0.3em] text-bgDarker">Verified</span>
                 </>
             ) : (
                 <>
                   <span className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-400 group-hover:text-white transition-colors">
                     {isHolding ? 'Stabilizing...' : `Hold to Verify (+${habit.baseXp || 10} XP)`}
                   </span>
                 </>
             )}
          </div>
      </div>
    </div>
  );
};
