import React, { useState, useRef, useEffect } from 'react';
import { Chat } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Search, Loader2 } from 'lucide-react';
import { chatApi } from '../services/chat';

interface SearchModalProps {
  chats: Chat[];
  onClose: () => void;
  onSelectChat: (chatId: string) => void;
  currentChatId: string | null;
}

export const SearchModal: React.FC<SearchModalProps> = ({ chats, onClose, onSelectChat, currentChatId }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{
    chat: Chat;
    messages: Array<{
      id: string;
      content: string;
      sender: 'user' | 'assistant';
      created_at: string;
      message_order: number;
    }>;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const searchResults = await chatApi.searchChats({
          q: query.trim(),
          limit: 50,
          include_messages: true
        });
        setResults(searchResults.results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.98, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 relative border border-gray-300"
          onClick={e => e.stopPropagation()}
        >
          <button
            className="absolute top-1 right-1 text-gray-500 hover:text-black"
            onClick={onClose}
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-5 h-5 text-gray-600" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search chats, questions, answers..."
              className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
          </div>
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
              <span className="ml-2 text-gray-500">Searching...</span>
            </div>
          )}
          
          {error && (
            <div className="text-red-500 text-center py-4">
              {error}
            </div>
          )}
          
          {!loading && !error && query.trim() && results.length === 0 && (
            <div className="text-gray-500 text-center py-8">No results found.</div>
          )}
          
          <div className="max-h-96 overflow-y-auto space-y-4">
            {results.map(({ chat, messages }) => (
              <div
                key={chat.id}
                className={`bg-gray-100 rounded-lg p-4 border border-gray-300 cursor-pointer transition-shadow hover:shadow-lg active:shadow-inner ${currentChatId === chat.id ? 'ring-2 ring-gray-400' : ''}`}
                onClick={() => {
                  onSelectChat(chat.id);
                  onClose();
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-gray-600" />
                  <div className={`font-semibold text-left ${currentChatId === chat.id ? 'text-black' : 'text-black'} hover:underline`}>
                    {chat.name}
                  </div>
                </div>
                {messages.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs text-gray-600 font-medium">Matching messages:</div>
                    {messages.map((message, index) => (
                      <div key={message.id} className="bg-gray-50 rounded p-2 border border-gray-300">
                        <div className="text-xs text-gray-600 mb-1">
                          {message.sender === 'user' ? 'Question' : 'Answer'}:
                        </div>
                        <div className="text-black text-sm break-words">
                          {message.content}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}; 