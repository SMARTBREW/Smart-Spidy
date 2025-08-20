// Test script to login as admin and check stats
// Using built-in fetch (Node.js 18+)

async function testAdminLogin() {
  try {
    console.log('Testing admin login and stats...\n');
    
    // Step 1: Login as admin
    const loginResponse = await fetch('http://localhost:3000/api/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'himanshu@smartbrew.in',
        password: 'admin123' // You might need to change this password
      })
    });
    
    console.log(`Login response status: ${loginResponse.status}`);
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.log('Login error:', errorText);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('Login successful!');
    console.log('User:', loginData.user.name, `(${loginData.user.role})`);
    console.log('Session ID:', loginData.session_id);
    
    // Step 2: Get admin stats
    const statsResponse = await fetch('http://localhost:3000/api/users/stats', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginData.tokens.access.token}`,
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`\nStats response status: ${statsResponse.status}`);
    
    if (!statsResponse.ok) {
      const errorText = await statsResponse.text();
      console.log('Stats error:', errorText);
      return;
    }
    
    const stats = await statsResponse.json();
    console.log('\nStats response:');
    console.log(JSON.stringify(stats, null, 2));
    
    // Step 3: Test the mapping that frontend does
    const adminStats = {
      totalUsers: stats.overall.total,
      activeUsers: stats.overall.active,
      totalChats: 0,
      totalMessages: 0,
      trainingDataCount: 0,
      activeSessions: 0,
    };
    
    console.log('\nMapped AdminStats for frontend:');
    console.log(JSON.stringify(adminStats, null, 2));
    
    // Step 4: Get users with pagination
    const usersResponse = await fetch('http://localhost:3000/api/users?page=1&limit=10', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginData.tokens.access.token}`,
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`\nUsers response status: ${usersResponse.status}`);
    
    if (!usersResponse.ok) {
      const errorText = await usersResponse.text();
      console.log('Users error:', errorText);
      return;
    }
    
    const usersData = await usersResponse.json();
    console.log('\nUsers response:');
    console.log(JSON.stringify(usersData, null, 2));
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testAdminLogin();
