#!/bin/bash

# Smart-Spidy Backend Deployment Script for Jenkins
# This script handles the complete deployment process

set -e  # Exit on any error

echo "Starting Smart-Spidy Backend Deployment..."

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
    print_status "Health check passed! Application is running."
else
    print_error "Health check failed! Response code: $HEALTH_RESPONSE"
    print_status "Checking PM2 logs..."
    pm2 logs "$PM2_APP_NAME" --lines 20
    exit 1
fi

print_step "Step 9: Checking nginx status..."
if sudo systemctl is-active --quiet nginx; then
    print_status "nginx is running"
else
    print_warning "nginx is not running, starting it..."
    sudo systemctl start nginx
fi

print_step "Step 10: Testing nginx proxy..."
NGINX_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/health || echo "000")

if [ "$NGINX_HEALTH" = "200" ]; then
    print_status " nginx proxy is working correctly"
else
    print_warning " nginx proxy health check failed: $NGINX_HEALTH"
fi

print_step "Step 11: Testing production URL..."
PROD_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL/health" || echo "000")

if [ "$PROD_HEALTH" = "200" ]; then
    print_status "Production URL is accessible"
else
    print_warning "  Production URL test failed: $PROD_HEALTH"
fi

print_step "Step 12: Final verification..."
print_status " PM2 Status:"
pm2 status

print_status " Application URLs:"
echo "   - Direct: http://localhost:3000"
echo "   - Through nginx: http://localhost"
echo "   - Production: $DEPLOYMENT_URL"
echo "   - Health: $DEPLOYMENT_URL/health"

print_status " Backend deployment completed successfully!"
print_status " Deployment completed at: $(date)" 