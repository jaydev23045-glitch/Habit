
import { useEffect, useRef } from 'react';
import { Task } from '../types';

export const useVoiceSentinel = (tasks: Task[], voiceEnabled: boolean) => {
  const processedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!voiceEnabled) return;

    const checkProtocols = () => {
      const now = new Date();
      // Ensure we are comparing today's tasks
      const todayStr = now.toISOString().split('T')[0];
      
      tasks.forEach(task => {
        // Skip completed, or tasks not for today, or tasks without time
        if (task.completed || !task.time || task.date !== todayStr) return;
        
        const [tHours, tMinutes] = task.time.split(':').map(Number);
        const taskTime = new Date(now);
        taskTime.setHours(tHours, tMinutes, 0, 0);

        const diffMs = taskTime.getTime() - now.getTime();
        const diffMinutes = Math.floor(diffMs / 60000);

        // T-Minus 15 Minutes (Between 14 and 15 mins)
        if (diffMinutes === 15 && !processedRef.current.has(`${task.id}-15`)) {
           speak(`Advisory. Protocol "${task.title}" commences in 15 minutes. Prepare workspace.`);
           processedRef.current.add(`${task.id}-15`);
        }

        // T-Minus 5 Minutes (Between 4 and 5 mins)
        if (diffMinutes === 5 && !processedRef.current.has(`${task.id}-5`)) {
           speak(`Warning. Protocol "${task.title}" imminent. T-minus 5 minutes.`);
           processedRef.current.add(`${task.id}-5`);
        }

        // Start (Between -1 and 1 min)
        if (diffMinutes === 0 && !processedRef.current.has(`${task.id}-0`)) {
           speak(`Attention Operator. The time is ${task.time}. Protocol "${task.title}" is now active. Execute immediately.`);
           processedRef.current.add(`${task.id}-0`);
           
           // Backup Notification if browser supports it
           if ("Notification" in window && Notification.permission === 'granted') {
             new Notification(`Flow OS: ${task.title}`, { body: "Protocol Active. Execute." });
           }
        }
      });
    };

    // Run check every 10 seconds
    const interval = setInterval(checkProtocols, 10000); 
    
    // Initial check
    checkProtocols();

    return () => clearInterval(interval);
  }, [tasks, voiceEnabled]);

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    
    // Cancel any current speaking to prioritize the alert
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    
    // Try to find a robotic or distinct voice (Google US English is often good, or generic)
    const preferredVoice = voices.find(v => v.name.includes('Google US English')) || 
                           voices.find(v => v.name.includes('Samantha')) || 
                           voices[0];
                           
    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.rate = 1.05; // Slightly faster for urgency
    utterance.pitch = 0.9; // Slightly lower for authority
    
    window.speechSynthesis.speak(utterance);
  };
};
