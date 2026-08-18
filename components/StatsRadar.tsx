
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { UserStats } from '../types';

interface StatsRadarProps {
  stats: UserStats;
}

export const StatsRadar: React.FC<StatsRadarProps> = ({ stats }) => {
  const data = [
    { subject: 'STR', A: stats.STR, fullMark: 100 },
    { subject: 'INT', A: stats.INT, fullMark: 100 },
    { subject: 'WIL', A: stats.WIL, fullMark: 100 },
    { subject: 'REC', A: stats.REC, fullMark: 100 },
    { subject: 'FOC', A: stats.FOC, fullMark: 100 },
  ];

  return (
    <div className="w-full h-64 relative">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: '900' }} 
          />
          <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const stat = payload[0].payload;
                const descMap: Record<string, string> = {
                  STR: 'Strength — physical activity & workout persistence',
                  INT: 'Intellect — reading, learning & research dedication',
                  WIL: 'Willpower — consistent positive habits maintenance',
                  REC: 'Recovery — quality sleep, rest & mindfulness',
                  FOC: 'Focus — deep focus work & pomodoro sessions'
                };
                return (
                  <div className="bg-bgDarker/95 border border-primary/20 p-3.5 rounded-2xl shadow-2xl backdrop-blur-md max-w-[200px] text-left">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-white uppercase tracking-widest">{stat.subject}</span>
                      <span className="text-sm font-black text-emerald-400">{stat.A}</span>
                    </div>
                    <p className="text-[9px] text-slate-400 leading-normal">{descMap[stat.subject]}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Radar
            name="Stats"
            dataKey="A"
            stroke="#10b981"
            strokeWidth={2}
            fill="#10b981"
            fillOpacity={0.4}
          />
        </RadarChart>
      </ResponsiveContainer>
      
      {/* Decorative Corners */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-emerald-500/50"></div>
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-emerald-500/50"></div>
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-emerald-500/50"></div>
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-emerald-500/50"></div>
    </div>
  );
};
