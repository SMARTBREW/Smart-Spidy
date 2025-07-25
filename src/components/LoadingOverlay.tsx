import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLoading } from '../contexts/LoadingContext';

const LoadingOverlay: React.FC = () => {
  const { isLoading } = useLoading();

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="flex flex-col items-center"
          >
            <div className="relative">
              <div
                className="w-32 h-32 border-[10px] border-gray-800 border-t-blue-500 rounded-full animate-spin shadow-2xl"
                style={{
                  boxShadow: '0 0 40px 10px #2563eb, 0 0 0 4px #000',
                }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-blue-400 drop-shadow-lg animate-pulse">Loading</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingOverlay; 