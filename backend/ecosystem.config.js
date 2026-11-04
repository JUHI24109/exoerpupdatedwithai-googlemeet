// PM2 Ecosystem Config — EXO ERP Production Deployment
// Usage:
//   pm2 start ecosystem.config.js
//   pm2 save
//   pm2 startup   (auto-restart on server reboot)
//   pm2 logs exo-erp
//   pm2 monit     (live monitoring dashboard)

module.exports = {
  apps: [
    {
      name: 'exo-erp',
      script: 'index.js',
      cwd: __dirname,
      instances: 2,              // 2 instances for load balancing
      exec_mode: 'cluster',      // Cluster mode for multi-core
      watch: false,              // Don't watch files in production
      max_memory_restart: '500M', // Auto-restart if memory exceeds 500MB
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      // Logging
      error_file: './logs/error.log',
      out_file: './logs/output.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Auto-restart on crash
      autorestart: true,
      min_uptime: '10s',         // Consider started if up for 10s
      max_restarts: 15,          // Max restarts in a window
      restart_delay: 3000,       // Wait 3s between restarts
      // Health check
      listen_timeout: 10000,
      kill_timeout: 5000,
    }
  ]
};

