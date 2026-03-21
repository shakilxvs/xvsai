export type Mode = 'chat' | 'deep' | 'fast' | 'research' | 'code' | 'image';

export interface Source {
  title: string;
  url: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode: Mode;
  model?: string;
  provider?: string;
  timestamp: Date;
  imageUrl?: string;
  imageLoading?: boolean;
  sources?: Source[];
}

export interface ModeConfig {
  id: Mode;
  label: string;
  description: string;
  accent: string;
  glow: string;
  gradient: string;
}
