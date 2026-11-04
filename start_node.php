<?php
echo "<h2>EXO-ERP Node.js Server Starter (Background Mode)</h2>";
echo "<pre>";

$dir = __DIR__;

// Check if .env exists in backend
$envFile = $dir . '/backend/.env';

if (!file_exists($envFile)) {
    echo "<span style='color:red; font-size:16px;'><b>⚠️ WARNING: No .env file found in backend/</b></span>\n";
    echo "You MUST create backend/.env with your Cloudways database credentials.\n\n";
    echo "<b>Quick Setup:</b>\n";
    echo "1. Go to Cloudways → Application Settings → Access Details\n";
    echo "2. Copy: DB Name, DB Username, DB Password\n";
    echo "3. Create backend/.env with:\n\n";
    echo "   PORT=5000\n";
    echo "   JWT_SECRET=exo-erp-secret-key-change-this\n";
    echo "   DB_HOST=localhost\n";
    echo "   DB_PORT=3306\n";
    echo "   DB_DATABASE=your_db_name\n";
    echo "   DB_USERNAME=your_db_user\n";
    echo "   DB_PASSWORD=your_db_pass\n";
    echo "   DB_DIALECT=mysql\n\n";
    echo "</pre>";
    exit;
}

$script = <<<EOT
#!/bin/bash
cd "{$dir}"
echo "Starting installation at \$(date)" > "{$dir}/backend_log.txt"

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

# Install in backend directory
cd "{$dir}/backend"
npm install --no-audit --no-fund --legacy-peer-deps >> "{$dir}/backend_log.txt" 2>&1
echo "Installation finished. Starting Node.js..." >> "{$dir}/backend_log.txt"

pkill -f 'node.*backend/index.js' 2>/dev/null
pkill -f 'node.*index.js' 2>/dev/null
sleep 1

cd "{$dir}"
nohup node "{$dir}/backend/index.js" >> "{$dir}/backend_log.txt" 2>&1 &
echo "Node.js PID: \$! started at \$(date)" >> "{$dir}/backend_log.txt"
EOT;

echo "<span style='color:green; font-size:18px;'><b>✅ Command sent to server!</b></span>\n\n";
echo "The server is now installing packages and starting Node.js in the background.\n";
echo "<b>You do NOT need to wait on this page!</b>\n\n";
echo "<b>Next Steps:</b>\n";
echo "1. Wait exactly <b>2 minutes</b>.\n";
echo "2. Go to your login page and try logging in.\n";
echo "3. If it still says Connection Error, check <a href='backend_log.txt'>backend_log.txt</a>.\n";
echo "\n<a href='frontend/index.html' style='padding:10px; background:#3b82f6; color:white; text-decoration:none; border-radius:5px;'>Go to Login Page</a>";
echo "</pre>";

// Flush all output to the browser and close the connection
if (function_exists('fastcgi_finish_request')) {
    fastcgi_finish_request();
} else {
    // Fallback for non-FPM servers
    ob_end_flush();
    flush();
}

// Now safely run the background task without holding the user's browser
$script = str_replace("\r", "", $script);
file_put_contents($dir . '/startup.sh', $script);
chmod($dir . '/startup.sh', 0755);
exec("bash " . escapeshellarg($dir . '/startup.sh') . " > /dev/null 2>&1 &");

?>
