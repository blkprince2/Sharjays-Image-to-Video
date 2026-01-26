
import React from 'react';
import { RenderJob } from '../types';

interface RendersProps {
  renders: RenderJob[];
  setRenders: React.Dispatch<React.SetStateAction<RenderJob[]>>;
}

const Renders: React.FC<RendersProps> = ({ renders, setRenders }) => {
  const clearHistory = () => {
    if (confirm("Clear all render history?")) setRenders([]);
  };

  return (
    <div className="glass-effect rounded-xl p-6 shadow-2xl animate-fadeIn">
       <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-[#D4AF37]">Render Queue & History</h2>
        <button 
          onClick={clearHistory}
          className="text-xs text-red-500 border border-red-500/20 px-3 py-1 rounded hover:bg-red-500/10"
        >
          Clear History
        </button>
      </div>

      <div className="overflow-x-auto">
         <table className="w-full text-left">
            <thead>
               <tr className="border-b border-gold/20 text-gold text-sm uppercase">
                  <th className="pb-4 pl-2">Job ID</th>
                  <th className="pb-4">Type</th>
                  <th className="pb-4">Prompt/Script</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4">Date</th>
                  <th className="pb-4 text-right pr-2">Actions</th>
               </tr>
            </thead>
            <tbody>
               {renders.length === 0 ? (
                 <tr>
                    <td colSpan={6} className="py-20 text-center text-white/20 italic">No renders in queue</td>
                 </tr>
               ) : (
                 renders.map(job => (
                    <tr key={job.id} className="border-b border-white/5 hover:bg-white/5 transition">
                       <td className="py-4 pl-2 font-mono text-xs">#{job.id.slice(-6)}</td>
                       <td className="py-4">
                          <span className={`text-[10px] px-2 py-0.5 rounded ${job.type === 'image2video' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                             {job.type.toUpperCase()}
                          </span>
                       </td>
                       <td className="py-4 max-w-[200px] truncate text-sm text-white/70">{job.prompt}</td>
                       <td className="py-4">
                          <div className="flex items-center gap-2">
                             <div className={`w-2 h-2 rounded-full ${job.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
                             <span className="text-sm font-medium">{job.status}</span>
                          </div>
                       </td>
                       <td className="py-4 text-xs text-white/40">{new Date(job.createdAt).toLocaleDateString()}</td>
                       <td className="py-4 text-right pr-2">
                          <button className="text-gold hover:scale-110 transition"><i className="fas fa-download"></i></button>
                       </td>
                    </tr>
                 ))
               )}
            </tbody>
         </table>
      </div>
    </div>
  );
};

export default Renders;
