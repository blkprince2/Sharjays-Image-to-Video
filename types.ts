
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
  type: 'image' | 'video' | 'audio';
  size: string;
  date: string;
  dataUrl?: string;
}

export interface GenerationSettings {
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
