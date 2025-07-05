import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Chat } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Search } from 'lucide-react';

interface SearchModalProps {
  chats: Chat[];
  onClose: () => void;
  onSelectChat: (chatId: string) => void;
  currentChatId: string | null;
}

export const SearchModal: React.FC<SearchModalProps> = ({ chats, onClose, onSelectChat, currentChatId }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const lower = query.toLowerCase();
    const res: { chat: Chat; matches: { type: 'name' | 'qa'; question?: string; answer?: string; value?: string; messageId?: string }[] }[] = [];
    for (const chat of chats) {
      const matches: { type: 'name' | 'qa'; question?: string; answer?: string; value?: string; messageId?: string }[] = [];
      if (chat.name.toLowerCase().includes(lower)) {
        matches.push({ type: 'name', value: chat.name });
      }
      for (let i = 0; i < chat.messages.length; i++) {
        const msg = chat.messages[i];
        if (msg.sender === 'user' && msg.content.toLowerCase().includes(lower)) {
          // Pair with next assistant message if exists
          const nextMsg = chat.messages[i + 1];
          matches.push({
            type: 'qa',
            question: msg.content,
            answer: nextMsg && nextMsg.sender === 'assistant' ? nextMsg.content : undefined,
            messageId: msg.id,
          });
        } else if (msg.sender === 'assistant' && msg.content.toLowerCase().includes(lower)) {
          // Pair with previous user message if exists
          const prevMsg = chat.messages[i - 1];
          matches.push({
            type: 'qa',
            question: prevMsg && prevMsg.sender === 'user' ? prevMsg.content : undefined,
            answer: msg.content,
            messageId: msg.id,
          });
        }
      }
      if (matches.length > 0) {
        res.push({ chat, matches });
      }
    }
    return res;
  }, [query, chats]);

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
          className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 relative"
          onClick={e => e.stopPropagation()}
        >
          <button
            className="absolute top-1 right-1 text-gray-400 hover:text-black"
            onClick={onClose}
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-5 h-5 text-gray-500" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search chats, questions, answers..."
              className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {query.trim() && results.length === 0 && (
            <div className="text-gray-500 text-center py-8">No results found.</div>
          )}
          <div className="max-h-96 overflow-y-auto space-y-4">
            {results.map(({ chat, matches }) => (
              <div
                key={chat.id}
                className={`bg-gray-100 rounded-lg p-4 border border-gray-200 cursor-pointer transition-shadow hover:shadow-lg active:shadow-inner ${currentChatId === chat.id ? 'ring-2 ring-blue-400' : ''}`}
                onClick={() => {
                  onSelectChat(chat.id);
                  onClose();
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  <div className={`font-semibold text-left ${currentChatId === chat.id ? 'text-blue-600' : 'text-gray-900'} hover:underline`}>
                    {chat.name}
                  </div>
                </div>
                <ul className="space-y-1">
                  {matches.map((m, i) => (
                    <li key={i} className="text-gray-700 text-sm">
                      {m.type === 'name' ? (
                        <>
                          <span className="bg-blue-100 text-blue-700 px-1 rounded">Chat name match</span>{' '}
                          <span className="break-words">{m.value}</span>
                        </>
                      ) : (
                        <div className="bg-gray-50 rounded p-2 border border-gray-200 mb-1">
                          <div className="text-xs text-gray-500 mb-1">Question:</div>
                          <div className="mb-1 text-gray-900">{m.question}</div>
                          {m.answer && <>
                            <div className="text-xs text-gray-500 mb-1">Answer:</div>
                            <div className="text-gray-800">{m.answer}</div>
                          </>}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}; 