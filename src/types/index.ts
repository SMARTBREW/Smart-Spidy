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
  query: string; // User's question
  answer: string | null; // Assistant's answer (can be null until answered)
  chatId?: string;
  userId?: string;
  messageOrder?: number;
  createdAt?: Date;
  sender: 'user' | 'assistant'; // Added for admin/MessagesTable.tsx compatibility
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

// RAG System Types
export interface RAGResponse {
  answer: string;
  sources: KnowledgeBaseSource[];
  confidence: number;
  processingTime: number;
  metadata?: {
    queryEmbedding?: number[];
    searchResults?: number;
    contextLength?: number;
  };
}

export interface KnowledgeBaseSource {
  id: string;
  smartspidy_chunk: string;
  combined_text: string;
  similarity: number;
  metadata?: {
    source?: string;
    category?: string;
    lastUpdated?: string;
  };
}

export interface RAGError {
  message: string;
  type: 'embedding' | 'search' | 'generation' | 'validation' | 'unknown';
  details?: any;
  timestamp?: Date;
}

export interface RAGConfig {
  matchThreshold: number;
  matchCount: number;
  embeddingModel: string;
  chatModel: string;
  maxContextLength: number;
  temperature: number;
}

export interface SmartSpidyKnowledgeBase {
  id: string;
  combined_text: string;
  smartspidy_chunk: string;
  smartspidy_embedding: number[];
  created_at: string;
  metadata?: {
    source?: string;
    category?: string;
    tags?: string[];
  };
}