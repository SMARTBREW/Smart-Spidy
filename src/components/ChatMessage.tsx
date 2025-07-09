import React from 'react';
import { motion } from 'framer-motion';
import { User, Bot, ThumbsUp, ThumbsDown, Copy, Check } from 'lucide-react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
  isLast: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLast }) => {
  const isUser = message.sender === 'user';

  if (isUser) {
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
              <span className="text-xs text-gray-600">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="prose prose-sm max-w-none">
              <p className="text-black leading-relaxed whitespace-pre-wrap break-words">
                {message.content}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  } else {
    // Assistant message - no box, starts from left edge, extends to full width
    const formattedContent = message.content.replace(/\*\*(.*?)\*\*/g, '"$1"');
    const [feedback, setFeedback] = React.useState<null | 'up' | 'down'>(null);
    const [copied, setCopied] = React.useState(false);
    const handleCopy = () => {
      navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    };
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
            <span className="text-xs text-gray-600">
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <div className="prose prose-sm max-w-none">
            <p className="text-black leading-relaxed whitespace-pre-wrap break-words">
              {formattedContent}
            </p>
          </div>
          {/* Feedback buttons */}
          <div className="flex gap-2 mt-2">
            <button
              aria-label="Thumbs up"
              className="p-1"
              onClick={() => setFeedback('up')}
              disabled={feedback === 'up'}
            >
              <ThumbsUp size={20} fill={feedback === 'up' ? '#6B7280' : 'none'} stroke="black" />
            </button>
            <button
              aria-label="Thumbs down"
              className="p-1"
              onClick={() => setFeedback('down')}
              disabled={feedback === 'down'}
            >
              <ThumbsDown size={20} fill={feedback === 'down' ? '#6B7280' : 'none'} stroke="black" />
            </button>
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
            {feedback && (
              <span className="text-xs text-gray-500 ml-2">{feedback === 'up' ? 'Thanks for your feedback!' : 'Sorry to hear that!'}</span>
            )}
          </div>
        </div>
      </motion.div>
    );
  }
};