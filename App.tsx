import React, { useState, useEffect, useCallback } from 'react';
import { Tab, Project, RenderJob, Asset } from './types';
import Dashboard from './components/Dashboard';
import ImageToVideo from './components/ImageToVideo';
import LipSync from './components/LipSync';
import Projects from './components/Projects';
import Renders from './components/Renders';
import AssetLibrary from './components/AssetLibrary';
import Help from './components/Help';
import Settings from './components/Settings';
import AIAssistant from './components/AIAssistant';

const LOGO_DATA_URI = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAABhWlDQ1BJQ0MgcHJvZmlsZQAAeJydks9rE0EQx79pS9IqClV6UPAiREvSqkXpQaRWS6EghYKk9pDkZre7S7K7yW52Teih/4InD7148+Zf4MGDP0G8ePbgwUMv3vXiRY9+u0mSshXfMvPm2/fN7MzsDCHXmK7ruSIApXmG7fht9vTM7PyC8D0AQQIowjAs7/mO77fOADXm733d3O8FQK/NlGvdGv9/1K9Y677n+WAnpL8H7Xo+2An0H8Ge5wfYBeonYI+7u77v6P+AnUDv678DdpP6E0Hn+2u5m3mX+V/AW6D/AnYRvU/vW/of0H8CO4H9oP6f7/Vun62463eX+f6n6S/NlA66G1A/AD3XhO0FhW6P+94D8G6Ae8D3XAd6A6gG8ALXW0B3A70N6BfU871N82vG++mJ97+W56Yp2XmB5/fTivVv6U7NfL9WzI68MvPG7Bnz6fT5tGbM2zNz/0u1XmB58vXWpYk3Wz97P0N8eT48X54Xzx/fH99v32ffH98H5x/f77fMvAnz6pSZF19uVpY+C3yv1m9f/p/+S/W2nAnfI3xP8j3N9/nOnAnfq38C/8Tf/wE3D85Lh0V9oAAAAF1QTFRF////3d3d7u7uzMzM5+fn8/Pyq6qre3t7+vr67+/vu7u7Vofgd3d3+fn57u7uzMzM3d3d8/Pyv7+/urq6+vr6rq6u9/f35+fntra2oKCgxMTEnJyc0tLS6+vr////jUOfcAAAAAlwSFlzAAAOwwAADsMBx2+oZAAAAAd0SU1FB+kDAxUMCBoXPy0AAACASURBVDjL7ZExDsAgDAPNf8I2+v+HNRKWSggLInA0N/Z0UqKk/7B7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u/u99PnkH1A9vLp3Wv/38H7v7u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7u/u7v9pPz65B7fXQ0r790O7m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m/m";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Dashboard);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);

  // Initialize state from LocalStorage for production persistence
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('sj_projects');
    return saved ? JSON.parse(saved) : [];
  });
  const [renders, setRenders] = useState<RenderJob[]>(() => {
    const saved = localStorage.getItem('sj_renders');
    return saved ? JSON.parse(saved) : [];
  });
  const [assets, setAssets] = useState<Asset[]>(() => {
    const saved = localStorage.getItem('sj_assets');
    return saved ? JSON.parse(saved) : [];
  });

  // Persist state changes
  useEffect(() => localStorage.setItem('sj_projects', JSON.stringify(projects)), [projects]);
  useEffect(() => localStorage.setItem('sj_renders', JSON.stringify(renders)), [renders]);
  useEffect(() => localStorage.setItem('sj_assets', JSON.stringify(assets)), [assets]);

  useEffect(() => {
    const checkKey = async () => {
      const aistudio = (window as any).aistudio;
      if (aistudio) {
        setHasApiKey(await aistudio.hasSelectedApiKey());
      }
    };
    checkKey();
    const interval = setInterval(checkKey, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenKeyDialog = async () => {
    if ((window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const addJob = useCallback((job: RenderJob) => setRenders(prev => [job, ...prev]), []);
  
  const updateJob = useCallback((jobId: string, updates: Partial<RenderJob>) => {
    setRenders(prev => prev.map(job => job.id === jobId ? { ...job, ...updates } : job));
  }, []);

  const addAsset = useCallback((asset: Asset) => setAssets(prev => [asset, ...prev]), []);

  const renderContent = () => {
    switch (activeTab) {
      case Tab.Dashboard:
        return <Dashboard projects={projects} renders={renders} assets={assets} onSwitch={setActiveTab} />;
      case Tab.Image2Video:
        return <ImageToVideo onAddJob={addJob} onUpdateJob={updateJob} onAddAsset={addAsset} />;
      case Tab.LipSync:
        return <LipSync onAddJob={addJob} onUpdateJob={updateJob} onAddAsset={addAsset} />;
      case Tab.Projects:
        return <Projects projects={projects} setProjects={setProjects} />;
      case Tab.Renders:
        return <Renders renders={renders} setRenders={setRenders} />;
      case Tab.Assets:
        return <AssetLibrary assets={assets} onAddAsset={addAsset} setAssets={setAssets} />;
      case Tab.Help:
        return <Help />;
      case Tab.Settings:
        return <Settings />;
      default:
        return <Dashboard projects={projects} renders={renders} assets={assets} onSwitch={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5DC] font-sans selection:bg-gold selection:text-black">
      <nav className="fixed left-0 top-0 h-full w-20 md:w-64 bg-black border-r border-gold/20 flex flex-col z-50">
        <div className="p-6 flex items-center gap-3 border-b border-gold/10">
          <img src={LOGO_DATA_URI} alt="Logo" className="w-10 h-10 object-contain" />
          <div className="hidden md:block">
            <h1 className="text-xl font-black tracking-tighter text-[#D4AF37]">SHARJAYS</h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">Studio Pro</p>
          </div>
        </div>
        <div className="flex-1 py-8 px-4 space-y-2 overflow-y-auto scrollbar-hide">
          {Object.values(Tab).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                activeTab === tab ? 'bg-gold text-black shadow-lg shadow-gold/20' : 'text-white/60 hover:text-gold hover:bg-white/5'
              }`}>
              <i className={`fas fa-${
                tab === Tab.Dashboard ? 'th-large' : 
                tab === Tab.Image2Video ? 'film' : 
                tab === Tab.LipSync ? 'microphone-alt' :
                tab === Tab.Projects ? 'folder' :
                tab === Tab.Renders ? 'history' :
                tab === Tab.Assets ? 'archive' :
                tab === Tab.Help ? 'question-circle' : 'cog'
              } text-lg`}></i>
              <span className="hidden md:block font-bold text-sm capitalize">{tab}</span>
            </button>
          ))}
        </div>
        <div className="p-6 border-t border-gold/10">
          <div className="hidden md:block p-4 bg-gold/5 rounded-xl border border-gold/10">
             <p className="text-[10px] font-black text-gold uppercase tracking-widest mb-1">Compute Status</p>
             <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${hasApiKey ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-[10px] text-white/60 font-mono">{hasApiKey ? 'NEURAL-READY' : 'KEY-REQUIRED'}</span>
             </div>
          </div>
        </div>
      </nav>
      <main className="pl-20 md:pl-64 pt-6 pr-6 pb-24 min-h-screen overflow-x-hidden">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
           <div>
             <h2 className="text-4xl font-black uppercase tracking-widest text-white/90">{activeTab}</h2>
             <p className="text-gold/60 text-sm mt-1">Directing visual synthesis through Gemini Veo 3.1</p>
           </div>
           <div className="flex gap-4 items-center">
              {!hasApiKey ? (
                <button onClick={handleOpenKeyDialog} className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-500 hover:text-white transition flex items-center gap-2 animate-pulse">
                  <i className="fas fa-key"></i> Connect Paid Key
                </button>
              ) : (
                <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-2 rounded-lg text-[10px] font-bold flex items-center gap-2">
                  <i className="fas fa-check-circle"></i> Paid Key Connected
                </div>
              )}
              <div className="bg-black/50 border border-gold/20 px-4 py-2 rounded-lg flex flex-col items-end">
                 <span className="text-[9px] text-white/40 uppercase tracking-widest">Active Model</span>
                 <span className="text-xs font-bold text-gold">VEO-3.1-PRO</span>
              </div>
           </div>
        </header>
        {renderContent()}
      </main>
      <AIAssistant />
    </div>
  );
};

export default App;