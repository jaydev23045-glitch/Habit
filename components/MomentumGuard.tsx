import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, CheckCircle2, Coffee, Shield, ArrowRight, X, MapPin } from 'lucide-react';
import { MomentumSession, MicroSegment } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface MomentumGuardProps {
  session: MomentumSession;
  onSessionUpdate: (session: MomentumSession) => void;
  onExit: (finalSession: MomentumSession, bridge?: string) => void;
  soundEnabled: boolean;
}

const SEGMENT_DURATION = 10 * 60; // 10 minutes in seconds
const MAX_SEGMENTS = 6; // Force stop after 1 hour

export const MomentumGuard: React.FC<MomentumGuardProps> = ({ session, onSessionUpdate, onExit, soundEnabled }) => {
  // Guard State
  const [guardState, setGuardState] = useState<'planning' | 'running' | 'checkpoint' | 'cooldown' | 'parking'>('planning');
  const [timeLeft, setTimeLeft] = useState(SEGMENT_DURATION);
  const [microGoal, setMicroGoal] = useState('');
  const [bridgeNote, setBridgeNote] = useState('');
  const [currentSegmentNum, setCurrentSegmentNum] = useState(1);
  
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const secondsRemainingOnStartRef = useRef<number>(timeLeft);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Audio helper
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      // Soft, non-aggressive chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.5);
    } catch (e) {}
  };

  // Close AudioContext on unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Effect to manage the background-safe interval
  useEffect(() => {
    if (guardState === 'running') {
      startTimeRef.current = Date.now();
      secondsRemainingOnStartRef.current = timeLeft;
      timerRef.current = window.setInterval(() => {
        if (startTimeRef.current !== null) {
          const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
          const nextTimeLeft = Math.max(0, secondsRemainingOnStartRef.current - elapsedSeconds);
          setTimeLeft(nextTimeLeft);
        }
      }, 200);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [guardState]);

  // Effect to handle microsegment completion check
  useEffect(() => {
    if (timeLeft === 0 && guardState === 'running') {
      playChime();
      handleSegmentComplete();
    }
  }, [timeLeft, guardState]);

  // Anti-Distraction: Check for visibility (simulated "Focus Loss" detection)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && guardState === 'running') {
        // Just a console log in this demo
        console.log("Momentum Guard: Stay with us.");
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [guardState]);

  const startSegment = () => {
    if (!microGoal.trim()) return;
    setGuardState('running');
    
    // Add new segment to data
    const newSegment: MicroSegment = {
      id: uuidv4(),
      segmentNumber: currentSegmentNum,
      startedAt: new Date().toISOString(),
      goal: microGoal,
      outcome: 'continue' // placeholder
    };
    
    onSessionUpdate({
      ...session,
      segments: [...session.segments, newSegment]
    });
  };

  const handleSegmentComplete = () => {
    if (currentSegmentNum >= MAX_SEGMENTS) {
      setGuardState('cooldown');
    } else {
      setGuardState('checkpoint');
    }
  };

  const handleCheckpointDecision = (decision: 'continue' | 'park' | 'enough') => {
    const now = new Date().toISOString();
    
    // Update the completed segment
    const updatedSegments = [...session.segments];
    const lastSegIndex = updatedSegments.length - 1;
    updatedSegments[lastSegIndex] = {
      ...updatedSegments[lastSegIndex],
      completedAt: now,
      outcome: decision
    };

    const updatedSession = {
      ...session,
      totalSegments: session.totalSegments + 1,
      segments: updatedSegments,
      status: decision === 'continue' ? 'active' : 'completed'
    } as MomentumSession; // Explicit cast to help TS

    onSessionUpdate(updatedSession);

    if (decision === 'continue') {
      setCurrentSegmentNum(prev => prev + 1);
      setTimeLeft(SEGMENT_DURATION);
      setMicroGoal(''); // Clear goal for new segment
      setGuardState('planning');
    } else {
      // Transition to Parking to capture context
      setGuardState('parking');
    }
  };

  const handleFinalExit = () => {
    onExit(session, bridgeNote);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Progress bar calculation
  const progressPercent = ((SEGMENT_DURATION - timeLeft) / SEGMENT_DURATION) * 100;

  return (
    <div className="fixed inset-0 z-[100] bg-bgDarker/95 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in">
      
      {/* Top Bar */}
      <div className="absolute top-0 w-full p-6 flex justify-between items-center opacity-50">
        <div className="flex items-center gap-2 text-primary font-bold tracking-widest uppercase text-xs">
          <Shield size={16} /> Momentum Guard Active
        </div>
        <div className="text-slate-400 text-sm font-mono">
          Session Total: {(session.totalSegments * 10) + Math.floor((SEGMENT_DURATION - timeLeft)/60)}m
        </div>
      </div>

      <div className="w-full max-w-2xl px-8">
        
        {/* State: Planning (Micro Goal) */}
        {guardState === 'planning' && (
          <div className="animate-fade-in text-center">
            <div className="mb-8 inline-block p-4 rounded-full bg-primary/10 text-primary mb-6">
               <ArrowRight size={32} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Segment {currentSegmentNum}</h2>
            <p className="text-slate-400 mb-8">Don't think about the whole task. What is the <span className="text-white font-bold">one tiny thing</span> you will do in the next 10 minutes?</p>
            
            <input 
              autoFocus
              type="text"
              value={microGoal}
              onChange={e => setMicroGoal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && startSegment()}
              placeholder="e.g., Read one paragraph, Write 3 lines..."
              className="w-full bg-transparent border-b-2 border-slate-700 text-2xl text-center py-4 text-white focus:outline-none focus:border-primary transition-colors mb-8 placeholder:text-slate-600"
            />
            
            <button 
              onClick={startSegment}
              disabled={!microGoal.trim()}
              className="px-8 py-3 bg-primary hover:bg-primary-hover text-white rounded-full font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
            >
              Start 10m Segment <Play size={18} fill="currentColor" />
            </button>
          </div>
        )}

        {/* State: Running (The Tunnel) */}
        {guardState === 'running' && (
          <div className="text-center animate-fade-in relative">
            <div className="mb-2 text-slate-500 font-bold uppercase tracking-widest text-xs">Current Micro-Goal</div>
            <h2 className="text-2xl font-bold text-white mb-12 max-w-xl mx-auto leading-relaxed">"{microGoal}"</h2>
            
            {/* Minimalist Timer Visualization */}
            <div className="relative h-2 bg-slate-800 rounded-full w-full max-w-lg mx-auto overflow-hidden mb-6">
               <div 
                 className="absolute top-0 left-0 h-full bg-primary transition-all duration-1000 ease-linear shadow-[0_0_15px_rgba(124,58,237,0.5)]"
                 style={{ width: `${progressPercent}%` }}
               />
            </div>
            
            <div className="text-6xl font-bold text-slate-700 font-mono tracking-tighter">
               {formatTime(timeLeft)}
            </div>
            
            <div className="mt-12 opacity-30 hover:opacity-100 transition-opacity">
               <button onClick={() => setGuardState('checkpoint')} className="text-xs text-red-400 border border-red-900 px-3 py-1 rounded hover:bg-red-900/20">
                 Emergency Stop
               </button>
            </div>
          </div>
        )}

        {/* State: Checkpoint */}
        {guardState === 'checkpoint' && (
           <div className="bg-cardBg border border-cardBorder rounded-2xl p-8 max-w-lg mx-auto shadow-2xl animate-slide-in">
              <div className="flex items-center gap-3 mb-6 text-teal-400">
                 <CheckCircle2 size={32} />
                 <h2 className="text-2xl font-bold text-white">Segment Complete</h2>
              </div>
              <p className="text-slate-300 mb-8">
                 You've banked 10 minutes of solid focus. That's a win. <br/>
                 How is your energy right now?
              </p>
              
              <div className="space-y-3">
                 <button 
                   onClick={() => handleCheckpointDecision('continue')}
                   className="w-full py-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-all"
                 >
                   <Play size={20} fill="currentColor" /> I have momentum. Continue.
                 </button>
                 
                 <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => handleCheckpointDecision('park')}
                      className="py-4 bg-bgDark border border-cardBorder hover:border-slate-500 text-slate-300 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                    >
                      <Coffee size={18} /> Pause & Park
                    </button>
                    <button 
                      onClick={() => handleCheckpointDecision('enough')}
                      className="py-4 bg-bgDark border border-cardBorder hover:border-slate-500 text-slate-300 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                    >
                      <CheckCircle2 size={18} /> Done for Today
                    </button>
                 </div>
              </div>
           </div>
        )}

        {/* State: Parking (Context Bridge) */}
        {guardState === 'parking' && (
           <div className="bg-cardBg border border-cardBorder rounded-2xl p-8 max-w-lg mx-auto shadow-2xl animate-slide-in text-center">
              <div className="mb-4 inline-block p-3 rounded-full bg-blue-500/10 text-blue-400">
                 <MapPin size={32} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Build a Bridge to Tomorrow</h2>
              <p className="text-slate-400 text-sm mb-6">
                 Don't force your future self to think. Leave a tiny breadcrumb. <br/>
                 <span className="text-blue-400">What is the exact next step?</span>
              </p>
              
              <input 
                 autoFocus
                 type="text"
                 value={bridgeNote}
                 onChange={e => setBridgeNote(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && handleFinalExit()}
                 placeholder="e.g. Open 'Report_v2.docx' and write intro"
                 className="w-full bg-bgDark border border-cardBorder rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 mb-6"
              />

              <button 
                 onClick={handleFinalExit}
                 className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all"
              >
                 Save Context & Exit
              </button>
           </div>
        )}

        {/* State: Cooldown (Forced) */}
        {guardState === 'cooldown' && (
           <div className="text-center animate-fade-in">
              <div className="w-20 h-20 bg-orange-500/20 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                 <Coffee size={40} />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Guard Protocol: Cooldown</h2>
              <p className="text-slate-400 max-w-md mx-auto mb-8">
                 You have completed 6 segments (60 minutes). To prevent burnout, the Momentum Guard requires you to take a break now.
              </p>
              <button 
                 onClick={() => handleCheckpointDecision('enough')}
                 className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-full font-bold transition-all"
              >
                 Close Session
              </button>
           </div>
        )}

      </div>
    </div>
  );
};