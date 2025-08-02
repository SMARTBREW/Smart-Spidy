require('dotenv').config();
const { supabaseAdmin } = require('../config/supabase');

// Test notification data
const testNotifications = [
  {
    chat_id: "7ae737c0-2e6a-468c-8e90-897abdd13cb4",
    user_id: "197e2a6e-88db-4ea9-b135-ff8b09d036df", // Ayush's user ID
    chat_name: "abhay",
    message_count: 85,
    days_inactive: 2,
    last_activity_date: "2025-07-30T10:30:00.000Z",
    notification_type: "chat_inactive_2days",
    is_read: false,
    is_sent: true,
    title: "Chat Inactive Alert",
    message: "Your chat \"abhay\" has been inactive for 2 days. Consider re-engaging with your audience."
  },
  {
    chat_id: "7ae737c0-2e6a-468c-8e90-897abdd13cb4",
    user_id: "197e2a6e-88db-4ea9-b135-ff8b09d036df",
    chat_name: "abhay",
    message_count: 120,
    days_inactive: 4,
    last_activity_date: "2025-07-28T14:20:00.000Z",
    notification_type: "chat_inactive_4days",
    is_read: false,
    is_sent: true,
    title: "Critical Alert - Red Status",
    message: "Your chat \"abhay\" has been inactive for 4 days and is now in RED status. Immediate action required!"
  },
  {
    chat_id: "db7686ba-ecd9-41d9-aa04-100da7913f77",
    user_id: "842ddef4-ced2-41cc-8219-bc7e4ecd396e", // Another user
    chat_name: "Marketing Campaign",
    message_count: 45,
    days_inactive: 2,
    last_activity_date: "2025-07-30T09:15:00.000Z",
    notification_type: "fundraiser_inactive_2days",
    is_read: false,
    is_sent: true,
    title: "Fundraiser Opportunity",
    message: "Your chat \"Marketing Campaign\" has great potential! Consider converting it to a fundraiser."
  },
  {
    chat_id: "db7686ba-ecd9-41d9-aa04-100da7913f77",
    user_id: "842ddef4-ced2-41cc-8219-bc7e4ecd396e",
    chat_name: "Marketing Campaign",
    message_count: 200,
    days_inactive: 0,
    last_activity_date: "2025-08-01T16:45:00.000Z",
    notification_type: "status_update",
    is_read: false,
    is_sent: true,
    title: "High Engagement Alert",
    message: "Your chat \"Marketing Campaign\" is performing exceptionally well! Keep up the great work."
  },
  {
    chat_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    user_id: "197e2a6e-88db-4ea9-b135-ff8b09d036df",
    chat_name: "Product Launch",
    message_count: 75,
    days_inactive: 1,
    last_activity_date: "2025-07-31T11:30:00.000Z",
    notification_type: "fundraiser_inactive_2days",
    is_read: false,
    is_sent: true,
    title: "Fundraiser Conversion Ready",
    message: "Your chat \"Product Launch\" has reached the threshold for fundraiser conversion. Ready to scale up?"
  },
  {
    chat_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    user_id: "197e2a6e-88db-4ea9-b135-ff8b09d036df",
    chat_name: "Product Launch",
    message_count: 150,
    days_inactive: 0,
    last_activity_date: "2025-08-01T13:20:00.000Z",
    notification_type: "system_alert",
    is_read: false,
    is_sent: true,
    title: "System Update Available",
    message: "New features are available for your chat \"Product Launch\". Check out the latest updates!"
  },
  {
    chat_id: "f5g6h7i8-j9k0-1234-lmno-pq5678901234",
    user_id: "842ddef4-ced2-41cc-8219-bc7e4ecd396e",
    chat_name: "Customer Support",
    message_count: 30,
    days_inactive: 3,
    last_activity_date: "2025-07-29T08:45:00.000Z",
    notification_type: "chat_inactive_2days",
    is_read: false,
    is_sent: true,
    title: "Support Chat Inactive",
    message: "Your support chat \"Customer Support\" has been inactive for 2 days. Consider following up with customers."
  },
  {
    chat_id: "f5g6h7i8-j9k0-1234-lmno-pq5678901234",
    user_id: "842ddef4-ced2-41cc-8219-bc7e4ecd396e",
    chat_name: "Customer Support",
    message_count: 60,
    days_inactive: 0,
    last_activity_date: "2025-08-01T15:10:00.000Z",
    notification_type: "status_update",
    is_read: false,
    is_sent: true,
    title: "Support Metrics Update",
    message: "Your support chat \"Customer Support\" shows excellent response times. Great job maintaining quality!"
  }
];

async function createTestNotifications() {
  try {
    console.log('Creating test notifications...');
    
    for (const notification of testNotifications) {
      const { data, error } = await supabaseAdmin
        .from('notifications')
        .insert(notification)
        .select('*')
        .single();
      
      if (error) {
        console.error('Error creating notification:', error);
      } else {
        console.log(`✅ Created notification: ${data.title}`);
      }
    }
    
    console.log('\n🎉 Test notifications created successfully!');
    console.log('\n📊 Summary:');
    console.log('- Total notifications created: 8');
    console.log('- Unread notifications: 8');
    console.log('- Different users: 2');
    console.log('- Different chat types: 4');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Process interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Process terminated');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the script
createTestNotifications(); 