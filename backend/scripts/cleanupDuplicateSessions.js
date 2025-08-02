const { createClient } = require('@supabase/supabase-js');
const config = require('../config/supabase');

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

async function cleanupDuplicateSessions() {
  console.log('Starting cleanup of duplicate sessions...');

  try {
    // Get all user sessions
    const { data: allSessions, error: fetchError } = await supabaseAdmin
      .from('user_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching sessions:', fetchError);
      return;
    }

    console.log(`Found ${allSessions.length} total sessions`);

    // Group sessions by user_id
    const sessionsByUser = {};
    allSessions.forEach(session => {
      if (!sessionsByUser[session.user_id]) {
        sessionsByUser[session.user_id] = [];
      }
      sessionsByUser[session.user_id].push(session);
    });

    console.log(`Found ${Object.keys(sessionsByUser).length} unique users`);

    // For each user, keep only the most recent session
    const sessionsToDelete = [];
    const sessionsToUpdate = [];

    for (const [userId, sessions] of Object.entries(sessionsByUser)) {
      if (sessions.length > 1) {
        console.log(`User ${userId} has ${sessions.length} sessions`);
        
        // Sort by created_at descending to get the most recent first
        sessions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // Keep the most recent session, mark others for deletion
        const keepSession = sessions[0];
        const deleteSessions = sessions.slice(1);
        
        sessionsToDelete.push(...deleteSessions.map(s => s.id));
        
        // If the kept session is not active, make sure it's properly marked
        if (!keepSession.is_active && !keepSession.logout_time) {
          sessionsToUpdate.push({
            id: keepSession.id,
            logout_time: new Date().toISOString(),
            session_duration: Math.floor((new Date() - new Date(keepSession.login_time)) / 1000)
          });
        }
      }
    }

    console.log(`Sessions to delete: ${sessionsToDelete.length}`);
    console.log(`Sessions to update: ${sessionsToUpdate.length}`);

    // Delete duplicate sessions
    if (sessionsToDelete.length > 0) {
      const { error: deleteError } = await supabaseAdmin
        .from('user_sessions')
        .delete()
        .in('id', sessionsToDelete);

      if (deleteError) {
        console.error('Error deleting duplicate sessions:', deleteError);
      } else {
        console.log(`Successfully deleted ${sessionsToDelete.length} duplicate sessions`);
      }
    }

    // Update sessions that need fixing
    for (const sessionUpdate of sessionsToUpdate) {
      const { error: updateError } = await supabaseAdmin
        .from('user_sessions')
        .update({
          logout_time: sessionUpdate.logout_time,
          session_duration: sessionUpdate.session_duration,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionUpdate.id);

      if (updateError) {
        console.error('Error updating session:', updateError);
      }
    }

    console.log('Cleanup completed successfully!');

    // Verify the cleanup
    const { data: finalSessions, error: verifyError } = await supabaseAdmin
      .from('user_sessions')
      .select('user_id')
      .order('created_at', { ascending: false });

    if (!verifyError) {
      const uniqueUsers = new Set(finalSessions.map(s => s.user_id));
      console.log(`Final count: ${finalSessions.length} sessions for ${uniqueUsers.size} users`);
      
      // Check for any remaining duplicates
      const userCounts = {};
      finalSessions.forEach(s => {
        userCounts[s.user_id] = (userCounts[s.user_id] || 0) + 1;
      });
      
      const duplicates = Object.entries(userCounts).filter(([_, count]) => count > 1);
      if (duplicates.length > 0) {
        console.warn('Warning: Found remaining duplicates:', duplicates);
      } else {
        console.log('✅ No duplicate sessions found!');
      }
    }

  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

// Run the cleanup if this script is executed directly
if (require.main === module) {
  cleanupDuplicateSessions()
    .then(() => {
      console.log('Cleanup script completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Cleanup script failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanupDuplicateSessions }; 