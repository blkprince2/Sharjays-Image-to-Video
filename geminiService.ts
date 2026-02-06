import { GoogleGenAI, Modality, Type } from "@google/genai";

export class GeminiService {
  private getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async startAssistantChat() {
    const ai = this.getAI();
    return ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: `You are the SHARJAYS Studio Co-Pilot. Help users with cinematic production. 
        Focus on descriptive lighting and camera instructions. Use Google Search for trends.`,
        tools: [{ googleSearch: {} }]
      },
    });
  }

  /**
   * Uses AI to intelligently split a script into chunks suitable for video extension.
   * Splits at natural pauses and sentence endings.
   */
  async intelligentlySplitScript(text: string): Promise<string[]> {
    try {
      const ai = this.getAI();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Split the following script into logical segments for a lip-sync video. 
        Each segment should be between 10 and 25 words. 
        Split at natural pauses, commas, or ends of sentences.
        Return only the segments as a JSON array of strings.
        
        Script: "${text}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });

      const result = JSON.parse(response.text || "[]");
      return Array.isArray(result) ? result : [text];
    } catch (err) {
      console.warn("AI Splitter failed, falling back to regex.", err);
      return this.splitScript(text);
    }
  }

  private async handleApiError(err: any): Promise<never> {
    const errorMessage = typeof err === 'string' ? err : (err.message || JSON.stringify(err));
    const status = err.status || (err.error?.code);

    if (errorMessage.toLowerCase().includes("quota") || errorMessage.includes("RESOURCE_EXHAUSTED") || status === 429) {
      if (window.aistudio?.openSelectKey) await window.aistudio.openSelectKey();
      throw new Error("Quota Exhausted. Veo models require a API key from a PAID Google Cloud project. Check billing at ai.google.dev/gemini-api/docs/billing");
    }

    if (errorMessage.includes("Requested entity was not found") || status === 400) {
      if (window.aistudio?.openSelectKey) await window.aistudio.openSelectKey();
      throw new Error("API Key expired or invalid. Please re-select a valid paid API key.");
    }

    throw new Error(errorMessage || "An unexpected error occurred.");
  }

  /**
   * Generates or extends video. Handles the "AI Stitch" by passing a previous video reference.
   */
  async generateVideo(
    prompt: string, 
    imageBase64?: string, 
    previousVideoRef?: any,
    aspectRatio: '16:9' | '9:16' = '16:9'
  ) {
    try {
      const ai = this.getAI();
      // Extension uses 'veo-3.1-generate-preview', Initial uses 'veo-3.1-fast-generate-preview'
      const modelName = previousVideoRef ? 'veo-3.1-generate-preview' : 'veo-3.1-fast-generate-preview';
      
      const payload: any = {
        model: modelName,
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p', // Extension requires 720p
          aspectRatio: aspectRatio
        }
      };

      if (previousVideoRef) {
        payload.video = previousVideoRef;
      } else if (imageBase64) {
        payload.image = {
          imageBytes: imageBase64.split(',')[1],
          mimeType: 'image/png'
        };
      }

      return await ai.models.generateVideos(payload);
    } catch (err: any) {
      return await this.handleApiError(err);
    }
  }

  async pollVideoOperation(operation: any) {
    const ai = this.getAI();
    let currentOp = operation;
    let attempts = 0;
    
    while (!currentOp.done) {
      const waitTime = Math.min(10000 + (attempts * 2000), 20000);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      try {
        currentOp = await ai.operations.getVideosOperation({ operation: currentOp });
        attempts++;
      } catch (err: any) {
        return await this.handleApiError(err);
      }
    }

    if (currentOp.error) return await this.handleApiError(currentOp.error);
    return currentOp;
  }

  splitScript(text: string, maxLength: number = 180): string[] {
    if (!text) return [];
    const sentences = text.match(/[^.!?]+[.!?]?(?:\s|$)/g) || [text];
    const chunks: string[] = [];
    let current = "";
    for (const s of sentences) {
      if ((current + s).length > maxLength && current.length > 0) {
        chunks.push(current.trim());
        current = s;
      } else {
        current += (current ? " " : "") + s;
      }
    }
    if (current) chunks.push(current.trim());
    return chunks;
  }
}

export const gemini = new GeminiService();