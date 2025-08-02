const { generateAllNotifications } = require('./services/notificationService');

console.log('🧪 Testing fixed notification generation...');
console.log('Current time:', new Date().toISOString());

async function testNotifications() {
  try {
    console.log('🚀 Starting fixed notification generation...');
    
    const result = await generateAllNotifications();
    
    console.log('✅ Fixed notification generation completed successfully');
    console.log('📊 Results:', JSON.stringify(result, null, 2));
    
    // Show detailed breakdown
    console.log('\n📈 Detailed Breakdown:');
    console.log(`- 2-day inactive chats: ${result.chatNotifications.twoDayCount}`);
    console.log(`- 5-day inactive chats: ${result.chatNotifications.fiveDayCount}`);
    console.log(`- 2-day inactive fundraisers: ${result.fundraiserNotifications.twoDayCount}`);
    console.log(`- 5-day inactive fundraisers: ${result.fundraiserNotifications.fiveDayCount}`);
    console.log(`- Total notifications generated: ${result.chatNotifications.totalGenerated + result.fundraiserNotifications.totalGenerated}`);
    
  } catch (error) {
    console.error('❌ Fixed notification generation failed:', error);
    console.error('Error details:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

testNotifications(); 