
import React from 'react';

const Settings: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto glass-effect rounded-xl p-8 shadow-2xl animate-fadeIn">
       <h2 className="text-2xl font-bold text-gold mb-8 flex items-center gap-2">
          <i className="fas fa-sliders-h"></i> System Settings
       </h2>

       <div className="space-y-8">
          <section>
             <h3 className="text-sm font-bold text-gold/60 uppercase tracking-widest mb-4">Rendering Engine</h3>
             <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-black/40 rounded-lg border border-gold/10">
                   <div>
                      <p className="font-bold">Hardware Acceleration</p>
                      <p className="text-xs text-white/40">Use NVIDIA Tensor Cores for inference</p>
                   </div>
                   <input type="checkbox" defaultChecked className="w-5 h-5 accent-gold" />
                </div>
                <div className="flex items-center justify-between p-4 bg-black/40 rounded-lg border border-gold/10">
                   <div>
                      <p className="font-bold">Precision Rendering</p>
                      <p className="text-xs text-white/40">FP16 mixed-precision for speed</p>
                   </div>
                   <input type="checkbox" defaultChecked className="w-5 h-5 accent-gold" />
                </div>
             </div>
          </section>

          <section>
             <h3 className="text-sm font-bold text-gold/60 uppercase tracking-widest mb-4">Export Preferences</h3>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-xs text-white/60">Default Format</label>
                   <select className="w-full bg-black border border-gold/30 rounded p-2 text-sm">
                      <option>MP4 (H.264)</option>
                      <option>WebM (VP9)</option>
                      <option>HEVC (H.265)</option>
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-xs text-white/60">Max Quality</label>
                   <select className="w-full bg-black border border-gold/30 rounded p-2 text-sm">
                      <option>4K UHD</option>
                      <option>1080p HD</option>
                      <option>720p</option>
                   </select>
                </div>
             </div>
          </section>

          <section className="pt-8 border-t border-gold/20">
             <button className="w-full bg-gold text-black font-bold py-3 rounded-lg hover:brightness-110 shadow-lg shadow-gold/20">
                Save All Changes
             </button>
             <button className="w-full mt-4 py-3 border border-red-500/20 text-red-500 font-bold rounded-lg hover:bg-red-500/10">
                Factory Reset Studio
             </button>
          </section>
       </div>
    </div>
  );
};

export default Settings;
