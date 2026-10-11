
import React, { useState } from 'react';
import { Power, ShieldCheck, Zap } from 'lucide-react';
import { voiceService } from '../services/voiceService';
import { AppData } from '../types';

interface SystemBootProps {
  data: AppData;
  onBootComplete: () => void;
}

export const SystemBoot: React.FC<SystemBootProps> = ({ data, onBootComplete }) => {
  const [booting, setBooting] = useState(false);
  const [autoBootNextTime, setAutoBootNextTime] = useState(true);

  const handleInitialize = async () => {
    setBooting(true);
    
    // Remember that user has booted
    localStorage.setItem('flow-os-booted', 'true');
    if (!autoBootNextTime) {
      localStorage.removeItem('flow-os-auto-boot');
    } else {
      localStorage.setItem('flow-os-auto-boot', 'true');
    }

    // 1. Unlock Audio Context
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        await ctx.resume();
      }
    } catch (e) {
      console.warn("AudioContext unlock ignored:", e);
    }
    
    // 2. Request Notification Permission
    if ("Notification" in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (e) {
        // Notification permission optional
      }
    }

    // 3. Cortex Greeting
    if (data.user.voiceEnabled) {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const todaysTasks = (data.tasks || []).filter(t => t.date === todayStr && !t.completed);
        const script = `Welcome back, ${data.user.name}. Flow OS online.`;
        voiceService.speak(script);
      } catch (e) {
        console.error("Briefing failed", e);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 600));
    onBootComplete();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#06080c] flex flex-col justify-between items-center p-6 sm:p-10 pt-[max(env(safe-area-inset-top),2rem)] pb-[max(env(safe-area-inset-bottom),2.5rem)] animate-fade-in relative overflow-hidden select-none">
       {/* Background Ambient Radial Glows */}
       <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[140px] pointer-events-none" />
       <div className="absolute bottom-10 right-10 w-64 h-64 bg-accentCyan/10 rounded-full blur-[100px] pointer-events-none" />

       {/* Top Header Section */}
       <div className="w-full flex justify-between items-center relative z-10 max-w-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">SYS_ONLINE</span>
          </div>
          <div className="flex items-center gap-2 text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500 bg-white/[0.03] border border-white/[0.06] px-2.5 py-1 rounded-full">
            <ShieldCheck size={12} className="text-emerald-400" />
            <span>AES-256 CIPHER</span>
          </div>
       </div>

       {/* Center Arc Reactor & Actions */}
       <div className="flex flex-col items-center justify-center my-auto relative z-10 w-full max-w-sm text-center space-y-7">
          <div className="relative flex justify-center items-center">
             <div className="absolute inset-0 bg-primary/30 blur-[50px] rounded-full animate-pulse"></div>
             
             {/* Orbital Concentric Ring */}
             <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full border border-white/10 flex items-center justify-center p-3 relative">
                <div className={`absolute inset-0 rounded-full border border-dashed border-primary/40 ${booting ? 'animate-spin' : 'animate-[spin_20s_linear_infinite]'}`}></div>
                <button 
                  onClick={handleInitialize}
                  disabled={booting}
                  className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 border-primary/50 flex items-center justify-center bg-gradient-to-br from-[#121624] to-[#0a0d16] hover:bg-primary/20 transition-all group active:scale-95 shadow-[0_0_50px_rgba(139,92,246,0.5)] cursor-pointer"
                  title="Launch Flow OS"
                >
                   <Power size={44} className={`text-primary transition-all ${booting ? 'animate-pulse text-white drop-shadow-[0_0_20px_rgba(139,92,246,1)] scale-110' : 'group-hover:scale-110'}`} />
                </button>
             </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-[0.2em] uppercase italic">
              Flow OS <span className="text-primary not-italic font-mono text-xs px-2 py-0.5 rounded bg-primary/20 border border-primary/30 align-middle">v3.5 PRO</span>
            </h1>
            <p className="text-slate-400 text-xs font-mono uppercase tracking-[0.25em] h-5">
               {booting ? 'INITIALIZING NEURAL CORE...' : 'SYSTEM STANDBY • READY TO BOOT'}
            </p>
          </div>

          <button
            onClick={handleInitialize}
            disabled={booting}
            className="w-full py-4 bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.25em] shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Zap size={16} />
            <span>Launch Flow OS</span>
          </button>
       </div>

       {/* Bottom Preferences Section */}
       <div className="w-full max-w-sm relative z-10 flex flex-col items-center gap-3">
          <label className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] cursor-pointer select-none">
            <input 
              type="checkbox"
              checked={autoBootNextTime}
              onChange={e => setAutoBootNextTime(e.target.checked)}
              className="w-3.5 h-3.5 rounded bg-black/60 border-white/20 text-primary cursor-pointer accent-primary"
            />
            <span className="text-[10px] font-semibold text-slate-300">
              Auto-launch next time (skip this screen)
            </span>
          </label>

          <div className="flex items-center justify-center gap-3 text-[9px] font-mono text-slate-500 uppercase tracking-widest">
            <span>[100% PRIVATE]</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">[LOCAL STORAGE OK]</span>
          </div>
       </div>
    </div>
  );
};
