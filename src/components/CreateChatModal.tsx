import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface CreateChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChat: (fields: {
    name: string;
    instagramUsername: string;
    occupation: string;
    product: string;
    gender: string;
  }) => void;
}

export const CreateChatModal: React.FC<CreateChatModalProps> = ({ isOpen, onClose, onCreateChat }) => {
  const [fields, setFields] = useState({
    name: '',
    instagramUsername: '',
    occupation: '',
    product: '',
    gender: '',
  });

  useEffect(() => {
    if (!isOpen) {
      setFields({ name: '', instagramUsername: '', occupation: '', product: '', gender: '' });
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fields.name) return;
    onCreateChat(fields);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
        onClick={onClose}
        aria-modal="true"
        role="dialog"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative"
          onClick={e => e.stopPropagation()}
        >
          <button
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold mb-4 text-black">Create New Chat</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              value={fields.name}
              onChange={e => setFields(f => ({ ...f, name: e.target.value }))}
              placeholder="Enter chat name..."
              className="w-full p-3 border border-gray-300 rounded-xl text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
              autoFocus
              maxLength={50}
              required
            />
            <input
              type="text"
              value={fields.instagramUsername}
              onChange={e => setFields(f => ({ ...f, instagramUsername: e.target.value }))}
              placeholder="Instagram username"
              className="w-full p-3 border border-gray-300 rounded-xl text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
              maxLength={50}
            />
            <input
              type="text"
              value={fields.occupation}
              onChange={e => setFields(f => ({ ...f, occupation: e.target.value }))}
              placeholder="Occupation"
              className="w-full p-3 border border-gray-300 rounded-xl text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
              maxLength={50}
            />
            <select
              value={fields.product}
              onChange={e => setFields(f => ({ ...f, product: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-gray-500"
              required
            >
              <option value="" disabled>Select product</option>
              <option value="khushi">khushi</option>
              <option value="animal care">animal care</option>
              <option value="WAL">WAL</option>
            </select>
            <select
              value={fields.gender}
              onChange={e => setFields(f => ({ ...f, gender: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-gray-500"
              required
            >
              <option value="" disabled>Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-black text-white font-medium hover:bg-gray-800 transition-all"
                disabled={!fields.name}
              >
                Create
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}; 