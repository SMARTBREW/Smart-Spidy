// Timeout configuration for the application
export const TIMEOUT_CONFIG = {
  // Activity tracker timeouts (in minutes)
  ACTIVITY: {
    TIMEOUT_MINUTES: 60, // Auto logout after 60 minutes of inactivity
    WARNING_MINUTES: 45, // Show warning after 45 minutes of inactivity
    CHECK_INTERVAL_SECONDS: 30, // Check every 30 seconds
  },
  
  // Token refresh timeouts (in minutes)
  TOKEN: {
    BUFFER_MINUTES: 30, // Refresh token 30 minutes before expiration
    REFRESH_RETRY_ATTEMPTS: 3, // Number of retry attempts for token refresh
  },
  
  // Session validation (in minutes)
  SESSION: {
    VALIDATION_INTERVAL_MINUTES: 2, // Validate session every 2 minutes
  },
  
  // Inactivity warning modal
  WARNING: {
    COUNTDOWN_SECONDS: 300, // 5 minutes countdown in warning modal
  }
};

// Helper function to get timeout in milliseconds
export const getTimeoutMs = (minutes: number): number => minutes * 60 * 1000;
export const getTimeoutSeconds = (minutes: number): number => minutes * 60;
