
export enum Tab {
  Dashboard = 'dashboard',
  Image2Video = 'image2video',
  LipSync = 'lipsync',
  Projects = 'projects',
  Renders = 'renders',
  Assets = 'assets',
  Help = 'help',
  Settings = 'settings'
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  imageCount: number;
  videoCount: number;
  thumbnail?: string;
}

export interface RenderJob {
  id: string;
  type: 'image2video' | 'lipsync';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: string;
  outputUrl?: string;
  prompt?: string;
}

export interface Asset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio' | '3d';
  size: string;
  date: string;
  dataUrl?: string;
}

export interface VirtualSet {
  id: string;
  name: string;
  type: 'color' | 'image' | 'video' | '3d' | 'hdr';
  value: string; // Hex color or URL
  thumbnail: string;
}

export interface WardrobeStyle {
  id: string;
  name: string;
  category: 'suit' | 'hoodie' | 'tshirt' | 'accessory';
  promptModifier: string;
  thumbnail: string;
  defaultColor: string;
  material: string;
  texture: string;
  fit: string;
}

export interface GenerationSettings {
  // Existing interface remains same
  prompt: string;
  negativePrompt: string;
  stylePreset: string;
  cameraMotion: string;
  motionStrength: number;
  duration: number;
  fps: number;
  resolution: string;
  aspectRatio: string;
  seed: number;
  subjectLock: boolean;
  cfgScale: number;
  steps: number;
}
