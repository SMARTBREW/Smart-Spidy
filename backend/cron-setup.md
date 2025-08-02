# Notification System Cron Job Setup

## 🚀 Automatic Notification Setup Guide

### Option 1: Windows Task Scheduler (Recommended)

1. **Open Task Scheduler:**
   - Press `Win + R`
   - Type `taskschd.msc`
   - Press Enter

2. **Create Basic Task:**
   - Click "Create Basic Task"
   - Name: "Smart-Spidy Notifications"
   - Description: "Daily notification generation at 9:00 AM"

3. **Set Trigger:**
   - Daily
   - Start time: 9:00 AM
   - Recur every: 1 day

4. **Set Action:**
   - Start a program
   - Program: `cmd.exe`
   - Arguments: `/c "cd C:\Users\hp\Desktop\Smart-Spidy\backend && npm run generate-notifications"`

5. **Advanced Settings:**
   - Run whether user is logged on or not
   - Run with highest privileges
   - Start in: `C:\Users\hp\Desktop\Smart-Spidy\backend`

### Option 2: Node.js Cron Package

1. **Install cron package:**
   ```bash
   npm install node-cron
   ```

2. **Create cron service:**
   ```javascript
   // backend/services/cronService.js
   const cron = require('node-cron');
   const { generateAllNotifications } = require('./notificationService');

   // Run daily at 9:00 AM
   cron.schedule('0 9 * * *', async () => {
     console.log('🕐 Running scheduled notification generation...');
     try {
       await generateAllNotifications();
       console.log('✅ Scheduled notification generation completed');
     } catch (error) {
       console.error('❌ Scheduled notification generation failed:', error);
     }
   }, {
     timezone: "Asia/Kolkata" // Adjust to your timezone
   });

   console.log('📅 Notification cron job scheduled for 9:00 AM daily');
   ```

3. **Add to index.js:**
   ```javascript
   // backend/index.js
   require('./services/cronService'); // Add this line
   ```

### Option 3: PM2 with Cron (Production)

1. **Install PM2:**
   ```bash
   npm install -g pm2
   ```

2. **Create ecosystem file:**
   ```javascript
   // backend/ecosystem.config.js
   module.exports = {
     apps: [{
       name: 'smart-spidy-backend',
       script: 'index.js',
       instances: 1,
       autorestart: true,
       watch: false,
       max_memory_restart: '1G',
       env: {
         NODE_ENV: 'production'
       }
     }],
     deploy: {
       production: {
         user: 'your-username',
         host: 'your-server',
         ref: 'origin/main',
         repo: 'your-repo-url',
         path: '/var/www/smart-spidy',
         'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
       }
     }
   };
   ```

3. **Start with PM2:**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

### Option 4: Simple Batch Script (Windows)

1. **Create batch file:**
   ```batch
   @echo off
   cd /d C:\Users\hp\Desktop\Smart-Spidy\backend
   npm run generate-notifications
   ```

2. **Save as:** `C:\Users\hp\Desktop\Smart-Spidy\backend\run-notifications.bat`

3. **Add to Task Scheduler:**
   - Program: `C:\Users\hp\Desktop\Smart-Spidy\backend\run-notifications.bat`

## 🔧 Testing the Setup

### Manual Test:
```bash
npm run generate-notifications
```

### Check if cron is working:
```bash
# Check cron logs
pm2 logs smart-spidy-backend

# Check task scheduler
taskschd.msc
```

## 📊 Monitoring

### Log Files:
- Check console output for success/failure
- Monitor notification count in database
- Verify cleanup process is working

### Database Check:
```sql
-- Check today's notifications
SELECT COUNT(*) FROM notifications 
WHERE DATE(created_at) = CURRENT_DATE;

-- Check cleanup worked
SELECT COUNT(*) FROM notifications 
WHERE DATE(created_at) < CURRENT_DATE;
```

## ⚠️ Important Notes

1. **Server must be running** for notifications to work
2. **Database connection** must be stable
3. **Timezone** should be set correctly
4. **Logs** should be monitored for errors
5. **Backup** the notification system before production

## 🎯 Recommended Setup for Development

Use **Option 1 (Windows Task Scheduler)** for now:
- Simple to set up
- No additional dependencies
- Easy to test and modify
- Works with your current setup

## 🚀 Production Setup

For production, use **Option 3 (PM2)**:
- More reliable
- Better error handling
- Automatic restarts
- Process monitoring 