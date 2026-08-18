
import React, { useEffect } from 'react';
import { Trophy, Crown, Sparkles, ArrowRight } from 'lucide-react';
import { audioService } from '../services/audioService';

interface LevelUpModalProps {
  level: number;
  isOpen: boolean;
  onClose: () => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ level, isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      audioService.playSuccess();
      // Trigger a heavier vibration if available
      if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-bgDarker/95 backdrop-blur-xl animate-fade-in p-6">
      <div className="relative w-full max-w-md text-center">
        
        {/* Background Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500/20 rounded-full blur-[80px] animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-primary/30 rounded-full blur-[60px]"></div>

        <div className="relative z-10 flex flex-col items-center">
           <div className="mb-8 relative">
              <div className="absolute inset-0 bg-yellow-400 blur-2xl opacity-40 animate-pulse"></div>
              <Crown size={80} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" strokeWidth={1.5} />
              <Sparkles size={32} className="text-white absolute -top-4 -right-4 animate-bounce" />
              <Sparkles size={24} className="text-white absolute bottom-0 -left-6 animate-pulse" />
           </div>

           <h2 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 tracking-tighter mb-2 italic drop-shadow-2xl">
             LEVEL {level}
           </h2>
           
           <div className="text-xs font-black text-yellow-500/80 uppercase tracking-[0.5em] mb-8 border-y border-yellow-500/20 py-2 w-full max-w-[200px]">
             Promotion Granted
           </div>

           <p className="text-slate-300 text-lg font-medium mb-10 leading-relaxed max-w-xs">
             Your cognitive output has exceeded previous parameters. System privileges expanded.
           </p>

           <button 
             onClick={onClose}
             className="group relative px-10 py-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:shadow-[0_0_50px_rgba(245,158,11,0.6)] transition-all active:scale-95 overflow-hidden"
           >
             <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
             <span className="relative flex items-center gap-3">
               Acknowledge <ArrowRight size={16} />
             </span>
           </button>
        </div>
      </div>
    </div>
  );
};
