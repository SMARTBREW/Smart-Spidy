import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from './hooks/useChat';
import { LoginForm } from './components/LoginForm';
import { ChatInterface } from './components/ChatInterface';

function App() {
  const { user, login, isLoading } = useChat();
  
  // Debug logging
  console.log('App component render - user:', user, 'isLoading:', isLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {user ? (
        <motion.div
          key="chat-interface"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChatInterface user={user} />
        </motion.div>
      ) : (
        <motion.div
          key="login-form"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <LoginForm onLogin={login} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default App;