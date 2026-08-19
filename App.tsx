
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { TaskManager } from './components/TaskManager';
import { Settings } from './components/Settings';
import { HabitTracker } from './components/HabitTracker';
import { Auth } from './components/Auth';
import { Forecast } from './components/Forecast';
import { FocusMode } from './components/FocusMode';
import { Learning } from './components/Learning';
import { DayReview } from './components/DayReview';
import { Reports } from './components/Reports';
import { MomentumGuard } from './components/MomentumGuard';
import { HistoricalReportModal } from './components/HistoricalReportModal';
import { LevelUpModal } from './components/LevelUpModal';
import { WorkTracker } from './components/WorkTracker';
import { SystemBoot } from './components/SystemBoot';
import { Task, Habit, LearningTopic, ViewName, AppData, UserProfile, HorizonPotential, MomentumSession, TopicStatus, HistoricalReport, ReportRange, DayReflection, WorkSession } from './types';

import { voiceService } from './services/voiceService';
import { CloudOff, Loader2, Lock, RefreshCw, ShieldCheck, AlertTriangle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { audioService } from './services/audioService';
import { getReportTriggers } from './services/persistenceService';
import { useVoiceSentinel } from './hooks/useVoiceSentinel';
import { useCharacter } from './hooks/useCharacter';
import { getFlowDate, calculateStreak, calculateVelocity } from './services/dateService';
import { signIn, signUp, signOut, pushVault, pullVault } from './services/cloudService';
import { supabase } from './services/supabaseClient';

// Supabase powers the backend — no Google Sheets needed
const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

const INITIAL_DATA: AppData = {
  tasks: [],
  habits: [],
  topics: [],
  potentials: [],
  workSessions: [],
  user: {
    name: 'Explorer',
    bio: 'Flow OS User',
    xp: 0,
    stats: { STR: 0, INT: 0, WIL: 0, FOC: 0, REC: 0 },
    freezeInventory: 1, // Start with 1 Shield
    voiceEnabled: true,
    emailSettings: { enabled: true, frequency: 'monthly' },
    cloudConfig: { provider: 'supabase', autoSync: true },
  },
  archivedTasks: [],
  historicalReports: [],
  aiHistory: [],
  reflections: []
};

export default function App() {
  // Supabase session — check BOTH our email key AND Supabase's own session key
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const hasEmail = !!localStorage.getItem('flow-os-auth-email');
    const hasSupabaseSession = !!localStorage.getItem('flow-os-auth');
    return hasEmail && hasSupabaseSession;
  });

  const [isBooted, setIsBooted] = useState(false);

  const [userEmail, setUserEmail] = useState<string>(() => {
    return localStorage.getItem('flow-os-auth-email') || '';
  });

  const [currentView, setCurrentView] = useState<ViewName>('dashboard');
  const [selectedDate, setSelectedDate] = useState(getFlowDate());
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncStatus, setLastSyncStatus] = useState<'success' | 'fail' | 'idle'>('idle');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const hasNarratedToday = useRef(false);
  
  const [activeMomentum, setActiveMomentum] = useState<MomentumSession | null>(null);
  const [momentumTargetId, setMomentumTargetId] = useState<string | null>(null);
  const [activeReport, setActiveReport] = useState<HistoricalReport | null>(null);
  
  // Level Up State
  const [showLevelUp, setShowLevelUp] = useState(false);

  // Online / Offline State
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor Supabase session states to enable seamless 7-day+ persistence
  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          setIsAuthenticated(true);
          setUserEmail(session.user.email);
          localStorage.setItem('flow-os-auth-email', session.user.email);
        } else {
          setIsAuthenticated(false);
          setUserEmail('');
          localStorage.removeItem('flow-os-auth-email');
        }
      } catch (e) {
        console.error('[Flow OS] Failed to pull auth session:', e);
      }
    };
    initSession();

    // Listen to token refreshes and log-outs across browser tabs
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email);
        localStorage.setItem('flow-os-auth-email', session.user.email);
      } else {
        setIsAuthenticated(false);
        setUserEmail('');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Undo Toast State
  const [undoToast, setUndoToast] = useState<{
    id: string;
    type: 'task' | 'habit' | 'topic' | 'work';
    label: string;
    payload: any;
  } | null>(null);

  const toastTimeoutRef = useRef<any>(null);

  const showUndoToast = (type: 'task' | 'habit' | 'topic' | 'work', label: string, payload: any) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    
    setUndoToast({
      id: Math.random().toString(),
      type,
      label,
      payload
    });

    toastTimeoutRef.current = setTimeout(() => {
      setUndoToast(null);
    }, 6000);
  };

  const handleUndo = () => {
    if (!undoToast) return;
    const { type, payload } = undoToast;

    if (type === 'task') {
      setData(prev => ({ ...prev, tasks: [...(prev.tasks || []), payload] }));
    } else if (type === 'habit') {
      setData(prev => ({ ...prev, habits: [...(prev.habits || []), payload] }));
    } else if (type === 'topic') {
      setData(prev => ({ ...prev, topics: [...(prev.topics || []), payload] }));
    } else if (type === 'work') {
      setData(prev => ({ ...prev, workSessions: [...(prev.workSessions || []), payload] }));
    }

    setUndoToast(null);
    audioService.playSuccess();
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !isNaN(Number(e.key))) {
        const num = Number(e.key);
        const views: ViewName[] = ['dashboard', 'tasks', 'habits', 'learning', 'reports', 'forecast', 'settings', 'work'];
        if (num >= 1 && num <= views.length) {
          e.preventDefault();
          setCurrentView(views[num - 1]);
          audioService.playAction();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, []);

  const [data, setData] = useState<AppData>(() => {
    try {
      const saved = localStorage.getItem('flow-os-data');
      if (!saved) return INITIAL_DATA;
      const parsed = JSON.parse(saved);
      
      // Ensure existing data fits new shape if needed
      // Ensure stats object exists on user if loading older data
      const baseStats = { STR: 0, INT: 0, WIL: 0, FOC: 0, REC: 0 };
      const currentStats = parsed.user?.stats || {};
      const mergedStats = { ...baseStats, ...currentStats };
      // Ensure no NaN values
      Object.keys(mergedStats).forEach(k => {
          if (typeof mergedStats[k] !== 'number' || isNaN(mergedStats[k])) mergedStats[k] = 0;
      });

      const mergedUser = { 
        ...INITIAL_DATA.user, 
        ...parsed.user,
        stats: mergedStats,
        freezeInventory: parsed.user?.freezeInventory ?? 1
      };
      return { ...INITIAL_DATA, ...parsed, user: mergedUser };
    } catch (e) {
      return INITIAL_DATA;
    }
  });

  // Calculate Level for LevelUp Modal
  const { level } = useCharacter(data.user);
  const prevLevelRef = useRef(level);

  // Effect to detect level up
  useEffect(() => {
    if (isBooted && level > prevLevelRef.current && prevLevelRef.current > 0) {
      setShowLevelUp(true);
    }
    prevLevelRef.current = level;
  }, [level, isBooted]);

  // Activate Voice Sentinel
  useVoiceSentinel(data.tasks, data.user.voiceEnabled && isBooted);

  // Persist state to local storage immediately whenever data changes
  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('flow-os-data', JSON.stringify(data));
    }
  }, [data, isAuthenticated]);

  // ── Supabase Cloud Sync ──────────────────────────────────────────────────
  const syncWithCloud = useCallback(async (direction: 'push' | 'pull'): Promise<AppData | null> => {
    setIsSyncing(true);
    try {
      if (direction === 'push') {
        await pushVault(data);
        setLastSyncStatus('success');
        return data;
      } else {
        const cloudData = await pullVault();
        if (cloudData) {
          setLastSyncStatus('success');
          return cloudData;
        }
        return null;
      }
    } catch (e) {
      console.error('[Flow OS] Sync error:', e);
      setLastSyncStatus('fail');
      return null;
    } finally {
      setIsSyncing(false);
      setTimeout(() => setLastSyncStatus('idle'), 3000);
    }
  }, [data]);

  // Deprecated manual narration in favor of SystemBoot briefing
  const narrateSystemStatus = useCallback((customMessage?: string) => {
    if (!data.user.voiceEnabled) return;
    if (customMessage) {
      voiceService.speak(customMessage);
      return;
    }
  }, [data.user.voiceEnabled]);



  // Email relay via Google Sheets removed — Supabase is now the backend
  // To send email reports, integrate an Edge Function or email service later
  const handleSendEmailReport = async (_report: HistoricalReport) => {
    console.info('[Flow OS] Email reports require an email service integration.');
    return false;
  };

  useEffect(() => {
    if (isAuthenticated && data.user.lastLogin) {
      const triggers = getReportTriggers(data.user.lastLogin);
      if (triggers.length > 0) {
        triggers.forEach(range => {
          const completedCount = data.tasks.filter(t => t.completed).length + data.archivedTasks.length;
          const focusHours = Math.round(data.tasks.reduce((acc, t) => acc + (t.actualDuration || 0), 0) / 60);
          
          const newReport: HistoricalReport = {
            id: uuidv4(),
            range,
            periodLabel: range === 'month' ? 'Last Month' : range === '6month' ? 'Semi-Annual' : 'Yearly',
            generatedAt: new Date().toISOString(),
            tasksCompleted: completedCount,
            minutesFocused: data.tasks.reduce((acc, t) => acc + (t.actualDuration || 0), 0),
            insight: "Your performance trajectory remains ascending. Continuity is your greatest asset.",
            viewed: false
          };
          
          updateData(prev => ({
            ...prev,
            historicalReports: [newReport, ...(prev.historicalReports || [])],
            user: { ...prev.user, lastLogin: new Date().toISOString() }
          }));
          
          setActiveReport(newReport);
          audioService.playNotification();
        });
      }
    }
  }, [isAuthenticated]);

  // ── Supabase Auth ────────────────────────────────────────────────────────
  const handleAuth = async (email: string, pass: string, isSignup: boolean) => {
    setIsAuthLoading(true);
    const cleanEmail = email.toLowerCase().trim();
    
    try {
      if (isSignup) {
        // Supabase handles password hashing (bcrypt) — no plaintext storage
        await signUp(cleanEmail, pass);
        const newData: AppData = {
          ...INITIAL_DATA,
          user: {
            ...INITIAL_DATA.user,
            email: cleanEmail,
            name: cleanEmail.split('@')[0],
            lastLogin: new Date().toISOString()
          }
        };
        setData(newData);
        setUserEmail(cleanEmail);
        setIsAuthenticated(true);
        localStorage.setItem('flow-os-auth-email', cleanEmail);
        audioService.playSuccess();
        // Push initial empty vault to Supabase
        await pushVault(newData);
      } else {
        // Supabase validates credentials securely
        await signIn(cleanEmail, pass);
        // Pull existing vault data from Supabase
        const cloudData = await pullVault();
        if (cloudData) {
          const mergedUser = {
            ...INITIAL_DATA.user,
            ...cloudData.user,
            stats: { ...INITIAL_DATA.user.stats, ...(cloudData.user?.stats || {}) },
            freezeInventory: cloudData.user?.freezeInventory ?? 1,
            lastLogin: new Date().toISOString()
          };
          setData({ ...cloudData, user: mergedUser });
        }
        setUserEmail(cleanEmail);
        setIsAuthenticated(true);
        localStorage.setItem('flow-os-auth-email', cleanEmail);
        audioService.playSuccess();
      }
    } catch (err: any) {
      throw new Error(err.message || 'Authentication failed.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();                              // Clears Supabase session
    setIsAuthenticated(false);
    setIsBooted(false);
    setUserEmail('');
    localStorage.removeItem('flow-os-auth-email');
    localStorage.removeItem('flow-os-data');
    setCurrentView('dashboard');
    setData(INITIAL_DATA);
    hasNarratedToday.current = false;
  };

  // Auto-push to Supabase every 5 minutes when data changes
  useEffect(() => {
    if (!isAuthenticated) return;
    if (data.user.cloudConfig?.autoSync !== false) {
      const timer = setTimeout(() => syncWithCloud('push'), SYNC_INTERVAL_MS);
      return () => clearTimeout(timer);
    }
  }, [data, isAuthenticated, syncWithCloud]);

  const updateData = useCallback((updates: Partial<AppData> | ((prev: AppData) => AppData)) => {
    setData(prev => {
      const next = typeof updates === 'function' ? updates(prev) : { ...prev, ...updates };
      localStorage.setItem('flow-os-data', JSON.stringify(next));
      return next;
    });
  }, []);

  const startMomentum = (id: string) => {
    audioService.playAction();
    setMomentumTargetId(id);
    setActiveMomentum({ id: uuidv4(), status: 'active', totalSegments: 0, segments: [] });
  };

  const handleMomentumExit = (finalSession: MomentumSession, bridge?: string) => {
    const totalMinutes = (finalSession?.segments?.length || 0) * 10;
    updateData(prev => ({
      ...prev,
      tasks: (prev.tasks || []).map(t => t.id === momentumTargetId ? { ...t, nextBridge: bridge, actualDuration: (t.actualDuration || 0) + totalMinutes } : t),
      topics: (prev.topics || []).map(t => t.id === momentumTargetId ? { ...t, nextBridge: bridge, totalMinutes: (t.totalMinutes || 0) + totalMinutes } : t),
      user: { ...prev.user, xp: prev.user.xp + ((finalSession?.segments?.length || 0) * 50) }
    }));
    setActiveMomentum(null);
    setMomentumTargetId(null);
    audioService.playSuccess();
  };

  const addTask = (task: Task) => {
    updateData(prev => ({ ...prev, tasks: [...(prev.tasks || []), task] }));
    audioService.playAction();
  };

  const toggleTask = (id: string) => {
    updateData(prev => ({
      ...prev,
      tasks: (prev.tasks || []).map(t => t.id === id ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : undefined } : t),
      user: { ...prev.user, xp: prev.user.xp + 10 }
    }));
    audioService.playSuccess();
  };

  const deleteTask = (id: string) => {
    const taskToDelete = data.tasks.find(t => t.id === id);
    if (taskToDelete) {
      updateData(prev => ({ ...prev, tasks: (prev.tasks || []).filter(t => t.id !== id) }));
      showUndoToast('task', taskToDelete.title, taskToDelete);
      audioService.playAction();
    }
  };

  const updateTask = (id: string, updates: Partial<Task>) => updateData(prev => ({
    ...prev,
    tasks: (prev.tasks || []).map(t => t.id === id ? { ...t, ...updates } : t)
  }));

  const toggleHabit = (id: string) => {
    updateData(prev => {
      let xpChange = 0;
      let attributeUpdate = { ...prev.user.stats };
      let freezeInventory = prev.user.freezeInventory;
      
      const updatedHabits = (prev.habits || []).map(h => {
        if (h.id !== id) return h;

        const today = getFlowDate();
        const currentHistory = h.history || {};
        const isDoneToday = !!currentHistory[today];
        
        // Toggle the status for today
        const newHistory = { ...currentHistory };
        if (isDoneToday) {
          // UNDO
          delete newHistory[today];
          xpChange = -(h.baseXp || 10);
          if (h.attribute && attributeUpdate[h.attribute] !== undefined) {
             attributeUpdate[h.attribute] = Math.max(0, attributeUpdate[h.attribute] - (h.baseXp || 10));
          }
        } else {
          // COMPLETE
          newHistory[today] = true;
          xpChange = (h.baseXp || 10);
          if (h.attribute && attributeUpdate[h.attribute] !== undefined) {
             attributeUpdate[h.attribute] += (h.baseXp || 10);
          }
        }

        // New Robust Streak Calculation
        const { currentStreak, freezesUsed } = calculateStreak(newHistory, freezeInventory);
        
        // Update global freeze inventory if used
        freezeInventory -= freezesUsed;

        const newVelocity = calculateVelocity(newHistory);

        return {
          ...h,
          history: newHistory,
          streak: currentStreak,
          completed: !isDoneToday,
          velocity: newVelocity
        };
      });

      return {
        ...prev,
        habits: updatedHabits,
        user: { 
            ...prev.user, 
            xp: Math.max(0, prev.user.xp + xpChange),
            stats: attributeUpdate,
            freezeInventory
        }
      };
    });
  };

  const addHabit = (h: Habit) => {
    updateData(prev => ({ ...prev, habits: [...(prev.habits || []), h] }));
    audioService.playAction();
  };

  // FIX: was incorrectly using deleteTask — now targets habits array
  const deleteHabit = (id: string) => {
    const habitToDelete = data.habits.find(h => h.id === id);
    if (habitToDelete) {
      updateData(prev => ({ ...prev, habits: (prev.habits || []).filter(h => h.id !== id) }));
      showUndoToast('habit', habitToDelete.title, habitToDelete);
      audioService.playAction();
    }
  };

  const updateHabit = (id: string, updates: Partial<Habit>) => updateData(prev => ({
    ...prev,
    habits: (prev.habits || []).map(h => h.id === id ? { ...h, ...updates } : h)
  }));

  const addTopic = (topic: LearningTopic) => {
    updateData(prev => ({ ...prev, topics: [...(prev.topics || []), topic] }));
    audioService.playAction();
  };

  const deleteTopic = (id: string) => {
    const topicToDelete = data.topics.find(t => t.id === id);
    if (topicToDelete) {
      updateData(prev => ({ ...prev, topics: (prev.topics || []).filter(t => t.id !== id) }));
      showUndoToast('topic', topicToDelete.title, topicToDelete);
      audioService.playAction();
    }
  };

  const updateTopic = (id: string, updates: Partial<LearningTopic>) => updateData(prev => ({
    ...prev,
    topics: (prev.topics || []).map(t => t.id === id ? { ...t, ...updates } : t)
  }));

  const processRevision = (id: string, action: 'learn' | 're-read' | 'hard' | 'mastered' | 'extra') => {
    const SRS_INTERVALS = [1, 3, 7, 14, 30, 90];
    updateData(prev => {
      const topic = (prev.topics || []).find(t => t.id === id);
      if (!topic) return prev;
      const now = new Date();
      let newStep = topic.currentStep || 0;
      let newNextDate: string | null = topic.nextReviewDate;
      let newStatus: TopicStatus = topic.status;
      let xpAward = 20;

      if (action === 'mastered') {
        newStatus = 'mastered';
        newNextDate = null;
        xpAward = 500;
        audioService.playSuccess();
      } else if (action === 'learn' || action === 're-read') {
        newStep = Math.min(newStep + 1, SRS_INTERVALS.length - 1);
        const daysToAdd = SRS_INTERVALS[newStep];
        const nextDateObj = new Date();
        nextDateObj.setDate(now.getDate() + daysToAdd);
        newNextDate = nextDateObj.toISOString().split('T')[0];
        xpAward = 50 * (newStep + 1);
        audioService.playAction();
      } else if (action === 'hard') {
        const nextDateObj = new Date();
        nextDateObj.setDate(now.getDate() + 1);
        newNextDate = nextDateObj.toISOString().split('T')[0];
        xpAward = 10;
        audioService.playAction();
      }

      return {
        ...prev,
        user: { ...prev.user, xp: (prev.user.xp || 0) + xpAward },
        topics: (prev.topics || []).map(t => t.id === id ? {
          ...t,
          currentStep: newStep,
          status: newStatus,
          nextReviewDate: newNextDate,
          lastReviewDate: now.toISOString().split('T')[0],
          history: [...(t.history || []), `${action} on ${now.toLocaleDateString()}`],
          sessions: [...(t.sessions || []), { date: now.toISOString(), duration: 25, action }]
        } : t)
      };
    });
  };

  const addPotential = (p: HorizonPotential) => {
    updateData(prev => ({ ...prev, potentials: [...(prev.potentials || []), p] }));
    audioService.playAction();
  };

  const convertPotential = (id: string) => {
    updateData(prev => {
      const p = (prev.potentials || []).find(item => item.id === id);
      if (!p) return prev;
      const newTask: Task = { id: uuidv4(), title: p.title, time: p.time || '09:00', date: selectedDate, completed: false, type: 'task', priority: 'medium' };
      return { ...prev, tasks: [...(prev.tasks || []), newTask], potentials: (prev.potentials || []).filter(item => item.id !== id) };
    });
    audioService.playSuccess();
  };

  const dismissPotential = (id: string) => {
    updateData(prev => ({ ...prev, potentials: (prev.potentials || []).filter(p => p.id !== id) }));
    audioService.playAction();
  };

  const saveDayReview = (review: DayReflection) => {
    updateData(prev => ({
      ...prev,
      reflections: [...(prev.reflections || []), review]
    }));
    audioService.playSuccess();
  };

  const addWorkSession = (session: WorkSession) => {
    const gainedXP = Math.max(1, Math.floor(session.durationSeconds / 60));
    updateData(prev => ({
      ...prev,
      workSessions: [...(prev.workSessions || []), session],
      user: {
        ...prev.user,
        xp: (prev.user.xp || 0) + gainedXP
      }
    }));
  };

  const deleteWorkSession = (id: string) => {
    const session = (data.workSessions || []).find(s => s.id === id);
    if (!session) return;
    showUndoToast('work', `Deleted "${session.details}"`, session);
    updateData(prev => ({
      ...prev,
      workSessions: (prev.workSessions || []).filter(s => s.id !== id)
    }));
  };

  const resetWorkSessions = () => {
    updateData(prev => ({ ...prev, workSessions: [] }));
    audioService.playAction();
  };

  if (!isAuthenticated) return <Auth onLogin={handleAuth} />;

  if (!isBooted) return <SystemBoot data={data} onBootComplete={() => setIsBooted(true)} />;

  return (
    <div className="flex h-dvh bg-bgDark text-slate-100 font-sans overflow-hidden">
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-red-500 text-white px-4 py-2 text-center text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 z-[200] animate-fade-in shadow-lg">
          <AlertTriangle size={14} /> Offline Mode Active — Data cached locally
        </div>
      )}
      <Sidebar currentView={currentView} setView={setCurrentView} />
      <MobileNav currentView={currentView} setView={setCurrentView} />

      
      {/* Modals and Overlays */}
      {activeMomentum && (
        <MomentumGuard session={activeMomentum} onSessionUpdate={setActiveMomentum} onExit={handleMomentumExit} soundEnabled={true} />
      )}

      {activeReport && (
        <HistoricalReportModal 
          report={activeReport} 
          isOpen={!!activeReport} 
          onClose={() => setActiveReport(null)} 
          userName={data.user.name} 
          onSendEmail={handleSendEmailReport}
        />
      )}

      {undoToast && (
        <div className="fixed bottom-24 md:bottom-8 left-8 z-[70] bg-slate-900 border border-primary/30 p-4 rounded-2xl flex items-center justify-between gap-6 shadow-[0_0_50px_rgba(124,58,237,0.3)] animate-slide-in">
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{undoToast.type} Deconfigured</span>
            <span className="text-xs font-bold text-white max-w-[200px] truncate">{undoToast.label}</span>
          </div>
          <button 
            onClick={handleUndo} 
            className="px-3 py-1.5 bg-primary/20 hover:bg-primary border border-primary/30 text-primary hover:text-white rounded-lg text-xs font-black uppercase tracking-widest transition-all"
          >
            Undo
          </button>
        </div>
      )}

      <LevelUpModal 
        level={level} 
        isOpen={showLevelUp} 
        onClose={() => setShowLevelUp(false)} 
      />

      {isAuthLoading && (
        <div className="fixed inset-0 z-[1000] bg-bgDark flex flex-col items-center justify-center animate-fade-in px-6 text-center">
           <Loader2 className="animate-spin text-primary mb-4" size={48} />
           <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-widest text-sm">
             <Lock size={16} /> Establishing Secure Vault Connection...
           </div>
        </div>
      )}

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden ml-0 lg:ml-72 pb-20 lg:pb-0">
        <Header title={currentView.toUpperCase()} user={data.user} setView={setCurrentView} selectedDate={selectedDate} setSelectedDate={setSelectedDate} data={data} />
        
        {/* Sync Status Badge */}
        <div className="fixed bottom-24 lg:bottom-6 right-6 z-50 pointer-events-none">
           <div className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border backdrop-blur-md transition-all duration-500 shadow-2xl ${
             isSyncing ? 'bg-primary/20 border-primary text-primary scale-105' : 
             lastSyncStatus === 'success' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' :
             lastSyncStatus === 'fail' ? 'bg-red-500/20 border-red-500 text-red-400' :
             'bg-slate-800/40 border-slate-700/50 text-slate-500 opacity-60'
           }`}>
              {isSyncing ? <Loader2 className="animate-spin" size={14} /> : 
               lastSyncStatus === 'fail' ? <CloudOff size={14} /> : 
               <ShieldCheck size={16} className="text-emerald-400" />}
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-0.5">
                  {isSyncing ? 'Syncing...' : lastSyncStatus === 'success' ? 'Vault Verified' : 'Local Backup'}
                </span>
                <span className="text-[8px] opacity-50 font-medium truncate max-w-[120px]">{userEmail}</span>
              </div>
              {!isSyncing && (
                <button onClick={() => syncWithCloud('push')} className="pointer-events-auto ml-2 p-1 hover:bg-white/10 rounded transition-colors" title="Force Sync">
                  <RefreshCw size={12} />
                </button>
              )}
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            {currentView === 'dashboard' && <Dashboard data={data} toggleTask={toggleTask} toggleHabit={toggleHabit} switchView={setCurrentView} selectedDate={selectedDate} convertPotential={convertPotential} dismissPotential={dismissPotential} />}
            {currentView === 'focus' && <FocusMode onSessionComplete={(mins) => updateData(prev => ({ ...prev, user: { ...prev.user, xp: (prev.user.xp || 0) + (mins * 2) } }))} />}
            {currentView === 'tasks' && <TaskManager tasks={data.tasks || []} addTask={addTask} toggleTask={toggleTask} deleteTask={deleteTask} selectedDate={selectedDate} startMomentum={startMomentum} updateTask={updateTask} />}
            {currentView === 'learning' && <Learning topics={data.topics || []} addTopic={addTopic} processRevision={processRevision} deleteTopic={deleteTopic} updateTopic={updateTopic} startMomentum={startMomentum} />}
            {currentView === 'habits' && <HabitTracker habits={data.habits || []} addHabit={addHabit} toggleHabit={toggleHabit} deleteHabit={deleteHabit} updateHabit={updateHabit} />}
            {currentView === 'forecast' && <Forecast data={data} addPotential={addPotential} convertPotential={convertPotential} dismissPotential={dismissPotential} />}
            {currentView === 'work' && (
              <WorkTracker 
                sessions={data.workSessions || []} 
                onAddSession={addWorkSession} 
                onDeleteSession={deleteWorkSession} 
                onResetSessions={resetWorkSessions} 
              />
            )}
            {currentView === 'review' && <DayReview data={data} updateTask={updateTask} selectedDate={selectedDate} onSaveReview={saveDayReview} />}
            {currentView === 'reports' && <Reports data={data} />}
            {currentView === 'settings' && <Settings user={data.user} data={data} onImport={(newData) => setData(newData)} updateUser={(u) => updateData(prev => ({...prev, user: {...prev.user, ...u}}))} onDeployChanges={async () => { await syncWithCloud('push'); }} onManualPull={async () => { await syncWithCloud('pull'); }} resetData={() => { localStorage.removeItem('flow-os-data'); setData(INITIAL_DATA); }} onLogout={handleLogout} />}
          </div>
        </div>
      </main>
    </div>
  );
}
