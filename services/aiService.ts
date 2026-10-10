import { GoogleGenAI } from '@google/genai';

export const parseVoiceCommand = async (transcript: string, apiKey: string) => {
  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
You are a highly intelligent productivity assistant. The user just spoke a voice command.
User transcript: "${transcript}"
Current Date: ${new Date().toISOString().split('T')[0]}

Your job is to parse this command into a strict JSON object.
Allowed actions:
- TASK: Add a new task (e.g., "Remind me to call Mom at 5pm", "Buy groceries tomorrow")
- HABIT: Add a new habit (e.g., "I want to start running every day")
- WORK_SESSION: Log a completed work session (e.g., "I just worked on coding for 45 minutes")
- UNKNOWN: Cannot determine the intent.

Return ONLY valid JSON (no markdown formatting, no backticks).
Format:
{
  "type": "TASK" | "HABIT" | "WORK_SESSION" | "UNKNOWN",
  "title": "String title of task/habit/work",
  "time": "HH:MM format if specified for task, else omit",
  "duration": "Number of minutes for work session, else omit"
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
    console.error("Gemini Parse Error:", err);
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
