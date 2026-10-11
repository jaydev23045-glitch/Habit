import { useState, useCallback, useRef } from 'react';
import { parseVoiceCommand } from '../services/aiService';
import { audioService } from '../services/audioService';
import { voiceService } from '../services/voiceService';
import { MultiVoiceResult } from '../types';

export interface VoiceContext {
  habitTitles?: string[];
  todayDate?: string;
  language?: string;
}

export function useVoiceToTask(
  apiKey?: string, 
  onResult?: (res: MultiVoiceResult) => void,
  context?: VoiceContext
) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const accumulatedRef = useRef<string>('');
  const shouldContinueRef = useRef<boolean>(false);
  const silenceTimerRef = useRef<any>(null);

  const processCommand = async (text: string) => {
    if (!text.trim() || !apiKey) return;
    
    setIsProcessing(true);
    try {
      const result = await parseVoiceCommand(text, apiKey, context);
      if (result && onResult) {
        onResult(result);
      }
      setIsProcessing(false);
      audioService.playSuccess();
    } catch (e: any) {
      console.error(e);
      setIsProcessing(false);
      
      if (e.message === "NETWORK_TIMEOUT" || !navigator.onLine) {
        voiceService.speak("Network connection is slow. Please check your connection or try again.");
      } else {
        voiceService.speak("AI processing completed with warning. Please repeat clearly.");
      }
    }
  };

  const stopListening = useCallback(() => {
    shouldContinueRef.current = false;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(async () => {
    if (!apiKey) {
      alert("Please configure your Gemini API Key in Settings first!");
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
    accumulatedRef.current = '';
    shouldContinueRef.current = true;
    
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true; // Listen continuously without 10-second cutoffs
    recognitionRef.current.interimResults = true;
    
    // Choose speech language: user preference or Indian English / Gujarati / Hindi
    const activeLang = context?.language || (typeof localStorage !== 'undefined' ? localStorage.getItem('flow-os-voice-lang') : '') || 'en-IN';
    recognitionRef.current.lang = activeLang;

    recognitionRef.current.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          accumulatedRef.current += ' ' + event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      const fullText = (accumulatedRef.current + ' ' + interim).trim();
      setTranscript(fullText);

      // Generous 5-second silence buffer before auto-submitting
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        if (shouldContinueRef.current && accumulatedRef.current.trim()) {
          stopListening();
        }
      }, 5000);
    };

    recognitionRef.current.onerror = (event: any) => {
      console.warn("Speech recognition notice:", event.error);
      if (event.error === 'no-speech') {
        // Normal pause, keep listening
        return;
      }
      setIsListening(false);
      shouldContinueRef.current = false;
    };

    recognitionRef.current.onend = async () => {
      if (shouldContinueRef.current) {
        // Mobile browser edge-case: auto-restart to prevent premature cutoff
        try {
          recognitionRef.current.start();
          return;
        } catch (e) {}
      }
      
      setIsListening(false);
      const textToProcess = accumulatedRef.current.trim();
      if (textToProcess) {
        await processCommand(textToProcess);
      }
    };

    try {
      recognitionRef.current.start();
    } catch (e) {
      console.error(e);
    }
  }, [apiKey, context, stopListening]);

  return {
    isListening,
    transcript,
    isProcessing,
    startListening,
    stopListening
  };
}
