const { supabaseAdmin } = require('../config/supabase');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

async function testStatsEndpoint() {
  try {
    console.log('Testing stats endpoint...\n');
    
    // Get an admin user
    const { data: adminUsers, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('role', 'admin')
      .eq('is_active', true)
      .limit(1);
    
    if (userError || !adminUsers || adminUsers.length === 0) {
      console.error('Error fetching admin user:', userError);
      return;
    }
    
    const adminUser = adminUsers[0];
    
    if (userError || !adminUser) {
      console.error('Error fetching admin user:', userError);
      return;
    }
    
    console.log(`Using admin user: ${adminUser.name} (${adminUser.email})`);
    
    // Create an active session for the user
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('user_sessions')
      .insert([{
        user_id: adminUser.id,
        login_time: new Date().toISOString(),
        is_active: true
      }])
      .select()
      .single();
    
    if (sessionError) {
      console.error('Error creating session:', sessionError);
      return;
    }
    
    console.log('Active session created successfully');
    
    // Create JWT token
    const token = jwt.sign(
      { 
        sub: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        type: 'access'
      },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { expiresIn: '1h' }
    );
    
    console.log('JWT token created successfully');
    
    // Test the stats endpoint
    const response = await fetch('http://localhost:3000/api/users/stats', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP Error: ${response.status} - ${errorText}`);
      return;
    }
    
    const stats = await response.json();
    console.log('\nStats endpoint response:');
    console.log(JSON.stringify(stats, null, 2));
    
    // Test the users endpoint to see pagination data
    const usersResponse = await fetch('http://localhost:3000/api/users?page=1&limit=10', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!usersResponse.ok) {
      const errorText = await usersResponse.text();
      console.error(`HTTP Error: ${usersResponse.status} - ${errorText}`);
      return;
    }
    
    const usersData = await usersResponse.json();
    console.log('\nUsers endpoint response:');
    console.log(JSON.stringify(usersData, null, 2));
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

testStatsEndpoint();
