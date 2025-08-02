const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const passport = require('passport');
const rateLimit = require('express-rate-limit');
const httpStatus = require('http-status');

const config = require('./config/config');
const { jwtStrategy } = require('./config/passport');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const fundraiserRoutes = require('./routes/fundraiserRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Initialize cron service for automatic notifications
require('./services/cronService');

const ApiError = require('./utils/ApiError');

const app = express();

passport.use('jwt', jwtStrategy);
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 
}));

app.use(compression());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 50, 
  message: 'Too many authentication attempts from this IP, please try again later.',
  skipSuccessfulRequests: true, 
});

app.use('/api/users/login', authLimiter);
app.use('/api/users/register', authLimiter);
app.use('/api/users/refresh-token', authLimiter);

const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 200, 
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/health', publicLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(passport.initialize());

// Minimal request logging (only in development)
if (config.env === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: config.env 
  });
});

app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/fundraisers', fundraiserRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);



app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

app.use((err, req, res, next) => {
  let { statusCode, message } = err;
  
  // Provide default values if they're undefined
  if (!statusCode) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
  }
  
  if (!message) {
    message = 'Internal Server Error';
  }
  
  if (config.env === 'production' && !err.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR];
  }

  console.error('Error occurred:', {
    statusCode,
    message,
    stack: err.stack,
    originalError: err
  });

  res.status(statusCode).json({
    success: false,
    message,
    ...(config.env === 'development' && { stack: err.stack })
  });
});

const PORT = config.port || 3000;

app.listen(PORT, () => {
  console.log(` Server is running on port ${PORT}`);
  console.log(` Environment: ${config.env}`);
  console.log(` Health check: http://localhost:${PORT}/health`);
});

module.exports = app; 