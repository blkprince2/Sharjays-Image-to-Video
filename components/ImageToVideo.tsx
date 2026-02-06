import React, { useState, useRef, useEffect } from 'react';
import { RenderJob, Asset } from '../types';
import { gemini } from '../geminiService';
import ModelViewer from './ModelViewer';

interface ImageToVideoProps {
  onAddJob: (job: RenderJob) => void;
  onUpdateJob: (id: string, updates: Partial<RenderJob>) => void;
  onAddAsset: (asset: Asset) => void;
}

const ImageToVideo: React.FC<ImageToVideoProps> = ({ onAddJob, onUpdateJob, onAddAsset }) => {
  const [image, setImage] = useState<string | null>(null);
  const [model3d, setModel3d] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [styleModifier, setStyleModifier] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [showSavedToast, setShowSavedToast] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('sj_draft_i2v');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.image) setImage(data.image);
      if (data.model3d) setModel3d(data.model3d);
      if (data.prompt) setPrompt(data.prompt);
      if (data.aspectRatio) setAspectRatio(data.aspectRatio);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      localStorage.setItem('sj_draft_i2v', JSON.stringify({ image, model3d, prompt, aspectRatio }));
      setLastSaved(new Date().toLocaleTimeString());
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 2000);
    }, 30000);
    return () => clearInterval(timer);
  }, [image, model3d, prompt, aspectRatio]);

  const handleSwitchKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setErrorMsg(null);
    }
  };

  const startGeneration = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    setErrorMsg(null);
    const jobId = `job_${Date.now()}`;
    
    try {
      onAddJob({
        id: jobId,
        type: 'image2video',
        status: 'pending',
        progress: 0,
        createdAt: new Date().toISOString(),
        prompt
      });

      setProgressMsg("Verifying Neural Key...");
      const fullPrompt = styleModifier ? `${prompt}. Subject styling: ${styleModifier}` : prompt;
      
      setProgressMsg("Submitting to Veo API...");
      const operation = await gemini.generateVideo(fullPrompt, image || undefined, undefined, aspectRatio);
      onUpdateJob(jobId, { status: 'processing', progress: 20 });

      setProgressMsg("Processing Neural Stream...");
      const result = await gemini.pollVideoOperation(operation);
      
      const uri = result.response?.generatedVideos?.[0]?.video?.uri;
      if (uri) {
        const videoRes = await fetch(`${uri}&key=${process.env.API_KEY}`);
        const blob = await videoRes.blob();
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
        onUpdateJob(jobId, { status: 'completed', progress: 100, outputUrl: url });
        setProgressMsg("Synthesis Complete.");
      }
    } catch (err: any) {
      const msg = err.message || "Synthesis Failed";
      setProgressMsg(msg);
      setErrorMsg(msg);
      onUpdateJob(jobId, { status: 'failed' });
    } finally {
      setIsGenerating(false);
    }
  };

  const exportToVault = () => {
    if (videoUrl) {
      onAddAsset({
        id: `a_${Date.now()}`,
        name: `Production_${Date.now()}.mp4`,
        type: 'video',
        size: 'N/A',
        date: new Date().toLocaleDateString(),
        dataUrl: videoUrl
      });
      alert("Added to Asset Vault.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn relative">
      {showSavedToast && (
        <div className="fixed top-24 right-10 z-[60] bg-gold text-black text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-2xl">
          Auto-Saved {lastSaved}
        </div>
      )}
      <div className="space-y-6">
        <div className="glass-effect rounded-xl p-6 shadow-xl relative overflow-hidden">
          <h3 className="text-lg font-bold text-gold mb-4 flex items-center gap-2">
            <i className="fas fa-microchip"></i> Source Hub
          </h3>
          {!image && !model3d ? (
            <div className="border-2 border-dashed border-gold/20 rounded-xl p-10 text-center bg-black/40 hover:border-gold/40 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <i className="fas fa-plus text-3xl text-gold mb-2 block"></i>
              <p className="text-gold/60 text-[10px] uppercase font-bold tracking-widest">Select Image or 3D</p>
            </div>
          ) : model3d ? (
            <div className="h-64 rounded-xl overflow-hidden border border-gold/20">
              <ModelViewer modelUrl={model3d} onSnapshot={setImage} onStyleUpdate={setStyleModifier} className="w-full h-full" />
            </div>
          ) : (
            <div className="relative group rounded-xl overflow-hidden border border-gold/20 h-64">
              <img src={image!} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                <button onClick={() => {setImage(null); setModel3d(null);}} className="bg-red-500 text-white w-10 h-10 rounded-full"><i className="fas fa-trash"></i></button>
              </div>
            </div>
          )}
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.glb,.gltf" onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
              const res = ev.target?.result as string;
              if (f.name.endsWith('.glb') || f.name.endsWith('.gltf')) setModel3d(res); else setImage(res);
            };
            reader.readAsDataURL(f);
          }} />
        </div>
        <div className="glass-effect rounded-xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-gold mb-4">Directives</h3>
          <textarea className="w-full bg-black/40 border border-gold/20 rounded-lg p-4 text-[#F5F5DC] focus:border-gold focus:outline-none h-32 resize-none text-sm" placeholder="Describe the cinematic motion..." value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        </div>
        <div className="glass-effect rounded-xl p-6 shadow-xl">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button onClick={() => setAspectRatio('16:9')} className={`py-3 rounded-lg border text-[10px] font-black uppercase ${aspectRatio === '16:9' ? 'border-gold bg-gold/10 text-gold' : 'border-white/5 text-white/30'}`}>16:9 Wide</button>
            <button onClick={() => setAspectRatio('9:16')} className={`py-3 rounded-lg border text-[10px] font-black uppercase ${aspectRatio === '9:16' ? 'border-gold bg-gold/10 text-gold' : 'border-white/5 text-white/30'}`}>9:16 Vert</button>
          </div>
          <button onClick={startGeneration} disabled={isGenerating || !prompt} className="w-full bg-gold text-black font-black py-4 rounded-xl disabled:opacity-30 flex items-center justify-center gap-3 uppercase tracking-widest text-xs">
            {isGenerating ? <i className="fas fa-sync animate-spin"></i> : <i className="fas fa-play"></i>}
            {isGenerating ? 'Synthesizing...' : 'Launch Production'}
          </button>
        </div>
      </div>
      <div className="lg:col-span-2">
        <div className="glass-effect rounded-xl p-8 min-h-[500px] flex flex-col shadow-2xl relative">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-gold">Production Output</h3>
            {videoUrl && <button onClick={exportToVault} className="text-xs text-gold border border-gold/30 px-4 py-1.5 rounded-full hover:bg-gold/10 transition">Export to Vault</button>}
          </div>
          <div className="flex-1 rounded-2xl border border-gold/10 relative overflow-hidden bg-black flex items-center justify-center aspect-video">
            {isGenerating ? (
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                <p className="text-gold font-black uppercase tracking-widest pulse-gold">{progressMsg}</p>
              </div>
            ) : errorMsg ? (
              <div className="text-center p-12 bg-red-500/5 border border-red-500/20 rounded-xl max-w-lg mx-auto">
                <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                <p className="text-white text-sm mb-6 leading-relaxed">{errorMsg}</p>
                {errorMsg.toLowerCase().includes("quota") && (
                  <div className="space-y-4">
                    <button onClick={handleSwitchKey} className="bg-red-500 text-white font-black py-3 px-8 rounded-lg uppercase tracking-widest text-xs hover:bg-red-600 transition shadow-lg">
                      Switch API Project / Key
                    </button>
                    <p className="text-[10px] text-white/40 italic">Note: Veo models require a project with billing enabled.</p>
                  </div>
                )}
              </div>
            ) : videoUrl ? (
              <video src={videoUrl} controls autoPlay loop className="w-full h-full" />
            ) : (
              <div className="text-center opacity-20"><i className="fas fa-video text-6xl mb-4"></i><p className="text-xl font-black uppercase tracking-widest">Stream Idle</p></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageToVideo;