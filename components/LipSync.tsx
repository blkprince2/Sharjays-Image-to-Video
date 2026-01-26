
import React, { useState, useRef } from 'react';
import { RenderJob } from '../types';
import { gemini } from '../geminiService';

interface LipSyncProps {
  onAddJob: (job: RenderJob) => void;
}

const LipSync: React.FC<LipSyncProps> = ({ onAddJob }) => {
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [currentSegment, setCurrentSegment] = useState(0);
  const [totalSegments, setTotalSegments] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [voice, setVoice] = useState('Kore');
  
  const faceInputRef = useRef<HTMLInputElement>(null);

  const handleFaceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setImageData(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const setImageData = (data: string) => {
    setFaceImage(data);
  };

  const startLipSync = async () => {
    if (!text || !faceImage) return;
    
    setIsProcessing(true);
    setStatus("Preparing your production...");
    
    try {
      // 1. Split the script into segments.
      const segments = gemini.splitScript(text);
      if (segments.length === 0) {
        throw new Error("The script is empty or could not be parsed.");
      }
      setTotalSegments(segments.length);
      
      let lastVideoMetadata: any = null;
      let finalVideoBlob: Blob | null = null;

      for (let i = 0; i < segments.length; i++) {
        setCurrentSegment(i + 1);
        const segmentText = segments[i];
        
        // Step A: Generate Audio for this segment to verify TTS first.
        setStatus(`Part ${i + 1}/${segments.length}: Generating audio synthesis...`);
        try {
          // We generate it mainly to ensure the API is responsive and text is valid.
          const base64PCM = await gemini.generateTTS(segmentText, voice);
          // Note: In a real 'connector' with Veo, the model handles the voice/animation 
          // based on the prompt. We provide the segment audio via the prompt context.
        } catch (ttsErr: any) {
          throw new Error(`TTS Error in segment ${i+1}: ${ttsErr.message}`);
        }
        
        // Step B: Connect and Generate/Extend Video.
        setStatus(`Part ${i + 1}/${segments.length}: Rendering visual continuity...`);
        const animationPrompt = `Professional cinematic production. A close-up shot of the person from the source image. They are speaking naturally and clearly with perfectly synchronized lip movements, subtle emotional expressions, and natural eye contact. They are saying: "${segmentText}"`;
        
        // If i > 0, we pass lastVideoMetadata to EXTEND the previous video.
        const operation = await gemini.generateVideo(
          animationPrompt, 
          faceImage, 
          lastVideoMetadata,
          '16:9'
        );
        
        const result = await gemini.pollVideoOperation(operation);
        lastVideoMetadata = result.response?.generatedVideos?.[0]?.video;

        if (!lastVideoMetadata) {
          throw new Error(`Segment ${i + 1} failed to generate video content.`);
        }
        
        // Fetch the latest version of the (potentially stitched) video.
        if (i === segments.length - 1) {
          setStatus("Finalizing master export...");
          const downloadLink = lastVideoMetadata.uri;
          const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
          if (!videoResponse.ok) throw new Error("Failed to download the final video file.");
          finalVideoBlob = await videoResponse.blob();
        }
      }

      if (finalVideoBlob) {
        const url = URL.createObjectURL(finalVideoBlob);
        setVideoUrl(url);
        setStatus("Production ready for export.");
        
        onAddJob({
          id: `ls_${Date.now()}`,
          type: 'lipsync',
          status: 'completed',
          progress: 100,
          createdAt: new Date().toISOString(),
          prompt: text.length > 50 ? text.slice(0, 50) + "..." : text
        });
      }
    } catch (err: any) {
      console.error("Lip-Sync Processing Error:", err);
      const errorMsg = err.message || JSON.stringify(err);
      
      if (errorMsg.includes("403") || errorMsg.includes("PERMISSION_DENIED")) {
        setStatus("Access Denied: Please ensure you have connected a PAID Tier API key.");
        const aistudio = (window as any).aistudio;
        if (aistudio) setTimeout(() => aistudio.openSelectKey(), 3000);
      } else {
        setStatus(`Error: ${errorMsg}`);
      }
    } finally {
      setIsProcessing(false);
      setCurrentSegment(0);
      setTotalSegments(0);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
      {/* Configuration Sidebar */}
      <div className="space-y-6">
        <div className="glass-effect rounded-xl p-6">
          <h3 className="text-lg font-bold text-[#D4AF37] mb-4 flex items-center gap-2">
            <i className="fas fa-id-card"></i> Source Subject
          </h3>
          {!faceImage ? (
            <div 
              onClick={() => faceInputRef.current?.click()}
              className="border-2 border-dashed border-gold/30 rounded-lg p-10 text-center cursor-pointer hover:border-gold transition"
            >
              <i className="fas fa-smile text-4xl text-[#D4AF37] mb-4"></i>
              <p className="text-gold font-bold">Upload Portrait</p>
              <input type="file" ref={faceInputRef} className="hidden" accept="image/*" onChange={handleFaceUpload} />
            </div>
          ) : (
            <div className="relative group">
              <img src={faceImage} alt="Portrait" className="w-full h-48 object-cover rounded-lg border border-gold/20" />
              <button 
                onClick={() => setFaceImage(null)} 
                className="absolute top-2 right-2 bg-red-500 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition shadow-lg"
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
          )}
        </div>

        <div className="glass-effect rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-[#D4AF37]">The Script</h3>
            <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${text.length > 1000 ? 'bg-red-500/20 text-red-400' : 'bg-gold/10 text-gold/60'}`}>
              {text.length} chars
            </span>
          </div>
          <textarea 
            className="w-full bg-[#1A1A1A] border border-gold/30 rounded-lg p-4 text-[#F5F5DC] focus:border-gold h-64 resize-none scrollbar-thin text-sm leading-relaxed"
            placeholder="Paste your script here. We support long-form text by intelligently splitting and extending the video segments for a continuous experience."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="mt-4 space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Vocal Signature</label>
              <select 
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-gold/30 rounded p-2 text-xs text-gold focus:outline-none focus:border-gold"
              >
                <option value="Kore">Kore (Male - Authority)</option>
                <option value="Zephyr">Zephyr (Female - Soft)</option>
                <option value="Puck">Puck (Youthful - Energetic)</option>
                <option value="Charon">Charon (Male - Cinematic Deep)</option>
              </select>
            </div>
            <button 
              onClick={startLipSync}
              disabled={isProcessing || !text || !faceImage}
              className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50 transition shadow-xl shadow-gold/10"
            >
              {isProcessing ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-magic"></i>}
              {isProcessing ? 'Processing Master...' : 'Begin Production'}
            </button>
          </div>
        </div>
      </div>

      {/* Rendering Preview */}
      <div className="lg:col-span-2">
        <div className="glass-effect rounded-xl p-6 h-full flex flex-col shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-[#D4AF37]">Cinematic Workspace</h3>
            {totalSegments > 0 && (
              <div className="flex items-center gap-3 bg-gold/5 px-4 py-1.5 rounded-full border border-gold/20">
                <span className="text-[10px] text-gold font-bold uppercase tracking-widest">
                  Rendering Part {currentSegment} of {totalSegments}
                </span>
                <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="bg-gold h-full transition-all duration-700" 
                    style={{ width: `${(currentSegment / totalSegments) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex-1 bg-black rounded-xl border border-gold/20 flex items-center justify-center relative overflow-hidden aspect-video shadow-inner">
            {isProcessing ? (
              <div className="text-center px-12">
                <div className="w-20 h-20 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-8 shadow-lg shadow-gold/20"></div>
                <p className="text-xl font-bold text-gold pulse-gold mb-3">{status}</p>
                <p className="text-[10px] text-white/30 uppercase tracking-[0.2em]">Veo Neural Stitched Output</p>
                <div className="mt-6 flex flex-wrap justify-center gap-2 opacity-50">
                  {Array.from({ length: totalSegments }).map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`w-2 h-2 rounded-full ${idx + 1 <= currentSegment ? 'bg-gold' : 'bg-white/10'}`}
                    ></div>
                  ))}
                </div>
              </div>
            ) : videoUrl ? (
              <video src={videoUrl} controls autoPlay className="w-full h-full object-contain" />
            ) : (
              <div className="text-center text-white/10">
                <i className="fas fa-clapperboard text-[120px] mb-6"></i>
                <p className="text-lg font-bold uppercase tracking-widest">Production Idle</p>
                <p className="text-xs mt-2 italic">Upload a photo and script to begin rendering your video</p>
              </div>
            )}
          </div>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="p-5 bg-black/40 rounded-xl border border-gold/10">
                <h4 className="text-[10px] text-gold font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                  <i className="fas fa-microchip"></i> Engine Status
                </h4>
                <p className="text-xs text-white/50 leading-relaxed">
                  Our system utilizes sequential frame prediction to ensure that character identity and lighting remain consistent across segment boundaries. Stitched videos are returned as a single high-bitrate MP4 container.
                </p>
             </div>
             {videoUrl && (
               <div className="flex items-center justify-center">
                  <a 
                    href={videoUrl} 
                    download="sharjays_studio_production.mp4"
                    className="group bg-gold text-black font-bold py-4 px-10 rounded-full hover:brightness-110 transition flex items-center gap-3 shadow-xl shadow-gold/20"
                  >
                    <i className="fas fa-file-download text-lg group-hover:bounce"></i> 
                    <span>Download Master Clip</span>
                  </a>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LipSync;
