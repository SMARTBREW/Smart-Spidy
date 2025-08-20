const { supabaseAdmin } = require('../config/supabase');
const bcrypt = require('bcryptjs');

async function createTestAdmin() {
  try {
    console.log('Creating test admin user...\n');
    
    // Check if test admin already exists
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', 'testadmin@smartbrew.in')
      .single();
    
    if (existingUser) {
      console.log('Test admin already exists:', existingUser.name);
      return;
    }
    
    // Create test admin user
    const hashedPassword = await bcrypt.hash('testadmin123', 12);
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert([{
        name: 'Test Admin',
        email: 'testadmin@smartbrew.in',
        password_hash: hashedPassword,
        role: 'admin',
        is_active: true
      }])
      .select('*')
      .single();
    
    if (error) {
      console.error('Error creating test admin:', error);
      return;
    }
    
    console.log('Test admin created successfully!');
    console.log('Email: testadmin@smartbrew.in');
    console.log('Password: testadmin123');
    console.log('User ID:', user.id);
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

createTestAdmin();
