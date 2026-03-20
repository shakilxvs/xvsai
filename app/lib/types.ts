export type Mode = 'chat' | 'deep' | 'fast' | 'research' | 'code' | 'image';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode: Mode;
  model?: string;
  provider?: string;
  timestamp: Date;
}

export interface ModeConfig {
  id: Mode;
  label: string;
  description: string;
  accent: string;
  glow: string;
  gradient: string;
}
