
import React, { useState } from 'react';
import { Mail, Lock, User, ShieldCheck, ArrowRight, Loader2, Sparkles, HelpCircle, AlertCircle } from 'lucide-react';

interface AuthProps {
  onLogin: (email: string, pass: string, isSignup: boolean) => Promise<void>;
  onDevBypass?: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin, onDevBypass }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onLogin(email, password, isSignup);
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bgDark flex items-center justify-center p-6 font-sans">
      <div className={`w-full max-w-md transition-all duration-300 ${shake ? 'animate-[shake_0.5s_ease-in-out]' : 'animate-fade-in'}`}>
        <style>
          {`
            @keyframes shake {
              0%, 100% { transform: translateX(0); }
              25% { transform: translateX(-10px); }
              75% { transform: translateX(10px); }
            }
          `}
        </style>
        
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 shadow-xl mb-6"><Sparkles className="text-white" size={32} /></div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">Flow OS</h1>
          <p className="text-slate-400">Step 1: Authenticate with your Private Vault</p>
        </div>

        <div className="bg-cardBg/50 backdrop-blur-xl border border-cardBorder rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Account Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="email" 
                  required 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="name@email.com" 
                  className="w-full bg-bgDark/50 border border-cardBorder rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-primary focus:outline-none transition-all" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Vault Key (Password)</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="password" 
                  required 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="Your secret key" 
                  className="w-full bg-bgDark/50 border border-cardBorder rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-primary focus:outline-none transition-all" 
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs font-bold flex items-center gap-3">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary-hover text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50">
              {loading ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="animate-spin" size={20} />
                  <span>Scanning Vault...</span>
                </div>
              ) : (
                <>
                  <span>{isSignup ? 'Initialize Vault' : 'Unlock System'}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <button onClick={() => { setIsSignup(!isSignup); setError(''); }} className="text-slate-400 text-sm hover:text-white transition-colors font-medium">
              {isSignup ? 'Already have an account? Unlock Existing' : "New user? Create your Vault Shard"}
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-center gap-2 text-slate-600">
             <ShieldCheck size={16} /> <span className="text-[10px] font-bold uppercase tracking-widest">Local-First Vault Verification</span>
          </div>
          
          <details className="group max-w-sm mx-auto bg-bgDarker/30 border border-white/5 rounded-2xl p-3 select-none cursor-pointer hover:border-emerald-500/20 transition-all">
             <summary className="text-[9px] font-black text-slate-500 group-hover:text-slate-400 uppercase tracking-widest flex items-center justify-between outline-none list-none">
               <span>🔒 Secure Cloud Vault Architecture</span>
               <span className="text-slate-600 transition-transform group-open:rotate-180">▼</span>
             </summary>
             <div className="mt-2 text-[8px] text-slate-500 leading-relaxed font-semibold space-y-1.5 pt-1.5 border-t border-white/5 text-left">
                <p>• <strong>Row-Level Security (RLS)</strong>: The database restricts table data access strictly to authenticated account credentials.</p>
                <p>• <strong>Secure SSL Tunnels</strong>: All connection protocols are fully encrypted using standard HTTPS/WSS channels.</p>
                <p>• <strong>bcrypt Passwords</strong>: Credentials are fully hashed before persistence, preventing breach disclosures.</p>
             </div>
          </details>
        </div>

        {/* DEV BYPASS — remove before production */}
        {onDevBypass && (
          <div className="mt-6 text-center">
            <button
              onClick={onDevBypass}
              className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-amber-400/60 hover:text-amber-400 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300"
            >
              <span className="text-amber-500/50 group-hover:text-amber-400 transition-colors">⚡</span>
              Dev Bypass — Skip Auth
              <span className="absolute -top-2 -right-2 bg-amber-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">DEV</span>
            </button>
            <p className="text-[9px] text-slate-700 mt-2 font-medium">Loads test data · No Supabase · Local only</p>
          </div>
        )}
      </div>
    </div>
  );
};
