const { supabaseAdmin } = require('./config/supabase');

console.log('🔍 Checking all inactive chats in database...');

async function checkInactiveChats() {
  try {
    const today = new Date();
    const twoDaysAgo = new Date(today.getTime() - (2 * 24 * 60 * 60 * 1000));
    const fiveDaysAgo = new Date(today.getTime() - (5 * 24 * 60 * 60 * 1000));
    const tenDaysAgo = new Date(today.getTime() - (10 * 24 * 60 * 60 * 1000));
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));

    console.log('📅 Date ranges:');
    console.log('- 2 days ago:', twoDaysAgo.toISOString());
    console.log('- 5 days ago:', fiveDaysAgo.toISOString());
    console.log('- 10 days ago:', tenDaysAgo.toISOString());
    console.log('- 30 days ago:', thirtyDaysAgo.toISOString());

    // Get all chats with their status
    const { data: allChats, error } = await supabaseAdmin
      .from('chats')
      .select(`
        id,
        name,
        user_id,
        message_count,
        updated_at,
        status,
        is_gold,
        created_at
      `)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching chats:', error);
      return;
    }

    console.log(`\n📊 Total chats in database: ${allChats.length}`);

    // Analyze inactive chats
    const inactiveChats = allChats.filter(chat => {
      const lastActivity = new Date(chat.updated_at);
      return lastActivity < twoDaysAgo;
    });

    console.log(`\n📈 Inactive chats (older than 2 days): ${inactiveChats.length}`);

    // Group by status
    const byStatus = {};
    const byInactivityPeriod = {
      '2-5 days': [],
      '5-10 days': [],
      '10-30 days': [],
      '30+ days': []
    };

    inactiveChats.forEach(chat => {
      const status = chat.status || 'null';
      if (!byStatus[status]) byStatus[status] = [];
      byStatus[status].push(chat);

      const lastActivity = new Date(chat.updated_at);
      const daysInactive = Math.floor((today - lastActivity) / (24 * 60 * 60 * 1000));

      if (daysInactive >= 2 && daysInactive < 5) {
        byInactivityPeriod['2-5 days'].push(chat);
      } else if (daysInactive >= 5 && daysInactive < 10) {
        byInactivityPeriod['5-10 days'].push(chat);
      } else if (daysInactive >= 10 && daysInactive < 30) {
        byInactivityPeriod['10-30 days'].push(chat);
      } else if (daysInactive >= 30) {
        byInactivityPeriod['30+ days'].push(chat);
      }
    });

    console.log('\n📋 Breakdown by status:');
    Object.entries(byStatus).forEach(([status, chats]) => {
      console.log(`- ${status}: ${chats.length} chats`);
    });

    console.log('\n📅 Breakdown by inactivity period:');
    Object.entries(byInactivityPeriod).forEach(([period, chats]) => {
      console.log(`- ${period}: ${chats.length} chats`);
      if (chats.length > 0) {
        chats.forEach(chat => {
          const lastActivity = new Date(chat.updated_at);
          const daysInactive = Math.floor((today - lastActivity) / (24 * 60 * 60 * 1000));
          console.log(`  * "${chat.name}" (${chat.is_gold ? 'Fundraiser' : 'Chat'}) - ${daysInactive} days inactive, status: ${chat.status || 'null'}`);
        });
      }
    });

    // Check what would be caught by current notification logic
    const twoDayEligible = inactiveChats.filter(chat => 
      ['green', 'yellow', null].includes(chat.status) && 
      !chat.is_gold &&
      new Date(chat.updated_at) < twoDaysAgo
    );

    const fiveDayEligible = inactiveChats.filter(chat => 
      chat.status === 'red' && 
      !chat.is_gold &&
      new Date(chat.updated_at) < fiveDaysAgo
    );

    console.log('\n🎯 Current notification logic would catch:');
    console.log(`- 2-day notifications: ${twoDayEligible.length} chats`);
    console.log(`- 5-day notifications: ${fiveDayEligible.length} chats`);

  } catch (error) {
    console.error('❌ Error checking inactive chats:', error);
  }
}

checkInactiveChats(); 