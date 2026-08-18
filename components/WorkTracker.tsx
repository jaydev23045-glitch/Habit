import React, { useState, useEffect, useRef, useMemo } from 'react';
import { WorkSession } from '../types';
import { Play, Square, Timer, Trash2, History, Award, Zap, Clock } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { audioService } from '../services/audioService';

interface WorkTrackerProps {
  sessions: WorkSession[];
  onAddSession: (session: WorkSession) => void;
  onDeleteSession: (id: string) => void;
  onResetSessions?: () => void;
}

export const WorkTracker: React.FC<WorkTrackerProps> = ({ sessions, onAddSession, onDeleteSession, onResetSessions }) => {
  const [details, setDetails] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [limit, setLimit] = useState<number>(0); // Auto-stop limit in seconds (0 means no limit)

  const timerIntervalRef = useRef<number | null>(null);

  // Core helper to commit session and clean state/localStorage
  const saveSessionAndReset = (durationSecs: number, startTimestamp: number) => {
    const savedDetails = localStorage.getItem('flow-os-active-work-details') || 'General Work Session';
    const endMs = startTimestamp + durationSecs * 1000;
    
    const newSession: WorkSession = {
      id: uuidv4(),
      details: savedDetails,
      durationSeconds: durationSecs,
      startedAt: new Date(startTimestamp).toISOString(),
      endedAt: new Date(endMs).toISOString()
    };

    onAddSession(newSession);

    // Clean active storage
    localStorage.removeItem('flow-os-active-work-start');
    localStorage.removeItem('flow-os-active-work-details');
    localStorage.removeItem('flow-os-active-work-limit');
    setDetails('');
    setElapsed(0);
    setLimit(0);
    setIsTracking(false);
    audioService.playSuccess();
  };

  // Sync state with localStorage to survive reload/navigating away
  useEffect(() => {
    const activeStart = localStorage.getItem('flow-os-active-work-start');
    const activeDetails = localStorage.getItem('flow-os-active-work-details');
    const activeLimit = localStorage.getItem('flow-os-active-work-limit');
    
    if (activeStart) {
      const startTime = parseInt(activeStart, 10);
      const limitVal = activeLimit ? parseInt(activeLimit, 10) : 0;
      const diff = Math.floor((Date.now() - startTime) / 1000);

      // Check if it already exceeded the limit while offline/closed
      if (limitVal > 0 && diff >= limitVal) {
        saveSessionAndReset(limitVal, startTime);
      } else {
        setElapsed(diff > 0 ? diff : 0);
        setDetails(activeDetails || '');
        setLimit(limitVal);
        setIsTracking(true);
      }
    }
  }, []);

  // Timer interval ticking and auto-stop validation
  useEffect(() => {
    if (isTracking) {
      const activeStart = localStorage.getItem('flow-os-active-work-start');
      if (activeStart) {
        const startTime = parseInt(activeStart, 10);
        timerIntervalRef.current = window.setInterval(() => {
          const diff = Math.floor((Date.now() - startTime) / 1000);
          
          // Read limit directly from local state
          if (limit > 0 && diff >= limit) {
            // Auto stop triggered!
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
            }
            saveSessionAndReset(limit, startTime);
          } else {
            setElapsed(diff > 0 ? diff : 0);
          }
        }, 1000);
      }
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTracking, limit]);

  const handleStart = () => {
    const trimDetails = details.trim() || 'General Work Session';
    const now = Date.now();
    localStorage.setItem('flow-os-active-work-start', String(now));
    localStorage.setItem('flow-os-active-work-details', trimDetails);
    localStorage.setItem('flow-os-active-work-limit', String(limit));
    
    setDetails(trimDetails);
    setElapsed(0);
    setIsTracking(true);
    audioService.playAction();
  };

  const handleStop = () => {
    const activeStart = localStorage.getItem('flow-os-active-work-start');
    if (activeStart) {
      const startMs = parseInt(activeStart, 10);
      const endMs = Date.now();
      const finalDuration = Math.max(1, Math.floor((endMs - startMs) / 1000));
      
      // Cap duration at limit if set
      const durationSecs = limit > 0 ? Math.min(finalDuration, limit) : finalDuration;
      saveSessionAndReset(durationSecs, startMs);
    } else {
      setIsTracking(false);
    }
  };

  const formatStopwatch = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDurationDisplay = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  // Grouping sessions by local date string
  const groupedSessions = useMemo(() => {
    const groups: Record<string, { dateLabel: string; totalSeconds: number; list: WorkSession[] }> = {};
    
    // Sort sessions newest first
    const sorted = [...sessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    
    sorted.forEach(s => {
      const startDate = new Date(s.startedAt);
      const dateKey = s.startedAt.split('T')[0]; // 'YYYY-MM-DD'
      
      // Format nice date label
      let label = startDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
      const todayStr = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (dateKey === todayStr) {
        label = 'Today';
      } else if (dateKey === yesterdayStr) {
        label = 'Yesterday';
      }
      
      if (!groups[dateKey]) {
        groups[dateKey] = {
          dateLabel: label,
          totalSeconds: 0,
          list: []
        };
      }
      
      groups[dateKey].totalSeconds += s.durationSeconds;
      groups[dateKey].list.push(s);
    });
    
    // Return as sorted array of groups
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [sessions]);

  // Monthly Analytics calculations
  const { monthlySeconds, monthlyBreakdown, currentMonthLabel } = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const monthLabel = now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

    const thisMonthSessions = sessions.filter(s => {
      const d = new Date(s.startedAt);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    const totalSecs = thisMonthSessions.reduce((acc, s) => acc + s.durationSeconds, 0);

    const breakdown: Record<string, number> = {};
    thisMonthSessions.forEach(s => {
      const desc = s.details.trim() || 'General Work Session';
      breakdown[desc] = (breakdown[desc] || 0) + s.durationSeconds;
    });

    const sortedBreakdown = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);

    return {
      monthlySeconds: totalSecs,
      monthlyBreakdown: sortedBreakdown,
      currentMonthLabel: monthLabel
    };
  }, [sessions]);

  // Extract top 5 unique recent work descriptions
  const recentDescriptions = useMemo(() => {
    const list: string[] = [];
    const sorted = [...sessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    sorted.forEach(s => {
      const desc = s.details.trim();
      if (desc && !list.includes(desc)) {
        list.push(desc);
      }
    });
    return list.slice(0, 5);
  }, [sessions]);

  const handleResetAll = () => {
    if (window.confirm("Are you sure you want to permanently delete all logged work sessions? This action cannot be undone.")) {
      if (onResetSessions) {
        onResetSessions();
      }
    }
  };

  // Stats
  const totalSecondsLogged = sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const totalXPGained = sessions.reduce((acc, s) => acc + Math.max(1, Math.floor(s.durationSeconds / 60)), 0);

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-10 pb-24 pt-4">
      {/* Immersive Heading */}
      <div className="text-center space-y-2">
         <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.3em]">
            Time Analytics Shard
         </div>
         <h2 className="text-4xl font-black text-white tracking-tighter italic">Work Tracker</h2>
         <p className="text-slate-400 max-w-md mx-auto leading-relaxed text-sm font-medium">
            Monitor focus sprints, record work segments, and generate RPG experience points automatically.
         </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-cardBg/40 border border-white/5 rounded-3xl p-6 backdrop-blur-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center text-primary">
            <Clock size={22} />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Time Logged</div>
            <div className="text-xl font-bold text-white mt-1">{formatDurationDisplay(totalSecondsLogged)}</div>
          </div>
        </div>

        <div className="bg-cardBg/40 border border-white/5 rounded-3xl p-6 backdrop-blur-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400">
            <Zap size={22} />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">RPG Energy Generated</div>
            <div className="text-xl font-bold text-white mt-1">{totalXPGained} XP</div>
          </div>
        </div>

        <div className="bg-cardBg/40 border border-white/5 rounded-3xl p-6 backdrop-blur-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-500/10 border border-teal-500/20 rounded-2xl flex items-center justify-center text-teal-400">
            <History size={22} />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sessions Completed</div>
            <div className="text-xl font-bold text-white mt-1">{sessions.length}</div>
          </div>
        </div>
      </div>

      {/* Timer Section */}
      <div className="max-w-xl mx-auto bg-cardBg border border-cardBorder rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden flex flex-col items-center">
        {isTracking && (
          <div className="absolute inset-0 bg-primary/5 animate-pulse pointer-events-none" />
        )}
        
        <h3 className="font-bold text-[10px] text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3 mb-6 self-start">
          <Timer size={16} className="text-primary" /> stopwatch telemetry
        </h3>

        {!isTracking ? (
          <div className="w-full space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Work Description</label>
              <input 
                type="text" 
                value={details} 
                onChange={e => setDetails(e.target.value)} 
                placeholder="What are you focusing on?" 
                className="w-full bg-bgDark border border-cardBorder rounded-2xl px-5 py-4 text-sm text-white focus:border-primary outline-none transition-all placeholder:text-slate-700" 
              />
            </div>

            {/* Suggested Recent Descriptions */}
            {recentDescriptions.length > 0 && (
              <div className="space-y-2 w-full text-left">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 block">Recent Activities</label>
                <div className="flex flex-wrap gap-2">
                  {recentDescriptions.map(desc => (
                    <button
                      key={desc}
                      type="button"
                      onClick={() => setDetails(desc)}
                      className="px-3.5 py-2 bg-bgDark/50 hover:bg-primary/20 border border-white/5 hover:border-primary/30 text-slate-400 hover:text-white rounded-xl text-[10px] font-bold transition-all uppercase tracking-wide active:scale-95 text-left truncate max-w-xs"
                    >
                      {desc}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Auto-Stop Limit</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { label: 'None', val: 0 },
                  { label: '30 Min', val: 1800 },
                  { label: '1 Hour', val: 3600 },
                  { label: '2 Hours', val: 7200 },
                  { label: '3 Hours', val: 10800 }
                ].map(opt => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setLimit(opt.val)}
                    className={`py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all ${
                      limit === opt.val 
                        ? 'bg-primary/20 border-primary text-primary shadow-lg shadow-primary/10' 
                        : 'bg-bgDark/30 border-white/5 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            
            <button 
              onClick={handleStart}
              className="w-full bg-primary hover:bg-primary-hover text-white py-5 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              <Play size={16} fill="currentColor" className="ml-1" /> Initialize Timer
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center space-y-8">
            <div className="text-center space-y-1">
              <div className="text-[10px] font-black text-primary uppercase tracking-[0.25em] animate-pulse flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary" /> Active session telemetry
              </div>
              <div className="text-xs text-slate-400 font-bold max-w-xs truncate mb-2">{details}</div>
              {limit > 0 && (
                <div className="inline-flex px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-black text-primary uppercase tracking-widest">
                  Auto-stops in: {formatDurationDisplay(Math.max(0, limit - elapsed))}
                </div>
              )}
            </div>

            {/* Glowing Digital Ticker */}
            <div className="relative font-mono text-5xl sm:text-6xl font-black text-white bg-bgDark border border-cardBorder rounded-[1.5rem] px-8 py-6 shadow-2xl tracking-wider select-none animate-fade-in">
              <div className="absolute inset-0 rounded-[1.5rem] border border-primary/20 animate-pulse pointer-events-none" />
              {formatStopwatch(elapsed)}
            </div>

            <button 
              onClick={handleStop}
              className="w-full bg-red-600 hover:bg-red-500 text-white py-5 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-red-500/20 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              <Square size={16} fill="currentColor" /> Stop Focus Timer
            </button>
          </div>
        )}
      </div>

      {/* Monthly Analytics Breakdown & Reset Panel */}
      <div className="bg-cardBg border border-cardBorder rounded-[2rem] p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-white/5 pb-4 gap-3">
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-teal-400">Monthly Analytics</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Project-Wise Distribution ({currentMonthLabel})</p>
          </div>
          <div className="text-left sm:text-right shrink-0">
            <span className="inline-block bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl">
              Month Total: {formatDurationDisplay(monthlySeconds)}
            </span>
          </div>
        </div>

        {monthlyBreakdown.length === 0 ? (
          <div className="text-slate-600 font-bold italic text-xs text-center py-6">
            No work telemetry logged in {currentMonthLabel}.
          </div>
        ) : (
          <div className="space-y-4">
            {monthlyBreakdown.map(([desc, secs]) => {
              const pct = monthlySeconds > 0 ? Math.round((secs / monthlySeconds) * 100) : 0;
              return (
                <div key={desc} className="space-y-1.5 animate-fade-in">
                  <div className="flex justify-between items-center text-xs font-bold gap-4">
                    <span className="text-slate-300 truncate">{desc}</span>
                    <span className="text-slate-500 font-mono text-[10px] shrink-0">
                      {formatDurationDisplay(secs)} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-bgDark h-2 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="bg-primary h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${pct}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-4 border-t border-white/5 flex justify-end">
          <button 
            onClick={handleResetAll}
            className="text-[9px] font-black text-red-500 hover:text-white px-4 py-2 hover:bg-red-600/10 border border-red-500/20 hover:border-red-500 rounded-xl transition-all uppercase tracking-widest active:scale-95"
          >
            Reset Session Records
          </button>
        </div>
      </div>

      {/* History Log */}
      <div className="space-y-8">
        <div className="flex items-center gap-4">
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-slate-600">Focus Session Records</h3>
            <div className="flex-1 h-px bg-white/5"></div>
        </div>

        {groupedSessions.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-[3rem] bg-white/2 text-slate-700 font-bold italic text-sm">
            No work sessions recorded in this lifecycle.
          </div>
        ) : (
          <div className="space-y-8">
            {groupedSessions.map(([dateKey, group]) => (
              <div key={dateKey} className="space-y-4 animate-fade-in">
                {/* Day Header */}
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">{group.dateLabel}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                    Daily Total: {formatDurationDisplay(group.totalSeconds)}
                  </span>
                </div>

                {/* Day's Sessions */}
                <div className="space-y-3 pl-2 sm:pl-4">
                  {group.list.map(s => {
                    const gainedXP = Math.max(1, Math.floor(s.durationSeconds / 60));
                    const startedTime = new Date(s.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

                    return (
                      <div key={s.id} className="group flex items-center gap-4 bg-cardBg border border-cardBorder p-4 rounded-2xl transition-all hover:border-primary/50 shadow-md">
                        <div className="w-8 h-8 bg-primary/10 text-primary border border-primary/20 rounded-lg flex items-center justify-center shrink-0">
                          <Timer size={14} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-slate-100 truncate">{s.details}</h4>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                              Started at {startedTime}
                            </span>
                            <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-tighter border border-white/5 bg-white/5 text-slate-400">
                              {formatDurationDisplay(s.durationSeconds)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded-full text-yellow-400 text-[10px] font-black uppercase tracking-widest shrink-0">
                            <Award size={10} />
                            <span>+{gainedXP} XP</span>
                          </div>
                          <button 
                            onClick={() => onDeleteSession(s.id)}
                            className="p-2 text-slate-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded-lg"
                            title="Delete Entry"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
