const dotenv = require('dotenv');
const Joi = require('joi');

dotenv.config();

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(3000),
    SUPABASE_URL: Joi.string().required().description('Supabase project URL'),
    SUPABASE_ANON_KEY: Joi.string().required().description('Supabase anon/public key'),
    SUPABASE_SERVICE_ROLE_KEY: Joi.string().required().description('Supabase service role key'),
    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    REFRESH_JWT_SECRET: Joi.string().required().description('JWT secret key'),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number().default(480).description('minutes after which access tokens expire (8 hours)'),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number().default(30).description('days after which refresh tokens expire'),
    SMTP_HOST: Joi.string().description('server that will send the emails'),
    SMTP_PORT: Joi.number().description('port to connect to the email server'),
    SMTP_USERNAME: Joi.string().description('username for email server'),
    SMTP_PASSWORD: Joi.string().description('password for email server'),
    EMAIL_FROM: Joi.string().description('the from field in the emails sent by the app'),
    OPENAI_API_KEY: Joi.string().description('OpenAI API key'),
    INSTAGRAM_ACCESS_TOKEN: Joi.string().description('Instagram Graph API access token'),
    INSTAGRAM_BUSINESS_ACCOUNT_ID: Joi.string().description('Instagram business account ID'),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  supabase: {
    url: envVars.SUPABASE_URL,
    anonKey: envVars.SUPABASE_ANON_KEY,
    serviceRoleKey: envVars.SUPABASE_SERVICE_ROLE_KEY,
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshSecret: envVars.REFRESH_JWT_SECRET,
    refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
    resetPasswordExpirationMinutes: 10,
  },
  email: {
    smtp: {
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT,
      auth: {
        user: envVars.SMTP_USERNAME,
        pass: envVars.SMTP_PASSWORD,
      },
    },
    from: envVars.EMAIL_FROM,
  },
  openai: {
    apiKey: envVars.OPENAI_API_KEY,
  },
  instagram: {
    accessToken: envVars.INSTAGRAM_ACCESS_TOKEN,
    businessAccountId: envVars.INSTAGRAM_BUSINESS_ACCOUNT_ID,
  },
};