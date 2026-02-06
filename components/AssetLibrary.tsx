
import React, { useState } from 'react';
import { Asset } from '../types';

interface AssetLibraryProps {
  assets: Asset[];
  onAddAsset: (asset: Asset) => void;
  setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
}

const AssetLibrary: React.FC<AssetLibraryProps> = ({ assets, onAddAsset, setAssets }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [filter, setFilter] = useState<'all' | 'image' | '3d'>('all');

  const processFile = (file: File) => {
    const reader = new FileReader();
    const is3d = file.name.endsWith('.glb') || file.name.endsWith('.gltf');
    const isImage = file.type.startsWith('image/');
    
    reader.onload = (ev) => {
      const newAsset: Asset = {
        id: `a_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: file.name,
        type: is3d ? '3d' : isImage ? 'image' : 'video',
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        date: new Date().toLocaleDateString(),
        dataUrl: ev.target?.result as string
      };
      onAddAsset(newAsset);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) Array.from(files).forEach(processFile);
  };

  const filteredAssets = assets.filter(a => filter === 'all' || a.type === filter);

  return (
    <div 
      className={`glass-effect rounded-xl p-6 shadow-2xl animate-fadeIn min-h-[500px] transition-all duration-300 relative ${
        isDragging ? 'ring-2 ring-gold bg-gold/5' : ''
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); Array.from(e.dataTransfer.files).forEach(processFile); }}
    >
       {isDragging && (
         <div className="absolute inset-0 bg-gold/10 backdrop-blur-sm z-10 flex flex-col items-center justify-center border-2 border-dashed border-gold m-4 rounded-xl pointer-events-none">
            <i className="fas fa-cube text-6xl text-gold animate-bounce mb-4"></i>
            <p className="text-gold font-bold text-xl uppercase tracking-widest">Drop Media or 3D Assets</p>
         </div>
       )}

       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[#D4AF37]">Asset Vault</h2>
          <div className="flex gap-4 mt-2">
            {['all', 'image', '3d'].map(f => (
              <button 
                key={f} 
                onClick={() => setFilter(f as any)}
                className={`text-[10px] uppercase font-bold tracking-widest pb-1 transition-all ${filter === f ? 'text-gold border-b border-gold' : 'text-white/40 hover:text-white'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <label className="bg-[#D4AF37] text-black font-bold py-2 px-6 rounded-lg cursor-pointer hover:brightness-110 transition shadow-lg shadow-gold/10">
          <i className="fas fa-upload mr-2"></i> Import Media
          <input type="file" className="hidden" multiple onChange={handleUpload} />
        </label>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
         {filteredAssets.length === 0 ? (
            <div className="col-span-full py-20 text-center text-white/10 italic">
               <i className="fas fa-archive text-6xl mb-4 block"></i>
               Vault empty in this category.
            </div>
         ) : (
           filteredAssets.map(asset => (
             <div key={asset.id} className="bg-[#1A1A1A] border border-gold/10 rounded-xl overflow-hidden group hover:border-gold/50 transition shadow-lg">
                <div className="aspect-square bg-black/40 flex items-center justify-center relative">
                   {asset.type === '3d' ? (
                     <i className="fas fa-cube text-5xl text-gold/30 group-hover:text-gold transition-colors"></i>
                   ) : asset.type === 'image' ? (
                     <img src={asset.dataUrl} alt={asset.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition" />
                   ) : (
                     <i className="fas fa-film text-4xl opacity-20"></i>
                   )}
                   <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition"></div>
                   <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button 
                        onClick={() => setAssets(prev => prev.filter(a => a.id !== asset.id))}
                        className="bg-red-500/50 text-white w-6 h-6 rounded flex items-center justify-center hover:bg-red-500"
                      >
                        <i className="fas fa-trash text-[10px]"></i>
                      </button>
                   </div>
                   {asset.type === '3d' && (
                     <span className="absolute bottom-2 left-2 bg-gold text-black text-[8px] font-bold px-1.5 rounded uppercase">3D GLB</span>
                   )}
                </div>
                <div className="p-3">
                   <p className="text-[11px] font-bold text-[#D4AF37] truncate">{asset.name}</p>
                   <p className="text-[9px] text-white/30">{asset.size} • {asset.date}</p>
                </div>
             </div>
           ))
         )}
      </div>
    </div>
  );
};

export default AssetLibrary;
