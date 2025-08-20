import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from './hooks/useChat';
import { LoginForm } from './components/LoginForm';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoadingProvider } from './contexts/LoadingContext';
import LoadingOverlay from './components/LoadingOverlay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { InactivityWarningModal } from './components/InactivityWarningModal';
import { useLoadingSetup } from './hooks/useLoadingSetup';
import authService from './services/auth';
import ActivityTracker from './services/activityTracker';
import { TIMEOUT_CONFIG } from './config/timeouts';

// Lazy load components
const ChatInterface = React.lazy(() => 
  import('./components/ChatInterface').then(module => ({ 
    default: module.ChatInterface 
  }))
);
const AdminDashboard = React.lazy(() => 
  import('./components/admin/AdminDashboard').then(module => ({ 
    default: module.AdminDashboard 
  }))
);

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
          timeoutMinutes: TIMEOUT_CONFIG.ACTIVITY.TIMEOUT_MINUTES,
          warningMinutes: TIMEOUT_CONFIG.ACTIVITY.WARNING_MINUTES,
          checkIntervalSeconds: TIMEOUT_CONFIG.ACTIVITY.CHECK_INTERVAL_SECONDS
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

    // Validate session every configured interval
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
    }, TIMEOUT_CONFIG.SESSION.VALIDATION_INTERVAL_MINUTES * 60 * 1000);

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
              <Suspense fallback={<LoadingSpinner size="lg" text="Loading Chat Interface..." className="h-64" />}>
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
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute user={user}>
              <Suspense fallback={<LoadingSpinner size="lg" text="Loading Admin Dashboard..." className="h-64" />}>
                <AdminDashboard userRole="admin" />
              </Suspense>
            </ProtectedRoute>
          } />
        </Routes>
      </AnimatePresence>

      {/* Inactivity Warning Modal */}
      <InactivityWarningModal
        isOpen={showInactivityWarning}
        onExtend={handleExtendSession}
        onLogout={handleLogoutNow}
        timeRemaining={TIMEOUT_CONFIG.WARNING.COUNTDOWN_SECONDS}
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