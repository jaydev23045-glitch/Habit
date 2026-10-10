import React, { useState } from 'react';
import { Lock, Loader2, Key } from 'lucide-react';
import { cryptoService } from '../services/cryptoService';

interface VaultUnlockProps {
  encryptedKey: string;
  onUnlock: (decryptedKey: string) => void;
  onCancel: () => void;
}

export const VaultUnlock: React.FC<VaultUnlockProps> = ({ encryptedKey, onUnlock, onCancel }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    
    setIsUnlocking(true);
    setError('');
    
    try {
      const decrypted = await cryptoService.decrypt(encryptedKey, password);
      if (decrypted && decrypted.startsWith('AIza')) { // Google API keys start with AIza
        onUnlock(decrypted);
      } else {
        throw new Error("Invalid key format decoded.");
      }
    } catch (err) {
      console.error(err);
      setError('Incorrect Vault Password. Please try again.');
      setIsUnlocking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-bgDark border border-cardBorder p-8 rounded-[2rem] shadow-2xl max-w-sm w-full space-y-6">
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.3)]">
            <Lock size={32} />
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-widest text-center">Encrypted Vault</h2>
          <p className="text-xs text-slate-400 text-center leading-relaxed">
            Your Gemini AI key is secured with AES-256 encryption. Enter your Vault Password to unlock it into active memory.
          </p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <Key size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Vault Password..."
                className="w-full bg-black/50 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white focus:border-primary outline-none transition-all font-semibold placeholder:text-slate-600"
                autoFocus
              />
            </div>
            {error && <p className="text-red-400 text-[10px] font-bold px-2">{error}</p>}
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button 
              type="submit"
              disabled={isUnlocking || !password}
              className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {isUnlocking ? <Loader2 size={16} className="animate-spin" /> : 'Unlock Vault'}
            </button>
            <button 
              type="button"
              onClick={onCancel}
              className="w-full py-3 bg-transparent text-slate-500 hover:text-slate-300 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all"
            >
              Skip AI for now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
