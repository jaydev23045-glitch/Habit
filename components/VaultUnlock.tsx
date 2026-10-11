import React, { useState, useEffect } from 'react';
import { Lock, Loader2, Key, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { cryptoService } from '../services/cryptoService';

interface VaultUnlockProps {
  encryptedKey: string;
  onUnlock: (decryptedKey: string) => void;
  onCancel: () => void;
}

export const VaultUnlock: React.FC<VaultUnlockProps> = ({ encryptedKey, onUnlock, onCancel }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [error, setError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPass = password.trim();
    if (!cleanPass) return;
    
    setIsUnlocking(true);
    setError('');
    
    try {
      const decrypted = (await cryptoService.decrypt(encryptedKey, cleanPass)).trim();
      // Accepts any valid API key (not just AIza prefix)
      if (decrypted && decrypted.length >= 6) {
        if (rememberDevice) {
          localStorage.setItem('flow-os-unlocked-key', decrypted);
        }
        onUnlock(decrypted);
      } else {
        throw new Error("Decryption returned invalid or empty key.");
      }
    } catch (err: any) {
      console.error("Vault decryption error:", err);
      setError('Incorrect Vault Password. Please check for typos and try again.');
      setIsUnlocking(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 animate-fade-in overflow-y-auto">
      <div className="bg-[#0e121b] border border-white/[0.12] p-6 sm:p-8 rounded-[2rem] shadow-[0_30px_90px_rgba(0,0,0,0.85)] max-w-sm w-full space-y-6 relative overflow-hidden my-auto">
        {/* Ambient Top Glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-24 bg-primary/25 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col items-center justify-center space-y-3 relative z-10">
          <div className="w-14 h-14 bg-gradient-to-b from-primary/30 to-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.4)] border border-primary/30">
            <Lock size={26} className="text-white drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-black text-white uppercase tracking-widest">Secure Enclave</h2>
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[9px] font-mono uppercase text-emerald-400 font-bold tracking-widest">AES-256 Hardware Cipher</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 text-center leading-relaxed font-medium">
            Enter your Vault Password to unlock AI capabilities on this device.
          </p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4 relative z-10">
          <div className="space-y-2">
            <div className="relative group">
              <Key size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
              <input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Vault Password..."
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="w-full bg-[#0b0e14] border border-white/[0.1] focus:border-primary/80 rounded-2xl pl-11 pr-11 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold placeholder:text-slate-500 shadow-inner"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 transition-colors p-1"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {error && (
              <p className="text-rose-400 text-[10px] font-bold px-2 flex items-center gap-1.5 animate-pulse">
                <span>⚠</span> {error}
              </p>
            )}
          </div>

          {/* Remember on this device checkbox */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input 
                type="checkbox"
                checked={rememberDevice}
                onChange={e => setRememberDevice(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded bg-black/60 border-white/20 text-primary focus:ring-0 cursor-pointer accent-primary"
              />
              <div>
                <span className="text-[11px] font-bold text-slate-200 block">
                  Remember on this device
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5 leading-tight">
                  Keep unlocked so you never have to re-enter this password on your phone.
                </span>
              </div>
            </label>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <button 
              type="submit"
              disabled={isUnlocking || !password.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 shadow-[0_0_25px_rgba(139,92,246,0.35)]"
            >
              {isUnlocking ? <Loader2 size={16} className="animate-spin" /> : 'Authorize & Unlock ↵'}
            </button>
            <button 
              type="button"
              onClick={onCancel}
              className="w-full py-2.5 bg-transparent text-slate-500 hover:text-slate-300 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Cancel (Esc)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
