
import React, { useState } from 'react';
import { Trophy, Clock, Calendar, Mail, Share2, Star, Check, Loader2 } from 'lucide-react';
import { LearningTopic } from '../types';

interface MasteryModalProps {
  topic: LearningTopic | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MasteryModal: React.FC<MasteryModalProps> = ({ topic, isOpen, onClose }) => {
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  if (!isOpen || !topic) return null;

  const handleEmailReport = () => {
    setEmailStatus('sending');
    // Simulate network delay for realism
    setTimeout(() => {
      setEmailStatus('sent');
      // In a real app, this would call an API
      console.log(`[Flow OS] Mastery Report for "${topic.title}" queued for monthly summary.`);
    }, 1500);
  };

  const avgTime = topic.sessions.length > 0 
    ? Math.round(topic.totalMinutes / topic.sessions.length) 
    : 0;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-bgDarker/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-cardBg border-2 border-yellow-500/30 rounded-2xl p-0 w-full max-w-lg shadow-2xl relative overflow-hidden">
        
        {/* Confetti / Header Background */}
        <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 p-8 text-center border-b border-yellow-500/20 relative">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-30">
             {/* Decorative circles */}
             <div className="absolute top-[-20%] left-[-10%] w-32 h-32 rounded-full bg-yellow-400 blur-3xl"></div>
             <div className="absolute bottom-[-20%] right-[-10%] w-40 h-40 rounded-full bg-orange-400 blur-3xl"></div>
          </div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white shadow-lg mb-4 animate-bounce">
              <Trophy size={32} fill="currentColor" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">Topic Mastered!</h2>
            <p className="text-yellow-200/80 text-sm font-medium">You have fully retained this concept.</p>
          </div>
        </div>

        <div className="p-8 space-y-6">
           <div className="text-center">
              <h3 className="text-xl font-bold text-white">{topic.title}</h3>
              <p className="text-slate-400 text-sm mt-1">{topic.category}</p>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="bg-bgDark/50 border border-cardBorder p-4 rounded-xl flex flex-col items-center">
                 <Clock className="text-primary mb-2" size={20} />
                 <div className="text-2xl font-bold text-white">{topic.totalMinutes}m</div>
                 <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Total Study Time</div>
              </div>
              <div className="bg-bgDark/50 border border-cardBorder p-4 rounded-xl flex flex-col items-center">
                 <Calendar className="text-teal-400 mb-2" size={20} />
                 <div className="text-2xl font-bold text-white">{topic.sessions.length}</div>
                 <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Total Sessions</div>
              </div>
           </div>

           <div className="bg-white/5 rounded-xl p-4 flex justify-between items-center text-sm">
              <span className="text-slate-400">Avg. Session Duration</span>
              <span className="font-bold text-slate-200">{avgTime} mins</span>
           </div>

           <div className="flex gap-3 pt-2">
              <button 
                onClick={handleEmailReport}
                disabled={emailStatus !== 'idle'}
                className={`flex-1 border rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all py-3
                  ${emailStatus === 'sent' 
                    ? 'bg-green-500/20 border-green-500/50 text-green-400' 
                    : 'bg-cardBg border-cardBorder hover:bg-white/5 text-slate-200'}
                `}
              >
                {emailStatus === 'idle' && <><Mail size={16} /> Email Report</>}
                {emailStatus === 'sending' && <><Loader2 size={16} className="animate-spin" /> Sending...</>}
                {emailStatus === 'sent' && <><Check size={16} /> Sent ✓</>}
              </button>
              
              <button 
                onClick={onClose}
                className="flex-1 bg-primary hover:bg-primary-hover text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all"
              >
                <Star size={16} fill="currentColor" /> Awesome!
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};
