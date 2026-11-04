// backend/sync.js
// Simple helper to sync Sequelize models (create/alter tables)
require('dotenv').config({ path: __dirname + '/../.env' });
const { sequelize } = require('./models/sql');

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('✅ Sequelize models synced with MySQL');
    process.exit(0);
  } catch (err) {
    console.error('❌ Sync error:', err);
    process.exit(1);
  }
})();
