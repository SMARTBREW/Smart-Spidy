import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Paperclip, Mic } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void> | void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState('');
  const [listening, setListening] = useState(false);

  // Voice recognition logic
  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    setListening(true);
    recognition.start();
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setMessage((prev) => prev ? prev + ' ' + transcript : transcript);
    };
    recognition.onerror = () => {
      setListening(false);
    };
    recognition.onend = () => {
      setListening(false);
    };
  };

  // File upload handler (images only)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setMessage((prev) => prev ? prev + ' [Image attached: ' + file.name + ']' : '[Image attached: ' + file.name + ']');
      // You can add logic here to actually upload or process the image as needed
    } else if (file) {
      alert('Only image files are allowed.');
    }
    e.target.value = '';
  };

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
                className="absolute right-10 top-2 p-2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                tabIndex={-1}
                onClick={handleVoiceInput}
                aria-label="Start voice input"
                title="Start voice input"
                disabled={disabled || listening}
              >
                <Mic className={`w-4 h-4 ${listening ? 'animate-pulse text-blue-500' : ''}`} />
              </button>
              <label className="absolute right-2 top-2 p-2 text-gray-500 hover:text-gray-700 transition-colors duration-200 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  disabled={disabled}
                />
                <Paperclip className="w-4 h-4" />
              </label>
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