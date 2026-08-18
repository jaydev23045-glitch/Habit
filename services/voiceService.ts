
import { GoogleGenAI, Modality } from "@google/genai";

class VoiceService {
  private audioCtx: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private isSpeaking: boolean = false;

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
    this.isSpeaking = false;
  }

  /**
   * Speaks the provided text with detailed AI voice.
   * Handles overlapping calls by stopping previous narration.
   */
  async speak(text: string, voiceName: 'Kore' | 'Puck' | 'Zephyr' = 'Zephyr') {
    if (!text) return;
    
    // If already speaking, stop current to allow new narration (or queue if desired)
    if (this.isSpeaking) {
      this.stop();
    }

    try {
      this.initAudio();
      this.isSpeaking = true;
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
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
        
        // Final safety stop before starting new buffer
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
      } else {
        this.isSpeaking = false;
      }
    } catch (error) {
      console.error("Voice Engine Failure:", error);
      this.isSpeaking = false;
    }
  }
}

export const voiceService = new VoiceService();
