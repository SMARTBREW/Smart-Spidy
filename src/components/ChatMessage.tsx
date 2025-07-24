import React from 'react';
import { motion } from 'framer-motion';
import { User, Bot, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
  isLast: boolean;
  type: 'user' | 'assistant';
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLast, type }) => {
  const [copied, setCopied] = React.useState(false);
  const [feedback, setFeedback] = React.useState<null | 'up' | 'down'>(null);
  const textToShow = type === 'user' ? message.content : (message.content || '');
  const handleCopy = () => {
    navigator.clipboard.writeText(textToShow);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };
  const formattedContent = type === 'assistant' ? textToShow.replace(/\*\*(.*?)\*\*/g, '"$1"') : textToShow;
  const timestamp = message.createdAt ? new Date(message.createdAt).toLocaleTimeString() : '';

  if (type === 'user') {
    // User message - boxed and positioned on the right half
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex justify-end w-full mb-2 mt-5"
      >
        <div className="w-1/2">
          <div className="bg-gray-100 border border-gray-300 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-black">You</span>
              <span className="text-xs text-gray-600">{timestamp}</span>
            </div>
            <div className="prose prose-sm max-w-none">
              <p className="text-black leading-relaxed whitespace-pre-wrap break-words">
                {formattedContent}
              </p>
            </div>
            <div className="flex gap-2 mt-2 justify-end">
              <button
                aria-label="Copy question"
                className="p-1 flex items-center"
                onClick={handleCopy}
              >
                <Copy size={18} />
                {copied && (
                  <span className="text-xs text-black font-semibold ml-1">Copied!</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  } else {
    // Assistant message - no box, starts from left edge, extends to full width
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex justify-start w-full mb-2 mt-5"
      >
        <div className="w-full">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-black">Smart Spidy</span>
            <span className="text-xs text-gray-600">{timestamp}</span>
          </div>
          <div className="prose prose-sm max-w-none">
            <p className="text-black leading-relaxed whitespace-pre-wrap break-words">
              {formattedContent}
            </p>
          </div>
          <div className="flex gap-2 mt-2 items-center">
            <button
              aria-label="Copy message"
              className="p-1 flex items-center"
              onClick={handleCopy}
            >
              <Copy size={18} />
              {copied && (
                <span className="text-xs text-black font-semibold ml-1">Copied!</span>
              )}
            </button>
            {/* Feedback icons for Spidy answer */}
            {feedback === null && (
              <>
                <button
                  aria-label="Thumbs up"
                  className="p-1 flex items-center text-black hover:text-gray-600"
                  onClick={() => setFeedback('up')}
                >
                  <ThumbsUp size={18} stroke="black" fill="none" />
                </button>
                <button
                  aria-label="Thumbs down"
                  className="p-1 flex items-center text-black hover:text-gray-600"
                  onClick={() => setFeedback('down')}
                >
                  <ThumbsDown size={18} stroke="black" fill="none" />
                </button>
              </>
            )}
            {feedback === 'up' && (
              <ThumbsUp size={18} stroke="black" fill="#4B5563" />
            )}
            {feedback === 'down' && (
              <ThumbsDown size={18} stroke="black" fill="#4B5563" />
            )}
          </div>
        </div>
      </motion.div>
    );
  }
};