
import React, { useState } from 'react';
import { AppData, Task } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { History, Clock, ArrowUpRight, ArrowDownRight, Minus, BookOpen, GraduationCap, FileSpreadsheet, Calendar, Printer } from 'lucide-react';
import { audioService } from '../services/audioService';

interface ReportsProps {
  data: AppData;
}

export const Reports: React.FC<ReportsProps> = ({ data }) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'custom'>('week');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // AGGREGATE DATA
  // Combine archived and current tasks - with safety
  const allTasks = [...(data?.archivedTasks || []), ...(data?.tasks || [])];
  const completedTasks = allTasks.filter(t => t && t.completed && t.date);

  // Generate chart data based on timeRange
  const generateChartData = () => {
    const result = [];
    if (timeRange === 'custom') {
      const start = new Date(startDate + 'T00:00:00Z');
      const end = new Date(endDate + 'T00:00:00Z');
      const limitDays = 90;
      let current = new Date(start);
      let count = 0;

      while (current <= end && count < limitDays) {
        const dateStr = current.toISOString().split('T')[0];
        const daysTasks = completedTasks.filter(t => t?.date === dateStr);
        const daysSessions = (data?.workSessions || []).filter(s => s && s.startedAt && s.startedAt.split('T')[0] === dateStr);
        
        const taskHours = daysTasks.reduce((acc, t) => acc + (t?.actualDuration || 0), 0) / 60;
        const sessionHours = daysSessions.reduce((acc, s) => acc + (s?.durationSeconds || 0), 0) / 3600;
        const focusHours = taskHours + sessionHours;
        
        result.push({
          name: current.toLocaleDateString('en-US', {month: 'short', day: 'numeric'}),
          fullDate: dateStr,
          focus: parseFloat(focusHours.toFixed(1)),
          tasks: daysTasks.length
        });

        current.setUTCDate(current.getUTCDate() + 1);
        count++;
      }
    } else {
      const days = timeRange === 'week' ? 7 : 30;
      const today = new Date();

      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        
        const daysTasks = completedTasks.filter(t => t?.date === dateStr);
        const daysSessions = (data?.workSessions || []).filter(s => s && s.startedAt && s.startedAt.split('T')[0] === dateStr);
        
        const taskHours = daysTasks.reduce((acc, t) => acc + (t?.actualDuration || 0), 0) / 60;
        const sessionHours = daysSessions.reduce((acc, s) => acc + (s?.durationSeconds || 0), 0) / 3600;
        const focusHours = taskHours + sessionHours;
        
        result.push({
          name: timeRange === 'week' ? d.toLocaleDateString('en-US', {weekday: 'short'}) : d.getDate().toString(),
          fullDate: dateStr,
          focus: parseFloat(focusHours.toFixed(1)),
          tasks: daysTasks.length
        });
      }
    }
    return result;
  };

  const chartData = generateChartData();

  const exportToCSV = () => {
    const headers = ['Date', 'Completed Tasks Count', 'Focus Time (Minutes)'];
    const rows = chartData.map(d => [
      d.fullDate,
      d.tasks,
      Math.round(d.focus * 60)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `flow-os-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    audioService.playSuccess();
  };

  // Calculate distribution percentages dynamically
  const { taskPercent, learningPercent, stopwatchPercent } = React.useMemo(() => {
    const taskMins = completedTasks.reduce((acc, t) => acc + (t?.actualDuration || 0), 0);
    const learningMins = (data?.topics || []).reduce((acc, t) => acc + (t?.totalMinutes || 0), 0);
    const stopwatchMins = (data?.workSessions || []).reduce((acc, s) => acc + (s?.durationSeconds || 0), 0) / 60;
    const total = taskMins + learningMins + stopwatchMins;

    if (total === 0) {
      return { taskPercent: 0, learningPercent: 0, stopwatchPercent: 0 };
    }

    return {
      taskPercent: Math.round((taskMins / total) * 100),
      learningPercent: Math.round((learningMins / total) * 100),
      stopwatchPercent: Math.round((stopwatchMins / total) * 100)
    };
  }, [completedTasks, data?.topics, data?.workSessions]);

  // Sort completed tasks for list view - with safety
  const recentCompletedTasks = [...completedTasks].sort((a,b) => {
    const dateA = a?.completedAt || a?.date || '';
    const dateB = b?.completedAt || b?.date || '';
    return dateB.localeCompare(dateA);
  });
  
  // Learning Data
  const activeTopics = (data?.topics || []).filter(t => t?.totalMinutes && t.totalMinutes > 0).sort((a,b) => (b?.totalMinutes || 0) - (a?.totalMinutes || 0));

  // Helper to find previous instances
  const getTaskHistory = (currentTask: Task) => {
    if (!currentTask?.title) return [];
    return allTasks.filter(t => 
      t &&
      t.completed && 
      t.actualDuration && 
      t.title.toLowerCase().trim() === currentTask.title.toLowerCase().trim() && 
      t.id !== currentTask.id
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold">Productivity Report</h2>
        
        <div className="flex flex-wrap items-center gap-3">
          {timeRange === 'custom' && (
            <div className="flex items-center gap-2 bg-cardBg border border-cardBorder rounded-xl px-3 py-1.5 animate-slide-in">
              <Calendar size={14} className="text-primary" />
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => e.target.value && setStartDate(e.target.value)} 
                className="bg-transparent text-xs text-white focus:outline-none w-28"
                style={{ colorScheme: 'dark' }}
              />
              <span className="text-slate-600 text-xs">-</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => e.target.value && setEndDate(e.target.value)} 
                className="bg-transparent text-xs text-white focus:outline-none w-28"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          )}

          <div className="flex bg-cardBg rounded-xl p-1 border border-cardBorder h-10">
             <button 
               onClick={() => setTimeRange('week')}
               className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timeRange === 'week' ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'}`}
             >
               Weekly
             </button>
             <button 
               onClick={() => setTimeRange('month')}
               className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timeRange === 'month' ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'}`}
             >
               Monthly
             </button>
             <button 
               onClick={() => setTimeRange('custom')}
               className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timeRange === 'custom' ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'}`}
             >
               Custom
             </button>
          </div>

          <button 
            onClick={exportToCSV}
            title="Export data as CSV"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all h-10"
          >
            <FileSpreadsheet size={16} /> Export CSV
          </button>

          <button 
            onClick={() => window.print()}
            title="Export report as PDF"
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 transition-all h-10 animate-fade-in"
          >
            <Printer size={16} /> Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-cardBg border border-cardBorder p-6 rounded-xl flex flex-col items-center justify-center">
            <div className="text-slate-400 text-xs font-bold uppercase mb-1">Consistency</div>
            <div className="text-3xl font-bold text-primary">
                {chartData.length > 0 ? Math.round((chartData.filter(d => d.tasks > 0).length / chartData.length) * 100) : 0}%
            </div>
         </div>
         <div className="bg-cardBg border border-cardBorder p-6 rounded-xl flex flex-col items-center justify-center">
            <div className="text-slate-400 text-xs font-bold uppercase mb-1">Focus Hours ({timeRange})</div>
            <div className="text-3xl font-bold text-purple-400">
                {Math.round(chartData.reduce((acc, curr) => acc + curr.focus, 0))}h
            </div>
         </div>
         <div className="bg-cardBg border border-cardBorder p-6 rounded-xl flex flex-col items-center justify-center">
            <div className="text-slate-400 text-xs font-bold uppercase mb-1">Total Tasks</div>
            <div className="text-3xl font-bold text-teal-400">
                {chartData.reduce((acc, curr) => acc + curr.tasks, 0)}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Main Chart */}
         <div className="lg:col-span-2 bg-cardBg border border-cardBorder rounded-xl p-6 h-[400px]">
            <h3 className="font-bold mb-6">Activity Overview ({timeRange === 'week' ? 'Last 7 Days' : 'Last 30 Days'})</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }}
                  cursor={{ fill: '#334155', opacity: 0.2 }}
                />
                <Bar dataKey="focus" name="Focus (h)" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="tasks" name="Tasks" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
         </div>

         {/* Heatmap / Distribution */}
         <div className="bg-cardBg border border-cardBorder rounded-xl p-6">
            <h3 className="font-bold mb-6">Focus Distribution</h3>
            <div className="space-y-6">
               <CategoryBar label="Task Execution" percent={taskPercent} color="bg-primary" />
               <CategoryBar label="Spaced Learning" percent={learningPercent} color="bg-purple-500" />
               <CategoryBar label="Stopwatch Sprints" percent={stopwatchPercent} color="bg-emerald-500" />
            </div>

            <div className="mt-8 pt-8 border-t border-cardBorder">
               <h4 className="font-bold text-sm mb-4">Activity Heatmap</h4>
               <div className="flex flex-wrap gap-1.5">
                  {chartData.map((day, i) => (
                    <div 
                      key={i} 
                      title={`${day.fullDate}: ${day.tasks} tasks`}
                      className={`w-3 h-3 rounded-sm ${day.tasks > 4 ? 'bg-primary' : day.tasks > 0 ? 'bg-primary/40' : 'bg-slate-800'}`}
                    ></div>
                  ))}
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Task Time Analysis */}
        <div className="bg-cardBg border border-cardBorder rounded-xl p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <History size={18} className="text-teal-400" /> Recent Activity
          </h3>
          <p className="text-sm text-slate-400 mb-6">Time analysis of recently completed tasks.</p>
          
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {recentCompletedTasks.length === 0 ? (
              <div className="text-center py-6 text-slate-500 italic">Complete tasks to see time analysis.</div>
            ) : (
              recentCompletedTasks.slice(0, 10).map((task, index) => {
                const history = getTaskHistory(task);
                const historyAvg = history.length > 0 
                  ? history.reduce((acc, t) => acc + (t?.actualDuration || 0), 0) / history.length 
                  : 0;
                
                const diff = history.length > 0 ? (task?.actualDuration || 0) - historyAvg : 0;
                
                return (
                  <div key={task?.id || `report-task-${index}`} className="bg-bgDark/50 border border-cardBorder rounded-lg p-3 flex justify-between items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-200 text-sm truncate">{task?.title || 'Untitled'}</div>
                      <div className="text-xs text-slate-500 mt-1">{task?.date || 'No Date'}</div>
                    </div>
                    <div className="text-right">
                       <div className="text-sm font-bold text-white">{task?.actualDuration || '-'}m</div>
                       {history.length > 0 && (
                          <div className={`text-xs font-bold flex items-center justify-end ${diff < 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {diff < 0 ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />} {Math.abs(Math.round(diff))}m
                          </div>
                       )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Learning Analytics */}
        <div className="bg-cardBg border border-cardBorder rounded-xl p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <GraduationCap size={18} className="text-purple-400" /> Learning Analytics
          </h3>
          <p className="text-sm text-slate-400 mb-6">Total time invested in topics.</p>
          
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {activeTopics.length === 0 ? (
              <div className="text-center py-6 text-slate-500 italic">No learning sessions recorded yet.</div>
            ) : (
              activeTopics.map((topic, index) => (
                <div key={topic?.id || `report-topic-${index}`} className="bg-bgDark/50 border border-cardBorder rounded-lg p-3 flex justify-between items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-200 text-sm truncate">{topic?.title || 'Untitled'}</div>
                    <div className="text-xs text-slate-500 mt-1">{(topic?.sessions || []).length} sessions</div>
                  </div>
                  <div className="text-right">
                     <div className="text-sm font-bold text-white flex items-center gap-1">
                        <Clock size={14} className="text-purple-400"/> {topic?.totalMinutes || 0}m
                     </div>
                     {topic?.status === 'mastered' && (
                        <div className="text-xs font-bold text-yellow-400 mt-1">MASTERED</div>
                     )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const CategoryBar = ({ label, percent, color }: { label: string, percent: number, color: string }) => (
  <div>
    <div className="flex justify-between text-sm mb-2">
       <span className="text-slate-300">{label}</span>
       <span className="font-bold text-slate-100">{percent}%</span>
    </div>
    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
       <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }}></div>
    </div>
  </div>
);
