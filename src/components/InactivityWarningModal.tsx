import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, AlertTriangle } from 'lucide-react';

interface InactivityWarningModalProps {
  isOpen: boolean;
  onExtend: () => void;
  onLogout: () => void;
  timeRemaining: number;
}

export const InactivityWarningModal: React.FC<InactivityWarningModalProps> = ({
  isOpen,
  onExtend,
  onLogout,
  timeRemaining
}) => {
  const [countdown, setCountdown] = useState(timeRemaining);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, onLogout]);

  useEffect(() => {
    if (isOpen) {
      setCountdown(timeRemaining);
    }
  }, [isOpen, timeRemaining]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={onExtend}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
          >
            <div className="bg-white rounded-lg shadow-2xl p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-yellow-100 p-3 rounded-full">
                  <AlertTriangle className="w-8 h-8 text-yellow-600" />
                </div>
              </div>
              
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Session Timeout Warning
                </h3>
                <p className="text-gray-600 mb-4">
                  You've been inactive for a while. Your session will expire in:
                </p>
                
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-red-500" />
                  <span className="text-2xl font-bold text-red-500">
                    {formatTime(countdown)}
                  </span>
                </div>
                
                <p className="text-sm text-gray-500">
                  Click anywhere or press "Stay Logged In" to extend your session.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={onLogout}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Logout Now
                </button>
                <button
                  onClick={onExtend}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Stay Logged In
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}; 