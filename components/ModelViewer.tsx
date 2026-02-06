
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { VirtualSet, WardrobeStyle } from '../types';

interface ModelViewerProps {
  modelUrl: string;
  onSnapshot: (base64: string) => void;
  onStyleUpdate?: (promptModifier: string) => void;
  className?: string;
}

interface SceneHistoryState {
  activeSet: VirtualSet;
  activeOutfit: WardrobeStyle | null;
  outfitColor: { name: string; hex: string };
  reflectionIntensity: number;
  gridIntensity: number;
}

const PREDEFINED_SETS: VirtualSet[] = [
  // COLORS
  { id: 'chroma-green', name: 'Chroma Green', type: 'color', value: '#00ff00', thumbnail: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=150&h=150&fit=crop' },
  { id: 'chroma-blue', name: 'Chroma Blue', type: 'color', value: '#0000ff', thumbnail: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=150&h=150&fit=crop' },
  { id: 'studio-white', name: 'Studio White', type: 'color', value: '#ffffff', thumbnail: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=150&h=150&fit=crop' },
  { id: 'studio-black', name: 'Infinite Black', type: 'color', value: '#000000', thumbnail: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=150&h=150&fit=crop' },
  
  // VIDEOS (Motion)
  { id: 'vid-cyber', name: 'Cyber Grid', type: 'video', value: 'https://assets.mixkit.co/videos/preview/mixkit-abstract-technology-loop-with-blue-lines-and-dots-31293-large.mp4', thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=150' },
  { id: 'vid-bokeh', name: 'Luxury Bokeh', type: 'video', value: 'https://assets.mixkit.co/videos/preview/mixkit-golden-bokeh-lights-shimmering-in-the-dark-32630-large.mp4', thumbnail: 'https://images.unsplash.com/photo-1490810193509-47c9f1355057?w=150' },
  { id: 'vid-particles', name: 'Neural Flow', type: 'video', value: 'https://assets.mixkit.co/videos/preview/mixkit-floating-blue-particles-on-a-dark-background-34448-large.mp4', thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=150' },
  { id: 'vid-glitch', name: 'Data Glitch', type: 'video', value: 'https://assets.mixkit.co/videos/preview/mixkit-digital-glitch-distortion-on-a-dark-background-34449-large.mp4', thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=150' },
  
  // IMAGES / HDR (Environments)
  { id: 'hdr-studio', name: 'HDR Sunset', type: 'hdr', value: 'https://threejs.org/examples/textures/equirectangular/venice_sunset_1k.hdr', thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=150' },
  { id: 'studio-pro', name: 'Cinematic Studio', type: 'image', value: 'https://images.unsplash.com/photo-1621619856624-42fd193a0661?w=1920', thumbnail: 'https://images.unsplash.com/photo-1621619856624-42fd193a0661?w=150&h=150&fit=crop' },
  { id: 'podcast-sharjays', name: 'SHARJAYS Podcast', type: 'image', value: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=1920', thumbnail: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=150&h=150&fit=crop' },
];

const WARDROBE_STYLES: WardrobeStyle[] = [
  { id: 'exec-suit', name: 'Executive Suit', category: 'suit', promptModifier: 'bespoke tailored three-piece suit', thumbnail: 'https://images.unsplash.com/photo-1594932224828-b4b059b6f684?w=150&h=150&fit=crop', defaultColor: '#0a0a0a', material: 'Super 120s Merino Wool', texture: 'Fine Twill', fit: 'Bespoke' },
  { id: 'slim-suit', name: 'Slim-Fit Suit', category: 'suit', promptModifier: 'modern slim-fit wool suit', thumbnail: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=150&h=150&fit=crop', defaultColor: '#000080', material: 'Italian Wool Blend', texture: 'Smooth Matte', fit: 'Slim' },
  { id: 'silk-tie', name: 'Silk Tie', category: 'accessory', promptModifier: 'silk necktie with a Windsor knot', thumbnail: 'https://images.unsplash.com/photo-1589756823851-ede1be674188?w=150&h=150&fit=crop', defaultColor: '#8b0000', material: 'Mulberry Silk', texture: 'Satin Luster', fit: 'Regular' },
  { id: 'heavy-hoodie', name: 'Heavy Hoodie', category: 'hoodie', promptModifier: 'oversized heavyweight streetwear hoodie', thumbnail: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=150&h=150&fit=crop', defaultColor: '#1a1a1a', material: 'Heavyweight Fleece', texture: 'Brushed Cotton', fit: 'Oversized' },
  { id: 'essential-hoodie', name: 'Essential Hoodie', category: 'hoodie', promptModifier: 'clean minimalist essential hoodie', thumbnail: 'https://images.unsplash.com/photo-1531646083582-893ec7be61be?w=150&h=150&fit=crop', defaultColor: '#333333', material: 'Organic French Terry', texture: 'Looped Knit', fit: 'Relaxed' },
  { id: 'vneck-tee', name: 'V-Neck Tee', category: 'tshirt', promptModifier: 'premium cotton V-neck t-shirt', thumbnail: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=150&h=150&fit=crop', defaultColor: '#ffffff', material: 'Pima Cotton', texture: 'Soft Jersey', fit: 'Slim' },
  { id: 'crew-tee', name: 'Crew Neck Tee', category: 'tshirt', promptModifier: 'designer crew neck t-shirt', thumbnail: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=150&h=150&fit=crop', defaultColor: '#ffffff', material: 'Supima Cotton', texture: 'Fine Interlock', fit: 'Regular' },
  { id: 'cuban-chain', name: 'Cuban Link', category: 'accessory', promptModifier: 'solid heavy cuban link chain', thumbnail: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=150&h=150&fit=crop', defaultColor: '#D4AF37', material: '24K Gold Plated', texture: 'High Polish', fit: 'Solid' },
  { id: 'figaro-chain', name: 'Figaro Chain', category: 'accessory', promptModifier: 'sophisticated figaro chain', thumbnail: 'https://images.unsplash.com/photo-1590548784585-645d89efd671?w=150&h=150&fit=crop', defaultColor: '#C0C0C0', material: '925 Sterling Silver', texture: 'Diamond Cut', fit: 'Elegant' },
];

const OUTFIT_COLORS = [
  { name: 'Onyx', hex: '#0a0a0a' },
  { name: 'Midnight', hex: '#191970' },
  { name: 'Navy', hex: '#000080' },
  { name: 'Crimson', hex: '#8b0000' },
  { name: 'Emerald', hex: '#004d00' },
  { name: 'Charcoal', hex: '#36454f' },
  { name: 'Gold', hex: '#D4AF37' },
  { name: 'Silver', hex: '#C0C0C0' },
  { name: 'Ivory', hex: '#f5f5f5' },
  { name: 'Rose', hex: '#b76e79' },
];

const ModelViewer: React.FC<ModelViewerProps> = ({ modelUrl, onSnapshot, onStyleUpdate, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelGroupRef = useRef<THREE.Object3D | null>(null);
  const lodRef = useRef<THREE.LOD | null>(null);
  const bgModelGroupRef = useRef<THREE.Group | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isHoveredRef = useRef<boolean>(false);
  
  const reflectorRef = useRef<Reflector | null>(null);
  const floorPlaneRef = useRef<THREE.Mesh | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  
  const targetColorRef = useRef<THREE.Color>(new THREE.Color(0x0a0a0a));
  const currentColorRef = useRef<THREE.Color>(new THREE.Color(0x0a0a0a));
  const manualRotationRef = useRef<number>(0);
  const morphProgressRef = useRef<number>(0);

  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [activeSet, setActiveSet] = useState<VirtualSet>(PREDEFINED_SETS[0]);
  const [activeOutfit, setActiveOutfit] = useState<WardrobeStyle | null>(null);
  const [outfitColor, setOutfitColor] = useState<{ name: string; hex: string }>(OUTFIT_COLORS[0]);
  const [activeTab, setActiveTab] = useState<'stage' | 'wardrobe'>('stage');
  const [wardrobeFilter, setWardrobeFilter] = useState<WardrobeStyle['category'] | 'all'>('all');
  const [stageFilter, setStageFilter] = useState<'all' | 'color' | 'environment' | 'motion'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [customSets, setCustomSets] = useState<VirtualSet[]>([]);
  const [blurIntensity, setBlurIntensity] = useState(4);
  const [reflectionIntensity, setReflectionIntensity] = useState(0.5);
  const [gridIntensity, setGridIntensity] = useState(0.3);
  const [isMorphing, setIsMorphing] = useState(false);
  const [currentLodLevel, setCurrentLodLevel] = useState<string>('High-Fidelity');

  const [history, setHistory] = useState<SceneHistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isInternalUpdate = useRef(false);

  // Grouped and Filtered Wardrobe Logic
  const filteredWardrobeGroups = useMemo(() => {
    const searchLower = searchQuery.toLowerCase();
    const filtered = WARDROBE_STYLES.filter(s => {
      const matchesCategory = wardrobeFilter === 'all' || s.category === wardrobeFilter;
      const matchesSearch = s.name.toLowerCase().includes(searchLower);
      return matchesCategory && matchesSearch;
    });

    if (wardrobeFilter !== 'all') {
      return { [wardrobeFilter]: filtered };
    }

    return filtered.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, WardrobeStyle[]>);
  }, [wardrobeFilter, searchQuery]);

  // Grouped and Filtered Stage Logic
  const filteredStageItems = useMemo(() => {
    const all = [...PREDEFINED_SETS, ...customSets];
    return all.filter(item => {
      if (stageFilter === 'all') return true;
      if (stageFilter === 'color') return item.type === 'color';
      if (stageFilter === 'environment') return item.type === 'image' || item.type === 'hdr' || item.type === '3d';
      if (stageFilter === 'motion') return item.type === 'video';
      return true;
    });
  }, [stageFilter, customSets]);

  useEffect(() => {
    if (history.length === 0) {
      const initialState: SceneHistoryState = {
        activeSet: PREDEFINED_SETS[0],
        activeOutfit: null,
        outfitColor: OUTFIT_COLORS[0],
        reflectionIntensity: 0.5,
        gridIntensity: 0.3
      };
      setHistory([initialState]);
      setHistoryIndex(0);
    }
  }, []);

  useEffect(() => {
    if (onStyleUpdate) {
      if (activeOutfit) {
        onStyleUpdate(`wearing a ${outfitColor.name.toLowerCase()} ${activeOutfit.promptModifier}, material: ${activeOutfit.material}, texture: ${activeOutfit.texture}, fit: ${activeOutfit.fit}`);
      } else {
        onStyleUpdate("");
      }
    }
  }, [activeOutfit, outfitColor, onStyleUpdate]);

  const triggerMorphAnimation = useCallback(() => {
    setIsMorphing(true);
    morphProgressRef.current = 1.0;
    setTimeout(() => setIsMorphing(false), 1200);
  }, []);

  const rotateManual = useCallback((direction: 'left' | 'right') => {
    const amount = direction === 'left' ? -0.1 : 0.1;
    manualRotationRef.current += amount;
  }, []);

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const prevIndex = historyIndex - 1;
    const prevState = history[prevIndex];
    if (prevState.activeOutfit?.id !== activeOutfit?.id || prevState.outfitColor.hex !== outfitColor.hex) {
      triggerMorphAnimation();
    }
    isInternalUpdate.current = true;
    setActiveSet(prevState.activeSet);
    setActiveOutfit(prevState.activeOutfit);
    setOutfitColor(prevState.outfitColor);
    setReflectionIntensity(prevState.reflectionIntensity);
    setGridIntensity(prevState.gridIntensity);
    targetColorRef.current.set(prevState.outfitColor.hex);
    setHistoryIndex(prevIndex);
    setTimeout(() => { isInternalUpdate.current = false; }, 0);
  }, [historyIndex, history, activeOutfit, outfitColor, triggerMorphAnimation]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const nextIndex = historyIndex + 1;
    const nextState = history[nextIndex];
    if (nextState.activeOutfit?.id !== activeOutfit?.id || nextState.outfitColor.hex !== outfitColor.hex) {
      triggerMorphAnimation();
    }
    isInternalUpdate.current = true;
    setActiveSet(nextState.activeSet);
    setActiveOutfit(nextState.activeOutfit);
    setOutfitColor(nextState.outfitColor);
    setReflectionIntensity(nextState.reflectionIntensity);
    setGridIntensity(nextState.gridIntensity);
    targetColorRef.current.set(nextState.outfitColor.hex);
    setHistoryIndex(nextIndex);
    setTimeout(() => { isInternalUpdate.current = false; }, 0);
  }, [historyIndex, history, activeOutfit, outfitColor, triggerMorphAnimation]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      
      if (cmdOrCtrl && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      } else if (cmdOrCtrl && e.key === 'y') {
        e.preventDefault();
        redo();
      } else if (e.key === 'ArrowLeft') {
        rotateManual('left');
      } else if (e.key === 'ArrowRight') {
        rotateManual('right');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, rotateManual]);

  const commitToHistory = useCallback((newState: SceneHistoryState) => {
    if (isInternalUpdate.current) return;
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      const last = newHistory[newHistory.length - 1];
      if (last && last.activeSet.id === newState.activeSet.id && last.activeOutfit?.id === newState.activeOutfit?.id && last.outfitColor.hex === newState.outfitColor.hex) {
        return prev;
      }
      return [...newHistory, newState];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const updateScene = (update: Partial<SceneHistoryState>) => {
    const nextActiveSet = update.activeSet || activeSet;
    const nextActiveOutfit = update.activeOutfit === undefined ? activeOutfit : update.activeOutfit;
    const nextOutfitColor = update.outfitColor || outfitColor;
    const nextReflection = update.reflectionIntensity !== undefined ? update.reflectionIntensity : reflectionIntensity;
    const nextGrid = update.gridIntensity !== undefined ? update.gridIntensity : gridIntensity;
    
    if (update.activeOutfit !== undefined || update.outfitColor) {
      triggerMorphAnimation();
      if (update.outfitColor) {
        targetColorRef.current.set(update.outfitColor.hex);
      } else if (update.activeOutfit === null) {
        targetColorRef.current.set(0xffffff);
      }
    }

    if (update.activeSet) setActiveSet(update.activeSet);
    if (update.activeOutfit !== undefined) setActiveOutfit(update.activeOutfit);
    if (update.outfitColor) setOutfitColor(update.outfitColor);
    if (update.reflectionIntensity !== undefined) setReflectionIntensity(update.reflectionIntensity);
    if (update.gridIntensity !== undefined) setGridIntensity(update.gridIntensity);
    
    commitToHistory({ 
      activeSet: nextActiveSet, 
      activeOutfit: nextActiveOutfit, 
      outfitColor: nextOutfitColor,
      reflectionIntensity: nextReflection,
      gridIntensity: nextGrid
    });
  };

  const applySet = useCallback((set: VirtualSet) => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    
    if (videoRef.current) { 
      videoRef.current.pause(); 
      videoRef.current.src = "";
      videoRef.current.load();
      videoRef.current = null; 
    }
    if (bgModelGroupRef.current) { 
      scene.remove(bgModelGroupRef.current); 
      bgModelGroupRef.current = null; 
    }
    
    scene.background = new THREE.Color(0x0a0a0a);
    scene.environment = null;

    if (set.type === 'color') {
      const color = new THREE.Color(set.value);
      scene.background = color;
      if (floorPlaneRef.current) {
        (floorPlaneRef.current.material as THREE.MeshStandardMaterial).color.copy(color).multiplyScalar(0.2);
      }
    } else if (set.type === 'image') {
      new THREE.TextureLoader().load(set.value, (tex) => {
        tex.mapping = THREE.EquirectangularReflectionMapping; 
        tex.colorSpace = THREE.SRGBColorSpace;
        scene.background = tex; 
        scene.environment = tex;
      });
    } else if (set.type === 'hdr') {
      new RGBELoader().load(set.value, (tex) => {
        tex.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = tex; 
        scene.environment = tex;
      });
    } else if (set.type === 'video') {
      const video = document.createElement('video');
      video.src = set.value;
      video.loop = true; 
      video.muted = true; 
      video.playsInline = true; 
      video.crossOrigin = "anonymous";
      video.play().catch(e => console.warn("Video background playback blocked by browser", e));
      videoRef.current = video;
      
      const tex = new THREE.VideoTexture(video);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.format = THREE.RGBAFormat;
      scene.background = tex;
      scene.environment = tex;
    } else if (set.type === '3d') {
      new GLTFLoader().load(set.value, (gltf) => {
        const bg = gltf.scene;
        bgModelGroupRef.current = bg;
        const box = new THREE.Box3().setFromObject(bg);
        const scaleValue = 20 / Math.max(box.getSize(new THREE.Vector3()).x, 1);
        bg.scale.set(scaleValue, scaleValue, scaleValue);
        bg.position.y = -box.min.y * scaleValue;
        scene.add(bg);
      });
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    setLoading(true);

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    camera.position.set(0, 2, 5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(5, 5, 5);
    scene.add(keyLight);

    // GROUND SYSTEM
    const groundGeo = new THREE.PlaneGeometry(100, 100);
    
    // 1. Physical Floor Plane
    const floorMat = new THREE.MeshStandardMaterial({ 
      color: 0x050505, 
      roughness: 0.1, 
      metalness: 0.8,
      transparent: true,
      opacity: 0.95
    });
    const floorPlane = new THREE.Mesh(groundGeo, floorMat);
    floorPlane.rotation.x = -Math.PI / 2;
    floorPlane.position.y = -1.25;
    scene.add(floorPlane);
    floorPlaneRef.current = floorPlane;

    // 2. Reflective Mirror Plane
    const groundReflector = new Reflector(groundGeo, {
      clipBias: 0.003,
      textureWidth: window.innerWidth * window.devicePixelRatio,
      textureHeight: window.innerHeight * window.devicePixelRatio,
      color: 0x222222,
    });
    groundReflector.rotation.x = -Math.PI / 2;
    groundReflector.position.y = -1.24; // Slightly above floor plane to avoid z-fighting
    scene.add(groundReflector);
    reflectorRef.current = groundReflector;

    // 3. Cyber Grid Overlay
    const grid = new THREE.GridHelper(100, 50, 0xD4AF37, 0x333333);
    grid.position.y = -1.23;
    scene.add(grid);
    gridHelperRef.current = grid;

    const loader = new GLTFLoader();
    loader.load(modelUrl, (gltf) => {
      const highDetail = gltf.scene;
      const box = new THREE.Box3().setFromObject(highDetail);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      highDetail.position.sub(center);

      // Adjust floor position based on model base
      const groundLevel = -(size.y / 2);
      if (reflectorRef.current) reflectorRef.current.position.y = groundLevel + 0.005;
      if (floorPlaneRef.current) floorPlaneRef.current.position.y = groundLevel;
      if (gridHelperRef.current) gridHelperRef.current.position.y = groundLevel + 0.01;

      const lod = new THREE.LOD();
      lodRef.current = lod;
      lod.addLevel(highDetail, 0);

      const mediumDetail = highDetail.clone(true);
      mediumDetail.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const cloneMat = (m: THREE.Material) => {
             const c = m.clone() as THREE.MeshStandardMaterial;
             c.wireframe = true; c.transparent = true; c.opacity = 0.5;
             return c;
          };
          
          // Use local variable for narrowing to avoid 'unknown' type errors with mesh.material
          const mats = mesh.material;
          if (Array.isArray(mats)) {
            mesh.material = (mats as THREE.Material[]).map((m: THREE.Material) => cloneMat(m));
          } else {
            mesh.material = cloneMat(mats as THREE.Material);
          }
        }
      });

      const lowDetailGeo = new THREE.BoxGeometry(size.x, size.y, size.z);
      const lowDetailMat = new THREE.MeshBasicMaterial({ color: 0xD4AF37, wireframe: true, transparent: true, opacity: 0.3 });
      lod.addLevel(new THREE.Mesh(lowDetailGeo, lowDetailMat), 15);

      scene.add(lod);
      modelGroupRef.current = lod;
      setLoading(false);
      applySet(activeSet);
    }, (xhr) => {
      if (xhr.lengthComputable) setLoadProgress(Math.round((xhr.loaded / xhr.total) * 100));
    });

    const animate = () => {
      requestAnimationFrame(animate);
      if (modelGroupRef.current) {
        if (manualRotationRef.current !== 0) {
          modelGroupRef.current.rotation.y += manualRotationRef.current;
          manualRotationRef.current *= 0.8;
          if (Math.abs(manualRotationRef.current) < 0.001) manualRotationRef.current = 0;
        }

        modelGroupRef.current.rotation.y += isHoveredRef.current ? 0.007 : 0.002;
        
        if (morphProgressRef.current > 0.01) {
          morphProgressRef.current *= 0.94;
        } else {
          morphProgressRef.current = 0;
        }

        const baseScale = isHoveredRef.current ? 1.05 : 1.0;
        const morphScale = 1.0 + Math.sin(morphProgressRef.current * Math.PI) * 0.05;
        const targetScaleValue = baseScale * morphScale;
        modelGroupRef.current.scale.lerp(new THREE.Vector3(targetScaleValue, targetScaleValue, targetScaleValue), 0.1);
        
        currentColorRef.current.lerp(targetColorRef.current, 0.06);
        
        modelGroupRef.current.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const updateMat = (m: THREE.Material) => {
              if (m instanceof THREE.MeshStandardMaterial) {
                m.color.copy(currentColorRef.current);
                const pulseColor = new THREE.Color(0xD4AF37).multiplyScalar(morphProgressRef.current * 2);
                m.emissive.copy(pulseColor);
                if (morphProgressRef.current > 0.1) {
                   mesh.position.x = (Math.random() - 0.5) * 0.01 * morphProgressRef.current;
                   mesh.position.z = (Math.random() - 0.5) * 0.01 * morphProgressRef.current;
                } else {
                   mesh.position.set(0, 0, 0);
                }
              }
            };
            
            // Explicit type cast to Material or Material[] for safe iteration.
            const mats = mesh.material;
            if (Array.isArray(mats)) {
              (mats as THREE.Material[]).forEach(updateMat);
            } else {
              updateMat(mats as THREE.Material);
            }
          }
        });
        
        if (lodRef.current && cameraRef.current) {
          const dist = cameraRef.current.position.distanceTo(lodRef.current.position);
          let levelIdx = 0;
          for(let i = lodRef.current.levels.length - 1; i >= 0; i--) {
            if (dist >= lodRef.current.levels[i].distance) { levelIdx = i; break; }
          }
          if (levelIdx === 0) setCurrentLodLevel('High-Fidelity');
          else if (levelIdx === 1) setCurrentLodLevel('Wire-Ghost');
          else if (levelIdx === 2) setCurrentLodLevel('Spatial-Proxy');
        }
      }

      if (reflectorRef.current) {
        const baseColor = new THREE.Color(0x222222).multiplyScalar(reflectionIntensity * 2);
        reflectorRef.current.getRenderTarget().texture.generateMipmaps = true;
        reflectorRef.current.visible = reflectionIntensity > 0.01;
      }

      if (gridHelperRef.current) {
        gridHelperRef.current.visible = gridIntensity > 0.01;
        const mat = gridHelperRef.current.material as THREE.LineBasicMaterial;
        mat.opacity = gridIntensity;
        mat.transparent = true;
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      renderer.dispose();
      if (containerRef.current) containerRef.current.innerHTML = '';
      sceneRef.current = null;
    };
  }, [modelUrl]);

  useEffect(() => {
    applySet(activeSet);
  }, [activeSet, applySet]);

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const url = URL.createObjectURL(file);
    const is3d = file.name.endsWith('.glb') || file.name.endsWith('.gltf');
    const isHdr = file.name.endsWith('.hdr') || file.name.endsWith('.exr');
    const isVideo = file.type.startsWith('video/');
    const type = is3d ? '3d' : isHdr ? 'hdr' : isVideo ? 'video' : 'image';
    
    const newSet: VirtualSet = { 
      id: `c-${Date.now()}`, 
      name: file.name, 
      type, 
      value: url, 
      thumbnail: isVideo || isHdr || is3d ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150' : url 
    };
    
    setCustomSets(prev => [newSet, ...prev]);
    updateScene({ activeSet: newSet });
  };

  return (
    <div className={`relative ${className} group overflow-hidden bg-black rounded-2xl shadow-inner`}>
      <div 
        ref={containerRef} 
        style={{ filter: `blur(${blurIntensity}px) ${isMorphing ? 'brightness(1.8) contrast(1.1) saturate(0.2)' : ''}`, transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
        className={`w-full h-full cursor-grab active:cursor-grabbing transition-all duration-700 ${isMorphing ? 'animate-flicker' : ''}`} 
        onMouseEnter={() => { isHoveredRef.current = true; }}
        onMouseLeave={() => { isHoveredRef.current = false; }}
      />
      <div className={`absolute inset-0 z-[5] pointer-events-none transition-opacity duration-700 bg-white/20 mix-blend-overlay ${isMorphing ? 'opacity-100' : 'opacity-0'}`}></div>
      
      {isMorphing && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div className="absolute inset-0 bg-gold/5 animate-pulse"></div>
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gold/80 shadow-[0_0_20px_rgba(212,175,55,1)] animate-scan"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="px-6 py-2 bg-black/80 border border-gold/60 rounded-full backdrop-blur-xl shadow-2xl flex items-center gap-4">
               <div className="w-2 h-2 bg-gold rounded-full animate-ping"></div>
               <span className="text-[10px] text-gold font-black uppercase tracking-[0.5em]">Neural Morph Active...</span>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 backdrop-blur-3xl z-50">
          <div className="w-16 h-16 border-4 border-gold/10 border-t-gold rounded-full animate-spin mb-4"></div>
          <h4 className="text-[10px] text-gold font-black uppercase tracking-[0.4em]">Mounting Neural Scene... ({loadProgress}%)</h4>
        </div>
      )}
      {!loading && (
        <>
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
             <div className="bg-black/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-3">
                <div className="flex flex-col">
                   <span className="text-[7px] text-white/40 font-black uppercase tracking-widest">Neural Precision (LOD)</span>
                   <span className={`text-[9px] font-mono font-bold uppercase ${currentLodLevel === 'High-Fidelity' ? 'text-green-500' : currentLodLevel === 'Wire-Ghost' ? 'text-yellow-500' : 'text-red-500'}`}>{currentLodLevel}</span>
                </div>
             </div>
          </div>

          <div className="absolute bottom-6 left-6 z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
            <button 
              onMouseDown={() => { const itv = setInterval(() => rotateManual('left'), 50); window.addEventListener('mouseup', () => clearInterval(itv), {once: true}); }}
              onClick={() => rotateManual('left')}
              className="w-10 h-10 bg-black/80 backdrop-blur-md border border-white/10 text-gold rounded-full flex items-center justify-center hover:bg-gold hover:text-black transition-all shadow-xl pointer-events-auto"
              title="Rotate Left (ArrowLeft)"
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <button 
              onMouseDown={() => { const itv = setInterval(() => rotateManual('right'), 50); window.addEventListener('mouseup', () => clearInterval(itv), {once: true}); }}
              onClick={() => rotateManual('right')}
              className="w-10 h-10 bg-black/80 backdrop-blur-md border border-white/10 text-gold rounded-full flex items-center justify-center hover:bg-gold hover:text-black transition-all shadow-xl pointer-events-auto"
              title="Rotate Right (ArrowRight)"
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>

          <div className="absolute top-4 right-4 bottom-4 w-64 flex flex-col gap-4 bg-black/80 backdrop-blur-2xl p-5 rounded-3xl border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-12 group-hover:translate-x-0 overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center mb-1">
               <span className="text-[8px] text-white/40 uppercase font-black tracking-widest">Studio History</span>
               <div className="flex gap-2">
                  <button onClick={undo} disabled={historyIndex <= 0} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${historyIndex > 0 ? 'bg-gold/10 text-gold hover:bg-gold hover:text-black' : 'text-white/5 cursor-not-allowed opacity-30'}`}><i className="fas fa-undo text-[10px]"></i></button>
                  <button onClick={redo} disabled={historyIndex >= history.length - 1} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${historyIndex < history.length - 1 ? 'bg-gold/10 text-gold hover:bg-gold hover:text-black' : 'text-white/5 cursor-not-allowed opacity-30'}`}><i className="fas fa-redo text-[10px]"></i></button>
               </div>
            </div>
            <div className="flex gap-2 p-1 bg-white/5 rounded-xl mb-1">
              <button onClick={() => setActiveTab('stage')} className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === 'stage' ? 'bg-gold text-black' : 'text-white/40 hover:text-white'}`}>Stage</button>
              <button onClick={() => setActiveTab('wardrobe')} className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === 'wardrobe' ? 'bg-gold text-black' : 'text-white/40 hover:text-white'}`}>Wardrobe</button>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin pr-1">
              {activeTab === 'stage' ? (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-[8px] text-white/40 uppercase font-black tracking-widest">Background Gallery</span>
                    <button onClick={() => fileInputRef.current?.click()} className="text-[8px] text-gold hover:scale-110" title="Upload custom background image, video, or HDR"><i className="fas fa-plus"></i></button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*,.glb,.gltf,.hdr,.exr" onChange={handleCustomUpload} />
                  </div>

                  {/* Stage Filters */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {['all', 'color', 'environment', 'motion'].map(cat => (
                      <button 
                        key={cat} 
                        onClick={() => setStageFilter(cat as any)} 
                        className={`text-[6px] uppercase font-black px-2 py-1 rounded transition-all flex items-center gap-1 ${
                          stageFilter === cat 
                            ? 'bg-gold text-black' 
                            : 'text-white/30 bg-white/5 hover:text-white'
                        }`}
                      >
                        <i className={`fas fa-${
                          cat === 'all' ? 'layer-group' : 
                          cat === 'color' ? 'palette' : 
                          cat === 'environment' ? 'mountain' : 'film'
                        }`}></i>
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {filteredStageItems.map(set => (
                      <button 
                        key={set.id} 
                        onClick={() => updateScene({ activeSet: set })} 
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all group/stage-item ${activeSet.id === set.id ? 'border-gold scale-95 shadow-lg shadow-gold/20' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-95'}`}
                      >
                        <img src={set.thumbnail} className="w-full h-full object-cover" alt={set.name} />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/stage-item:opacity-100 transition-opacity">
                          <i className={`fas fa-${
                            set.type === 'video' ? 'play' : 
                            set.type === '3d' ? 'cube' : 
                            set.type === 'hdr' ? 'sun' : 
                            set.type === 'color' ? 'fill-drip' : 'image'
                          } text-[10px] text-white`}></i>
                        </div>
                        {set.type === 'video' && <div className="absolute top-1 right-1"><i className="fas fa-sync-alt text-[6px] text-gold animate-spin-slow"></i></div>}
                        <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/60 translate-y-full group-hover/stage-item:translate-y-0 transition-transform">
                          <p className="text-[5px] text-white font-black uppercase truncate">{set.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-[8px] text-white/40 uppercase font-black tracking-widest">Garments</span>
                  </div>

                  <div className="space-y-2 mt-2">
                    <div className="relative group/search">
                      <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[8px] text-white/20 group-focus-within/search:text-gold transition-colors"></i>
                      <input 
                        type="text" 
                        placeholder="Search garments..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 pl-8 pr-3 text-[9px] text-white focus:outline-none focus:border-gold/50 focus:bg-white/10 transition-all"
                      />
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {['all', 'suit', 'hoodie', 'tshirt', 'accessory'].map(cat => (
                        <button 
                          key={cat} 
                          onClick={() => setWardrobeFilter(cat as any)} 
                          className={`text-[6px] uppercase font-black px-2 py-1 rounded transition-all flex items-center gap-1.5 ${
                            wardrobeFilter === cat 
                              ? 'bg-gold text-black shadow-lg shadow-gold/20' 
                              : 'text-white/30 bg-white/5 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <i className={`fas fa-${
                            cat === 'all' ? 'th-large' : 
                            cat === 'suit' ? 'user-tie' : 
                            cat === 'hoodie' ? 'tshirt' : 
                            cat === 'tshirt' ? 'tshirt' : 'gem'
                          }`}></i>
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {activeOutfit && (
                    <div className="bg-gold/5 border border-gold/20 rounded-xl p-3 mb-2 space-y-2 animate-slideUp">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-gold uppercase tracking-widest">{activeOutfit.name}</span>
                        <button onClick={() => updateScene({ activeOutfit: null })} className="text-red-500 hover:text-red-400 text-[10px] transition-colors"><i className="fas fa-times-circle"></i></button>
                      </div>
                      <div className="grid grid-cols-1 gap-1.5">
                        <div className="flex justify-between text-[7px] text-white/40 uppercase tracking-widest">
                          <span>Material</span>
                          <span className="text-white">{activeOutfit.material}</span>
                        </div>
                        <div className="flex justify-between text-[7px] text-white/40 uppercase tracking-widest">
                          <span>Texture</span>
                          <span className="text-white">{activeOutfit.texture}</span>
                        </div>
                        <div className="flex justify-between text-[7px] text-white/40 uppercase tracking-widest">
                          <span>Fit</span>
                          <span className="text-white">{activeOutfit.fit}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {Object.keys(filteredWardrobeGroups).length === 0 ? (
                      <div className="text-center py-10">
                        <i className="fas fa-search text-white/5 text-3xl mb-3 block"></i>
                        <p className="text-[9px] text-white/30 uppercase font-black tracking-widest">No garments found</p>
                      </div>
                    ) : (
                      Object.entries(filteredWardrobeGroups).map(([group, items]) => (
                        <div key={group} className="space-y-2">
                          <div className="flex items-center gap-2 border-b border-white/5 pb-1">
                            <span className="text-[7px] text-white/20 uppercase font-black tracking-[0.3em]">{group}s</span>
                            <div className="flex-1 h-[1px] bg-white/5"></div>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {items.map(style => (
                              <button 
                                key={style.id} 
                                onClick={() => updateScene({ activeOutfit: style })} 
                                title={style.name}
                                className={`aspect-square rounded-xl overflow-hidden border-2 transition-all relative group/item ${
                                  activeOutfit?.id === style.id 
                                    ? 'border-gold scale-95 shadow-lg shadow-gold/20' 
                                    : 'border-transparent opacity-60 hover:opacity-100 hover:scale-95'
                                }`}
                              >
                                <img src={style.thumbnail} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-end p-1.5">
                                  <span className="text-[5px] text-white font-black uppercase truncate w-full">{style.name}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {activeOutfit && (
                    <div className="pt-2 border-t border-white/5 space-y-2">
                      <span className="text-[8px] text-white/40 uppercase font-black tracking-widest">Material Tint</span>
                      <div className="grid grid-cols-5 gap-2">
                        {OUTFIT_COLORS.map(color => (
                          <button key={color.hex} onClick={() => updateScene({ outfitColor: color })} className={`w-full aspect-square rounded-full border-2 transition-all scale-90 hover:scale-100 ${outfitColor.hex === color.hex ? 'border-white ring-2 ring-gold/20' : 'border-transparent'}`} style={{ backgroundColor: color.hex }} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="pt-4 border-t border-white/5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[8px] text-white/50 font-black uppercase tracking-widest">Reflection Power</span>
                <span className="text-[8px] text-gold font-mono">{(reflectionIntensity * 100).toFixed(0)}%</span>
              </div>
              <input type="range" min="0" max="1" step="0.01" value={reflectionIntensity} onChange={(e) => updateScene({ reflectionIntensity: parseFloat(e.target.value) })} className="w-full h-1 bg-gold/20 rounded-lg appearance-none cursor-pointer accent-gold" />
              
              <div className="flex justify-between items-center">
                <span className="text-[8px] text-white/50 font-black uppercase tracking-widest">Cyber Grid</span>
                <span className="text-[8px] text-gold font-mono">{(gridIntensity * 100).toFixed(0)}%</span>
              </div>
              <input type="range" min="0" max="1" step="0.01" value={gridIntensity} onChange={(e) => updateScene({ gridIntensity: parseFloat(e.target.value) })} className="w-full h-1 bg-gold/20 rounded-lg appearance-none cursor-pointer accent-gold" />
              
              <div className="flex justify-between items-center pt-2">
                <span className="text-[8px] text-white/50 font-black uppercase tracking-widest">Focus Blur</span>
                <span className="text-[8px] text-gold font-mono">{blurIntensity}px</span>
              </div>
              <input type="range" min="0" max="20" value={blurIntensity} onChange={(e) => setBlurIntensity(parseInt(e.target.value))} className="w-full h-1 bg-gold/20 rounded-lg appearance-none cursor-pointer accent-gold" />
            </div>
          </div>
          <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
            <div className="bg-black/90 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full animate-pulse ${activeOutfit ? 'bg-gold shadow-[0_0_10px_rgba(212,175,55,0.5)]' : 'bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]'}`}></div>
              <div><p className="text-[8px] text-white/40 uppercase font-black mb-0.5">Stream Status</p><p className="text-[10px] text-gold font-mono uppercase truncate max-w-[180px] tracking-tight">{activeOutfit ? `${outfitColor.name} ${activeOutfit.name}` : `Set: ${activeSet.name}`}</p></div>
            </div>
            <button onClick={() => onSnapshot(rendererRef.current!.domElement.toDataURL())} className="bg-gold text-black text-[10px] font-black py-4 px-8 rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all uppercase tracking-widest">Capture Frame</button>
          </div>
        </>
      )}
      <style>{`
        @keyframes scan { 0% { transform: translateY(-100%); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(1200%); opacity: 0; } }
        .animate-scan { animation: scan 1.2s linear infinite; }
        @keyframes flicker { 0% { opacity: 0.95; filter: hue-rotate(0deg); } 50% { opacity: 1; filter: hue-rotate(2deg); } 100% { opacity: 0.95; filter: hue-rotate(0deg); } }
        .animate-flicker { animation: flicker 0.15s infinite; }
        .animate-spin-slow { animation: spin 3s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ModelViewer;