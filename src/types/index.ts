export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
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
}

export interface AppState {
  user: User | null;
  chats: Chat[];
  currentChatId: string | null;
  isLoading: boolean;
}