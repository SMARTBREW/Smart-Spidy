// Test script to simulate frontend admin API call
// Using built-in fetch (Node.js 18+)

async function testAdminFrontend() {
  try {
    console.log('Testing frontend admin API call...\n');
    
    // Simulate the frontend API call to get admin stats
    const response = await fetch('http://localhost:3000/api/users/stats', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Note: This will fail without authentication, but let's see the error
      }
    });
    
    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText);
      return;
    }
    
    const stats = await response.json();
    console.log('Stats response:', JSON.stringify(stats, null, 2));
    
    // Test the mapping that the frontend does
    const adminStats = {
      totalUsers: stats.overall.total,
      activeUsers: stats.overall.active,
      totalChats: 0,
      totalMessages: 0,
      trainingDataCount: 0,
      activeSessions: 0,
    };
    
    console.log('\nMapped AdminStats:', JSON.stringify(adminStats, null, 2));
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testAdminFrontend();
