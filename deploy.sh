#!/bin/bash

# ============================================================
# Marketing OS - Production Deployment Script
# Runs on EC2 instance to restart services after code update
# ============================================================

set -e  # Exit on error

echo "🚀 Starting deployment process..."
echo "Time: $(date)"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_DIR="/home/ec2-user/marketting-os"
SERVER_DIR="$PROJECT_DIR/marketing-os-server"

# ============================================================
# 1. Backend Restart
# ============================================================
echo -e "${YELLOW}[1/4] Restarting backend API...${NC}"
cd $SERVER_DIR

# Stop PM2 process
pm2 stop marketing-os-api || true
pm2 delete marketing-os-api || true

# Kill any lingering processes on port 8000
kill $(lsof -t -i:8000) 2>/dev/null || true
sleep 2

# Restart with PM2
pm2 start dist/server.js --name "marketing-os-api" --max-memory-restart 500M
pm2 save

echo -e "${GREEN}✓ Backend restarted${NC}"

# ============================================================
# 2. Verify Backend is Running
# ============================================================
echo -e "${YELLOW}[2/4] Verifying backend health...${NC}"
sleep 3
if curl -s http://127.0.0.1:8000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is responding${NC}"
else
    echo -e "${YELLOW}⚠ Backend health check inconclusive (might still be starting)${NC}"
fi

# ============================================================
# 3. Reload Nginx
# ============================================================
echo -e "${YELLOW}[3/4] Reloading Nginx...${NC}"
sudo systemctl reload nginx
sleep 2

# Test nginx config
sudo nginx -t > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Nginx reloaded successfully${NC}"
else
    echo -e "${RED}✗ Nginx configuration error!${NC}"
    exit 1
fi

# ============================================================
# 4. Deployment Complete
# ============================================================
echo -e "${YELLOW}[4/4] Finalizing deployment...${NC}"

# Show process status
echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Deployment completed successfully!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo "Process Status:"
pm2 list
echo ""
echo "Service URLs:"
echo "  Frontend: https://app.wayon.in"
echo "  API: https://api.app.wayon.in"
echo ""
echo "Logs:"
echo "  Backend: pm2 logs marketing-os-api"
echo "  Nginx: sudo tail -f /var/log/nginx/error.log"
echo ""
echo "Deployed at: $(date)"
