const cron = require('node-cron');
const { generateAllNotifications } = require('./notificationService');

console.log('📅 Setting up notification cron jobs...');

// Run daily at 9:00 AM
cron.schedule('0 9 * * *', async () => {
  console.log('🕐 Running scheduled notification generation...');
  try {
    const result = await generateAllNotifications();
    console.log('✅ Scheduled notification generation completed successfully');
    console.log('📊 Results:', result);
  } catch (error) {
    console.error('❌ Scheduled notification generation failed:', error);
  }
}, {
  timezone: "Asia/Kolkata" // Adjust to your timezone
});

// Also run every 6 hours for testing (optional - remove in production)
cron.schedule('0 */6 * * *', async () => {
  console.log('🕐 Running test notification generation...');
  try {
    const result = await generateAllNotifications();
    console.log('✅ Test notification generation completed');
    console.log('📊 Results:', result);
  } catch (error) {
    console.error('❌ Test notification generation failed:', error);
  }
}, {
  timezone: "Asia/Kolkata"
});

console.log('✅ Notification cron jobs scheduled:');
console.log('   - Daily at 9:00 AM (production)');
console.log('   - Every 6 hours (testing)');
console.log('   - Timezone: Asia/Kolkata'); 