<?php
echo "<h2>EXO-ERP Node.js Backend Starter (v4 - MySQL Ready)</h2>";
echo "<pre>";

$dir = __DIR__;

// Check if .env exists in backend
$envFile = $dir . '/backend/.env';
$envExample = $dir . '/backend/.env.example';

if (!file_exists($envFile)) {
    echo "<span style='color:red; font-size:16px;'><b>⚠️ WARNING: No .env file found in backend/</b></span>\n";
    echo "You MUST create backend/.env with your Cloudways database credentials.\n\n";
    echo "<b>Quick Setup:</b>\n";
    echo "1. Go to Cloudways → Application Settings → Access Details\n";
    echo "2. Copy: DB Name, DB Username, DB Password\n";
    echo "3. Create backend/.env with these values:\n\n";
    echo "   PORT=5000\n";
    echo "   JWT_SECRET=exo-erp-secret-key-change-this\n";
    echo "   DB_HOST=localhost\n";
    echo "   DB_PORT=3306\n";
    echo "   DB_DATABASE=your_db_name\n";
    echo "   DB_USERNAME=your_db_user\n";
    echo "   DB_PASSWORD=your_db_pass\n";
    echo "   DB_DIALECT=mysql\n\n";
    echo "Or copy from .env.example:\n";
    echo "   cp backend/.env.example backend/.env\n";
    echo "   Then edit backend/.env with your actual values.\n\n";
    echo "</pre>";
    exit;
}

$script = <<<EOT
#!/bin/bash
cd "{$dir}"
echo "=== EXO-ERP Backend Start ===" > "{$dir}/backend_log.txt"
echo "Starting at \$(date)" >> "{$dir}/backend_log.txt"

# Auto-install portable Node.js if missing
if ! command -v node > /dev/null 2>&1; then
    if [ ! -d "node-v18" ]; then
        echo "Node not found globally. Downloading Portable Node.js..." >> "{$dir}/backend_log.txt"
        curl -sO https://nodejs.org/dist/v18.19.1/node-v18.19.1-linux-x64.tar.gz
        tar -xzf node-v18.19.1-linux-x64.tar.gz
        mv node-v18.19.1-linux-x64 node-v18
        rm node-v18.19.1-linux-x64.tar.gz
    fi
    export PATH="{$dir}/node-v18/bin:\$PATH"
fi

echo "Using Node version: \$(node -v)" >> "{$dir}/backend_log.txt"
echo "Using NPM version: \$(npm -v)" >> "{$dir}/backend_log.txt"

# Install dependencies in backend folder
cd "{$dir}/backend"
echo "Installing backend dependencies..." >> "{$dir}/backend_log.txt"
npm install --no-audit --no-fund --legacy-peer-deps >> "{$dir}/backend_log.txt" 2>&1
echo "Installation finished." >> "{$dir}/backend_log.txt"

# Kill any existing Node process
pkill -f 'node.*backend/index.js' 2>/dev/null
pkill -f 'node.*index.js' 2>/dev/null
sleep 1

# Start Node.js backend
cd "{$dir}"
echo "Starting Node.js server..." >> "{$dir}/backend_log.txt"
nohup node "{$dir}/backend/index.js" >> "{$dir}/backend_log.txt" 2>&1 &
echo "Node.js PID: \$!" >> "{$dir}/backend_log.txt"
echo "Node.js started at \$(date)" >> "{$dir}/backend_log.txt"
EOT;

echo "<span style='color:green; font-size:18px;'><b>✅ .env found! Starting backend...</b></span>\n\n";
echo "The server is now:\n";
echo "  1. Installing npm packages (including mysql2)\n";
echo "  2. Starting Node.js backend on port 5000\n\n";
echo "<b>You do NOT need to wait on this page!</b>\n\n";
echo "<b>Next Steps:</b>\n";
echo "1. Wait <b>2-3 minutes</b> for installation to complete.\n";
echo "2. Go to your login page and try logging in.\n";
echo "3. If it still fails, check <a href='backend_log.txt'>backend_log.txt</a> for errors.\n\n";

// Check .env content (show DB config status without revealing passwords)
$envContent = file_get_contents($envFile);
$hasDbHost = strpos($envContent, 'DB_HOST') !== false;
$hasDbName = strpos($envContent, 'DB_DATABASE') !== false;
echo "<b>Config Status:</b>\n";
echo "  DB_HOST configured: " . ($hasDbHost ? "✅" : "❌ MISSING") . "\n";
echo "  DB_DATABASE configured: " . ($hasDbName ? "✅" : "❌ MISSING") . "\n\n";

echo "<a href='frontend/index.html' style='padding:10px 20px; background:#3b82f6; color:white; text-decoration:none; border-radius:5px; font-weight:bold;'>Go to Login Page</a>";
echo "  ";
echo "<a href='backend_log.txt' style='padding:10px 20px; background:#6b7280; color:white; text-decoration:none; border-radius:5px;'>View Logs</a>";
echo "</pre>";

// Flush all output to the browser and close the connection
if (function_exists('fastcgi_finish_request')) {
    fastcgi_finish_request();
} else {
    ob_end_flush();
    flush();
}

// Now safely run the background task
$script = str_replace("\r", "", $script);
file_put_contents($dir . '/startup.sh', $script);
chmod($dir . '/startup.sh', 0755);
exec("bash " . escapeshellarg($dir . '/startup.sh') . " > /dev/null 2>&1 &");

?>
