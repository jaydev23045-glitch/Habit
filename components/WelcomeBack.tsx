
import React from 'react';
import { Sunrise, ArrowRight, X } from 'lucide-react';

interface WelcomeBackProps {
  isOpen: boolean;
  onClose: () => void;
  daysAbsent: number;
}

export const WelcomeBack: React.FC<WelcomeBackProps> = ({ isOpen, onClose, daysAbsent }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-bgDarker/95 backdrop-blur-md animate-fade-in p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-500/30">
           <Sunrise size={40} className="text-white" />
        </div>
        
        <h2 className="text-3xl font-bold text-white mb-4">Welcome back.</h2>
        <p className="text-slate-400 text-lg mb-8 leading-relaxed">
           You've been away for {daysAbsent} days. <br/>
           <span className="text-slate-200">That is completely okay.</span>
           <br/><br/>
           Life happens. The system has paused your backlog so you don't feel overwhelmed. 
           You don't need to "catch up." Just start fresh.
        </p>

        <button 
           onClick={onClose}
           className="w-full py-4 bg-white text-bgDarker font-bold text-lg rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
        >
           Start Fresh Today <ArrowRight size={20} />
        </button>
        
        <div className="mt-6 text-xs text-slate-600 uppercase tracking-widest font-bold">
           No Guilt Protocol Active
        </div>
      </div>
    </div>
  );
};
