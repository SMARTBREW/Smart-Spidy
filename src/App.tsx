import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from './hooks/useChat';
import { LoginForm } from './components/LoginForm';
import { ChatInterface } from './components/ChatInterface';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoadingProvider } from './contexts/LoadingContext';
import LoadingOverlay from './components/LoadingOverlay';
import { useLoadingSetup } from './hooks/useLoadingSetup';
import authService from './services/auth';

const App: React.FC = () => {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // Initialize loading wrappers for all services
  useLoadingSetup();
  
  const {
    user,
    chats,
    currentChat,
    currentChatId,
    isTyping,
    login,
    logout,
    createChat,
    selectChat,
    sendMessage,
    deleteChat,
    pinChat,
    setChatStatus,
  } = useChat();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuthenticated = await authService.isAuthenticated();
        if (isAuthenticated) {
          const currentUser = authService.getCurrentUser();
          if (currentUser) {
            login(currentUser);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [login]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  console.log('App component render - user:', user);
  console.log('User role:', user?.role);
  console.log('User ID:', user?.id);


  return (
    <motion.div 
      className="min-h-screen bg-gray-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={
            user ? <Navigate to="/chat" replace /> : <LoginForm onLogin={login} />
          } />
          <Route path="/chat" element={
            <ProtectedRoute user={user}>
              <ChatInterface
                user={user!}
                chats={chats}
                currentChat={currentChat}
                currentChatId={currentChatId}
                isTyping={isTyping}
                createChat={(name, instagramUsername, occupation, product, gender, profession) => {
                  createChat(name, instagramUsername, occupation, product, gender, profession);
                  return '';
                }}
                selectChat={selectChat}
                sendMessage={sendMessage}
                deleteChat={deleteChat}
                logout={logout}
                pinChat={pinChat}
                setChatStatus={setChatStatus}
              />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute user={user} requiredRole="admin">
              <AdminDashboard userRole={user?.role as 'admin'} />
            </ProtectedRoute>
          } />
        </Routes>
      </AnimatePresence>
    </motion.div>
  );
};

const AppWithRouter: React.FC = () => {
  return (
    <Router>
      <LoadingProvider>
        <App />
        <LoadingOverlay />
      </LoadingProvider>
    </Router>
  );
};

export default AppWithRouter;