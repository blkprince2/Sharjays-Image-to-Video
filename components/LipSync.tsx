import React, { useState, useRef, useEffect } from 'react';
import { RenderJob, Asset } from '../types';
import { gemini } from '../geminiService';
import ModelViewer from './ModelViewer';

interface LipSyncProps {
  onAddJob: (job: RenderJob) => void;
  onAddAsset: (asset: Asset) => void;
}

const LipSync: React.FC<LipSyncProps> = ({ onAddJob, onAddAsset }) => {
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [faceModel, setFaceModel] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [scriptChunks, setScriptChunks] = useState<string[]>([]);
  const [styleModifier, setStyleModifier] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSplitting, setIsSplitting] = useState(false);
  const [status, setStatus] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(-1);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [voice, setVoice] = useState('Kore');
  
  const faceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedData = localStorage.getItem('sharjays_autosave_ls');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        if (data.faceImage) setFaceImage(data.faceImage);
        if (data.faceModel) setFaceModel(data.faceModel);
        if (data.text) setText(data.text);
        if (data.voice) setVoice(data.voice);
      } catch (err) {}
    }
  }, []);

  const handleSplitScript = async () => {
    if (!text.trim()) return;
    setIsSplitting(true);
    setStatus("AI Script Splitter analyzing context...");
    try {
      const chunks = await gemini.intelligentlySplitScript(text);
      setScriptChunks(chunks);
    } catch (err) {
      setErrorMsg("Script splitting failed.");
    } finally {
      setIsSplitting(false);
      setStatus("");
    }
  };

  const handleSwitchKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setErrorMsg(null);
    }
  };

  const startSynthesis = async () => {
    if (!faceImage && !faceModel) return;
    let chunksToProcess = scriptChunks.length > 0 ? scriptChunks : [text];
    
    setIsProcessing(true);
    setErrorMsg(null);
    let lastOperationResponse: any = null;
    let finalVideoUrl = "";

    try {
      const jobId = `job_ls_${Date.now()}`;
      onAddJob({
        id: jobId,
        type: 'lipsync',
        status: 'processing',
        progress: 0,
        createdAt: new Date().toISOString(),
        prompt: text
      });

      for (let i = 0; i < chunksToProcess.length; i++) {
        setCurrentChunkIndex(i);
        const chunk = chunksToProcess[i];
        const isExtension = i > 0;
        
        setStatus(isExtension 
          ? `Neural Stitching segment ${i + 1}/${chunksToProcess.length}...` 
          : `Synthesizing Anchor segment 1/${chunksToProcess.length}...`
        );

        const chunkPrompt = `Close-up cinematic shot. The subject says: "${chunk}". 
          Subject style: ${styleModifier || 'elegant professional'}. 
          Perfect lip-sync and expressive facial animation. Studio lighting.`;

        const operation = await gemini.generateVideo(
          chunkPrompt, 
          !isExtension ? (faceImage || undefined) : undefined, 
          isExtension ? lastOperationResponse?.response?.generatedVideos?.[0]?.video : undefined
        );

        const result = await gemini.pollVideoOperation(operation);
        lastOperationResponse = result;

        // Preview the current progress
        const uri = result.response?.generatedVideos?.[0]?.video?.uri;
        if (uri) {
          const videoResponse = await fetch(`${uri}&key=${process.env.API_KEY}`);
          const blob = await videoResponse.blob();
          finalVideoUrl = URL.createObjectURL(blob);
          setVideoUrl(finalVideoUrl);
        }
      }

      setStatus("Production Complete. All segments stitched.");
    } catch (err: any) {
      setErrorMsg(err.message || "Synthesis failed");
    } finally {
      setIsProcessing(false);
      setCurrentChunkIndex(-1);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
      <div className="space-y-6">
        <div className="glass-effect rounded-xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-gold mb-4 flex items-center gap-2">
            <i className="fas fa-portrait"></i> Subject Source
          </h3>
          {!faceImage && !faceModel ? (
            <div className="border-2 border-dashed border-gold/20 rounded-xl p-10 text-center bg-black/40 hover:border-gold/40 cursor-pointer" onClick={() => faceInputRef.current?.click()}>
              <i className="fas fa-user-circle text-3xl text-gold mb-4 block"></i>
              <p className="text-gold/40 text-[10px] uppercase tracking-widest">Select Face or 3D Model</p>
            </div>
          ) : faceModel ? (
            <div className="h-64 rounded-xl overflow-hidden border border-gold/20">
              <ModelViewer modelUrl={faceModel} onSnapshot={setFaceImage} onStyleUpdate={setStyleModifier} className="w-full h-full" />
            </div>
          ) : (
            <div className="relative group rounded-xl overflow-hidden border border-gold/20 h-64">
              <img src={faceImage!} className="w-full h-full object-cover" />
              <button onClick={() => {setFaceImage(null); setFaceModel(null);}} className="absolute top-4 right-4 bg-red-500 text-white w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><i className="fas fa-times"></i></button>
            </div>
          )}
          <input type="file" ref={faceInputRef} className="hidden" accept="image/*,.glb,.gltf" onChange={(e) => {
            const f = e.target.files?.[0]; if (!f) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
              const res = ev.target?.result as string;
              if (f.name.endsWith('.glb') || f.name.endsWith('.gltf')) setFaceModel(res); else setFaceImage(res);
            };
            reader.readAsDataURL(f);
          }} />
        </div>

        <div className="glass-effect rounded-xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gold flex items-center gap-2">
              <i className="fas fa-pen-nib"></i> Script
            </h3>
            <button 
              onClick={handleSplitScript} 
              disabled={!text || isSplitting || isProcessing}
              className="text-[10px] bg-gold/10 text-gold border border-gold/30 px-3 py-1 rounded-full uppercase font-black hover:bg-gold hover:text-black transition"
            >
              {isSplitting ? 'Splitting...' : 'AI Split Script'}
            </button>
          </div>
          <textarea 
            className="w-full bg-black/40 border border-gold/20 rounded-lg p-4 text-cream focus:border-gold focus:outline-none h-40 resize-none text-sm"
            placeholder="Enter script for lip-sync..."
            value={text}
            onChange={(e) => { setText(e.target.value); setScriptChunks([]); }}
          />
          
          {scriptChunks.length > 0 && (
            <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
              <p className="text-[9px] text-white/30 uppercase font-black tracking-widest">Neural Performance Segments</p>
              {scriptChunks.map((chunk, idx) => (
                <div key={idx} className={`p-2 rounded border text-[10px] leading-relaxed ${currentChunkIndex === idx ? 'bg-gold/20 border-gold text-gold animate-pulse' : 'bg-white/5 border-white/10 text-white/50'}`}>
                  <span className="font-bold mr-2">{idx + 1}.</span> {chunk}
                </div>
              ))}
            </div>
          )}
        </div>

        <button 
          onClick={startSynthesis} 
          disabled={isProcessing || !text || (!faceImage && !faceModel)}
          className="w-full bg-gold text-black font-black py-4 rounded-xl disabled:opacity-30 uppercase tracking-[0.2em] text-xs shadow-2xl hover:brightness-110 active:scale-95 transition-all"
        >
          {isProcessing ? <i className="fas fa-sync animate-spin mr-2"></i> : <i className="fas fa-bolt mr-2"></i>}
          {isProcessing ? `Stitching Segment ${currentChunkIndex + 1}...` : 'Start Production'}
        </button>
      </div>

      <div className="lg:col-span-2">
        <div className="glass-effect rounded-xl p-8 min-h-[500px] flex flex-col shadow-2xl relative overflow-hidden">
          <div className="flex justify-between items-center mb-8 relative z-10">
            <h3 className="text-xl font-bold text-gold">Production Master</h3>
            {videoUrl && !isProcessing && (
              <button onClick={() => onAddAsset({
                id: `a_${Date.now()}`,
                name: `Master_Edit_${Date.now()}.mp4`,
                type: 'video',
                size: 'Master',
                date: new Date().toLocaleDateString(),
                dataUrl: videoUrl
              })} className="text-xs text-gold border border-gold/30 px-4 py-1.5 rounded-full hover:bg-gold/10 transition">Save to Vault</button>
            )}
          </div>
          
          <div className="flex-1 rounded-2xl border border-gold/10 relative overflow-hidden bg-black flex items-center justify-center aspect-video shadow-inner">
            {isProcessing ? (
              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-8">
                  <div className="absolute inset-0 border-4 border-gold/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
                  <i className="fas fa-brain absolute inset-0 flex items-center justify-center text-gold text-2xl animate-pulse"></i>
                </div>
                <h4 className="text-gold font-black text-xl mb-2 tracking-tight uppercase">{status}</h4>
                <div className="w-48 h-1 bg-white/5 mx-auto rounded-full overflow-hidden">
                   <div 
                    className="bg-gold h-full transition-all duration-1000" 
                    style={{ width: `${((currentChunkIndex + 1) / (scriptChunks.length || 1)) * 100}%` }}
                   ></div>
                </div>
              </div>
            ) : errorMsg ? (
              <div className="text-center p-12 max-w-md">
                <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                <p className="text-white text-sm mb-6">{errorMsg}</p>
                {errorMsg.toLowerCase().includes("quota") && (
                  <button onClick={handleSwitchKey} className="bg-red-500 text-white font-black py-3 px-8 rounded-lg uppercase text-xs">Switch Project Key</button>
                )}
              </div>
            ) : videoUrl ? (
              <video src={videoUrl} controls autoPlay loop className="w-full h-full object-contain" />
            ) : (
              <div className="text-center opacity-10">
                <i className="fas fa-clapperboard text-8xl mb-4"></i>
                <p className="text-2xl font-black uppercase tracking-[0.5em]">Studio Idle</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LipSync;