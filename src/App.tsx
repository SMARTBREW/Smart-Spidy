import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from './hooks/useChat';
import { LoginForm } from './components/LoginForm';
import { ChatInterface } from './components/ChatInterface';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';

// Inner App component that uses hooks inside Router context
function AppContent() {
  const { 
    user, 
    login, 
    isLoading,
    chats,
    currentChat,
    currentChatId,
    isTyping,
    createChat,
    selectChat,
    sendMessage,
    deleteChat,
    logout,
    pinChat,
    setChatStatus,
  } = useChat();
  
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
      <Routes>
          {/* Login Route */}
          <Route 
            path="/" 
            element={
              user ? (
                <Navigate to="/user" replace />
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
              )
            } 
          />
          
          {/* Main Chat Interface Route */}
          <Route 
            path="/user" 
            element={
              <ProtectedRoute user={user}>
                <motion.div
                  key="chat-interface"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChatInterface 
                    user={user!}
                    chats={chats}
                    currentChat={currentChat || null}
                    currentChatId={currentChatId}
                    isTyping={isTyping}
                    createChat={createChat}
                    selectChat={selectChat}
                    sendMessage={sendMessage}
                    deleteChat={deleteChat}
                    logout={logout}
                    pinChat={pinChat}
                    setChatStatus={setChatStatus}
                  />
                </motion.div>
              </ProtectedRoute>
            } 
          />
          
          {/* Admin Panel Route - Protected for admin users only */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute 
                user={user} 
                requiredRole="admin"
                redirectTo="/"
              >
                <motion.div
                  key="admin-dashboard"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <AdminDashboard userRole={user?.role as 'admin'} />
                </motion.div>
              </ProtectedRoute>
            } 
          />
      
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
  );
}

// Main App component that provides Router context
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;