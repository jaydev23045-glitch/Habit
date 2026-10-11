import { GoogleGenAI } from '@google/genai';
import { MultiVoiceResult } from '../types';

export const parseVoiceCommand = async (
  transcript: string, 
  apiKey: string,
  context?: { habitTitles?: string[]; todayDate?: string }
): Promise<MultiVoiceResult> => {
  const ai = new GoogleGenAI({ apiKey });
  const today = context?.todayDate || new Date().toISOString().split('T')[0];
  const habitList = (context?.habitTitles || []).join(', ');
  
  const prompt = `
You are J.A.R.V.I.S., an elite neural productivity assistant for Flow OS.
The user just spoke a natural stream-of-consciousness voice command or brain dump.
Transcript: "${transcript}"
Current Date: ${today}
Registered Habits: [${habitList}]

Your goal is to parse EVERY distinct intent from this speech into a single structured JSON object.

Capabilities:
1. "tasksToAdd": Any tasks or reminders to schedule. Infer relative dates ("tomorrow", "tonight", "next Monday") into YYYY-MM-DD. Infer 24-hr time (HH:MM) if mentioned. Infer priority ('high' | 'medium' | 'low').
2. "habitsToComplete": Any mention of completing or having done an existing habit (e.g. "finished my run", "did meditation", "read for 20 mins"). Match exact registered habit title from the list.
3. "habitsToAdd": Any intent to build a new habit (e.g. "I want to start cold showers"). Assign attribute: 'STR' | 'INT' | 'WIL' | 'FOC' | 'REC'.
4. "workSessionToLog": If they completed a work sprint (e.g. "worked on code for 45 mins"), extract title and duration in minutes.
5. "reflectionNote": Any mental state or sentiment note (e.g. "feeling energized", "feeling tired") to append to their daily review.
6. "aiVoiceResponse": A crisp, natural, professional 1-2 sentence spoken reply from J.A.R.V.I.S confirming what was accomplished (e.g. "Checked off your run, scheduled financial deck for tomorrow at 3 PM, and recorded your reflection."). DO NOT use markdown, emojis, or bullet points in aiVoiceResponse.

Return ONLY raw valid JSON (no markdown formatting, no backticks).
Format:
{
  "tasksToAdd": [ { "title": "...", "time": "HH:MM", "date": "YYYY-MM-DD", "priority": "medium" } ],
  "habitsToComplete": [ "Title" ],
  "habitsToAdd": [ { "title": "...", "attribute": "WIL" } ],
  "workSessionToLog": { "title": "...", "durationMinutes": 45 },
  "reflectionNote": "...",
  "aiVoiceResponse": "..."
}
`;

  try {
    const apiCall = ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    // 8 second timeout for slow internet
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("NETWORK_TIMEOUT")), 8000)
    );
    
    const response = await Promise.race([apiCall, timeoutPromise]) as any;
    
    const text = response.text || '';
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (err: any) {
    console.error("Gemini Multi-Entity Parse Error:", err);
    throw err;
  }
};

export const generateDailyDebrief = async (userData: any, apiKey: string) => {
  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
You are an advanced, hyper-intelligent AI assistant named J.A.R.V.I.S.
The user just booted up their system for the first time today.

Here is their current data state:
- Name: ${userData.name}
- Level: ${Math.floor(userData.xp / 100) + 1}
- Today's Tasks: ${userData.tasks.filter((t: any) => !t.completed).length} active
- Active Habits: ${userData.habits.length}
- Current Date: ${new Date().toISOString().split('T')[0]}

Generate a short, punchy 2-sentence morning greeting. 
Acknowledge their level, tasks, or a random insight. Be extremely professional, concise, and futuristic.
Do NOT use markdown. Do NOT use emojis. Just return the raw text to be spoken by a text-to-speech engine.
`;

  try {
    const apiCall = ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("NETWORK_TIMEOUT")), 8000)
    );
    
    const response = await Promise.race([apiCall, timeoutPromise]) as any;
    return response.text || "Good morning. System is online and ready.";
  } catch (err: any) {
    console.error("Debrief Generation Error:", err);
    throw err;
  }
};
