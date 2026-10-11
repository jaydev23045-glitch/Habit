
import { GoogleGenAI, Modality } from "@google/genai";

class VoiceService {
  private audioCtx: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private isSpeaking: boolean = false;
  private apiKey: string = '';

  public setApiKey(key: string) {
    this.apiKey = key?.trim();
  }

  private initAudio() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  private decodeBase64(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  private async decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length;
    const buffer = ctx.createBuffer(1, frameCount, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  }

  /**
   * Stops any current narration immediately.
   */
  stop() {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch (e) {}
      this.currentSource = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    this.isSpeaking = false;
  }

  /**
   * Speaks the provided text with detailed AI voice or authentic J.A.R.V.I.S fallback.
   */
  async speak(text: string, voiceName: 'Kore' | 'Puck' | 'Zephyr' = 'Zephyr', customKey?: string) {
    if (!text?.trim()) return;
    
    if (this.isSpeaking) {
      this.stop();
    }

    const effectiveKey = customKey || this.apiKey || (typeof localStorage !== 'undefined' ? localStorage.getItem('flow-os-unlocked-key') : '') || process.env.API_KEY;

    // 1. Try Gemini High-Definition TTS if an API key is available
    if (effectiveKey) {
      try {
        this.initAudio();
        this.isSpeaking = true;
        const ai = new GoogleGenAI({ apiKey: effectiveKey });
        
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName },
              },
            },
          },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio && this.audioCtx) {
          const audioBytes = this.decodeBase64(base64Audio);
          const audioBuffer = await this.decodeAudioData(audioBytes, this.audioCtx);
          
          this.stop();
          this.isSpeaking = true; 
          
          const source = this.audioCtx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(this.audioCtx.destination);
          
          return new Promise<void>((resolve) => {
            source.onended = () => {
              this.isSpeaking = false;
              this.currentSource = null;
              resolve();
            };
            
            this.currentSource = source;
            source.start();
          });
        }
      } catch (geminiError) {
        console.warn("Gemini TTS fallback to native speech:", geminiError);
      }
    }

    // 2. Intelligent Multilingual Browser SpeechSynthesis (J.A.R.V.I.S Engine)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Detect language script: Hindi, Gujarati, or English
        const isHindi = /[\u0900-\u097F]/.test(text);
        const isGujarati = /[\u0A80-\u0AFF]/.test(text);
        
        const voices = window.speechSynthesis.getVoices();
        
        if (isGujarati) {
          utterance.lang = 'gu-IN';
          const guVoice = voices.find(v => v.lang.includes('gu') || v.lang.includes('hi'));
          if (guVoice) utterance.voice = guVoice;
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
        } else if (isHindi) {
          utterance.lang = 'hi-IN';
          const hiVoice = voices.find(v => v.lang.includes('hi'));
          if (hiVoice) utterance.voice = hiVoice;
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
        } else {
          // J.A.R.V.I.S British Sophisticated Tone
          utterance.lang = 'en-GB';
          const jarvisVoice = voices.find(v => 
            (v.lang.includes('en-GB') || v.lang.includes('en_GB')) && (v.name.includes('Male') || v.name.includes('Daniel') || v.name.includes('George') || v.name.includes('Oliver') || v.name.includes('Arthur'))
          ) || voices.find(v => v.lang.includes('en-GB')) || voices.find(v => v.lang.includes('en-IN')) || voices[0];
          
          if (jarvisVoice) utterance.voice = jarvisVoice;
          utterance.rate = 1.0; // Steady, calm
          utterance.pitch = 0.92; // Slightly deeper, refined British AI resonance
        }

        window.speechSynthesis.speak(utterance);
      } catch (synthErr) {
        console.error("SpeechSynthesis error:", synthErr);
      }
    }
  }
}

export const voiceService = new VoiceService();
