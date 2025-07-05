import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Paperclip } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void> | void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      const messageToSend = message.trim();
      setMessage('');
      await onSendMessage(messageToSend);
    }
  };

  return (
    <div className="border-t border-gray-300 bg-white p-4">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    await handleSubmit(e);
                  }
                }}
                placeholder="Type your message..."
                rows={1}
                className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 pr-12 text-black placeholder-gray-500 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 shadow-sm"
                disabled={disabled}
                style={{
                  minHeight: '48px',
                  maxHeight: '120px',
                  height: 'auto',
                }}
              />
              <button
                type="button"
                className="absolute right-2 top-2 p-2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                <Paperclip className="w-4 h-4" />
              </button>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!message.trim() || disabled}
            className="bg-black text-white p-4 mb-2 rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-sm"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
      </form>
    </div>
  );
};