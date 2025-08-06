interface ActivityTrackerConfig {
  timeoutMinutes: number;
  warningMinutes: number;
  checkIntervalSeconds: number;
}

class ActivityTracker {
  private timeoutId: NodeJS.Timeout | null = null;
  private warningId: NodeJS.Timeout | null = null;
  private lastActivity: number = Date.now();
  private isActive: boolean = false;
  private config: ActivityTrackerConfig;
  private onLogout: () => void;
  private onWarning?: () => void;

  constructor(
    onLogout: () => void,
    onWarning?: () => void,
    config: Partial<ActivityTrackerConfig> = {}
  ) {
    this.onLogout = onLogout;
    this.onWarning = onWarning;
    this.config = {
      timeoutMinutes: 20, // Auto logout after 20 minutes of inactivity
      warningMinutes: 15, // Show warning after 15 minutes of inactivity
      checkIntervalSeconds: 30, // Check every 30 seconds
      ...config
    };
  }

  start(): void {
    if (this.isActive) return;
    
    console.log('ActivityTracker starting with config:', this.config);
    this.isActive = true;
    this.resetTimers();
    this.setupActivityListeners();
    this.startPeriodicCheck();
    console.log('ActivityTracker started successfully');
  }

  stop(): void {
    this.isActive = false;
    this.clearTimers();
    this.removeActivityListeners();
  }

  reset(): void {
    this.lastActivity = Date.now();
    this.resetTimers();
  }

  private resetTimers(): void {
    this.clearTimers();
    
    if (!this.isActive) return;

    const timeoutMs = this.config.timeoutMinutes * 60 * 1000;
    const warningMs = this.config.warningMinutes * 60 * 1000;

    console.log('Resetting timers - timeout in', timeoutMs / 1000 / 60, 'minutes, warning in', warningMs / 1000 / 60, 'minutes');

    // Set warning timer
    this.warningId = setTimeout(() => {
      console.log('Warning timer triggered');
      if (this.onWarning) {
        this.onWarning();
      }
    }, warningMs);

    // Set logout timer
    this.timeoutId = setTimeout(() => {
      console.log('Auto logout due to inactivity - timeout reached');
      this.onLogout();
    }, timeoutMs);
  }

  private clearTimers(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.warningId) {
      clearTimeout(this.warningId);
      this.warningId = null;
    }
  }

  private setupActivityListeners(): void {
    const events = [
      'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart',
      'click', 'keydown', 'wheel', 'focus', 'blur'
    ];

    events.forEach(event => {
      document.addEventListener(event, this.handleActivity, { passive: true });
    });

    // Also track visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private removeActivityListeners(): void {
    const events = [
      'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart',
      'click', 'keydown', 'wheel', 'focus', 'blur'
    ];

    events.forEach(event => {
      document.removeEventListener(event, this.handleActivity);
    });

    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private handleActivity = (): void => {
    console.log('Activity detected, resetting timers');
    this.lastActivity = Date.now();
    this.resetTimers();
  };

  private handleVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      // User came back to the tab, reset activity
      this.lastActivity = Date.now();
      this.resetTimers();
    }
  };

  private startPeriodicCheck(): void {
    const checkInterval = setInterval(() => {
      if (!this.isActive) {
        clearInterval(checkInterval);
        return;
      }

      const now = Date.now();
      const timeSinceLastActivity = now - this.lastActivity;
      const timeoutMs = this.config.timeoutMinutes * 60 * 1000;

      if (timeSinceLastActivity >= timeoutMs) {
        console.log('Auto logout due to inactivity (periodic check) - time since last activity:', timeSinceLastActivity, 'ms');
        this.onLogout();
        clearInterval(checkInterval);
      }
    }, this.config.checkIntervalSeconds * 1000);
  }

  getTimeUntilLogout(): number {
    const now = Date.now();
    const timeSinceLastActivity = now - this.lastActivity;
    const timeoutMs = this.config.timeoutMinutes * 60 * 1000;
    return Math.max(0, timeoutMs - timeSinceLastActivity);
  }

  getTimeUntilWarning(): number {
    const now = Date.now();
    const timeSinceLastActivity = now - this.lastActivity;
    const warningMs = this.config.warningMinutes * 60 * 1000;
    return Math.max(0, warningMs - timeSinceLastActivity);
  }

  isUserActive(): boolean {
    const now = Date.now();
    const timeSinceLastActivity = now - this.lastActivity;
    const timeoutMs = this.config.timeoutMinutes * 60 * 1000;
    return timeSinceLastActivity < timeoutMs;
  }

  getStatus(): { isActive: boolean; timeSinceLastActivity: number; timeUntilLogout: number } {
    const now = Date.now();
    const timeSinceLastActivity = now - this.lastActivity;
    const timeUntilLogout = this.getTimeUntilLogout();
    
    return {
      isActive: this.isActive,
      timeSinceLastActivity,
      timeUntilLogout
    };
  }
}

export default ActivityTracker; 