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
    
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, is_active')
      .eq('id', payload.sub)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return done(null, false);
    }
    
    done(null, user);
  } catch (error) {
    done(error, false);
  }
};

const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);

module.exports = {
  jwtStrategy,
};
