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
import { InactivityWarningModal } from './components/InactivityWarningModal';
import { useLoadingSetup } from './hooks/useLoadingSetup';
import authService from './services/auth';
import ActivityTracker from './services/activityTracker';

const App: React.FC = () => {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [activityTracker, setActivityTracker] = useState<ActivityTracker | null>(null);
  
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

  // Initialize activity tracker when user logs in
  useEffect(() => {
    if (user && !activityTracker) {
      console.log('Initializing ActivityTracker for user:', user.name);
      const tracker = new ActivityTracker(
        async () => {
          console.log('Auto logout due to inactivity');
          try {
            await authService.sessionTimeout();
          } catch (error) {
            console.error('Session timeout error:', error);
          }
          logout();
        },
        () => {
          console.log('Showing inactivity warning');
          setShowInactivityWarning(true);
        },
        {
          timeoutMinutes: 20, // Auto logout after 20 minutes
          warningMinutes: 15, // Show warning after 15 minutes
          checkIntervalSeconds: 30 // Check every 30 seconds
        }
      );
      
      setActivityTracker(tracker);
      tracker.start();
      console.log('ActivityTracker started');
    } else if (!user && activityTracker) {
      console.log('Stopping ActivityTracker - user logged out');
      activityTracker.stop();
      setActivityTracker(null);
      setShowInactivityWarning(false);
    }

    return () => {
      if (activityTracker) {
        activityTracker.stop();
      }
    };
  }, [user, logout]);

  const handleExtendSession = () => {
    if (activityTracker) {
      console.log('Extending session - resetting ActivityTracker');
      activityTracker.reset();
      setShowInactivityWarning(false);
    }
  };

  const handleLogoutNow = () => {
    setShowInactivityWarning(false);
    logout();
  };

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

  // Add periodic session validation
  useEffect(() => {
    if (!user) return;

    // Validate session every 2 minutes
    const sessionValidationInterval = setInterval(async () => {
      try {
        const isValid = await authService.validateSession();
        if (!isValid) {
          console.log('Session validation failed - logging out user');
          logout();
        }
      } catch (error) {
        console.error('Session validation error:', error);
        logout();
      }
    }, 2 * 60 * 1000); // Check every 2 minutes

    return () => {
      clearInterval(sessionValidationInterval);
    };
  }, [user, logout]);

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
                createChat={(name, instagramUsername, executiveInstagramUsername, occupation, product, gender, profession) => {
                  createChat(name, instagramUsername, executiveInstagramUsername, occupation, product, gender, profession);
                  return '';
                }}
                selectChat={selectChat}
                sendMessage={sendMessage}
                deleteChat={deleteChat}
                logout={logout}
                pinChat={pinChat}
                setChatStatus={setChatStatus}
                activityTracker={activityTracker}
              />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute user={user}>
              <AdminDashboard userRole="admin" />
            </ProtectedRoute>
          } />
        </Routes>
      </AnimatePresence>

      {/* Inactivity Warning Modal */}
      <InactivityWarningModal
        isOpen={showInactivityWarning}
        onExtend={handleExtendSession}
        onLogout={handleLogoutNow}
        timeRemaining={300} // 5 minutes warning countdown
      />
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