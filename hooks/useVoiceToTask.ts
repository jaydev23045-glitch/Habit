import { useState, useCallback, useRef } from 'react';
import { parseVoiceCommand } from '../services/aiService';
import { audioService } from '../services/audioService';
import { voiceService } from '../services/voiceService';

export interface VoiceCommandResult {
  type: 'TASK' | 'HABIT' | 'WORK_SESSION' | 'UNKNOWN';
  title?: string;
  time?: string;
  duration?: number;
}

export function useVoiceToTask(apiKey?: string, onResult?: (res: VoiceCommandResult) => void) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(async () => {
    if (!apiKey) {
      alert("Please enter a Gemini API Key in Settings first!");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser. Please use Chrome or Safari.");
      return;
    }

    audioService.playAction();
    setIsListening(true);
    setTranscript('');
    
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    let finalStr = '';

    recognitionRef.current.onresult = (event: any) => {
      let current = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        current += event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalStr += event.results[i][0].transcript;
        }
      }
      setTranscript(finalStr || current);
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognitionRef.current.onend = async () => {
      setIsListening(false);
      if (finalStr.trim()) {
        await processCommand(finalStr.trim());
      }
    };

    recognitionRef.current.start();
  }, [apiKey]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const processCommand = async (text: string) => {
    if (!text.trim() || !apiKey) return;
    
    setIsProcessing(true);
    try {
      const result = await parseVoiceCommand(text, apiKey);
      if (result && onResult) {
        onResult(result as VoiceCommandResult);
      }
      setIsProcessing(false);
      audioService.playSuccess();
    } catch (e: any) {
      console.error(e);
      setIsProcessing(false);
      
      if (e.message === "NETWORK_TIMEOUT" || !navigator.onLine) {
        voiceService.speak("Network connection is too slow. Please log your task manually for now.");
      } else {
        voiceService.speak("AI processing failed. Check your API key or try again later.");
      }
    }
  };

  return {
    isListening,
    transcript,
    isProcessing,
    startListening,
    stopListening
  };
}
