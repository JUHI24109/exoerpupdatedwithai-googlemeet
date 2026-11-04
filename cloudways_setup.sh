#!/bin/bash
# ============================================
# EXO-ERP — One-Click Cloudways Setup Script
# ============================================
# Paste this ENTIRE script into Cloudways SSH terminal
# It will do EVERYTHING automatically!
# ============================================

echo ""
echo "============================================"
echo "  EXO-ERP Backend Setup for Cloudways"
echo "============================================"
echo ""

# Find the app directory
APP_DIR=$(find /home/master/applications -maxdepth 2 -name "public_html" -type d 2>/dev/null | head -1)

if [ -z "$APP_DIR" ]; then
    echo "❌ Could not find public_html directory!"
    echo "Please enter your app folder path manually:"
    read -p "Path: " APP_DIR
fi

echo "📂 App directory: $APP_DIR"
cd "$APP_DIR" || { echo "❌ Cannot cd to $APP_DIR"; exit 1; }

# Check if backend folder exists
if [ ! -d "backend" ]; then
    echo "❌ backend/ folder not found in $APP_DIR"
    echo "Make sure your code is uploaded first!"
    exit 1
fi

echo "✅ Backend folder found!"
echo ""

# ---- Step 1: Get Node.js ----
echo "=== Step 1: Checking Node.js ==="
if command -v node > /dev/null 2>&1; then
    echo "✅ Node.js found: $(node -v)"
else
    echo "📦 Node.js not found. Installing via nvm..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    nvm install 18
    nvm use 18
    echo "✅ Node.js installed: $(node -v)"
fi
echo ""

# ---- Step 2: Get MySQL Credentials ----
echo "=== Step 2: MySQL Database Setup ==="

if [ -f "backend/.env" ]; then
    echo "✅ backend/.env already exists!"
    echo "Current config:"
    grep -E "^DB_" backend/.env
    echo ""
    read -p "Do you want to update it? (y/n): " UPDATE_ENV
    if [ "$UPDATE_ENV" != "y" ]; then
        echo "Keeping existing .env"
    else
        CREATE_ENV=true
    fi
else
    CREATE_ENV=true
fi

if [ "$CREATE_ENV" = true ]; then
    echo ""
    echo "📋 Go to Cloudways Dashboard:"
    echo "   → Your Application → Access Details"
    echo "   Copy the DB Name, Username, and Password"
    echo ""
    
    read -p "Enter DB Name (from Cloudways): " DB_NAME
    read -p "Enter DB Username (from Cloudways): " DB_USER
    read -p "Enter DB Password (from Cloudways): " DB_PASS

    if [ -z "$DB_NAME" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASS" ]; then
        echo "❌ All fields are required!"
        exit 1
    fi

    cat > backend/.env << ENVFILE
PORT=5000
JWT_SECRET=exo-erp-$(date +%s)-secret-key

DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=$DB_NAME
DB_USERNAME=$DB_USER
DB_PASSWORD=$DB_PASS
DB_DIALECT=mysql
ENVFILE

    echo ""
    echo "✅ backend/.env created successfully!"
fi
echo ""

# ---- Step 3: Install npm packages ----
echo "=== Step 3: Installing npm packages ==="
cd "$APP_DIR/backend"
npm install --no-audit --no-fund --legacy-peer-deps 2>&1
echo ""
echo "✅ npm packages installed!"
echo ""

# ---- Step 4: Kill old Node process & Start new one ----
echo "=== Step 4: Starting Node.js Backend ==="
cd "$APP_DIR"

# Kill any existing node processes for this app
pkill -f "node.*backend/index.js" 2>/dev/null
pkill -f "node.*index.js" 2>/dev/null
sleep 2

# Start backend
nohup node backend/index.js > backend_log.txt 2>&1 &
NODE_PID=$!
echo "🚀 Node.js started with PID: $NODE_PID"
echo ""

# Wait a moment for startup
echo "⏳ Waiting 5 seconds for server to start..."
sleep 5

# ---- Step 5: Verify ----
echo "=== Step 5: Verification ==="

# Check if process is running
if ps -p $NODE_PID > /dev/null 2>&1; then
    echo "✅ Node.js process is RUNNING (PID: $NODE_PID)"
else
    echo "❌ Node.js process CRASHED! Check logs:"
    echo "---"
    tail -20 backend_log.txt
    echo "---"
    exit 1
fi

# Check if port 5000 is responding
if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5000/api/auth/login 2>/dev/null | grep -q "4"; then
    echo "✅ API is responding on port 5000!"
else
    echo "⏳ API may still be starting up. Check logs:"
    tail -10 backend_log.txt
fi

echo ""
echo "============================================"
echo "  ✅ SETUP COMPLETE!"
echo "============================================"
echo ""
echo "📋 Last 10 lines of log:"
tail -10 backend_log.txt
echo ""
echo "🌐 Now go to your website and try logging in!"
echo "   Default login: EXO-101 / admin123"
echo ""
echo "📝 Useful commands:"
echo "   View logs:    tail -f $APP_DIR/backend_log.txt"
echo "   Restart:      pkill -f 'node.*index.js' && nohup node $APP_DIR/backend/index.js > $APP_DIR/backend_log.txt 2>&1 &"
echo "   Check status: ps aux | grep node"
echo ""
