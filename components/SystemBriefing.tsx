
import React, { useState, useEffect } from 'react';
import { UserProfile, Task, Habit } from '../types';
import { generateDailyDebrief } from '../services/aiService';
import { useSpeech } from '../hooks/useSpeech';
import { Activity, Power, Zap, Mic, Volume2, Loader2, Radio } from 'lucide-react';

interface SystemBriefingProps {
  user: UserProfile;
  tasks: Task[];
  habits: Habit[];
  activeGeminiKey?: string;
  onRequestAI?: () => void;
}

export const SystemBriefing: React.FC<SystemBriefingProps> = ({ user, tasks, habits, activeGeminiKey, onRequestAI }) => {
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'speaking'>('idle');
  const { speak, cancel, isSpeaking } = useSpeech();

  // Reset status when speech ends physically
  useEffect(() => {
    if (!isSpeaking && status === 'speaking') {
      setStatus('idle');
    }
  }, [isSpeaking, status]);

  const generateBriefing = async () => {
    if (!activeGeminiKey) {
      if (onRequestAI) onRequestAI();
      return;
    }
    
    setStatus('analyzing');
    
    try {
        const userData = {
           name: user.name,
           xp: user.xp,
           tasks,
           habits
        };
        
        const script = await generateDailyDebrief(userData, activeGeminiKey);
        
        setStatus('speaking');
        speak(script);
        
    } catch (e: any) {
        console.error("Briefing Error:", e);
        setStatus('idle');
        if (e.message === "NETWORK_TIMEOUT" || !navigator.onLine) {
           speak("Network connection is offline. Standby mode active.");
        } else {
           speak("AI Core offline. Please check your API key.");
        }
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col justify-between">
       {/* Background Animation layer for "Speaking" */}
       {status === 'speaking' && (
         <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-20 pointer-events-none">
            {[...Array(12)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-2 bg-primary rounded-full animate-neural-pulse"
                  style={{ 
                    height: `${Math.random() * 40 + 20}%`, 
                    animationDuration: `${0.5 + Math.random() * 0.5}s` 
                  }} 
                />
            ))}
         </div>
       )}

       <div className="flex justify-between items-start z-10 relative">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accentCyan animate-pulse shadow-[0_0_10px_#06b6d4]"></span>
              <h2 className="text-xl md:text-2xl font-black text-white italic tracking-tight flex items-center gap-2">
                J.A.R.V.I.S. <span className="text-primary not-italic text-sm font-mono tracking-widest px-2 py-0.5 rounded bg-primary/10 border border-primary/20">CORTEX 2.5</span>
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-[8px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-white/[0.04] text-slate-400 border border-white/[0.06]">
                CIPHER: AES-256
              </span>
              <span className="text-[8px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-white/[0.04] text-emerald-400 border border-white/[0.06] flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-emerald-400"></span> ZERO-KNOWLEDGE
              </span>
              <span className="text-[8px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                {status === 'idle' ? 'STANDBY' : status === 'analyzing' ? 'PROCESSING TELEMETRY' : 'AUDIO BROADCAST'}
              </span>
            </div>
          </div>
          <div className={`p-2.5 rounded-xl border transition-all ${status === 'speaking' ? 'bg-primary/20 border-primary text-primary shadow-[0_0_20px_rgba(139,92,246,0.3)] animate-pulse' : 'bg-white/[0.03] border-white/[0.06] text-slate-500'}`}>
             {status === 'speaking' ? <Volume2 size={18} className="animate-bounce" /> : <Radio size={18} />}
          </div>
       </div>

       <div className="flex-1 flex flex-col items-center justify-center py-8 relative z-10">
          {status === 'idle' && (
             <div className="flex flex-col items-center gap-4">
               <button 
                 id="cortex-button"
                 onClick={generateBriefing}
                 className="group relative flex items-center justify-center gap-3.5 px-8 py-4 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent hover:from-primary/30 hover:to-primary/10 border border-primary/40 hover:border-primary rounded-2xl transition-all active:scale-[0.98] shadow-[0_0_30px_rgba(139,92,246,0.2)]"
               >
                  <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Power size={18} className="text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-black text-xs uppercase tracking-[0.25em] text-white">Initialize J.A.R.V.I.S.</div>
                    <div className="text-[9px] text-slate-400 font-medium">Generate context-aware morning debrief</div>
                  </div>
               </button>
             </div>
          )}

          {status === 'analyzing' && (
             <div className="flex flex-col items-center gap-4">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <div className="absolute inset-0 border-2 border-primary/30 rounded-full animate-ping"></div>
                  <div className="absolute inset-2 border-2 border-dashed border-accentCyan rounded-full animate-spin"></div>
                  <Loader2 size={24} className="text-primary animate-spin" />
                </div>
                <div className="text-center">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary block">Synthesizing Neural Briefing</span>
                  <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">Analyzing schedule, streaks & level...</span>
                </div>
             </div>
          )}

          {status === 'speaking' && (
             <div className="flex flex-col items-center gap-4 w-full max-w-sm">
                <div className="flex items-center justify-center gap-1.5 h-14 w-full px-4 bg-black/40 rounded-2xl border border-white/[0.06] backdrop-blur-md">
                   {[40, 75, 55, 90, 60, 100, 70, 85, 45, 95, 65, 80, 50, 70, 60, 40].map((h, i) => (
                      <div 
                        key={i}
                        className="w-1.5 bg-gradient-to-t from-primary via-accentCyan to-accentEmerald rounded-full animate-pulse"
                        style={{ 
                           height: `${h}%`, 
                           animationDuration: `${0.4 + (i % 5) * 0.15}s`,
                           animationDelay: `${i * 0.05}s` 
                        }}
                      ></div>
                   ))}
                </div>
                <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-accentCyan animate-pulse">
                  TRANSMITTING NEURAL AUDIO STREAM...
                </span>
             </div>
          )}
       </div>

       {/* Footer Status */}
       <div className="flex justify-between items-end z-10 relative pt-4 border-t border-white/[0.04]">
          <div className="flex items-center gap-5">
             <div className="text-left">
                <div className="text-lg font-black text-white font-mono">{user.xp}</div>
                <div className="text-[8px] uppercase text-slate-500 font-bold tracking-widest">Operator XP</div>
             </div>
             <div className="w-px bg-white/10 h-6"></div>
             <div className="text-left">
                <div className="text-lg font-black text-white font-mono">{tasks.length}</div>
                <div className="text-[8px] uppercase text-slate-500 font-bold tracking-widest">Active Protocols</div>
             </div>
             <div className="w-px bg-white/10 h-6"></div>
             <div className="text-left">
                <div className="text-lg font-black text-emerald-400 font-mono">{habits.length}</div>
                <div className="text-[8px] uppercase text-slate-500 font-bold tracking-widest">Habit Engines</div>
             </div>
          </div>
          {status === 'speaking' && (
             <button 
               onClick={cancel} 
               className="text-[9px] font-bold text-rose-400 hover:text-white uppercase tracking-widest border border-rose-500/30 px-3.5 py-1.5 rounded-xl hover:bg-rose-500/20 transition-all active:scale-95 flex items-center gap-1.5"
             >
                <Power size={12} /> Abort Transmission
             </button>
          )}
       </div>
    </div>
  );
};
