import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, AppData, CloudConfig } from '../types';
import { Save, User, LogOut, Download, Upload, Globe, Loader2, RefreshCw, Volume2, VolumeX, ShieldAlert, Shield } from 'lucide-react';
import { voiceService } from '../services/voiceService';
import { audioService } from '../services/audioService';

interface SettingsProps {
  user: UserProfile;
  updateUser: (u: Partial<UserProfile>) => void;
  resetData: () => void;
  data?: AppData;
  onImport?: (data: AppData) => void;
}

import { cryptoService } from '../services/cryptoService';

export const Settings: React.FC<SettingsProps> = ({ user, updateUser, resetData, data, onImport }) => {
  const [name, setName] = useState(user.name);
  const [rawGeminiKey, setRawGeminiKey] = useState('');
  const [vaultPassword, setVaultPassword] = useState('');
  const [storageMode, setStorageMode] = useState<'direct' | 'vault'>(() => {
    if (user.encryptedGeminiKey && !user.rawGeminiKey) return 'vault';
    return 'direct';
  });
  const [showKey, setShowKey] = useState(false);
  const [showVaultPass, setShowVaultPass] = useState(false);
  const [autoBoot, setAutoBoot] = useState<boolean>(() => user.autoBootEnabled ?? true);
  const [isEncrypting, setIsEncrypting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(user.name);
  }, [user]);

  const handleVoiceToggle = async () => {
    const nextState = !user.voiceEnabled;
    updateUser({ voiceEnabled: nextState });
    audioService.playAction();
    if (nextState) {
      await voiceService.speak("Audio interface active.", "Zephyr");
    } else {
      voiceService.stop();
    }
  };

  const handleSave = async () => {
    const cleanKey = rawGeminiKey.trim();
    const cleanPass = vaultPassword.trim();

    setIsEncrypting(true);

    try {
      if (storageMode === 'direct') {
        // Direct local storage (Ideal for personal phones, never prompts for password)
        if (cleanKey) {
          updateUser({ 
            name, 
            rawGeminiKey: cleanKey, 
            encryptedGeminiKey: undefined, 
            autoBootEnabled: autoBoot 
          });
          localStorage.setItem('flow-os-unlocked-key', cleanKey);
        } else {
          updateUser({ name, autoBootEnabled: autoBoot });
        }
      } else {
        // Encrypted Vault Mode (Password protected)
        if (cleanKey && !cleanPass) {
          alert("You must provide a Vault Password to encrypt your Gemini API Key in Vault mode.");
          setIsEncrypting(false);
          return;
        }

        let payload = user.encryptedGeminiKey;
        if (cleanKey && cleanPass) {
          payload = await cryptoService.encrypt(cleanKey, cleanPass);
          localStorage.removeItem('flow-os-unlocked-key');
        }

        updateUser({ 
          name, 
          encryptedGeminiKey: payload, 
          rawGeminiKey: undefined, 
          autoBootEnabled: autoBoot 
        });
      }

      // Update autoBoot in localStorage
      if (autoBoot) {
        localStorage.setItem('flow-os-booted', 'true');
      }

      setRawGeminiKey('');
      setVaultPassword('');
      setIsEncrypting(false);
      audioService.playSuccess();
      alert("Settings saved successfully!");
    } catch (e) {
      console.error(e);
      setIsEncrypting(false);
      alert("Failed to save settings. Please try again.");
    }
  };

  const handleRemoveKey = () => {
    if (window.confirm("Remove your stored Gemini API Key from this device?")) {
      updateUser({ rawGeminiKey: undefined, encryptedGeminiKey: undefined });
      localStorage.removeItem('flow-os-unlocked-key');
      audioService.playAction();
      alert("API Key removed from this device.");
    }
  };

  const handleExport = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `flow-os-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    audioService.playSuccess();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        if (onImport) onImport(importedData);
        audioService.playSuccess();
      } catch (err) {
        alert("Invalid database snapshot.");
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (window.confirm("Are you sure you want to flush all local data cache? This resets your profile and task statistics.")) {
      resetData();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-24 pt-4">
      {/* Page Title */}
      <div className="text-center space-y-2">
         <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.3em]">
            System Setup
         </div>
         <h2 className="text-4xl font-black text-white tracking-tighter italic">Settings</h2>
         <p className="text-slate-400 max-w-md mx-auto leading-relaxed text-sm font-medium">
            Configure your local database, sync preferences, and identity parameters.
         </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Profile & Voice card */}
        <div className="bg-[#10141e]/90 backdrop-blur-2xl border border-white/[0.08] rounded-[2rem] p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-6">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 border-b border-white/[0.06] pb-3 flex items-center gap-2">
            <User size={14} className="text-primary" /> Profile & Voice
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Explorer Identity</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="w-full bg-black/50 border border-white/[0.08] focus:border-primary/80 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold" 
              />
            </div>

            <div className="flex items-center justify-between bg-black/40 border border-white/[0.06] p-4 rounded-2xl">
              <div>
                <div className="text-sm font-bold text-slate-200">Voice Synthesis</div>
                <div className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">Narrate boot sequences</div>
              </div>
              <button 
                onClick={handleVoiceToggle}
                className={`w-14 h-8 rounded-full relative transition-all duration-300 ${user.voiceEnabled ? 'bg-primary' : 'bg-slate-800'}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-md ${user.voiceEnabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            {/* Mobile Auto-Launch Option */}
            <div className="flex items-center justify-between bg-black/40 border border-white/[0.06] p-4 rounded-2xl">
              <div>
                <div className="text-sm font-bold text-slate-200">Auto-Launch on Startup</div>
                <div className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">Skip boot screen on mobile</div>
              </div>
              <button 
                onClick={() => setAutoBoot(!autoBoot)}
                className={`w-14 h-8 rounded-full relative transition-all duration-300 ${autoBoot ? 'bg-primary' : 'bg-slate-800'}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-md ${autoBoot ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div className="space-y-4 mt-6 pt-5 border-t border-white/[0.08]">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">Gemini AI Key</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Required for voice assistant & briefing</p>
                </div>
                {(user.rawGeminiKey || user.encryptedGeminiKey) && (
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      ● Active
                    </span>
                    <button
                      onClick={handleRemoveKey}
                      className="text-[9px] font-bold uppercase text-rose-400 hover:text-rose-300 hover:underline px-1"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {/* Storage Mode Selector */}
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Choose Storage Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStorageMode('direct')}
                    className={`p-3 rounded-xl border text-left transition-all ${storageMode === 'direct' ? 'bg-primary/20 border-primary text-white shadow-md shadow-primary/20' : 'bg-black/40 border-white/[0.06] text-slate-400 hover:border-white/20'}`}
                  >
                    <div className="text-[10px] font-bold text-white uppercase tracking-wider">⚡ Direct Phone Storage</div>
                    <div className="text-[8px] text-slate-400 mt-1 leading-relaxed">
                      Recommended for mobile. <strong className="text-primary font-bold">Never asks for password!</strong> 1-tap instant AI.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStorageMode('vault')}
                    className={`p-3 rounded-xl border text-left transition-all ${storageMode === 'vault' ? 'bg-primary/20 border-primary text-white shadow-md shadow-primary/20' : 'bg-black/40 border-white/[0.06] text-slate-400 hover:border-white/20'}`}
                  >
                    <div className="text-[10px] font-bold text-white uppercase tracking-wider">🔐 Encrypted Vault</div>
                    <div className="text-[8px] text-slate-400 mt-1 leading-relaxed">
                      AES-256 password encrypted. Prompts for password to unlock.
                    </div>
                  </button>
                </div>
              </div>

              {/* API Key Input */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                  {user.rawGeminiKey || user.encryptedGeminiKey ? 'Update API Key' : 'Paste Gemini API Key'}
                </label>
                <div className="relative">
                  <input 
                    type={showKey ? "text" : "password"} 
                    value={rawGeminiKey} 
                    onChange={e => setRawGeminiKey(e.target.value)} 
                    placeholder={user.rawGeminiKey || user.encryptedGeminiKey ? "Enter new key to overwrite..." : "Paste Gemini API Key..."}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    className="w-full bg-black/60 border border-white/[0.1] focus:border-primary/80 rounded-2xl pl-4 pr-11 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 p-1"
                  >
                    {showKey ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  </button>
                </div>
              </div>

              {/* Vault Password if in Vault mode */}
              {storageMode === 'vault' && rawGeminiKey && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="text-[9px] font-black uppercase text-primary tracking-wider">Create Vault Password</label>
                  <div className="relative">
                    <input 
                      type={showVaultPass ? "text" : "password"} 
                      value={vaultPassword} 
                      onChange={e => setVaultPassword(e.target.value)} 
                      placeholder="Type a password to encrypt this key..."
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      className="w-full bg-primary/5 border border-primary/40 rounded-2xl pl-4 pr-11 py-3 text-sm text-primary focus:border-primary outline-none transition-all font-semibold" 
                    />
                  </div>
                  <p className="text-[9px] text-slate-500 leading-relaxed">
                    Uses AES-256 to scramble your key before saving it to local storage.
                  </p>
                </div>
              )}
              
              <div className="pt-2">
                <button
                  onClick={handleSave}
                  disabled={isEncrypting}
                  className="w-full py-3.5 bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isEncrypting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  <span>Save Configuration</span>
                </button>
              </div>

              <div className="bg-black/30 border border-white/[0.04] rounded-2xl p-3.5 text-left">
                <div className="text-[9px] text-slate-500 leading-relaxed font-semibold">
                  Zero-Knowledge Guarantee: Your API key is stored 100% locally on this device. It is never transmitted to any third-party server.
                </div>
              </div>

            </div>
          </div>
        </div>


        {/* Data Portability (JSON Snapshots) */}
        <div className="bg-cardBg border border-cardBorder rounded-[2rem] p-6 sm:p-8 shadow-xl space-y-6">
          <h3 className="text-xs font-black uppercase tracking-[0.35em] text-teal-400 border-b border-white/5 pb-3 flex items-center gap-2">
            <Download size={14} /> Local Snapshots
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleExport}
              className="flex flex-col items-center justify-center p-4 bg-bgDark/50 border border-white/5 hover:border-teal-500/40 rounded-2xl transition-all text-center gap-3 group"
            >
              <div className="p-2.5 bg-teal-500/10 text-teal-400 rounded-xl group-hover:scale-115 transition-transform">
                <Download size={18} />
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">Export Backup</div>
            </button>

            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-4 bg-bgDark/50 border border-white/5 hover:border-teal-500/40 rounded-2xl transition-all text-center gap-3 group"
            >
              <div className="p-2.5 bg-teal-500/10 text-teal-400 rounded-xl group-hover:scale-115 transition-transform">
                <Upload size={18} />
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">Import Backup</div>
              <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
            </button>
          </div>
        </div>

        {/* System Operations */}
        <div className="bg-cardBg border border-cardBorder rounded-[2rem] p-6 sm:p-8 shadow-xl space-y-6">
          <h3 className="text-xs font-black uppercase tracking-[0.35em] text-red-500 border-b border-white/5 pb-3 flex items-center gap-2">
            <ShieldAlert size={14} /> System Operations
          </h3>

          <div className="grid grid-cols-1 gap-3">
            <button 
              onClick={handleResetData}
              className="py-4 border border-red-500/20 hover:border-red-500 bg-red-500/5 hover:bg-red-500/10 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 text-center flex items-center justify-center"
            >
              Flush Local Cache
            </button>
          </div>
        </div>
      </div>

      {/* Save Button block */}
      <div className="pt-6 flex justify-end">
        <button 
          disabled={isEncrypting}
          onClick={handleSave} 
          className="w-full sm:w-auto px-12 py-4 bg-primary hover:bg-primary-hover text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
        >
          {isEncrypting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isEncrypting ? 'Encrypting Vault...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};
