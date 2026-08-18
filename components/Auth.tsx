import React, { useState } from 'react';
import { Mail, Lock, ShieldCheck, ArrowRight, Loader2, Sparkles, AlertCircle } from 'lucide-react';

interface AuthProps {
  onLogin: (email: string, pass: string, isSignup: boolean) => Promise<void>;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
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
    <div className="min-h-screen bg-bgDark flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
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
        
        {/* Branding Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 shadow-xl mb-4 sm:mb-6 animate-pulse-soft">
            <Sparkles className="text-white" size={28} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-1 italic">Flow OS</h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">Verify your credentials to open your secure Vault</p>
        </div>

        {/* Credentials Form Card */}
        <div className="bg-cardBg/40 backdrop-blur-xl border border-cardBorder rounded-[2rem] p-5 sm:p-8 shadow-2xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Account Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="email" 
                  required 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="name@email.com" 
                  className="w-full bg-bgDark/50 border border-cardBorder rounded-xl pl-12 pr-4 py-3.5 text-sm text-white focus:border-primary focus:outline-none transition-all placeholder:text-slate-600 font-medium" 
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Vault Key (Password)</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="password" 
                  required 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="Enter vault password" 
                  className="w-full bg-bgDark/50 border border-cardBorder rounded-xl pl-12 pr-4 py-3.5 text-sm text-white focus:border-primary focus:outline-none transition-all placeholder:text-slate-600 font-medium" 
                />
              </div>
            </div>

            {/* Error alerts */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs font-bold flex items-center gap-3 animate-fade-in">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Submit Button */}
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-primary hover:bg-primary-hover text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 text-sm tracking-wide"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="animate-spin" size={18} />
                  <span>Scanning Vault...</span>
                </div>
              ) : (
                <>
                  <span>{isSignup ? 'Initialize Vault' : 'Unlock System'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Toggle login mode */}
          <div className="pt-5 border-t border-white/5 text-center">
            <button 
              onClick={() => { setIsSignup(!isSignup); setError(''); }} 
              className="text-slate-400 text-xs sm:text-sm hover:text-white transition-colors font-semibold"
            >
              {isSignup ? 'Already have an account? Unlock Existing' : "New user? Create your Vault Shard"}
            </button>
          </div>
        </div>

        {/* Security Disclosures */}
        <div className="mt-6 space-y-3 w-full">
          <div className="flex items-center justify-center gap-2 text-slate-600">
             <ShieldCheck size={16} /> 
             <span className="text-[9px] font-bold uppercase tracking-widest">Local-First Vault Verification</span>
          </div>
          
          <details className="group w-full max-w-sm mx-auto bg-bgDarker/30 border border-white/5 rounded-2xl p-3 select-none cursor-pointer hover:border-emerald-500/20 transition-all">
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
      </div>
    </div>
  );
};
