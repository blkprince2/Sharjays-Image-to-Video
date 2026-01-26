
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

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Dashboard);
  const [dateTime, setDateTime] = useState<string>(new Date().toLocaleString());
  const [timezone, setTimezone] = useState<string>('auto');
  const [hasKey, setHasKey] = useState<boolean>(false);
  
  // Persistent State
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('sharjays_projects');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [renders, setRenders] = useState<RenderJob[]>(() => {
    const saved = localStorage.getItem('sharjays_renders');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [assets, setAssets] = useState<Asset[]>(() => {
    const saved = localStorage.getItem('sharjays_assets');
    return saved ? JSON.parse(saved) : [];
  });

  // Check API Key status
  useEffect(() => {
    const checkKey = async () => {
      const aistudio = (window as any).aistudio;
      if (aistudio) {
        const status = await aistudio.hasSelectedApiKey();
        setHasKey(status);
      }
    };
    checkKey();
    const interval = setInterval(checkKey, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleConnectKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      await aistudio.openSelectKey();
      setHasKey(true);
    }
  };

  // Sync state with localStorage
  useEffect(() => {
    localStorage.setItem('sharjays_projects', JSON.stringify(projects));
  }, [projects]);
  
  useEffect(() => {
    localStorage.setItem('sharjays_renders', JSON.stringify(renders));
  }, [renders]);
  
  useEffect(() => {
    localStorage.setItem('sharjays_assets', JSON.stringify(assets));
  }, [assets]);

  // Clock Update
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      };
      if (timezone !== 'auto') {
        options.timeZone = timezone;
      }
      setDateTime(now.toLocaleString('en-US', options));
    }, 1000);
    return () => clearInterval(interval);
  }, [timezone]);

  const addRenderJob = useCallback((job: RenderJob) => {
    setRenders(prev => [job, ...prev]);
  }, []);

  const addAsset = useCallback((asset: Asset) => {
    setAssets(prev => [asset, ...prev]);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case Tab.Dashboard: return <Dashboard projects={projects} renders={renders} assets={assets} onSwitch={setActiveTab} />;
      case Tab.Image2Video: return <ImageToVideo onAddJob={addRenderJob} />;
      case Tab.LipSync: return <LipSync onAddJob={addRenderJob} />;
      case Tab.Projects: return <Projects projects={projects} setProjects={setProjects} />;
      case Tab.Renders: return <Renders renders={renders} setRenders={setRenders} />;
      case Tab.Assets: return <AssetLibrary assets={assets} onAddAsset={addAsset} setAssets={setAssets} />;
      case Tab.Help: return <Help />;
      case Tab.Settings: return <Settings />;
      default: return <Dashboard projects={projects} renders={renders} assets={assets} onSwitch={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass-effect border-b border-gold/30 py-4 px-6 sticky top-0 z-50">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setActiveTab(Tab.Dashboard)}>
            <div className="w-12 h-12 bg-gradient-to-br from-[#D4AF37] to-[#B8860B] rounded-lg flex items-center justify-center shadow-lg shadow-gold/20">
              <span className="text-black font-bold text-xl">S</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#D4AF37]">SHARJAYS Image→Video</h1>
              <p className="text-[#D4AF37]/70 text-sm">Hear The Truth</p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-6">
            {!hasKey ? (
              <button 
                onClick={handleConnectKey}
                className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg text-sm font-bold animate-pulse hover:bg-red-500 hover:text-white transition flex items-center gap-2"
              >
                <i className="fas fa-key"></i> Connect Paid API Key
              </button>
            ) : (
              <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                <i className="fas fa-check-circle"></i> Paid Key Connected
              </div>
            )}

            <div className="text-right hidden md:block">
              <div className="text-lg font-mono text-[#D4AF37]">{dateTime}</div>
              <div className="flex items-center gap-2 text-sm justify-end mt-1">
                <select 
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="bg-[#1A1A1A] border border-gold/30 rounded px-2 py-0.5 text-[#F5F5DC] text-xs focus:outline-none focus:border-gold"
                >
                  <option value="auto">Auto (Browser Time)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">EST</option>
                  <option value="America/Chicago">CST</option>
                  <option value="America/Denver">MST</option>
                  <option value="America/Los_Angeles">PST</option>
                  <option value="Europe/London">GMT</option>
                  <option value="Asia/Tokyo">JST</option>
                </select>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-xs">System Online</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Navigation */}
      <nav className="border-b border-gold/20 bg-[#1A1A1A] sticky top-[137px] md:top-[81px] z-40">
        <div className="container mx-auto">
          <div className="flex space-x-4 md:space-x-8 px-6 overflow-x-auto scrollbar-hide">
            {Object.values(Tab).map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-1 transition whitespace-nowrap border-b-2 ${
                  activeTab === tab 
                    ? 'border-[#D4AF37] text-[#F4E4A6] font-semibold' 
                    : 'border-transparent text-[#F5F5DC]/80 hover:text-[#D4AF37]'
                }`}
              >
                <i className={`fas fa-${getTabIcon(tab)} mr-2`}></i>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 container mx-auto py-6 px-4 relative">
        {renderContent()}
      </main>

      {/* AI Assistant */}
      <AIAssistant />

      {/* Footer */}
      <footer className="border-t border-gold/20 py-8 px-6 mt-auto">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-[#D4AF37] to-[#B8860B] rounded"></div>
                <span className="text-[#D4AF37] font-bold">SHARJAYS Image→Video Studio</span>
              </div>
              <p className="text-[#F5F5DC]/60 text-sm mt-2">Production Build v1.1.0 • © 2024 All rights reserved</p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6">
              <a href="#" className="text-[#F5F5DC]/70 hover:text-[#D4AF37] transition">Terms</a>
              <a href="#" className="text-[#F5F5DC]/70 hover:text-[#D4AF37] transition">Privacy</a>
              <a href="#" className="text-[#F5F5DC]/70 hover:text-[#D4AF37] transition">Security</a>
              <a href="#" className="text-[#F5F5DC]/70 hover:text-[#D4AF37] transition">Status</a>
              <a href="#" className="text-[#F5F5DC]/70 hover:text-[#D4AF37] transition">Docs</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

function getTabIcon(tab: Tab): string {
  switch (tab) {
    case Tab.Dashboard: return 'home';
    case Tab.Image2Video: return 'film';
    case Tab.LipSync: return 'microphone-alt';
    case Tab.Projects: return 'folder';
    case Tab.Renders: return 'download';
    case Tab.Assets: return 'images';
    case Tab.Help: return 'question-circle';
    case Tab.Settings: return 'cog';
    default: return 'circle';
  }
}

export default App;
