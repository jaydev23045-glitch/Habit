import React, { useState, useRef, memo } from 'react';
import { LearningTopic, TopicDifficulty, TopicPriority } from '../types';
import { Brain, BookOpen, Trash2, AlertTriangle, Plus, Check, Star, RefreshCw, Layers, Calendar, Mail, Trophy, Clock, MapPin, X, ChevronDown, ChevronUp, Edit2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface LearningProps {
  topics: LearningTopic[];
  addTopic: (topic: LearningTopic) => void;
  processRevision: (id: string, action: 'learn' | 're-read' | 'hard' | 'mastered' | 'extra') => void;
  deleteTopic: (id: string) => void;
  updateTopic: (id: string, updates: Partial<LearningTopic>) => void;
  startMomentum?: (id: string) => void;
}

const InteractiveStatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  colorClass, 
  detailList, 
  dateLabel 
}: { 
  title: string, 
  value: string | number, 
  icon: any, 
  colorClass: string,
  detailList?: string[],
  dateLabel?: string
}) => {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = detailList && detailList.length > 0;

  return (
    <div 
      className={`bg-cardBg border border-cardBorder p-5 rounded-xl transition-all relative overflow-hidden ${hasDetails ? 'cursor-pointer hover:border-slate-500' : ''} ${expanded ? 'row-span-2' : ''}`}
      onClick={() => hasDetails && setExpanded(!expanded)}
    >
      <div className="flex items-center gap-4 relative z-10">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClass} bg-opacity-10`}>
           <Icon size={24} className={colorClass.replace('bg-', 'text-')} />
        </div>
        <div>
           <div className="text-2xl font-bold text-white">{value}</div>
           <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
             {title} {hasDetails && (expanded ? <ChevronUp size={12}/> : <ChevronDown size={12}/>)}
           </div>
        </div>
      </div>

      {expanded && hasDetails && (
        <div className="mt-4 pt-4 border-t border-white/5 animate-fade-in">
           <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">
             {dateLabel ? 'Next Up:' : 'Recent:'}
           </div>
           <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
              {detailList.map((item, idx) => (
                <div key={idx} className="text-[11px] text-slate-300 truncate flex items-center gap-2">
                   <div className="w-1 h-1 rounded-full bg-primary"></div>
                   {item}
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

export const Learning = memo<LearningProps>(({ topics, addTopic, processRevision, deleteTopic, updateTopic, startMomentum }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState<TopicDifficulty>('medium');
  const [priority, setPriority] = useState<TopicPriority>('medium');
  const [isAdding, setIsAdding] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Edit States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingDesc, setEditingDesc] = useState('');
  const [editingCategory, setEditingCategory] = useState('');
  const [editingDifficulty, setEditingDifficulty] = useState<TopicDifficulty>('medium');
  const [editingPriority, setEditingPriority] = useState<TopicPriority>('medium');

  const startEditing = (topic: LearningTopic) => {
    setEditingId(topic.id);
    setEditingTitle(topic.title);
    setEditingDesc(topic.description);
    setEditingCategory(topic.category);
    setEditingDifficulty(topic.difficulty);
    setEditingPriority(topic.priority);
  };

  const saveEdit = (id: string) => {
    if (editingTitle.trim()) {
      updateTopic(id, {
        title: editingTitle,
        description: editingDesc,
        category: editingCategory,
        difficulty: editingDifficulty,
        priority: editingPriority
      });
    }
    setEditingId(null);
  };

  const handleManualAdd = () => {
    if(!title.trim()) return;
    addTopic({
      id: uuidv4(),
      title,
      description: description || 'Conceptual exploration.',
      category: category || 'General',
      type: 'learning',
      status: 'active',
      difficulty,
      priority,
      currentStep: 0,
      nextReviewDate: new Date().toISOString().split('T')[0],
      lastReviewDate: null,
      history: [],
      totalMinutes: 0,
      sessions: []
    });
    setTitle('');
    setDescription('');
    if (titleInputRef.current) titleInputRef.current.focus();
  };

  const today = new Date().toISOString().split('T')[0];
  const allDueTopics = topics.filter(t => t.status === 'active' && t.nextReviewDate && t.nextReviewDate <= today);
  
  allDueTopics.sort((a,b) => {
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (b.priority === 'high' && a.priority !== 'high') return 1;
      return a.nextReviewDate!.localeCompare(b.nextReviewDate!);
  });

  const VISIBLE_LIMIT = 10;
  const dueTopics = allDueTopics.slice(0, VISIBLE_LIMIT);
  const backloggedCount = Math.max(0, allDueTopics.length - VISIBLE_LIMIT);

  const upcomingTopics = topics.filter(t => t.status === 'active' && t.nextReviewDate && t.nextReviewDate > today).sort((a,b) => a.nextReviewDate!.localeCompare(b.nextReviewDate!));
  const masteredTopics = topics.filter(t => t.status === 'mastered');
  
  const nextSessionTopic = upcomingTopics.length > 0 ? upcomingTopics[0] : null;
  const nextReviewDateDisplay = nextSessionTopic 
    ? new Date(nextSessionTopic.nextReviewDate!).toLocaleDateString(undefined, {month:'short', day:'numeric'}) 
    : 'None';

  const formatDifficulty = (diff: string) => {
    const colors = { easy: 'text-emerald-400', medium: 'text-yellow-400', hard: 'text-red-400' };
    return <span className={`text-[10px] font-black uppercase tracking-widest ${colors[diff as keyof typeof colors]}`}>{diff}</span>;
  };

  return (
    <div className="animate-fade-in space-y-8 max-w-7xl mx-auto pb-24">
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
          <InteractiveStatCard 
             title="Total Topics" 
             value={topics.length} 
             icon={Brain} 
             colorClass="bg-blue-500" 
             detailList={topics.slice(0, 5).map(t => t.title)}
          />
          <InteractiveStatCard 
             title="Mastered" 
             value={masteredTopics.length} 
             icon={Trophy} 
             colorClass="bg-yellow-500" 
             detailList={masteredTopics.slice(0, 5).map(t => t.title)}
          />
          <InteractiveStatCard 
             title="Due Now" 
             value={allDueTopics.length} 
             icon={AlertTriangle} 
             colorClass="bg-red-500" 
             detailList={dueTopics.map(t => t.title)}
          />
          <InteractiveStatCard 
             title="Next Session" 
             value={nextReviewDateDisplay} 
             icon={Calendar} 
             colorClass="bg-purple-500" 
             dateLabel="true"
             detailList={nextSessionTopic ? [nextSessionTopic.title] : []}
          />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <BookOpen className="text-primary" size={20}/> 
                    Knowledge Vault
                    <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">{dueTopics.length}</span>
                </h2>
            </div>

            {backloggedCount > 0 && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex items-center gap-4 mb-4">
                    <Layers size={20} className="text-orange-400" />
                    <div>
                        <h4 className="font-bold text-orange-200 text-sm">Review Avalanche Prevented</h4>
                        <p className="text-xs text-orange-300/70">
                            We've focused your study on {VISIBLE_LIMIT} items. {backloggedCount} more are queued.
                        </p>
                    </div>
                </div>
            )}

            {dueTopics.length === 0 ? (
                <div className="bg-cardBg border border-cardBorder rounded-xl p-16 text-center flex flex-col items-center justify-center min-h-[300px]">
                    <Check size={48} className="text-emerald-500 mb-6 bg-emerald-500/10 p-3 rounded-full" />
                    <h3 className="text-2xl font-bold text-slate-200">System Satiated</h3>
                    <p className="text-slate-400 mt-2 max-w-xs">You've reached memory saturation for today. No reviews pending.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {dueTopics.map((topic) => (
                        <div key={topic.id} className="bg-cardBg border border-cardBorder rounded-xl overflow-hidden shadow-2xl transition-all hover:border-primary/40 group">
                            {editingId === topic.id ? (
                                <div className="p-6 space-y-4">
                                    <h3 className="font-bold text-[10px] text-slate-500 uppercase tracking-[0.3em]">Modify Protocol</h3>
                                    <input 
                                        type="text" 
                                        value={editingTitle} 
                                        onChange={(e) => setEditingTitle(e.target.value)} 
                                        className="w-full bg-bgDark border border-cardBorder rounded-xl p-3 text-sm focus:border-primary focus:outline-none font-medium text-white"
                                        placeholder="Topic Title"
                                    />
                                    <textarea 
                                        value={editingDesc} 
                                        onChange={(e) => setEditingDesc(e.target.value)} 
                                        className="w-full h-20 bg-bgDark border border-cardBorder rounded-xl p-3 text-sm focus:border-primary focus:outline-none font-medium resize-none text-white"
                                        placeholder="Description"
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input 
                                            type="text" 
                                            value={editingCategory} 
                                            onChange={(e) => setEditingCategory(e.target.value)} 
                                            className="w-full bg-bgDark border border-cardBorder rounded-xl p-3 text-sm focus:border-primary focus:outline-none font-medium text-white"
                                            placeholder="Category"
                                        />
                                        <select 
                                            value={editingDifficulty} 
                                            onChange={(e) => setEditingDifficulty(e.target.value as any)} 
                                            className="w-full bg-bgDark border border-cardBorder rounded-xl p-3 text-sm focus:border-primary focus:outline-none font-medium text-slate-300"
                                            style={{ colorScheme: 'dark' }}
                                        >
                                            <option value="easy">Easy</option>
                                            <option value="medium">Medium</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setEditingId(null)} className="flex-1 py-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-slate-400 text-xs font-bold transition-all">Cancel</button>
                                        <button onClick={() => saveEdit(topic.id)} className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-lg shadow-primary/20">Save</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="p-6 border-b border-white/5 relative">
                                        <div className="absolute top-6 right-6 flex gap-2">
                                            <button onClick={() => startEditing(topic)} className="text-slate-600 hover:text-primary p-2 hover:bg-primary/10 rounded-lg transition-all" title="Edit Topic"><Edit2 size={16}/></button>
                                            <button onClick={() => deleteTopic(topic.id)} className="text-slate-600 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-all" title="Delete Topic"><Trash2 size={16}/></button>
                                        </div>
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-1 rounded-md uppercase tracking-[0.2em]">{topic.category}</span>
                                            <span className="text-xs text-slate-500 font-bold">Memory Stage {topic.currentStep + 1}</span>
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-2">{topic.title}</h3>
                                        <p className="text-slate-400 text-sm leading-relaxed">{topic.description}</p>
                                    </div>

                                    <div className="bg-bgDark/50 px-6 py-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4 flex-1 mr-8">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mastery</span>
                                            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-primary to-purple-600 transition-all duration-1000" style={{width: `${(topic.currentStep / 5) * 100}%`}}></div>
                                            </div>
                                            <span className="text-xs font-bold text-primary">{Math.round((topic.currentStep / 5) * 100)}%</span>
                                        </div>
                                        <div className="flex gap-4">
                                           {formatDifficulty(topic.difficulty)}
                                           <div className="text-[10px] font-bold text-slate-600 uppercase">Sessions: {topic.sessions.length}</div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-bgDark/20 grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <button 
                                            onClick={() => startMomentum ? startMomentum(topic.id) : processRevision(topic.id, 'learn')}
                                            className="col-span-2 sm:col-span-1 bg-primary hover:bg-primary-hover text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20"
                                        >
                                            {topic.nextBridge ? <MapPin size={14} fill="currentColor" /> : <BookOpen size={14} />} 
                                            {topic.nextBridge ? 'Resume Study' : 'Start Focus'}
                                        </button>
                                        <button onClick={() => processRevision(topic.id, 'learn')} className="bg-white/5 hover:bg-white/10 text-slate-300 py-3 rounded-xl text-xs font-bold border border-white/10 transition-all">Recall OK</button>
                                        <button onClick={() => processRevision(topic.id, 'hard')} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 py-3 rounded-xl text-xs font-bold border border-red-500/20 transition-all">Struggled</button>
                                        <button onClick={() => processRevision(topic.id, 'mastered')} className="bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 py-3 rounded-xl text-xs font-bold border border-yellow-500/20 transition-all">Mastered</button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>

        <div className="space-y-6">
            <div className={`bg-cardBg border border-cardBorder rounded-2xl transition-all duration-300 overflow-hidden ${isAdding ? 'ring-2 ring-primary shadow-2xl' : ''}`}>
                <button onClick={() => setIsAdding(!isAdding)} className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <h3 className="font-bold text-sm flex items-center gap-3"><Plus className="text-primary" size={18}/> Plant Knowledge</h3>
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{isAdding ? 'Cancel' : 'Open'}</span>
                </button>
                {isAdding && (
                    <div className="p-5 pt-0 border-t border-white/5 space-y-4 animate-fade-in">
                        <input 
                            ref={titleInputRef}
                            className="w-full bg-bgDark border border-cardBorder rounded-xl p-3 text-sm focus:border-primary focus:outline-none font-medium"
                            placeholder="Title of concept..."
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />
                        <textarea
                            className="w-full bg-bgDark border border-cardBorder rounded-xl p-3 text-sm focus:border-primary focus:outline-none h-24 resize-none"
                            placeholder="Quick description or starting point..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                        <div className="grid grid-cols-2 gap-3">
                             <input className="bg-bgDark border border-cardBorder rounded-lg p-2 text-xs focus:border-primary outline-none" placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} />
                             <select value={difficulty} onChange={e => setDifficulty(e.target.value as any)} className="bg-bgDark border border-cardBorder rounded-lg p-2 text-xs text-slate-300 outline-none">
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                             </select>
                        </div>
                        <button onClick={handleManualAdd} disabled={!title.trim()} className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-white py-3 rounded-xl text-sm font-bold shadow-xl shadow-primary/20 transition-all">+ Add to Schedule</button>
                    </div>
                )}
            </div>

            <div className="bg-cardBg border border-cardBorder rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-xs uppercase tracking-widest text-slate-500">Upcoming Reviews</h3>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold">{upcomingTopics.length}</span>
                </div>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {upcomingTopics.length === 0 && <div className="text-xs text-slate-500 italic text-center py-4">Horizon is clear.</div>}
                    {upcomingTopics.map(t => (
                        <div key={t.id} className="p-3 bg-bgDark/30 border border-white/5 rounded-xl flex justify-between items-center group">
                             <div className="min-w-0">
                                <div className="text-sm font-bold text-slate-300 truncate">{t.title}</div>
                                <div className="text-[10px] text-slate-600 font-bold uppercase tracking-wider mt-0.5">{new Date(t.nextReviewDate!).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</div>
                             </div>
                             <button onClick={() => deleteTopic(t.id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-600 hover:text-red-400 transition-all"><Trash2 size={12} /></button>
                        </div>
                    ))}
                </div>
            </div>

            {masteredTopics.length > 0 && (
                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-6">
                    <h3 className="font-bold text-xs uppercase tracking-widest text-yellow-500 mb-3 flex items-center gap-2"><Trophy size={14} /> Mastered Vault</h3>
                    <div className="space-y-2">
                       {masteredTopics.slice(0, 5).map(t => (
                          <div key={t.id} className="text-xs text-slate-400 flex justify-between border-b border-yellow-500/10 pb-2">
                             <span className="font-medium">{t.title}</span>
                             <span className="font-bold text-yellow-500/50">{t.totalMinutes}m</span>
                          </div>
                       ))}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
});
