
import React from 'react';

const Help: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
       <div className="glass-effect rounded-xl p-8">
          <h2 className="text-3xl font-bold text-gold mb-4">Studio Documentation</h2>
          <p className="text-white/80">Everything you need to know about the SHARJAYS Video AI pipeline.</p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#1A1A1A] border border-gold/20 p-6 rounded-xl">
             <h3 className="text-xl font-bold text-gold mb-3 flex items-center gap-2">
                <i className="fas fa-film"></i> Video Generation
             </h3>
             <ul className="space-y-4 text-sm text-white/70">
                <li className="flex gap-3">
                   <span className="text-gold font-bold">01.</span>
                   <p>Upload a high-contrast image with clear subjects for best results.</p>
                </li>
                <li className="flex gap-3">
                   <span className="text-gold font-bold">02.</span>
                   <p>Use descriptive prompts. Focus on the camera's relationship to the subject.</p>
                </li>
                <li className="flex gap-3">
                   <span className="text-gold font-bold">03.</span>
                   <p>Veo 3.1 Fast provides rapid iterations at 1080p resolution.</p>
                </li>
             </ul>
          </div>

          <div className="bg-[#1A1A1A] border border-gold/20 p-6 rounded-xl">
             <h3 className="text-xl font-bold text-gold mb-3 flex items-center gap-2">
                <i className="fas fa-microphone"></i> Lip-Sync Studio
             </h3>
             <ul className="space-y-4 text-sm text-white/70">
                <li className="flex gap-3">
                   <span className="text-gold font-bold">01.</span>
                   <p>Use frontal "passport-style" photos for most accurate mouth masking.</p>
                </li>
                <li className="flex gap-3">
                   <span className="text-gold font-bold">02.</span>
                   <p>Gemini TTS allows for multi-lingual and expressive voice generation.</p>
                </li>
                <li className="flex gap-3">
                   <span className="text-gold font-bold">03.</span>
                   <p>Ensure audio levels are clear; our noise reduction will handle the rest.</p>
                </li>
             </ul>
          </div>
       </div>

       <div className="glass-effect rounded-xl p-6 text-center">
          <h3 className="text-xl font-bold text-gold mb-4">Need further assistance?</h3>
          <p className="text-white/60 mb-6">Our senior engineers are available 24/7 for Enterprise support.</p>
          <button className="bg-gold text-black font-bold py-2 px-8 rounded-full hover:brightness-110">
             Contact Support
          </button>
       </div>
    </div>
  );
};

export default Help;
