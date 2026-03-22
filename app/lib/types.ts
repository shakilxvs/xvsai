export type Mode = 'chat' | 'deep' | 'fast' | 'research' | 'code' | 'image' | 'open' | 'security';
export type UserStatus = 'pending' | 'approved' | 'banned' | 'rejected';

export interface Source {
  title: string;
  url: string;
}

export interface ImageResult {
  url: string;
  provider: string;
  providerUrl?: string;
  photographer?: string;
  photoUrl?: string;
  width?: number;
  height?: number;
}

export interface MediaItem {
  type: 'image' | 'video' | 'gif';
  url: string;
  thumb?: string;
  title?: string;
  provider: string;
  sourceUrl?: string;
  photographer?: string;
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
  images?: ImageResult[];
  sources?: Source[];
  openMedia?: MediaItem[];
}

export interface ModeConfig {
  id: Mode;
  label: string;
  description: string;
  accent: string;
  glow: string;
  gradient: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  dob?: string;
  gender?: string;
  address?: string;
  bio?: string;
  status: UserStatus;
  rejectionNote?: string;
  createdAt: Date;
  lastActive: Date;
  provider: 'google' | 'email';
}
