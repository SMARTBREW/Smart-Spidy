import React from 'react';
import { motion } from 'framer-motion';
import { User, Bot } from 'lucide-react';
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
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex justify-start w-full mb-2 mt-5"
      >
        <div className="w-full">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-black">Assistant</span>
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
              className={`p-1 rounded-full border ${feedback === 'up' ? 'bg-green-100 border-green-400' : 'bg-white border-gray-300'} hover:bg-green-50`}
              onClick={() => setFeedback('up')}
              disabled={feedback === 'up'}
            >
              <span role="img" aria-label="Thumbs up">👍</span>
            </button>
            <button
              aria-label="Thumbs down"
              className={`p-1 rounded-full border ${feedback === 'down' ? 'bg-red-100 border-red-400' : 'bg-white border-gray-300'} hover:bg-red-50`}
              onClick={() => setFeedback('down')}
              disabled={feedback === 'down'}
            >
              <span role="img" aria-label="Thumbs down">👎</span>
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