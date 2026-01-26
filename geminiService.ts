
import { GoogleGenAI, Modality } from "@google/genai";

export class GeminiService {
  private getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  /**
   * Starts a new chat session for the AI Assistant.
   */
  async startAssistantChat() {
    const ai = this.getAI();
    return ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: `You are the SHARJAYS Studio Co-Pilot, a world-class AI Assistant specialized in cinematic video production and realistic lip-sync animation. 
        Your goal is to help users create high-end content using the studio's tools:
        1. Image to Video: Uses Veo 3.1 for 1080p cinematic motion.
        2. Lip-Sync: Uses neural TTS and facial animation for long scripts.
        
        When asked for prompts, be extremely descriptive, focusing on lighting (chiaroscuro, volumetric), camera movement (dolly zoom, pan, tilt), and texture.
        When asked for scripts, ensure the tone matches the requested vocal signature (Kore, Zephyr, etc.).
        Keep responses concise, professional, and helpful. Always maintain the luxurious 'Hear The Truth' brand identity.`,
      },
    });
  }

  /**
   * Generates or extends video from prompt and optional image/video.
   */
  async generateVideo(
    prompt: string, 
    imageBase64?: string, 
    previousVideo?: any,
    aspectRatio: '16:9' | '9:16' = '16:9'
  ) {
    const ai = this.getAI();
    const modelName = previousVideo ? 'veo-3.1-generate-preview' : 'veo-3.1-fast-generate-preview';
    const resolution = previousVideo ? '720p' : '1080p';
    
    const payload: any = {
      model: modelName,
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: resolution,
        aspectRatio: aspectRatio
      }
    };

    if (previousVideo) {
      payload.video = previousVideo;
    } else if (imageBase64) {
      payload.image = {
        imageBytes: imageBase64.split(',')[1],
        mimeType: 'image/png'
      };
    }

    return await ai.models.generateVideos(payload);
  }

  async pollVideoOperation(operation: any) {
    const ai = this.getAI();
    let currentOp = operation;
    while (!currentOp.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      currentOp = await ai.operations.getVideosOperation({ operation: currentOp });
    }
    return currentOp;
  }

  async generateTTS(text: string, voiceName: string = 'Kore') {
    if (!text || text.trim().length === 0) throw new Error("TTS script segment is empty.");
    const ai = this.getAI();
    const ttsPrompt = `Please say the following text clearly: ${text}`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: ttsPrompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName }
          }
        }
      }
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    const base64Audio = part?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned from Gemini TTS API.");
    return base64Audio;
  }

  async decodePCM(base64: string, sampleRate: number = 24000): Promise<AudioBuffer> {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
    const dataInt16 = new Int16Array(bytes.buffer);
    const buffer = audioCtx.createBuffer(1, dataInt16.length, sampleRate);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
    return buffer;
  }

  splitScript(text: string, maxLength: number = 150): string[] {
    if (!text) return [];
    const sentences = text.match(/[^.!?]+[.!?]?(?:\s|$)/g) || [text];
    const chunks: string[] = [];
    let currentChunk = "";
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (!trimmed) continue;
      if ((currentChunk + trimmed).length > maxLength && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = trimmed;
      } else {
        currentChunk += (currentChunk ? " " : "") + trimmed;
      }
    }
    if (currentChunk.trim().length > 0) chunks.push(currentChunk.trim());
    return chunks.filter(c => c.length > 0);
  }
}

export const gemini = new GeminiService();
