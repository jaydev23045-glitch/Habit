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
