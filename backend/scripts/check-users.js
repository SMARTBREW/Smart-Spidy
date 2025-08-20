const { supabaseAdmin } = require('../config/supabase');

async function checkUsers() {
  try {
    console.log('Checking users in database...\n');
    
    // Get all users
    const { data: allUsers, error: allError } = await supabaseAdmin
      .from('users')
      .select('*');
    
    if (allError) {
      console.error('Error fetching all users:', allError);
      return;
    }
    
    console.log(`Total users in database: ${allUsers?.length || 0}`);
    
    if (allUsers && allUsers.length > 0) {
      console.log('\nUser details:');
      allUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role} - Active: ${user.is_active}`);
      });
    }
    
    // Get active users count
    const { count: activeCount, error: activeError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    
    if (activeError) {
      console.error('Error counting active users:', activeError);
      return;
    }
    
    console.log(`\nActive users: ${activeCount || 0}`);
    
    // Get inactive users count
    const { count: inactiveCount, error: inactiveError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', false);
    
    if (inactiveError) {
      console.error('Error counting inactive users:', inactiveError);
      return;
    }
    
    console.log(`Inactive users: ${inactiveCount || 0}`);
    
    // Get admin users count
    const { count: adminCount, error: adminError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin');
    
    if (adminError) {
      console.error('Error counting admin users:', adminError);
      return;
    }
    
    console.log(`Admin users: ${adminCount || 0}`);
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

checkUsers();
