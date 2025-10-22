export enum VibeType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
}

export interface Vibe {
  id: string;
  content: string;
  user_id: string;
  media_url?: string;
  type: VibeType;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateVibeRequest {
  content: string;
  user_id: string;
  media_url?: string;
  type: VibeType;
  is_public: boolean;
}
