
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { TaskManager } from './components/TaskManager';
import { Settings } from './components/Settings';
import { HabitTracker } from './components/HabitTracker';

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
import { CloudOff, Loader2, Lock, RefreshCw, ShieldCheck, AlertTriangle, Mic, Sparkles } from 'lucide-react';
import { useVoiceToTask, VoiceCommandResult } from './hooks/useVoiceToTask';
import { v4 as uuidv4 } from 'uuid';
import { audioService } from './services/audioService';
import { getReportTriggers } from './services/persistenceService';
import { useVoiceSentinel } from './hooks/useVoiceSentinel';
import { useCharacter } from './hooks/useCharacter';
import { getFlowDate, calculateStreak, calculateVelocity } from './services/dateService';


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
  const [isBooted, setIsBooted] = useState(false);
  const [currentView, setCurrentView] = useState<ViewName>('dashboard');
  const [selectedDate, setSelectedDate] = useState(getFlowDate());
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

  // AI Voice Command Integration
  const handleAICommandResult = (res: VoiceCommandResult) => {
    if (res.type === 'TASK' && res.title) {
      updateData(prev => ({
        ...prev,
        tasks: [...(prev.tasks || []), { 
          id: uuidv4(), 
          title: res.title!, 
          time: res.time || '09:00', 
          type: 'task', 
          priority: 'medium', 
          date: getFlowDate(), 
          completed: false 
        }]
      }));
      voiceService.speak("Task registered.");
    } else if (res.type === 'HABIT' && res.title) {
      updateData(prev => ({
        ...prev,
        habits: [...(prev.habits || []), { 
          id: uuidv4(), 
          title: res.title!, 
          type: 'habit', 
          frequency: 'daily', 
          history: {}, 
          streak: 0, 
          completed: false, 
          velocity: 0, 
          createdAt: new Date().toISOString(),
          attribute: 'WIL',
          baseXp: 10
        }]
      }));
      voiceService.speak("Habit initialized.");
    } else if (res.type === 'WORK_SESSION' && res.title) {
      updateData(prev => ({
        ...prev,
        workSessions: [...(prev.workSessions || []), {
          id: uuidv4(),
          date: getFlowDate(),
          startedAt: new Date(Date.now() - (res.duration || 25) * 60000).toISOString(),
          endedAt: new Date().toISOString(),
          durationSeconds: (res.duration || 25) * 60,
          details: res.title!
        }],
        user: {
          ...prev.user,
          xp: (prev.user.xp || 0) + (res.duration || 25)
        }
      }));
      voiceService.speak("Work session logged.");
    } else {
      voiceService.speak("Command unrecognized. Please repeat clearly.");
    }
  };

  const { isListening, transcript, isProcessing, startListening, stopListening } = useVoiceToTask(data.user.geminiKey, handleAICommandResult);


  // Persist state to local storage immediately whenever data changes
  useEffect(() => {
    localStorage.setItem('flow-os-data', JSON.stringify(data));
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
    if (data.user.lastLogin) {
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
  }, [data.user.lastLogin]);





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

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden ml-0 lg:ml-72 pb-20 lg:pb-0">
        <Header title={currentView.toUpperCase()} user={data.user} setView={setCurrentView} selectedDate={selectedDate} setSelectedDate={setSelectedDate} data={data} />
        
        {/* AI Voice Assistant FAB */}
        <div className="fixed bottom-24 lg:bottom-10 right-6 lg:right-10 z-[100]">
          {isProcessing ? (
            <div className="bg-primary text-white p-4 rounded-full shadow-[0_0_20px_rgba(139,92,246,0.6)] animate-pulse flex items-center justify-center">
              <Sparkles size={24} className="animate-spin" />
            </div>
          ) : isListening ? (
            <button 
              onClick={stopListening}
              className="bg-red-500 text-white p-4 rounded-full shadow-[0_0_30px_rgba(239,68,68,0.6)] animate-bounce flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
            >
              <Mic size={24} className="animate-pulse" />
            </button>
          ) : (
            <button 
              onClick={startListening}
              className="bg-bgDark/80 backdrop-blur border border-primary/50 text-primary hover:text-white hover:bg-primary p-4 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 group"
            >
              <Mic size={24} className="group-hover:scale-110 transition-transform" />
            </button>
          )}
          {transcript && (
            <div className="absolute bottom-16 right-0 bg-bgDark border border-cardBorder p-3 rounded-2xl shadow-xl w-64 text-xs text-slate-300 pointer-events-none animate-fade-in-up">
              "{transcript}"
            </div>
          )}
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
            {currentView === 'settings' && <Settings user={data.user} data={data} onImport={(newData) => setData(newData)} updateUser={(u) => updateData(prev => ({...prev, user: {...prev.user, ...u}}))} resetData={() => { localStorage.removeItem('flow-os-data'); setData(INITIAL_DATA); }} />}
          </div>
        </div>
      </main>
    </div>
  );
}
