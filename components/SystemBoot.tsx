
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
    <div className="fixed inset-0 z-[200] bg-bgDarker flex items-center justify-center animate-fade-in">
       <div className="text-center p-8">
          <div className="mb-12 relative flex justify-center">
             <div className="absolute inset-0 bg-primary/20 blur-[50px] rounded-full animate-pulse"></div>
             <button 
               onClick={handleInitialize}
               disabled={booting}
               className="relative w-32 h-32 rounded-full border-4 border-primary/30 flex items-center justify-center bg-bgDark hover:bg-primary/10 transition-all group active:scale-95 shadow-[0_0_50px_rgba(124,58,237,0.3)]"
             >
                <Power size={48} className={`text-primary ${booting ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`} />
             </button>
          </div>
          <h1 className="text-3xl font-black text-white tracking-[0.2em] uppercase mb-4">Flow OS <span className="text-primary">v3.0</span></h1>
          <p className="text-slate-500 text-xs font-mono uppercase tracking-[0.2em] h-4">
             {booting ? 'INITIALIZING NEURAL CORE...' : 'SYSTEM OFFLINE. TAP TO BOOT.'}
          </p>
       </div>
    </div>
  );
};
