# 🚀 Smart-Spidy Deployment Guide

## 📋 Pre-Deployment Checklist

### ✅ Backend Environment Variables (.env)
```env
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT
JWT_SECRET=your_jwt_secret
JWT_ACCESS_EXPIRATION_MINUTES=480
JWT_REFRESH_EXPIRATION_DAYS=30

# Server
PORT=3000
NODE_ENV=production

# AI Services (Optional)
OPENAI_API_KEY=your_openai_key
INSTAGRAM_ACCESS_TOKEN=your_instagram_token
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_instagram_account_id
```

### ✅ Frontend Environment Variables (.env)
```env
VITE_API_URL=https://your-backend-domain.com/api
```

## 🎯 Deployment Options

### Option 1: AWS EC2 (Recommended)

#### Step 1: Deploy Backend

**Complete Backend Deployment Checklist:**

```bash
# 1. Connect to your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# 2. System Update
sudo apt update && sudo apt upgrade -y

# 3. Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. Verify Node.js
node --version
npm --version

# 5. Install PM2
sudo npm install -g pm2

# 6. Install nginx
sudo apt install nginx -y

# 7. Clone Repository
git clone https://github.com/SMARTBREW/Smart-Spidy
cd Smart-Spidy/backend

# 8. Install Dependencies
npm install

# 9. Create .env File
nano .env
```

**Add these environment variables to .env:**
```env
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT
JWT_SECRET=your_jwt_secret
JWT_ACCESS_EXPIRATION_MINUTES=480
JWT_REFRESH_EXPIRATION_DAYS=30

# Server
PORT=3000
NODE_ENV=production

# AI Services (Optional)
OPENAI_API_KEY=your_openai_key
INSTAGRAM_ACCESS_TOKEN=your_instagram_token
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_instagram_account_id
```

```bash
# 10. Configure nginx
sudo nano /etc/nginx/sites-available/default
```

**Replace the content with:**
```nginx
server {
    listen 80;
    server_name _;

    # Frontend
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# 11. Test nginx Configuration
sudo nginx -t

# 12. Start nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 13. Start Backend with PM2
pm2 start index.js --name "smart-spidy-backend"
pm2 save
pm2 startup

# 14. Verify Everything
pm2 status
sudo systemctl status nginx
curl http://localhost:3000/api/health
curl http://localhost/api/health
```

#### Step 2: Deploy Frontend
```bash
# 1. Build frontend
cd ../frontend
npm install
npm run build

# 2. Serve with nginx
sudo apt-get install nginx
sudo cp -r dist/* /var/www/html/
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Option 2: Vercel + Railway

#### Backend (Railway)
1. Connect your GitHub repo to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically

#### Frontend (Vercel)
1. Connect your GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically

## ⏰ Notification System Setup

### Automatic Notifications (Recommended)

The notification system is **already configured** to run automatically! Here's how it works:

#### ✅ What's Already Set Up:
1. **Cron Service**: `backend/services/cronService.js`
2. **Daily Schedule**: 9:00 AM (Asia/Kolkata timezone)
3. **Cleanup**: Removes old notifications automatically
4. **Generation**: Creates new notifications for inactive chats

#### 🔧 How It Works:
```javascript
// This runs automatically when your server starts
cron.schedule('0 9 * * *', async () => {
  await generateAllNotifications();
}, { timezone: "Asia/Kolkata" });
```

#### 📊 What Happens Daily:
1. **Cleanup**: Removes notifications from previous days
2. **Generation**: Creates notifications for:
   - Chats inactive for exactly 2 days
   - Chats inactive for exactly 5 days
3. **Logging**: Records success/failure in console

### Manual Testing (Optional)
```bash
# Test notification generation
npm run generate-notifications

# Check if cron is working
pm2 logs smart-spidy-backend
```

## 🔧 Post-Deployment Verification

### 1. Check Backend Health
```bash
curl https://your-backend-domain.com/api/health
# Should return: {"status":"ok","message":"Server is running"}
```

### 2. Check Notification System
```bash
# Check if notifications are being generated
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-backend-domain.com/api/notifications/stats
```

### 3. Check Frontend
- Open your frontend URL
- Login and check if notifications appear
- Test notification clicking functionality

## 📊 Monitoring & Maintenance

### Daily Checks:
1. **Server Status**: `pm2 status`
2. **Notification Logs**: `pm2 logs smart-spidy-backend`
3. **Database**: Check notification count in Supabase

### Weekly Checks:
1. **Error Logs**: Check for any failed notification generations
2. **Database Cleanup**: Verify old notifications are being removed
3. **Performance**: Monitor server resources

### Monthly Checks:
1. **Token Expiry**: Check Instagram/OpenAI token validity
2. **Backup**: Verify database backups
3. **Updates**: Update dependencies if needed

## 🚨 Troubleshooting

### Notification System Not Working:
```bash
# 1. Check if server is running
pm2 status

# 2. Check logs
pm2 logs smart-spidy-backend

# 3. Test manually
npm run generate-notifications

# 4. Check database connection
curl https://your-backend-domain.com/api/health
```

### Common Issues:
1. **CORS Errors**: Ensure frontend URL is in CORS settings
2. **Database Connection**: Check Supabase credentials
3. **Token Issues**: Verify JWT secret and expiry settings
4. **Timezone Issues**: Ensure server timezone is correct

## 🎯 Success Criteria

After deployment, you should see:
- ✅ Backend API responding to health checks
- ✅ Frontend loading without errors
- ✅ Users can login and see notifications
- ✅ Notifications appear daily at 9:00 AM
- ✅ Old notifications are cleaned up automatically
- ✅ Admin panel shows all notifications
- ✅ Search and filtering work correctly

## 📞 Support

If you encounter issues:
1. Check the logs: `pm2 logs smart-spidy-backend`
2. Test manually: `npm run generate-notifications`
3. Verify environment variables are set correctly
4. Check database connectivity

---

**🎉 Your notification system will work automatically after deployment!**
The cron job will run daily at 9:00 AM and handle all cleanup and generation automatically. 