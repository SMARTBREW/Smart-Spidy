const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const { supabaseAdmin } = require('./supabase');
const config = require('./config');

const jwtOptions = {
  secretOrKey: config.jwt.secret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};

const jwtVerify = async (payload, done) => {
  try {
    if (payload.type !== 'access') {
      return done(null, false);
    }
    
    // First, check if user exists and is active
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, is_active')
      .eq('id', payload.sub)
      .eq('is_active', true)
      .single();

    if (userError || !user) {
      return done(null, false);
    }
    
    // Then, check if user has an active session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('user_sessions')
      .select('id, is_active, timeout_reason')
      .eq('user_id', payload.sub)
      .eq('is_active', true)
      .single();

    // If no active session found, the user should be logged out
    if (sessionError || !session) {
      console.log(`Session validation failed for user ${payload.sub}: No active session found`);
      return done(null, false);
    }

    // If session is marked as inactive, reject the token
    if (!session.is_active) {
      console.log(`Session validation failed for user ${payload.sub}: Session marked as inactive`);
      return done(null, false);
    }
    
    done(null, user);
  } catch (error) {
    console.error('JWT verification error:', error);
    done(error, false);
  }
};

const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);

module.exports = {
  jwtStrategy,
};
