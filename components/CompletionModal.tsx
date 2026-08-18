import React, { useState } from 'react';
import { Clock, Zap, CheckCircle2 } from 'lucide-react';

interface CompletionModalProps {
  taskTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (minutes: number, intensity: 'low' | 'medium' | 'high') => void;
}

export const CompletionModal: React.FC<CompletionModalProps> = ({ taskTitle, isOpen, onClose, onConfirm }) => {
  const [minutes, setMinutes] = useState(30);
  const [intensity, setIntensity] = useState<'low' | 'medium' | 'high'>('medium');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bgDarker/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-cardBg border border-cardBorder rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Task Complete!</h2>
            <p className="text-sm text-slate-400 line-clamp-1">{taskTitle}</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Time Input */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-3 flex items-center gap-2">
              <Clock size={14} /> Time Spent (Minutes)
            </label>
            <div className="flex gap-4 items-center">
              <input 
                type="range" 
                min="5" 
                max="180" 
                step="5"
                value={minutes}
                onChange={(e) => setMinutes(parseInt(e.target.value))}
                className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <input
                type="number"
                value={minutes}
                onChange={(e) => setMinutes(parseInt(e.target.value))}
                className="w-20 bg-bgDark border border-cardBorder rounded-lg p-2 text-center font-bold focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-2">
              <span>5m</span>
              <span>3h</span>
            </div>
          </div>

          {/* Intensity Input */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-3 flex items-center gap-2">
              <Zap size={14} /> Intensity / Effort
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['low', 'medium', 'high'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setIntensity(lvl)}
                  className={`py-2 rounded-lg text-sm font-bold border transition-all capitalize ${
                    intensity === lvl 
                      ? 'bg-primary/20 border-primary text-primary' 
                      : 'bg-bgDark border-cardBorder text-slate-400 hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-cardBorder">
            <button 
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-cardBorder text-slate-400 font-bold hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => onConfirm(minutes, intensity)}
              className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold shadow-lg shadow-primary/20 transition-all"
            >
              Save & Log
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
