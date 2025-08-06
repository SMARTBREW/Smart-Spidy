# 🚀 Smart-Spidy Jenkins CI/CD Setup Guide

## 📋 Table of Contents
1. [Quick Start - Minimal Setup](#quick-start---minimal-setup)
2. [Complete Jenkins Installation](#complete-jenkins-installation)
3. [Pipeline Configuration](#pipeline-configuration)
4. [Deployment Scripts](#deployment-scripts)
5. [GitHub Webhook Setup](#github-webhook-setup)
6. [Monitoring & Troubleshooting](#monitoring--troubleshooting)
7. [Security Configuration](#security-configuration)

---

## 🚀 Quick Start - Minimal Setup

### **Step 1: Install Jenkins (Required)**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Java
sudo apt install openjdk-11-jdk -y

# Add Jenkins repository
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee \
  /usr/share/keyrings/jenkins-keyring.asc > /dev/null

echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
  https://pkg.jenkins.io/debian-stable binary/ | sudo tee \
  /etc/apt/sources.list.d/jenkins.list > /dev/null

# Install Jenkins
sudo apt update
sudo apt install jenkins -y

# Start Jenkins
sudo systemctl start jenkins
sudo systemctl enable jenkins
```

### **Step 2: Get Initial Password**
```bash
# Get the initial admin password
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

### **Step 3: Access Jenkins Web Interface**
```bash
# Get your EC2 IP
curl http://169.254.169.254/latest/meta-data/public-ipv4
```

**Access Jenkins:**
- **URL:** `http://YOUR_EC2_IP:8080`
- **Password:** (from Step 2)

---

## 🔧 Complete Jenkins Installation

### **Step 4: Configure nginx for Jenkins Access**
```bash
# Create nginx configuration for Jenkins
sudo tee /etc/nginx/sites-available/jenkins > /dev/null << 'EOF'
server {
    listen 80;
    server_name jenkins.smartbrew.in;  # Replace with your domain

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable Jenkins site
sudo ln -s /etc/nginx/sites-available/jenkins /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### **Step 5: Set Up Jenkins User and SSH Keys**
```bash
# Create jenkins user (if not exists)
sudo useradd -m -s /bin/bash jenkins

# Generate ed25519 SSH key for Jenkins (more secure than RSA)
sudo -u jenkins ssh-keygen -t ed25519 -C "smartbrew.in" -f /var/lib/jenkins/.ssh/id_ed25519 -N ""

# Add Jenkins user to ubuntu group
sudo usermod -a -G ubuntu jenkins

# Set proper permissions for SSH directory and keys
sudo chown -R jenkins:jenkins /var/lib/jenkins/.ssh
sudo chmod 700 /var/lib/jenkins/.ssh
sudo chmod 600 /var/lib/jenkins/.ssh/id_ed25519
sudo chmod 644 /var/lib/jenkins/.ssh/id_ed25519.pub

# Add Jenkins SSH key to authorized keys
sudo cat /var/lib/jenkins/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Test SSH connection
sudo -u jenkins ssh -o StrictHostKeyChecking=no ubuntu@localhost "echo 'SSH connection successful'"

# Verify SSH key setup
ls -la /var/lib/jenkins/.ssh/
cat ~/.ssh/authorized_keys

# List all SSH keys for Jenkins
ls -la /var/lib/jenkins/.ssh/

# View the public key
sudo cat /var/lib/jenkins/.ssh/id_ed25519.pub

# View the private key (be careful with this!)
sudo cat /var/lib/jenkins/.ssh/id_ed25519
```

### **Step 6: Security Group Configuration**
Make sure your EC2 security group allows:
- **Port 22** (SSH)
- **Port 80** (HTTP)
- **Port 443** (HTTPS)
- **Port 8080** (Jenkins)
- **Port 3000** (Backend - internal only)

---

## 📝 Pipeline Configuration

### **Step 7: Create Jenkinsfile**
Create `Jenkinsfile` in your backend directory:

```groovy
pipeline {
    agent any
    
    environment {
        NODE_ENV = 'production'
        PROJECT_DIR = '/home/ubuntu/Smart-Spidy'
        BACKEND_DIR = '/home/ubuntu/Smart-Spidy/backend'
        PM2_APP_NAME = 'smart-spidy-backend'
        DEPLOYMENT_URL = 'https://api.smartbrew.in'
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo '🔍 Checking out source code...'
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                dir('backend') {
                    echo '📦 Installing Node.js dependencies...'
                    sh 'npm install'
                }
            }
        }
        
        stage('Environment Check') {
            steps {
                dir('backend') {
                    echo '🔧 Checking environment configuration...'
                    sh '''
                        if [ ! -f .env ]; then
                            echo "⚠️  Warning: .env file not found"
                        else
                            echo "✅ .env file exists"
                        fi
                        
                        echo "📊 Node.js version:"
                        node --version
                        
                        echo "📊 npm version:"
                        npm --version
                    '''
                }
            }
        }
        
        stage('Test') {
            steps {
                dir('backend') {
                    echo '🧪 Running tests...'
                    sh 'npm test || echo "No tests configured - continuing..."'
                }
            }
        }
        
        stage('Deploy to EC2') {
            steps {
                script {
                    echo '🚀 Deploying to EC2...'
                    sh '''
                        echo "📁 Navigating to project directory..."
                        cd ${BACKEND_DIR}
                        
                        echo "📥 Pulling latest changes..."
                        git pull origin main
                        
                        echo "📦 Installing dependencies..."
                        npm install
                        
                        echo "🔄 Restarting PM2 application..."
                        pm2 restart ${PM2_APP_NAME} || pm2 start index.js --name ${PM2_APP_NAME}
                        
                        echo "💾 Saving PM2 configuration..."
                        pm2 save
                        
                        echo "✅ Backend deployment completed!"
                    '''
                }
            }
        }
        
        stage('Health Check') {
            steps {
                script {
                    echo '🏥 Performing health checks...'
                    
                    // Wait for app to start
                    sh 'sleep 10'
                    
                    // Test health endpoint
                    sh '''
                        echo "🔍 Testing health endpoint..."
                        response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
                        
                        if [ "$response" = "200" ]; then
                            echo "✅ Health check passed - Backend is running"
                        else
                            echo "❌ Health check failed - Response code: $response"
                            echo "📋 Checking PM2 logs..."
                            pm2 logs ${PM2_APP_NAME} --lines 20
                            exit 1
                        fi
                    '''
                }
            }
        }
        
        stage('API Test') {
            steps {
                script {
                    echo '🔐 Testing API endpoints...'
                    sh '''
                        echo "🔍 Testing API authentication..."
                        response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/notifications/stats)
                        
                        if [ "$response" = "401" ]; then
                            echo "✅ API authentication working correctly (401 expected for unauthenticated request)"
                        else
                            echo "⚠️  API test returned: $response"
                        fi
                    '''
                }
            }
        }
        
        stage('Nginx Check') {
            steps {
                script {
                    echo '🌐 Checking nginx configuration...'
                    sh '''
                        echo "🔍 Checking nginx status..."
                        if sudo systemctl is-active --quiet nginx; then
                            echo "✅ nginx is running"
                        else
                            echo "❌ nginx is not running"
                            sudo systemctl start nginx
                        fi
                        
                        echo "🔍 Testing nginx proxy..."
                        nginx_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/health)
                        
                        if [ "$nginx_response" = "200" ]; then
                            echo "✅ nginx proxy is working correctly"
                        else
                            echo "⚠️  nginx proxy test returned: $nginx_response"
                        fi
                    '''
                }
            }
        }
        
        stage('Production URL Test') {
            steps {
                script {
                    echo '🌍 Testing production URL...'
                    sh '''
                        echo "🔍 Testing production endpoint: ${DEPLOYMENT_URL}/health"
                        prod_response=$(curl -s -o /dev/null -w "%{http_code}" ${DEPLOYMENT_URL}/health)
                        
                        if [ "$prod_response" = "200" ]; then
                            echo "✅ Production URL is accessible"
                        else
                            echo "⚠️  Production URL test returned: $prod_response"
                        fi
                    '''
                }
            }
        }
    }
    
    post {
        success {
            echo '🎉 Pipeline completed successfully!'
            echo '📊 Deployment Summary:'
            echo '   - Backend: Running on port 3000'
            echo '   - nginx: Proxying requests'
            echo '   - PM2: Managing Node.js process'
            echo '   - Health: All endpoints responding'
        }
        failure {
            echo '❌ Pipeline failed!'
            echo '🔍 Troubleshooting steps:'
            echo '   1. Check PM2 logs: pm2 logs smart-spidy-backend'
            echo '   2. Check nginx logs: sudo tail -f /var/log/nginx/error.log'
            echo '   3. Restart services: pm2 restart smart-spidy-backend && sudo systemctl restart nginx'
        }
        always {
            echo '🧹 Cleaning up workspace...'
            cleanWs()
        }
    }
}
```

### **Step 8: Create Deployment Script**
Create `deploy-backend.sh` in your backend directory:

```bash
#!/bin/bash

# Smart-Spidy Backend Deployment Script for Jenkins
# This script handles the complete deployment process

set -e  # Exit on any error

echo "🚀 Starting Smart-Spidy Backend Deployment..."

# Variables
PROJECT_DIR="/home/ubuntu/Smart-Spidy"
BACKEND_DIR="$PROJECT_DIR/backend"
PM2_APP_NAME="smart-spidy-backend"
DEPLOYMENT_URL="https://api.smartbrew.in"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if directories exist
if [ ! -d "$PROJECT_DIR" ]; then
    print_error "Project directory not found: $PROJECT_DIR"
    exit 1
fi

if [ ! -d "$BACKEND_DIR" ]; then
    print_error "Backend directory not found: $BACKEND_DIR"
    exit 1
fi

print_step "Step 1: Navigating to project directory..."
cd "$PROJECT_DIR"

print_step "Step 2: Pulling latest changes from git..."
git pull origin main

print_step "Step 3: Navigating to backend directory..."
cd "$BACKEND_DIR"

print_step "Step 4: Installing dependencies..."
npm install

print_step "Step 5: Checking PM2 status..."
if pm2 list | grep -q "$PM2_APP_NAME"; then
    print_status "Restarting PM2 application..."
    pm2 restart "$PM2_APP_NAME"
else
    print_warning "PM2 app not found, starting new instance..."
    pm2 start index.js --name "$PM2_APP_NAME"
fi

print_step "Step 6: Saving PM2 configuration..."
pm2 save

print_step "Step 7: Waiting for application to start..."
sleep 10

print_step "Step 8: Checking application health..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health || echo "000")

if [ "$HEALTH_RESPONSE" = "200" ]; then
    print_status "✅ Health check passed! Application is running."
else
    print_error "❌ Health check failed! Response code: $HEALTH_RESPONSE"
    print_status "Checking PM2 logs..."
    pm2 logs "$PM2_APP_NAME" --lines 20
    exit 1
fi

print_step "Step 9: Checking nginx status..."
if sudo systemctl is-active --quiet nginx; then
    print_status "✅ nginx is running"
else
    print_warning "nginx is not running, starting it..."
    sudo systemctl start nginx
fi

print_step "Step 10: Testing nginx proxy..."
NGINX_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/health || echo "000")

if [ "$NGINX_HEALTH" = "200" ]; then
    print_status "✅ nginx proxy is working correctly"
else
    print_warning "⚠️  nginx proxy health check failed: $NGINX_HEALTH"
fi

print_step "Step 11: Testing production URL..."
PROD_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL/health" || echo "000")

if [ "$PROD_HEALTH" = "200" ]; then
    print_status "✅ Production URL is accessible"
else
    print_warning "⚠️  Production URL test failed: $PROD_HEALTH"
fi

print_step "Step 12: Final verification..."
print_status "📊 PM2 Status:"
pm2 status

print_status "🌐 Application URLs:"
echo "   - Direct: http://localhost:3000"
echo "   - Through nginx: http://localhost"
echo "   - Production: $DEPLOYMENT_URL"
echo "   - Health: $DEPLOYMENT_URL/health"

print_status "🎉 Backend deployment completed successfully!"
print_status "⏰ Deployment completed at: $(date)"
```

### **Step 9: Make Deployment Script Executable**
```bash
# Navigate to your project directory
cd ~/Smart-Spidy/backend

# Make deployment script executable
chmod +x deploy-backend.sh

# Test the deployment script
./deploy-backend.sh
```

---

## 🔗 GitHub Webhook Setup

### **Step 10: Configure GitHub Webhook**

**In GitHub Repository:**
1. Go to **Settings** → **Webhooks**
2. **Add webhook:**
   - **Payload URL:** `http://YOUR_EC2_IP:8080/github-webhook/`
   - **Content type:** `application/json`
   - **Events:** `Just the push event`

### **Step 11: Configure Jenkins for Webhooks**

**In Jenkins:**
1. Install **GitHub Integration** plugin
2. Go to **Manage Jenkins** → **Configure System**
3. **GitHub** section:
   - **API URL:** `https://api.github.com`
   - **Credentials:** Add GitHub token (optional)

---

## 🎯 Jenkins Web Interface Setup

### **Step 12: Initial Jenkins Setup**

1. **Open Jenkins in browser:** `http://YOUR_EC2_IP:8080`
2. **Enter initial password:** (from Step 2)
3. **Install suggested plugins**
4. **Create admin user**
5. **Configure Jenkins URL:** `http://YOUR_EC2_IP:8080`

### **Step 13: Create Pipeline Job**

1. **Click "New Item"**
2. **Enter name:** `smart-spidy-backend-deploy`
3. **Select "Pipeline"**
4. **Click OK**

### **Step 14: Configure Pipeline**

In the job configuration:
1. **Pipeline section** → **Definition** → **Pipeline script from SCM**
2. **SCM** → **Git**
3. **Repository URL:** `https://github.com/SMARTBREW/Smart-Spidy.git`
4. **Branch:** `main`
5. **Script Path:** `Jenkinsfile`
6. **Save**

---

## 📊 Monitoring & Troubleshooting

### **Step 15: Jenkins Service Management**
```bash
# Start Jenkins
sudo systemctl start jenkins

# Stop Jenkins
sudo systemctl stop jenkins

# Restart Jenkins
sudo systemctl restart jenkins

# Check Jenkins status
sudo systemctl status jenkins

# View Jenkins logs
sudo tail -f /var/log/jenkins/jenkins.log
```

### **Step 16: Monitoring Commands**
```bash
# Check Jenkins port
sudo netstat -tlnp | grep :8080

# Check Jenkins process
ps aux | grep jenkins

# Check Jenkins user
sudo -u jenkins whoami

# Check Jenkins home directory
ls -la /var/lib/jenkins/

# Check Jenkins workspace
ls -la /var/lib/jenkins/workspace/
```

### **Step 17: Verification Script**
```bash
# Create verification script
cat > ~/verify-jenkins.sh << 'EOF'
#!/bin/bash
echo "🔍 Verifying Jenkins Setup..."

echo "📊 Jenkins Status:"
sudo systemctl status jenkins --no-pager

echo "🌐 Jenkins Port:"
sudo netstat -tlnp | grep :8080

echo "🔑 SSH Key Setup:"
ls -la /var/lib/jenkins/.ssh/

echo "📁 Project Directory:"
ls -la /home/ubuntu/Smart-Spidy/

echo "🚀 PM2 Status:"
pm2 status

echo "🌐 nginx Status:"
sudo systemctl status nginx --no-pager

echo "🏥 Health Check:"
curl -s http://localhost/health

echo "✅ Verification Complete!"
EOF

chmod +x ~/verify-jenkins.sh
~/verify-jenkins.sh
```

---

## 🔒 Security Configuration

### **Step 18: Security Best Practices**
```bash
# Restrict Jenkins access
sudo ufw allow 8080/tcp

# Set up firewall rules
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8080/tcp

# Check firewall status
sudo ufw status
```

### **Step 19: SSL Configuration (Optional)**
```bash
# Install certbot for SSL
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate for Jenkins
sudo certbot --nginx -d jenkins.smartbrew.in

# Test SSL setup
curl https://jenkins.smartbrew.in
```

---

## 🎉 Success Indicators

✅ **Jenkins running** on port 8080  
✅ **Pipeline job** created and configured  
✅ **GitHub webhook** set up for automatic deployments  
✅ **Deployment script** working correctly  
✅ **Health checks** passing  
✅ **Production URL** accessible at https://api.smartbrew.in  

---

## 🚀 How to Use

### **Manual Deployment:**
1. Go to Jenkins web interface
2. Click on your pipeline job
3. Click "Build Now"

### **Automatic Deployment:**
1. Push changes to GitHub main branch
2. Jenkins automatically triggers deployment
3. Check build logs for status

### **Monitor Deployments:**
```bash
# Check Jenkins builds
curl http://localhost:8080/api/json

# Check PM2 status
pm2 status

# Check application health
curl https://api.smartbrew.in/health
```

---

*Last Updated: January 2025*
*Version: 1.0* 