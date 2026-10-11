
import React, { useState } from 'react';
import { Power } from 'lucide-react';
import { voiceService } from '../services/voiceService';

import { AppData } from '../types';

interface SystemBootProps {
  data: AppData;
  onBootComplete: () => void;
}

export const SystemBoot: React.FC<SystemBootProps> = ({ data, onBootComplete }) => {
  const [booting, setBooting] = useState(false);

  const handleInitialize = async () => {
    setBooting(true);
    
    // 1. Unlock Audio Context (Crucial for browser autoplay policy)
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContext();
    await ctx.resume();
    
    // 2. Request Notification Permission
    if ("Notification" in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    // 3. Cortex Briefing
    let spoke = false;
    if (data.user.voiceEnabled) {
      try {
          const todayStr = new Date().toISOString().split('T')[0];
          const todaysTasks = data.tasks.filter(t => t.date === todayStr && !t.completed);
          const taskTitles = todaysTasks.length > 0 
            ? todaysTasks.map(t => t.title).join(', ') 
            : "No active protocols";
          
          // Generate local instant greeting
          const script = `Welcome back, ${data.user.name}. You have ${todaysTasks.length} active protocols today. Ready for input.`;
          
          // Speak with High Quality TTS and await complete playback
          await voiceService.speak(script);
          spoke = true;
      } catch (e) {
          console.error("Briefing failed", e);
      }
    }

    if (!spoke) {
      // Brief delay for visual effect if voice is disabled/fails
      await new Promise(resolve => setTimeout(resolve, 1500));
    } else {
      // Short delay after speaking for smooth transition visual effect
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    onBootComplete();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#06080c] flex items-center justify-center animate-fade-in relative overflow-hidden">
       {/* Background Ambient Radial Glow */}
       <div className="absolute w-[600px] h-[600px] bg-primary/15 rounded-full blur-[140px] pointer-events-none" />

       <div className="text-center p-8 relative z-10">
          <div className="mb-10 relative flex justify-center">
             <div className="absolute inset-0 bg-primary/30 blur-[60px] rounded-full animate-pulse"></div>
             
             {/* Outer Concentric Ring */}
             <div className="w-36 h-36 rounded-full border border-white/10 flex items-center justify-center p-2 relative">
                <div className={`absolute inset-0 rounded-full border border-dashed border-primary/40 ${booting ? 'animate-spin' : ''}`}></div>
                <button 
                  onClick={handleInitialize}
                  disabled={booting}
                  className="relative w-28 h-28 rounded-full border-2 border-primary/50 flex items-center justify-center bg-[#0e121b] hover:bg-primary/20 transition-all group active:scale-95 shadow-[0_0_50px_rgba(139,92,246,0.4)]"
                  title="Initialize Flow OS"
                >
                   <Power size={42} className={`text-primary ${booting ? 'animate-pulse text-white drop-shadow-[0_0_15px_rgba(139,92,246,0.9)]' : 'group-hover:scale-110 transition-transform'}`} />
                </button>
             </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-[0.25em] uppercase mb-3 italic">
            Flow OS <span className="text-primary not-italic font-mono text-sm px-2 py-0.5 rounded bg-primary/20 border border-primary/30">v3.5 PRO</span>
          </h1>
          <p className="text-slate-400 text-xs font-mono uppercase tracking-[0.25em] h-5">
             {booting ? 'INITIALIZING NEURAL CORE...' : 'SYSTEM OFFLINE. TAP TO BOOT.'}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3 text-[9px] font-mono text-slate-500 uppercase tracking-widest">
            <span>[CIPHER: AES-256]</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">[100% LOCAL-FIRST]</span>
          </div>
       </div>
    </div>
  );
};
