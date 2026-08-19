
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Clock, CloudRain, Zap, Waves, Volume2, VolumeX } from 'lucide-react';

interface FocusModeProps {
  onSessionComplete?: (minutes: number) => void;
}

// Minimal Audio Gen Class to avoid external dependencies
class NoiseGenerator {
  ctx: AudioContext | null = null;
  node: AudioNode | null = null;
  gainNode: GainNode | null = null;

  init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
  }

  play(type: 'brown' | 'pink' | 'white') {
    this.stop();
    this.init();
    if (!this.ctx) return;

    const bufferSize = 2 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (type === 'white') {
        data[i] = white;
      } else if (type === 'pink') {
        const b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        // Pink noise approximation (Paul Kellet's refined method) would go here
        // Using simple 1/f approximation for brevity in this snippet context
        data[i] = (Math.random() * 2 - 1 + (i > 0 ? data[i-1] : 0)) / 2; 
      } else {
        // Brown noise (1/f^2) - simple integration
        data[i] = (i > 0 ? data[i - 1] : 0) + (0.02 * white);
        data[i] /= 3.5; // Normalize roughly
      }
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    
    // Filter for smoother sound
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = type === 'white' ? 5000 : 1000;

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = 0.05; // Start low

    noise.connect(filter);
    filter.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);
    
    noise.start();
    this.node = noise;
  }

  stop() {
    if (this.node) {
      try { (this.node as any).stop(); } catch(e){}
      this.node.disconnect();
      this.node = null;
    }
  }

  setVolume(val: number) {
    if (this.gainNode) this.gainNode.gain.value = val;
  }
}

export const FocusMode: React.FC<FocusModeProps> = ({ onSessionComplete }) => {
  const [totalTime, setTotalTime] = useState(25 * 60);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'pomodoro' | 'short' | 'long' | 'custom'>('pomodoro');
  const [customInput, setCustomInput] = useState('60');
  const [isSettingCustom, setIsSettingCustom] = useState(false);
  
  // Audio State
  const [soundType, setSoundType] = useState<'none' | 'brown' | 'pink' | 'white'>('none');
  const noiseGen = useRef(new NoiseGenerator());
  
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const secondsRemainingOnStartRef = useRef<number>(timeLeft);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Wake Lock for mobile screens
  const wakeLockRef = useRef<any>(null);

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      }
    } catch (err) {}
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      } catch (err) {}
    }
  };

  // Effect to manage the background-safe interval
  useEffect(() => {
    if (isActive) {
      requestWakeLock();
      startTimeRef.current = Date.now();
      secondsRemainingOnStartRef.current = timeLeft;
      timerRef.current = window.setInterval(() => {
        if (startTimeRef.current !== null) {
          const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
          const nextTimeLeft = Math.max(0, secondsRemainingOnStartRef.current - elapsedSeconds);
          setTimeLeft(nextTimeLeft);
        }
      }, 200);
    } else {
      releaseWakeLock();
    }
    return () => {
      releaseWakeLock();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isActive]);

  // Effect to handle session completion check
  useEffect(() => {
    if (timeLeft === 0 && isActive) {
      setIsActive(false);
      noiseGen.current.stop(); // Stop noise on finish
      setSoundType('none');
      if (onSessionComplete) onSessionComplete(Math.round(totalTime / 60));
      const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3'); 
      audio.play().catch(() => {}); 

      // Show completion notification
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Flow OS", {
          body: "Focus session complete! 🎯"
        });
      }

      alert("Session Complete!");
    }
  }, [timeLeft, isActive, totalTime, onSessionComplete]);

  // Navigate away warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isActive) {
        e.preventDefault();
        e.returnValue = 'Active focus session in progress. Are you sure you want to abandon?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isActive]);

  // Handle Sound Changes
  useEffect(() => {
    if (soundType === 'none') {
        noiseGen.current.stop();
    } else {
        noiseGen.current.play(soundType);
    }
    return () => noiseGen.current.stop();
  }, [soundType]);

  const toggleTimer = () => {
    if (!isActive && "Notification" in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    setIsActive(!isActive);
  };
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(totalTime);
    setSoundType('none');
  };

  const setPreset = (newMode: 'pomodoro' | 'short' | 'long') => {
    setMode(newMode);
    setIsActive(false);
    setIsSettingCustom(false);
    let newTime = 25 * 60;
    if (newMode === 'short') newTime = 5 * 60;
    if (newMode === 'long') newTime = 15 * 60;
    setTotalTime(newTime);
    setTimeLeft(newTime);
  };

  const applyCustomTime = () => {
    const mins = parseInt(customInput);
    if (!isNaN(mins) && mins > 0) {
      setMode('custom');
      const newTime = mins * 60;
      setTotalTime(newTime);
      setTimeLeft(newTime);
      setIsActive(false);
      setIsSettingCustom(false);
    }
  };

  const progress = timeLeft / totalTime;
  const dashArray = 880; 
  const dashOffset = dashArray - (dashArray * progress); 

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] animate-fade-in gap-8">
      
      {/* Top Presets */}
      <div className="bg-cardBg p-1 rounded-xl border border-cardBorder flex flex-wrap justify-center gap-2 shadow-lg">
        {(['pomodoro', 'short', 'long'] as const).map((m) => (
           <button
             key={m}
             onClick={() => setPreset(m)}
             className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
               mode === m ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:text-white'
             }`}
           >
             {m === 'pomodoro' ? 'Pomodoro' : m === 'short' ? 'Short' : 'Long Break'}
           </button>
        ))}
        <button
          onClick={() => setIsSettingCustom(true)}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
            mode === 'custom' ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock size={14} /> Custom
        </button>
      </div>

      {isSettingCustom && (
        <div className="flex items-center gap-2 bg-cardBg p-2 rounded-lg border border-cardBorder animate-slide-in">
          <span className="text-sm text-slate-400 pl-2">Minutes:</span>
          <input 
            type="number" 
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            className="w-16 bg-bgDark border border-cardBorder rounded px-2 py-1 text-center focus:outline-none focus:border-primary text-white"
            autoFocus
          />
          <button onClick={applyCustomTime} className="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-primary-hover">Set</button>
        </div>
      )}

      {/* Main Timer Visual */}
      <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
         <svg className="w-full h-full transform -rotate-90 drop-shadow-[0_0_30px_rgba(124,58,237,0.1)]">
            <circle cx="50%" cy="50%" r="46%" className="stroke-slate-800 fill-none stroke-[8px]" />
            <circle 
              cx="50%" cy="50%" r="46%" 
              className="stroke-primary fill-none stroke-[8px] transition-all duration-1000 ease-linear"
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
            />
         </svg>
         <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-6xl sm:text-7xl font-bold tracking-tighter bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent transition-all">
              {formatTime(timeLeft)}
            </div>
            <div className="text-slate-500 tracking-[0.3em] text-xs mt-4 font-bold uppercase flex items-center gap-2">
              {isActive ? <span className="flex items-center gap-2"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div> Live</span> : 'Standby'}
            </div>
         </div>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-6">
        <button 
          onClick={toggleTimer}
          className="w-16 h-16 rounded-full bg-primary hover:bg-primary-hover text-white flex items-center justify-center text-2xl shadow-[0_0_30px_rgba(124,58,237,0.4)] transition-all hover:scale-110 active:scale-95 border-4 border-bgDark"
        >
          {isActive ? <Pause fill="currentColor" /> : <Play fill="currentColor" className="ml-1" />}
        </button>
        <button 
          onClick={resetTimer}
          className="w-16 h-16 rounded-full bg-cardBg border border-cardBorder text-slate-400 hover:border-primary hover:text-primary flex items-center justify-center text-2xl transition-all hover:scale-110 active:scale-95 shadow-lg"
        >
          <RotateCcw size={24} />
        </button>
      </div>

      {/* Audio Environment Controls */}
      <div className="w-full max-w-sm bg-cardBg/50 border border-white/5 rounded-2xl p-4 mt-4 backdrop-blur-sm">
         <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 text-center">Audio Environment</div>
         <div className="grid grid-cols-4 gap-2">
            <button 
               onClick={() => setSoundType(soundType === 'brown' ? 'none' : 'brown')}
               className={`flex flex-col items-center justify-center py-3 rounded-xl border transition-all ${soundType === 'brown' ? 'bg-orange-900/30 border-orange-500/50 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'bg-white/5 border-transparent text-slate-500 hover:text-slate-300'}`}
            >
               <Waves size={18} />
               <span className="text-[9px] font-bold mt-1 uppercase">Deep</span>
            </button>
            <button 
               onClick={() => setSoundType(soundType === 'pink' ? 'none' : 'pink')}
               className={`flex flex-col items-center justify-center py-3 rounded-xl border transition-all ${soundType === 'pink' ? 'bg-pink-900/30 border-pink-500/50 text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.2)]' : 'bg-white/5 border-transparent text-slate-500 hover:text-slate-300'}`}
            >
               <CloudRain size={18} />
               <span className="text-[9px] font-bold mt-1 uppercase">Flow</span>
            </button>
            <button 
               onClick={() => setSoundType(soundType === 'white' ? 'none' : 'white')}
               className={`flex flex-col items-center justify-center py-3 rounded-xl border transition-all ${soundType === 'white' ? 'bg-slate-700/50 border-white/50 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'bg-white/5 border-transparent text-slate-500 hover:text-slate-300'}`}
            >
               <Zap size={18} />
               <span className="text-[9px] font-bold mt-1 uppercase">Mask</span>
            </button>
            <button 
               onClick={() => setSoundType('none')}
               className={`flex flex-col items-center justify-center py-3 rounded-xl border transition-all ${soundType === 'none' ? 'bg-slate-800 border-slate-600 text-slate-300' : 'bg-white/5 border-transparent text-slate-500 hover:text-slate-300'}`}
            >
               <VolumeX size={18} />
               <span className="text-[9px] font-bold mt-1 uppercase">Off</span>
            </button>
         </div>
      </div>
    </div>
  );
};
