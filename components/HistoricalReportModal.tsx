
import React, { useState } from 'react';
import { HistoricalReport } from '../types';
import { Mail, CheckCircle2, Clock, Brain, X, Calendar, TrendingUp, Sparkles, Award, Loader2, Send } from 'lucide-react';

interface HistoricalReportModalProps {
  report: HistoricalReport | null;
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  onSendEmail?: (report: HistoricalReport) => Promise<boolean>;
}

export const HistoricalReportModal: React.FC<HistoricalReportModalProps> = ({ report, isOpen, onClose, userName, onSendEmail }) => {
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!isOpen || !report) return null;

  const handleEmailTrigger = async () => {
    if (!onSendEmail || sent) return;
    setIsSending(true);
    const success = await onSendEmail(report);
    if (success) setSent(true);
    setIsSending(false);
  };

  const dateLabel = new Date(report.generatedAt).toLocaleDateString(undefined, { 
    month: 'long', 
    year: 'numeric' 
  });

  const getRangeTitle = () => {
    if (report.range === 'year') return "Yearly Executive Summary";
    if (report.range === '6month') return "Semi-Annual Performance Review";
    return "Monthly Progress Snapshot";
  };

  const getBannerColor = () => {
    if (report.range === 'year') return "bg-gradient-to-r from-amber-500 to-yellow-600";
    if (report.range === '6month') return "bg-gradient-to-r from-blue-600 to-indigo-700";
    return "bg-gradient-to-r from-primary to-purple-700";
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white text-slate-800 rounded-2xl w-full max-w-2xl shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden relative border border-slate-200">
        
        {/* Email Header Simulation */}
        <div className="bg-slate-50 border-b border-slate-200 p-6 flex justify-between items-start">
           <div className="flex gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg ${getBannerColor()}`}>
                 {report.range === 'year' ? 'Y' : report.range === '6month' ? 'H' : 'M'}
              </div>
              <div>
                 <div className="font-black text-xl text-slate-900 tracking-tight">{getRangeTitle()}</div>
                 <div className="text-slate-500 text-sm font-medium">From: <span className="text-slate-800 font-bold">Flow OS Neural Relay</span> &lt;relay@flowos.io&gt;</div>
                 <div className="text-slate-400 text-[10px] mt-1 font-bold uppercase tracking-widest">{dateLabel} • Verified Archive</div>
              </div>
           </div>
           <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-200 rounded-full">
              <X size={24} />
           </button>
        </div>

        {/* Content Body */}
        <div className="p-8 md:p-12 overflow-y-auto max-h-[70vh] scroll-smooth">
           <h2 className="text-3xl font-black mb-6 text-slate-900 tracking-tight leading-none">
             Protocol Complete, {userName}.
           </h2>
           
           <p className="text-slate-600 mb-10 leading-relaxed text-lg font-medium">
             This automated transmission summarizes your cognitive output for the <span className="text-slate-900 font-bold">{report.periodLabel}</span> period. 
             No external judgment is applied; this is raw trajectory data for your internal calibration.
           </p>

           {/* Metrics Grid */}
           <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 mb-10 grid grid-cols-1 sm:grid-cols-3 gap-8 shadow-inner">
              <div className="text-center group">
                 <div className="flex justify-center text-emerald-500 mb-3 group-hover:scale-110 transition-transform"><CheckCircle2 size={32}/></div>
                 <div className="text-4xl font-black text-slate-900 tracking-tighter">{report.tasksCompleted}</div>
                 <div className="text-[10px] uppercase text-slate-500 font-black tracking-widest mt-1">Milestones</div>
              </div>
              <div className="text-center sm:border-l sm:border-slate-200 group">
                 <div className="flex justify-center text-indigo-600 mb-3 group-hover:scale-110 transition-transform"><Clock size={32}/></div>
                 <div className="text-4xl font-black text-slate-900 tracking-tighter">{Math.round(report.minutesFocused / 60)}h</div>
                 <div className="text-[10px] uppercase text-slate-500 font-black tracking-widest mt-1">Neural Flow</div>
              </div>
              <div className="text-center sm:border-l sm:border-slate-200 group">
                 <div className="flex justify-center text-amber-500 mb-3 group-hover:scale-110 transition-transform">
                   {report.range === 'year' ? <Award size={32} /> : <TrendingUp size={32} />}
                 </div>
                 <div className="text-4xl font-black text-slate-900 tracking-tighter">
                   {report.range === 'year' ? 'S+' : 'LVL ' + Math.min(99, Math.floor(report.tasksCompleted / 20))}
                 </div>
                 <div className="text-[10px] uppercase text-slate-500 font-black tracking-widest mt-1">Performance</div>
              </div>
           </div>

           {/* Insight Section */}
           <div className="space-y-8">
              <div className="bg-slate-900 text-white rounded-[2rem] p-8 relative overflow-hidden shadow-2xl">
                 <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Sparkles size={100} />
                 </div>
                 <h3 className="font-black text-xs uppercase tracking-[0.3em] text-primary-hover mb-4 flex items-center gap-2">
                    <Brain size={16}/> AI Analytical Insight
                 </h3>
                 <p className="text-slate-300 italic text-xl leading-relaxed relative z-10">
                    "{report.insight}"
                 </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="border-2 border-slate-100 rounded-2xl p-6">
                    <h4 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2"><Calendar size={14}/> Continuity</h4>
                    <p className="text-sm text-slate-600 font-medium">Your data density shows remarkable persistence during this {report.range} phase.</p>
                 </div>
                 <div className="border-2 border-slate-100 rounded-2xl p-6">
                    <h4 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2"><TrendingUp size={14}/> Recommendation</h4>
                    <p className="text-sm text-slate-600 font-medium">Focus on high-intensity blocks to maximize the quality of the next cycle.</p>
                 </div>
              </div>
           </div>

           {/* Footer */}
           <div className="text-center mt-16 pt-10 border-t border-slate-100 text-slate-400">
              <div className="font-black text-[10px] uppercase tracking-[0.5em] mb-2">Flow OS System Log</div>
              <p className="text-xs font-medium">This report is stored permanently in your Private Cloud Vault.</p>
           </div>
        </div>

        {/* Action Button */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row gap-4 justify-center">
           <button 
             onClick={handleEmailTrigger}
             disabled={isSending || sent}
             className={`px-10 py-4 rounded-xl font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2 border shadow-xl active:scale-95
               ${sent ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-primary hover:text-primary'}
             `}
           >
             {isSending ? <Loader2 className="animate-spin" size={14} /> : sent ? <CheckCircle2 size={14} /> : <Send size={14} />}
             {sent ? 'Sent to Gmail' : 'Send to Gmail'}
           </button>
           <button 
             onClick={onClose}
             className="px-10 py-4 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-[0.3em] hover:bg-slate-800 transition-all shadow-xl active:scale-95"
           >
             Acknowledge & Archive
           </button>
        </div>

      </div>
    </div>
  );
};
