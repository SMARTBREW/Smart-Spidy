# 🚀 Smart-Spidy Deployment Guide

## 📋 Pre-Deployment Checklist

### ✅ Environment Variables Setup

#### Backend (.env in backend/ directory)
```env
NODE_ENV=production
PORT=3000
SUPABASE_URL=your_actual_supabase_url
SUPABASE_ANON_KEY=your_actual_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key
JWT_SECRET=your_secure_jwt_secret
REFRESH_JWT_SECRET=your_secure_refresh_secret
OPENAI_API_KEY=your_openai_key
INSTAGRAM_ACCESS_TOKEN=your_instagram_token
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_instagram_account_id
```

#### Frontend (.env in root directory)
```env
VITE_API_URL=https://your-backend-domain.com/api
VITE_SUPABASE_URL=your_actual_supabase_url
VITE_SUPABASE_SERVICE_KEY=your_actual_service_role_key
```

### ✅ Database Setup
1. Run the SQL schema in Supabase
2. Set up RLS policies
3. Create necessary indexes
4. Test all database operations

### ✅ CORS Configuration
Update `backend/index.js` with your actual frontend domain:
```javascript
origin: config.env === 'production' 
  ? [
      'https://your-frontend-domain.com', // Replace with actual domain
      'https://www.your-frontend-domain.com'
    ]
```

---

## 🎯 Deployment Options

### Option 1: AWS (Recommended)

#### Backend Deployment (EC2)
```bash
# 1. Launch EC2 instance (t3.small or larger)
# 2. Install Node.js and PM2
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# 3. Clone repository
git clone your-repo-url
cd Smart-Spidy/backend

# 4. Install dependencies
npm install

# 5. Set environment variables
cp .env.example .env
# Edit .env with production values

# 6. Start with PM2
pm2 start index.js --name "smartspidy-backend"
pm2 startup
pm2 save
```

#### Frontend Deployment (S3 + CloudFront)
```bash
# 1. Build frontend
cd ../frontend
npm run build

# 2. Upload to S3
aws s3 sync dist/ s3://your-bucket-name

# 3. Configure CloudFront for CDN
```

### Option 2: Vercel + Railway

#### Backend (Railway)
```bash
# 1. Connect GitHub repo to Railway
# 2. Set environment variables in Railway dashboard
# 3. Deploy automatically on push
```

#### Frontend (Vercel)
```bash
# 1. Connect GitHub repo to Vercel
# 2. Set environment variables in Vercel dashboard
# 3. Deploy automatically on push
```

### Option 3: DigitalOcean App Platform
```bash
# 1. Connect GitHub repo to DigitalOcean
# 2. Configure build commands
# 3. Set environment variables
# 4. Deploy both frontend and backend
```

---

## 🔧 Production Configuration

### Backend Production Settings
```javascript
// In backend/index.js
NODE_ENV=production
PORT=process.env.PORT || 3000

// CORS for production
origin: ['https://your-frontend-domain.com']

// Rate limiting
max: 1000 // Increase for production

// Logging
// Add production logging (Winston or similar)
```

### Frontend Production Settings
```javascript
// In vite.config.ts
export default defineConfig({
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable for production
  },
  server: {
    port: 5173,
  },
})
```

---

## 🚨 Post-Deployment Checklist

### ✅ Health Checks
- [ ] Backend health endpoint: `GET /health`
- [ ] Frontend loads without errors
- [ ] Database connections working
- [ ] Authentication flow works
- [ ] API endpoints responding

### ✅ Security
- [ ] HTTPS enabled
- [ ] Environment variables secure
- [ ] CORS properly configured
- [ ] Rate limiting active
- [ ] Helmet security headers

### ✅ Monitoring
- [ ] Set up error logging
- [ ] Monitor API response times
- [ ] Set up uptime monitoring
- [ ] Database performance monitoring

### ✅ Cron Jobs
- [ ] Verify notification generation works
- [ ] Test cleanup processes
- [ ] Monitor cron job logs

---

## 🔄 Maintenance

### Environment Variable Updates
```bash
# For AWS EC2
pm2 restart smartspidy-backend

# For Railway/Vercel
# Update in dashboard and redeploy
```

### Database Migrations
```sql
-- Run in Supabase SQL editor
-- Add new tables, indexes, or policies
```

### SSL Certificate Renewal
```bash
# If using Let's Encrypt
sudo certbot renew
```

---

## 🆘 Troubleshooting

### Common Issues
1. **CORS Errors**: Check frontend domain in backend CORS config
2. **Database Connection**: Verify Supabase credentials
3. **Authentication**: Check JWT secrets and token expiry
4. **Rate Limiting**: Adjust limits for production traffic
5. **Memory Issues**: Monitor PM2 logs and restart if needed

### Logs
```bash
# PM2 logs
pm2 logs smartspidy-backend

# Railway logs
railway logs

# Vercel logs
vercel logs
```

---

## 📞 Support

For deployment issues:
1. Check environment variables
2. Verify database connectivity
3. Test API endpoints with Postman
4. Review server logs
5. Check CORS configuration 