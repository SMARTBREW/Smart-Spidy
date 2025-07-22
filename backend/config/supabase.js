const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

// Client for general operations (uses anon key)
const supabase = createClient(config.supabase.url, config.supabase.anonKey);

// Admin client for privileged operations (uses service role key)
const supabaseAdmin = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

module.exports = {
  supabase,
  supabaseAdmin
}; 