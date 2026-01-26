
import React from 'react';
import { Asset } from '../types';

interface AssetLibraryProps {
  assets: Asset[];
  onAddAsset: (asset: Asset) => void;
  setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
}

const AssetLibrary: React.FC<AssetLibraryProps> = ({ assets, onAddAsset, setAssets }) => {
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newAsset: Asset = {
        id: `a_${Date.now()}`,
        name: file.name,
        type: file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'audio',
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        date: new Date().toLocaleDateString()
      };
      onAddAsset(newAsset);
    }
  };

  return (
    <div className="glass-effect rounded-xl p-6 shadow-2xl animate-fadeIn">
       <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-[#D4AF37]">Asset Vault</h2>
        <label className="bg-[#D4AF37] text-black font-bold py-2 px-6 rounded-lg cursor-pointer hover:brightness-110 transition">
          <i className="fas fa-upload mr-2"></i> Import Media
          <input type="file" className="hidden" onChange={handleUpload} />
        </label>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
         {assets.length === 0 ? (
            <div className="col-span-full py-20 text-center text-white/20 italic">No assets in vault</div>
         ) : (
           assets.map(asset => (
             <div key={asset.id} className="bg-[#1A1A1A] border border-gold/10 rounded-lg overflow-hidden group hover:border-gold/50 transition">
                <div className="aspect-square bg-black/40 flex items-center justify-center relative">
                   <i className={`fas fa-${asset.type === 'image' ? 'image' : asset.type === 'video' ? 'video' : 'music'} text-4xl opacity-20`}></i>
                   <div className="absolute inset-0 bg-gold/10 opacity-0 group-hover:opacity-100 transition"></div>
                </div>
                <div className="p-3">
                   <p className="text-xs font-bold text-[#D4AF37] truncate">{asset.name}</p>
                   <p className="text-[10px] text-white/40">{asset.size} • {asset.date}</p>
                </div>
             </div>
           ))
         )}
      </div>
    </div>
  );
};

export default AssetLibrary;
