
import { useState, useEffect, useRef, useCallback } from 'react';

export const useSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const synth = window.speechSynthesis;
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const updateVoices = () => {
      setVoices(synth.getVoices());
    };
    
    updateVoices();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = updateVoices;
    }
  }, [synth]);

  const speak = useCallback((text: string) => {
    if (synth.speaking) {
      synth.cancel();
    }

    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Select Voice: Sci-fi preference
    const preferredVoice = voices.find(v => 
      v.name.includes('Google US English') || 
      v.name.includes('Microsoft David') || 
      v.name.includes('Samantha')
    ) || voices[0];

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    // Robotic Tuning
    utterance.pitch = 0.9; // Lower pitch for authority
    utterance.rate = 1.1;  // Slightly faster for efficiency

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synth.speak(utterance);
  }, [synth, voices]);

  const cancel = useCallback(() => {
    synth.cancel();
    setIsSpeaking(false);
  }, [synth]);

  return { speak, cancel, isSpeaking };
};
