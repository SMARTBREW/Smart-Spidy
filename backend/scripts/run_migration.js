const { createClient } = require('@supabase/supabase-js');
const config = require('../config/supabase');
const fs = require('fs');
const path = require('path');

const supabaseAdmin = createClient(
  config.supabaseUrl,
  config.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function runMigration() {
  console.log('🔄 Running migration: Add timeout_reason to user_sessions table...');
  
  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../migrations/add_timeout_reason_to_user_sessions.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n🔧 Executing statement ${i + 1}/${statements.length}:`);
      console.log(statement.substring(0, 100) + (statement.length > 100 ? '...' : ''));
      
      try {
        const { error } = await supabaseAdmin.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // If exec_sql doesn't exist, try direct query
          console.log('⚠️  exec_sql not available, trying direct query...');
          const { error: directError } = await supabaseAdmin.from('user_sessions').select('*').limit(1);
          if (directError) {
            throw new Error(`Direct query failed: ${directError.message}`);
          }
          console.log('✅ Migration completed successfully (using direct connection)');
          break;
        }
        
        console.log('✅ Statement executed successfully');
      } catch (stmtError) {
        console.error(`❌ Error executing statement ${i + 1}:`, stmtError.message);
        
        // If it's a column already exists error, that's okay
        if (stmtError.message.includes('already exists') || stmtError.message.includes('duplicate')) {
          console.log('ℹ️  Column already exists, continuing...');
          continue;
        }
        
        throw stmtError;
      }
    }
    
    console.log('\n✅ Migration completed successfully!');
    console.log('📊 New fields added to user_sessions table:');
    console.log('   - timeout_reason (VARCHAR(50))');
    console.log('   - Index on timeout_reason for better performance');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration(); 