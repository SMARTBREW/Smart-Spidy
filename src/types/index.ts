type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  role?: UserRole;
  isActive?: boolean;
  lastLogin?: string;
  createdAt?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin';
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface UserSession {
  id: string;
  userId: string;
  loginTime: Date;
  logoutTime: Date | null;
  ipAddress: string | null;
  userAgent: string | null;
  sessionDuration: number | null;
  isActive: boolean;
  createdAt: Date;
  user?: User;
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  chatId?: string;
  userId?: string;
  messageOrder?: number;
  createdAt?: Date;
  feedback?: string | null;
  instagramAccount?: InstagramAccount;
}

export interface InstagramAccount {
  id: string;
  igUserId?: string;
  username: string;
  name?: string;
  biography?: string;
  website?: string;
  followersCount?: number;
  followsCount?: number;
  mediaCount?: number;
  accountType?: string;
  isVerified?: boolean;
  igId?: string;
  audienceGenderAge?: any;
  audienceCountry?: any;
  audienceCity?: any;
  audienceLocale?: any;
  insights?: {
    impressions?: number;
    reach?: number;
    profileViews?: number;
    websiteClicks?: number;
  };
  mentions?: InstagramMention[];
  media?: InstagramMedia[];
  fetchedAt?: string;
  hasDetailedAccess?: boolean;
  totalLikesCount?: number;
  totalCommentsCount?: number;
  lastPostDate?: string;
  aiAnalysisScore?: number;
  aiAnalysisDetails?: {
    category?: string;
    strengths?: string[];
    weaknesses?: string[];
    recommendations?: string[];
    analysis?: string;
    metrics?: any;
    engagementRate?: number;
    analyzedAt?: string;
    error?: string;
  };
  rawJson?: any;
}

export interface InstagramMedia {
  id: string;
  mediaType: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  permalink?: string;
  caption?: string;
  timestamp?: string;
  likeCount?: number;
  commentsCount?: number;
  children?: InstagramMedia[];
  insights?: {
    impressions?: number;
    reach?: number;
    engagement?: number;
    saved?: number;
    videoViews?: number;
  };
  comments?: InstagramComment[];
}

export interface InstagramComment {
  id: string;
  text: string;
  username: string;
  timestamp: string;
  replies?: InstagramComment[];
}

export interface InstagramMention {
  id: string;
  mediaType: string;
  mediaUrl?: string;
  permalink?: string;
  caption?: string;
  timestamp: string;
}

// For admin UI Q&A pairing
export interface QAPair {
  query: Message;
  answer?: Message;
}

export interface Chat {
  id: string;
  name: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  pinned: boolean;
  pinnedAt: Date | null;
  status: 'green' | 'yellow' | 'red' | 'gold' | null;
  is_gold?: boolean; // <-- Added for gold status
  userId?: string;
  messageCount?: number;
  user?: User;
  instagramUsername?: string;
  occupation?: string;
  product?: string;
  gender?: string;
  profession?: ProfessionType; // <-- Added profession field
}

export interface TrainingData {
  id: string;
  userQuestion: string;
  assistantAnswer: string;
  userId: string | null;
  chatId: string | null;
  messageId: string | null;
  qualityScore: number;
  version: number;
  loopIteration: number;
  improvementNotes: string | null;
  embeddingVector: number[] | null;
  source: 'chat' | 'auto' | 'imported' | 'manual';
  tags: string[] | null;
  keywords: string[] | null;
  category: string | null;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  chat?: Chat;
  message?: Message;
  feedback?: string | null;
}

export interface AppState {
  user: User | null;
  chats: Chat[];
  currentChatId: string | null;
  isLoading: boolean;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalChats: number;
  totalMessages: number;
  trainingDataCount: number;
  activeSessions: number;
}

export interface Fundraiser {
  id: string;
  name: string;
  createdBy: User | string;
  createdAt: Date;
  user?: User;
}
// Predefined profession list for consistent template matching - matches database exactly
export const PROFESSION_LIST = [
  'Chef',
  'Golfer',
  'Lawyer',
  'Blogger',
  'Entrepreneur',
  'CEO',
  'Founder',
  'Coach',
  'Fitness Coach',
  'Nutritionist',
  'Leader',
  'Writer',
  'Author',
  'Social Worker/Activist',
  'Chef',
  'Doctor',
  'Model',
  'Digital Creator',
  'Influencer',
  'Youtuber',
  'Defense Veteran',
  'Defense Spouse',
  'NRI',
  "Women's Chamber of Commerce",
  'Interior Designer',
  'Designer',
  'Philanthropist',
  'IB School Student',
  'IB School Mother',
  'Journalist',
  'Pageant Winner',
  'Golfer',
  'Lawyer',
  'Director ‚Äì Organization',
  'Co-Founder',
  'Psychologist',
  'Politician',
  'Therapist',
  'Producer',
  'Producer',
  'Director ‚Äì Films',
  'VFX Designer',
  'Actor',
  'Actress',
  'Artist',
  'Cinematographer',
  'Music Director',
  'Vlogger',
  'Blogger',
  'TEDx Speaker',
  'Professor',
  'Author',
  'Model',
  'Digital Creator',
  'Social Activist /worker',
  'Chef',
  'Doctor',
  'Entrepreneur',
  'CEO',
  'Founder',
  'Coach',
  'Fitness Coach',
  'Nutritionist',
  'Leader',
  'Writer',
  'Influencer',
  'YouTuber',
  'Defence Veteran',
  'Defence Spouse',
  'NRI',
  "Women's Chamber of Commerce",
  'Interior Designer',
  'Designer',
  'Philanthropist',
  'IB School Student',
  'IB School Mother',
  'Journalist',
  'Pageant Winner',
  'Golfer',
  'Director - Organization',
  'Co-Founder',
  'Psychologist',
  'Politician',
  'Therapist',
  'Producer',
  'Film Director',
  'VFX Designer',
  'Cinematographer',
  'Artist',
  'Actor',
  'Actress',
  'Music Director',
  'Vlogger',
  'Blogger',
  'TEDx Speaker',
  'Professor',
  'Entrepreneur',
  'CEO',
  'Founder',
  'Coach'
] as const;

export type ProfessionType = typeof PROFESSION_LIST[number];