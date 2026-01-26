
import React, { useState, useRef } from 'react';
import { RenderJob } from '../types';
import { gemini } from '../geminiService';

interface ImageToVideoProps {
  onAddJob: (job: RenderJob) => void;
}

const ImageToVideo: React.FC<ImageToVideoProps> = ({ onAddJob }) => {
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ensureApiKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio && !(await aistudio.hasSelectedApiKey())) {
      await aistudio.openSelectKey();
    }
    return true;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const startGeneration = async () => {
    if (!prompt) return;
    
    setIsGenerating(true);
    setProgressMsg("Checking credentials...");
    
    try {
      await ensureApiKey();
      
      setProgressMsg("Submitting generation request to Veo...");
      const operation = await gemini.generateVideo(prompt, image || undefined, aspectRatio);
      
      const jobId = `job_${Date.now()}`;
      onAddJob({
        id: jobId,
        type: 'image2video',
        status: 'processing',
        progress: 10,
        createdAt: new Date().toISOString(),
        prompt: prompt
      });

      setProgressMsg("AI is thinking... Video generation typically takes 1-2 minutes.");
      const result = await gemini.pollVideoOperation(operation);
      
      const downloadLink = result.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const blob = await videoResponse.blob();
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
        setProgressMsg("Generation complete!");
      } else {
        throw new Error("No video URI in response");
      }
    } catch (err: any) {
      console.error("Video Generation Error Detail:", err);
      
      const errorMsg = err.message || JSON.stringify(err);
      const isPermissionError = errorMsg.includes("PERMISSION_DENIED") || errorMsg.includes("403") || errorMsg.includes("permission");
      const isNotFoundError = errorMsg.includes("Requested entity was not found");

      if (isPermissionError || isNotFoundError) {
        setProgressMsg("Access Denied. You must select a PAID API key with Veo permissions.");
        const aistudio = (window as any).aistudio;
        if (aistudio) {
          setTimeout(async () => {
            await aistudio.openSelectKey();
          }, 2000);
        }
      } else {
        setProgressMsg("Error: " + errorMsg);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
      <div className="space-y-6">
        <div className="glass-effect rounded-xl p-6">
          <h3 className="text-lg font-bold text-[#D4AF37] mb-4 flex items-center gap-2">
            <i className="fas fa-image"></i> Source Image
          </h3>
          {!image ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gold/30 rounded-lg p-10 text-center cursor-pointer hover:border-gold transition group"
            >
              <i className="fas fa-cloud-upload-alt text-4xl text-[#D4AF37] mb-4"></i>
              <p className="text-[#D4AF37] font-semibold mb-2">Upload Image</p>
              <p className="text-[#F5F5DC]/60 text-xs">Recommended for consistency</p>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            </div>
          ) : (
            <div className="relative">
              <img src={image} alt="Preview" className="w-full h-48 object-cover rounded-lg border border-gold/20" />
              <button 
                onClick={() => setImage(null)}
                className="absolute top-2 right-2 bg-black/50 hover:bg-red-500/50 text-white w-8 h-8 rounded-full flex items-center justify-center transition"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          )}
        </div>

        <div className="glass-effect rounded-xl p-6">
          <h3 className="text-lg font-bold text-[#D4AF37] mb-4 flex items-center gap-2">
            <i className="fas fa-magic"></i> Motion Prompt
          </h3>
          <textarea 
            className="w-full bg-[#1A1A1A] border border-gold/30 rounded-lg p-4 text-[#F5F5DC] focus:border-gold focus:outline-none h-32 resize-none"
            placeholder="e.g. 'A cinematic slow zoom into the character's face with dramatic shadows shifting across the background'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <div className="glass-effect rounded-xl p-6">
          <h3 className="text-lg font-bold text-[#D4AF37] mb-4">Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-[#F5F5DC]/60 mb-2 uppercase">Aspect Ratio</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setAspectRatio('16:9')} className={`py-2 rounded border ${aspectRatio === '16:9' ? 'border-gold bg-gold/10 text-gold' : 'border-gold/20 text-[#F5F5DC]/60'}`}>16:9</button>
                <button onClick={() => setAspectRatio('9:16')} className={`py-2 rounded border ${aspectRatio === '9:16' ? 'border-gold bg-gold/10 text-gold' : 'border-gold/20 text-[#F5F5DC]/60'}`}>9:16</button>
              </div>
            </div>
            <button 
              onClick={startGeneration}
              disabled={isGenerating || !prompt}
              className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-bold py-3 rounded-lg disabled:opacity-50"
            >
              {isGenerating ? <i className="fas fa-circle-notch animate-spin mr-2"></i> : null}
              {isGenerating ? 'Rendering...' : 'Generate 1080p Video'}
            </button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <div className="glass-effect rounded-xl p-6 min-h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-[#D4AF37]">Studio Output</h3>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-xs text-gold/60 underline hover:text-gold transition">
               Learn about Paid Billing
            </a>
          </div>
          <div className={`flex-1 rounded-lg border border-gold/20 relative overflow-hidden bg-black flex items-center justify-center ${aspectRatio === '9:16' ? 'aspect-[9/16] mx-auto' : 'aspect-video'}`}>
            {isGenerating ? (
              <div className="text-center px-6">
                <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                <p className="text-[#D4AF37] font-bold pulse-gold">{progressMsg}</p>
                <p className="text-xs text-white/40 mt-4 italic">Note: Veo models require a paid Tier API key from a project with billing enabled.</p>
              </div>
            ) : videoUrl ? (
              <video src={videoUrl} controls autoPlay loop className="w-full h-full object-contain" />
            ) : (
              <div className="text-center text-[#F5F5DC]/20">
                <i className="fas fa-play-circle text-7xl mb-4"></i>
                <p>Output will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageToVideo;
