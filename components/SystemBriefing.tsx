
import React, { useState, useEffect } from 'react';
import { UserProfile, Task } from '../types';
import { GoogleGenAI } from "@google/genai";
import { useSpeech } from '../hooks/useSpeech';
import { Activity, Power, Zap, Mic, Volume2, Loader2, Radio } from 'lucide-react';

interface SystemBriefingProps {
  user: UserProfile;
  tasks: Task[];
}

export const SystemBriefing: React.FC<SystemBriefingProps> = ({ user, tasks }) => {
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'speaking'>('idle');
  const { speak, cancel, isSpeaking } = useSpeech();

  // Reset status when speech ends physically
  useEffect(() => {
    if (!isSpeaking && status === 'speaking') {
      setStatus('idle');
    }
  }, [isSpeaking, status]);

  const generateBriefing = async () => {
    setStatus('analyzing');
    
    try {
        const today = new Date().toISOString().split('T')[0];
        const overdueCount = tasks.filter(t => !t.completed && t.date < today).length;
        const dueToday = tasks.filter(t => !t.completed && t.date === today).length;
        const statsStr = Object.entries(user.stats).map(([k, v]) => `${k} Level ${Math.floor(Math.sqrt((v as number)/100))}`).join(', ');
        
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `
                Context: User has the following stats: [${statsStr}]. 
                Status: ${overdueCount} overdue tasks. ${dueToday} tasks due today.
                
                Persona: You are CORTEX, a military-grade logistics AI for Flow OS.
                Objective: Generate a morning briefing script for the Operator.
                
                Rules:
                1. Keep it under 3 short sentences.
                2. Be strict, precise, and motivating. No fluff.
                3. Call the user 'Operator'.
                4. If overdue tasks > 0, demand immediate remediation.
                5. If stats are low, suggest training.
                6. Output raw text only.
            `
        });
        
        const script = response.text || "Systems nominal. Ready for protocol execution.";
        
        setStatus('speaking');
        speak(script);
        
    } catch (e) {
        console.error("Briefing Error:", e);
        setStatus('idle');
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
            <h2 className="text-2xl font-black text-white italic tracking-tight">CORTEX Module</h2>
            <p className="text-xs text-slate-400 uppercase font-black tracking-widest mt-1 flex items-center gap-2">
               {status === 'idle' ? 'Standby' : status === 'analyzing' ? 'Scanning Biometrics...' : 'Audio Transmission'}
            </p>
          </div>
          <div className={`p-2 rounded-full border ${status === 'speaking' ? 'bg-primary/20 border-primary text-primary animate-pulse' : 'bg-white/5 border-white/5 text-slate-500'}`}>
             {status === 'speaking' ? <Volume2 size={20} /> : <Radio size={20} />}
          </div>
       </div>

       <div className="flex-1 flex items-center justify-center py-6 relative z-10">
          {status === 'idle' && (
             <button 
               onClick={generateBriefing}
               className="group relative flex items-center justify-center gap-3 px-8 py-4 bg-white/5 hover:bg-primary/10 border border-white/10 hover:border-primary/50 rounded-2xl transition-all active:scale-95"
             >
                <Power size={20} className="text-primary group-hover:scale-110 transition-transform" />
                <span className="font-black text-xs uppercase tracking-[0.3em] text-white">Initialize System</span>
             </button>
          )}

          {status === 'analyzing' && (
             <div className="flex flex-col items-center gap-3">
                <Loader2 size={32} className="text-primary animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Computing...</span>
             </div>
          )}

          {status === 'speaking' && (
             <div className="flex items-center gap-1 h-12">
                {[...Array(5)].map((_, i) => (
                   <div 
                     key={i}
                     className="w-1.5 bg-primary rounded-full animate-[pulse_0.5s_ease-in-out_infinite]"
                     style={{ 
                        height: '100%', 
                        animationDelay: `${i * 0.1}s` 
                     }}
                   ></div>
                ))}
             </div>
          )}
       </div>

       {/* Footer Status */}
       <div className="flex justify-between items-end z-10 relative">
          <div className="flex gap-4">
             <div className="text-center">
                <div className="text-xl font-black text-white">{user.xp}</div>
                <div className="text-[8px] uppercase text-slate-500 font-bold">XP</div>
             </div>
             <div className="w-px bg-white/10 h-8"></div>
             <div className="text-center">
                <div className="text-xl font-black text-white">{tasks.length}</div>
                <div className="text-[8px] uppercase text-slate-500 font-bold">Protocols</div>
             </div>
          </div>
          {status === 'speaking' && (
             <button onClick={cancel} className="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase tracking-widest border border-red-500/30 px-3 py-1 rounded-lg hover:bg-red-500/10">
                Abort
             </button>
          )}
       </div>
    </div>
  );
};
