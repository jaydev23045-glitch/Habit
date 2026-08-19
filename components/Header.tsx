
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, AppData, ViewName } from '../types';
import { Bell, Trophy, Calendar, AlertTriangle, RotateCcw, Volume2, VolumeX, X, Brain, Zap, Clock } from 'lucide-react';
import { voiceService } from '../services/voiceService';
import { audioService } from '../services/audioService';
import { getFlowDate } from '../services/dateService';

interface HeaderProps {
  title: string;
  user: UserProfile;
  setView: (view: ViewName) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  data: AppData;
}

const LiveClock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
       <Clock size={12} className="text-slate-500" />
       <span className="text-xs font-mono text-slate-400">
         {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
       </span>
    </div>
  );
};

export const Header: React.FC<HeaderProps> = ({ title, user, setView, selectedDate, setSelectedDate, data }) => {
  const [isMuted, setIsMuted] = useState(() => audioService.getMuted());
  const [showNotifs, setShowNotifs] = useState(false);
  const lastNotifCount = useRef(0);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    audioService.setMuted(nextMuted);
    setIsMuted(nextMuted);
    if (!nextMuted) {
      audioService.playAction();
    }
  };

  const today = getFlowDate();
  const overdueTasks = data.tasks.filter(t => !t.completed && t.date < today);
  const dueTopics = data.topics.filter(t => t.status === 'active' && t.nextReviewDate && t.nextReviewDate <= today);
  const notifCount = overdueTasks.length + dueTopics.length;

  // SPEAK NOTIFICATIONS ON CHANGE
  useEffect(() => {
    if (user.voiceEnabled && notifCount > lastNotifCount.current && notifCount > 0) {
      const msg = `Attention: ${notifCount} system protocols require immediate verification. Access the notification shard for details.`;
      voiceService.speak(msg, "Zephyr");
      audioService.playNotification();
    }
    lastNotifCount.current = notifCount;
  }, [notifCount, user.voiceEnabled]);

  const handleNarrateAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user.voiceEnabled) return;
    
    let report = `Neural readout for active alerts. `;
    if (overdueTasks.length > 0) {
      report += `Overdue tasks include: ${overdueTasks.map(t => t.title).join(', ')}. `;
    }
    if (dueTopics.length > 0) {
      report += `Memory reviews pending for: ${dueTopics.map(t => t.title).join(', ')}. `;
    }
    report += `Verification required to maintain optimal flow state.`;
    
    voiceService.speak(report, "Zephyr");
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const resetToToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDate(today);
  };

  return (
    <header className="sticky top-0 z-40 bg-bgDark/80 backdrop-blur-md border-b border-cardBorder px-4 md:px-8 py-4 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <h1 className="text-lg md:text-2xl font-bold text-white uppercase tracking-tight italic">{title}</h1>
        <LiveClock />
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <div className="text-right hidden sm:block relative">
          <div className="relative group">
             <div className={`flex items-center gap-2 text-sm font-bold px-3 py-1.5 rounded-lg border transition-all ${selectedDate !== today ? 'bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(124,58,237,0.2)]' : 'border-cardBorder text-slate-400 group-hover:text-white group-hover:bg-white/5'}`}>
               <Calendar size={14} />
               <span>{formatDateDisplay(selectedDate)}</span>
               {selectedDate !== today && (
                 <button 
                  onClick={resetToToday}
                  className="ml-1 p-1 hover:bg-white/10 rounded-md transition-colors text-primary relative z-50 pointer-events-auto"
                  title="Return to Today"
                 >
                   <RotateCcw size={12} />
                 </button>
               )}
             </div>

             <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                style={{ colorScheme: 'dark' }}
                title="Select Date"
             />
          </div>
          {selectedDate !== today && (
             <div className="text-[9px] text-primary font-black mt-0.5 tracking-[0.3em] uppercase animate-pulse">Temporal Offset</div>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-3 bg-yellow-400/10 border border-yellow-400/20 px-3 py-1.5 rounded-full text-yellow-400 text-[10px] md:text-sm font-black uppercase tracking-widest shadow-[inset_0_0_10px_rgba(250,204,21,0.1)]">
          <Trophy size={14} />
          <span>{user.xp} XP</span>
        </div>

        <div className="relative">
            <button 
              onClick={toggleMute} 
              className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all mr-1"
              title={isMuted ? "Unmute Audio" : "Mute Audio"}
            >
              {isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
            </button>

            <button 
              onClick={() => { setShowNotifs(!showNotifs); audioService.playAction(); }} 
              className={`relative p-2.5 transition-all rounded-xl ${showNotifs ? 'bg-primary/20 text-primary' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
                <Bell size={22} />
                {notifCount > 0 && (
                  <span className="absolute top-2 right-2 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-bgDark"></span>
                  </span>
                )}
            </button>
            
            {showNotifs && (
                <div className="absolute right-0 top-14 w-80 md:w-96 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-[1.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden animate-fade-in z-[100]">
                    <div className="p-5 border-b border-white/5 bg-white/2 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-primary/10 rounded-lg text-primary">
                             <Brain size={18} />
                           </div>
                           <div>
                              <div className="font-black text-[11px] text-white uppercase tracking-[0.2em]">Neural Alerts</div>
                              <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">System Diagnostic</div>
                           </div>
                        </div>
                        <div className="flex items-center gap-2">
                           {user.voiceEnabled && notifCount > 0 && (
                             <button 
                               onClick={handleNarrateAll}
                               className="p-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-all"
                               title="Narrate Alerts"
                             >
                               <Volume2 size={16} />
                             </button>
                           )}
                           <button onClick={() => setShowNotifs(false)} className="p-2 text-slate-500 hover:text-white">
                              <X size={18} />
                           </button>
                        </div>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto scroll-smooth">
                        {notifCount === 0 ? (
                          <div className="p-12 text-center">
                             <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500">
                                <Zap size={32} />
                             </div>
                             <div className="font-black text-slate-300 text-sm uppercase tracking-widest">Protocol Clear</div>
                             <div className="text-[10px] text-slate-600 font-bold mt-2 uppercase">Neural sync optimized</div>
                          </div>
                        ) : (
                            <div className="p-2 space-y-1">
                                {overdueTasks.map(t => (
                                    <div key={t.id} className="p-4 hover:bg-white/5 border border-transparent hover:border-white/5 rounded-xl flex items-center gap-4 group transition-all">
                                        <div className="w-10 h-10 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                           <AlertTriangle size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Overdue Protocol</div>
                                            <div className="text-sm font-bold text-slate-200 truncate">{t.title}</div>
                                            <div className="text-[10px] text-slate-500 font-bold mt-1 uppercase">Target: {t.date}</div>
                                        </div>
                                    </div>
                                ))}
                                {dueTopics.map(t => (
                                    <div key={t.id} className="p-4 hover:bg-white/5 border border-transparent hover:border-white/5 rounded-xl flex items-center gap-4 group transition-all">
                                        <div className="w-10 h-10 bg-yellow-500/10 text-yellow-500 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                           <Brain size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-1">Knowledge Review</div>
                                            <div className="text-sm font-bold text-slate-200 truncate">{t.title}</div>
                                            <div className="text-[10px] text-slate-500 font-bold mt-1 uppercase">Stage {t.currentStep + 1} Pending</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {notifCount > 0 && (
                      <div className="p-4 bg-white/2 border-t border-white/5 text-center">
                         <button 
                           onClick={() => { setShowNotifs(false); setView('dashboard'); }}
                           className="text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-[0.2em] transition-all"
                         >
                           View Status Dashboard
                         </button>
                      </div>
                    )}
                </div>
            )}
        </div>
        
        <div 
          onClick={() => { setView('settings'); audioService.playAction(); }} 
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-sm font-black text-white cursor-pointer hover:ring-4 ring-primary/20 ring-offset-4 ring-offset-bgDark transition-all shadow-lg active:scale-95"
        >
          {user.name.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
};
