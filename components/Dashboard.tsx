
import React from 'react';
import { Tab, Project, RenderJob, Asset } from '../types';

interface DashboardProps {
  projects: Project[];
  renders: RenderJob[];
  assets: Asset[];
  onSwitch: (tab: Tab) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ projects, renders, assets, onSwitch }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
      <div className="glass-effect rounded-xl p-6 col-span-1 lg:col-span-2 shadow-xl">
        <h2 className="text-2xl font-bold text-[#D4AF37] mb-4">Production Environment Active</h2>
        <p className="text-[#F5F5DC]/90 mb-6 leading-relaxed">
          Integrated directly with Google Gemini & Veo 3.1. All generative processes are live and utilize verified neural compute resources.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#1A1A1A]/50 rounded-lg p-5 border border-gold/20 hover:border-gold/50 transition">
            <h3 className="font-semibold text-[#D4AF37] mb-2"><i className="fas fa-film mr-2"></i>Image to Video</h3>
            <p className="text-sm text-[#F5F5DC]/70 mb-4">Professional grade 1080p cinematic motion with Veo 3.1 Fast.</p>
            <button onClick={() => onSwitch(Tab.Image2Video)} className="bg-gold text-black font-bold py-2 px-4 rounded-lg text-sm w-full hover:brightness-110">
              Launch Video Studio
            </button>
          </div>
          <div className="bg-[#1A1A1A]/50 rounded-lg p-5 border border-gold/20 hover:border-gold/50 transition">
            <h3 className="font-semibold text-[#D4AF37] mb-2"><i className="fas fa-microphone-alt mr-2"></i>Lip-Sync Studio</h3>
            <p className="text-sm text-[#F5F5DC]/70 mb-4">Neural TTS coupled with frame-consistent animation.</p>
            <button onClick={() => onSwitch(Tab.LipSync)} className="bg-gold text-black font-bold py-2 px-4 rounded-lg text-sm w-full hover:brightness-110">
              Launch Lip-Sync
            </button>
          </div>
        </div>
      </div>
      
      <div className="glass-effect rounded-xl p-6 shadow-xl h-fit">
        <h3 className="text-lg font-bold text-[#D4AF37] mb-6 flex items-center gap-2">
          <i className="fas fa-server"></i> Active Session
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-white/60">Total Renders</span>
            <span className="text-gold font-bold">{renders.length}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-white/60">Assets in Vault</span>
            <span className="text-gold font-bold">{assets.length}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-white/60">API Status</span>
            <span className="text-green-500 font-bold">CONNECTED</span>
          </div>
          <div className="pt-4 border-t border-gold/20">
            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Resource Utilization</p>
            <div className="w-full bg-black rounded-full h-1.5 overflow-hidden">
              <div className="bg-gold h-full rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-effect rounded-xl p-6 col-span-1 lg:col-span-3 shadow-xl">
        <h3 className="text-lg font-bold text-[#D4AF37] mb-4 flex items-center gap-2">
          <i className="fas fa-stream"></i> Global Queue Status
        </h3>
        {renders.length === 0 ? (
          <p className="text-center py-10 text-white/20">No active render operations.</p>
        ) : (
          <div className="space-y-2">
            {renders.slice(0, 5).map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-black/20 rounded border border-gold/10">
                <span className="text-xs font-mono">ID: {r.id.slice(-8)}</span>
                <span className={`text-[10px] font-bold px-2 py-1 rounded ${r.status === 'completed' ? 'text-green-500' : 'text-yellow-500'}`}>
                   {r.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
