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
  createdBy: User;
  createdAt: Date;
}
// Predefined profession list for consistent template matching
export const PROFESSION_LIST = [
  'Entrepreneur',
  'Startup Founder',
  'Chef',
  'Home Chef',
  'Interior Designer',
  'Artist',
  'Painter',
  'Model',
  'Actor',
  'Dancer',
  'Singer',
  'Photographer',
  'Fashion Designer',
  'Makeup Artist',
  'MUA',
  'Tattoo Artist',
  'Content Creator',
  'Digital Creator',
  'Influencer',
  'YouTuber',
  'Blogger',
  'Vlogger',
  'Podcaster',
  'Cinematographer',
  'Filmmaker',
  'Graphic Designer',
  'Architect',
  'Event Planner',
  'Social Media Manager',
  'Writer',
  'Poet',
  'Standup Comedian',
  'Coach',
  'Life Coach',
  'Therapist',
  'Counselor',
  'Doctor',
  'Dentist',
  'Lawyer',
  'Engineer',
  'Software Developer',
  'Teacher',
  'Educator',
  'Consultant',
  'Chartered Accountant',
  'Fitness Trainer',
  'Yoga Instructor',
  'Zumba Coach',
  'Nutritionist',
  'Dietitian',
  'Astrologer',
  'Tarot Reader',
  'Saree Draper',
  'Boutique Owner',
  'Mehndi Artist',
  'Resin Artist',
  'Doodle Artist',
  'Nail Artist',
  'Decor Stylist',
  'Craft Store Owner',
  'Sustainable Fashion Advocate',
  'NGO Worker',
  'Social Worker',
  'Pet Influencer',
  'Pet Parent'
] as const;

export type ProfessionType = typeof PROFESSION_LIST[number];