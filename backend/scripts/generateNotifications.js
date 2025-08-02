#!/usr/bin/env node

/**
 * Notification Generation Cron Job
 * 
 * This script runs the notification generation process.
 * It can be called manually or scheduled via cron.
 * 
 * Usage:
 * - Manual: node scripts/generateNotifications.js
 * - Cron: 0 9 * * * /usr/bin/node /path/to/backend/scripts/generateNotifications.js
 */

require('dotenv').config();
const notificationService = require('../services/notificationService');

async function main() {
  try {
    console.log('🕐 Starting notification generation at:', new Date().toISOString());
    
    // Run the complete notification generation process
    const results = await notificationService.generateAllNotifications();
    
    console.log('📊 Notification Generation Results:');
    console.log('  Chat Notifications:', results.chatNotifications);
    console.log('  Fundraiser Notifications:', results.fundraiserNotifications);
    console.log('  Cleanup:', results.cleanup);
    console.log('  Timestamp:', results.timestamp);
    
    console.log('✅ Notification generation completed successfully');
    
    // Exit with success code
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Notification generation failed:', error);
    
    // Exit with error code
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the main function
main(); 