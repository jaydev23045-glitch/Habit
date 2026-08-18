import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, AppData, CloudConfig } from '../types';
import { Save, User, LogOut, Download, Upload, Globe, Loader2, RefreshCw, Volume2, VolumeX, ShieldAlert } from 'lucide-react';
import { voiceService } from '../services/voiceService';
import { audioService } from '../services/audioService';

interface SettingsProps {
  user: UserProfile;
  updateUser: (u: Partial<UserProfile>) => void;
  resetData: () => void;
  onLogout: () => void;
  data?: AppData;
  onImport?: (data: AppData) => void;
  onDeployChanges?: () => Promise<void | any>;
  onManualPull?: () => Promise<void | any>;
}

export const Settings: React.FC<SettingsProps> = ({ user, updateUser, resetData, onLogout, data, onImport, onDeployChanges, onManualPull }) => {
  const [name, setName] = useState(user.name);
  const [cloud, setCloud] = useState<CloudConfig>(user.cloudConfig || { provider: 'supabase', autoSync: true });
  const [isDeploying, setIsDeploying] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(user.name);
    setCloud(user.cloudConfig);
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
    updateUser({ name, cloudConfig: cloud });
    if (onDeployChanges) {
      setIsDeploying(true);
      try {
        await onDeployChanges();
        audioService.playSuccess();
      } catch (e) {
        console.error(e);
      } finally {
        setIsDeploying(false);
      }
    }
  };

  const handleManualPull = async () => {
    if (!onManualPull) return;
    setIsPulling(true);
    try {
      await onManualPull();
      audioService.playSuccess();
    } catch (e) {
      console.error(e);
    } finally {
      setIsPulling(false);
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
        <div className="bg-cardBg border border-cardBorder rounded-[2rem] p-6 sm:p-8 shadow-xl space-y-6">
          <h3 className="text-xs font-black uppercase tracking-[0.35em] text-slate-500 border-b border-white/5 pb-3 flex items-center gap-2">
            <User size={14} className="text-primary" /> Profile & Voice
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Explorer Identity</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="w-full bg-bgDark border border-cardBorder rounded-2xl px-4 py-3.5 text-sm text-white focus:border-primary outline-none transition-all font-semibold" 
              />
            </div>

            <div className="flex items-center justify-between bg-bgDark/40 border border-white/5 p-4 rounded-2xl">
              <div>
                <div className="text-sm font-bold text-slate-200">Voice Synthesis</div>
                <div className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">Narrate boot sequences</div>
              </div>
              <button 
                onClick={handleVoiceToggle}
                className={`w-14 h-8 rounded-full relative transition-all duration-300 ${user.voiceEnabled ? 'bg-primary' : 'bg-slate-800'}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 ${user.voiceEnabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Database & Cloud Synchronization */}
        <div className="bg-cardBg border border-cardBorder rounded-[2rem] p-6 sm:p-8 shadow-xl space-y-6">
          <h3 className="text-xs font-black uppercase tracking-[0.35em] text-emerald-400 border-b border-white/5 pb-3 flex items-center gap-2">
            <Globe size={14} /> Cloud Vault Backup
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-2xl">
              <div>
                <div className="text-sm font-bold text-emerald-400">Postgres Auto-Sync</div>
                <div className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">Realtime vault updates</div>
              </div>
              <input 
                type="checkbox" 
                checked={cloud.autoSync} 
                onChange={e => setCloud({...cloud, autoSync: e.target.checked})} 
                className="w-5 h-5 accent-emerald-500 cursor-pointer rounded" 
              />
            </div>

            <button 
              onClick={handleManualPull}
              disabled={isPulling}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-bgDark border border-cardBorder hover:border-emerald-500 hover:text-emerald-400 text-slate-400 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
            >
              {isPulling ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Pull Cloud Vault Data
            </button>
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

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleResetData}
              className="py-4 border border-red-500/20 hover:border-red-500 bg-red-500/5 hover:bg-red-500/10 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 text-center flex items-center justify-center"
            >
              Flush Local Cache
            </button>

            <button 
              onClick={onLogout}
              className="py-4 border border-slate-700/50 hover:border-slate-500 bg-slate-800/30 hover:bg-slate-800/60 text-slate-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 text-center flex items-center justify-center gap-2"
            >
              <LogOut size={14} /> Log Out
            </button>
          </div>
        </div>
      </div>

      {/* Save Button block */}
      <div className="pt-6 flex justify-end">
        <button 
          disabled={isDeploying} 
          onClick={handleSave} 
          className="w-full sm:w-auto px-12 py-4 bg-primary hover:bg-primary-hover text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
        >
          {isDeploying ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save Settings
        </button>
      </div>
    </div>
  );
};
