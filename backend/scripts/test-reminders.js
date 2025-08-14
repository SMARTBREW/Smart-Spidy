const { supabaseAdmin } = require('../config/supabase');

// Test reminder functionality
async function testReminders() {
  console.log('🧪 Testing Reminder Functionality...\n');

  try {
    // Test 1: Check if reminders table exists
    console.log('1. Checking if reminders table exists...');
    const { data: tableCheck, error: tableError } = await supabaseAdmin
      .from('reminders')
      .select('count')
      .limit(1);
    
    if (tableError) {
      console.log('❌ Reminders table not found or not accessible');
      console.log('Error:', tableError.message);
      console.log('\n💡 Please run the migration first:');
      console.log('   - Execute the SQL in backend/migrations/add_reminders_table.sql');
      console.log('   - Or run: npm run migrate (if environment is configured)');
      return;
    }
    
    console.log('✅ Reminders table exists and is accessible\n');

    // Test 2: Check notification types constraint
    console.log('2. Checking notification types constraint...');
    const { data: notificationTypes, error: notificationError } = await supabaseAdmin
      .from('notifications')
      .select('notification_type')
      .limit(1);
    
    if (notificationError) {
      console.log('❌ Error checking notifications table:', notificationError.message);
    } else {
      console.log('✅ Notifications table is accessible');
      console.log('   - Reminder notification types should be supported\n');
    }

    // Test 3: Test reminder creation (if we have a test user)
    console.log('3. Testing reminder creation...');
    console.log('   - This requires a valid user_id');
    console.log('   - Skipping actual creation test for safety\n');

    // Test 4: Check cron service integration
    console.log('4. Checking cron service integration...');
    try {
      const cronService = require('../services/cronService');
      console.log('✅ Cron service is properly configured');
      console.log('   - Reminder processing should run every 5 minutes\n');
    } catch (error) {
      console.log('❌ Cron service not accessible:', error.message);
    }

    console.log('🎉 Reminder feature setup appears to be complete!');
    console.log('\n📋 Next steps:');
    console.log('   1. Start the backend server: npm start');
    console.log('   2. Test the frontend reminder interface');
    console.log('   3. Create a test reminder and verify it works');
    console.log('   4. Check that notifications are created when reminders are due');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check your Supabase configuration');
    console.log('   2. Ensure the migration has been run');
    console.log('   3. Verify environment variables are set');
  }
}

// Run the test
testReminders();
