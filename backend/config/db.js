const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

let sequelize;

if (process.env.DB_HOST && process.env.DB_DATABASE) {
  // MySQL — Cloudways / cPanel hosting
  const dialect = process.env.DB_DIALECT || 'mysql';
  console.log(`🔗 Connecting to ${dialect.toUpperCase()} database at ${process.env.DB_HOST}...`);
  sequelize = new Sequelize(
    process.env.DB_DATABASE,
    process.env.DB_USERNAME || 'root',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306', 10),
      dialect: dialect,
      logging: false,
      quoteIdentifiers: true,
      pool: { max: 20, min: 2, acquire: 30000, idle: 10000 },
      dialectOptions: dialect === 'mysql' ? { connectTimeout: 10000 } : {}
    }
  );
} else if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres://')) {
  console.log('🔗 Connecting to PostgreSQL database...');
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      // ssl: { require: true, rejectUnauthorized: false }
    }
  });
} else if (process.env.DB_DIALECT === 'mysql') {
  console.log('🔗 Connecting to MySQL database...');
  sequelize = new Sequelize(
    process.env.DB_DATABASE || 'zeytnndnay',
    process.env.DB_USERNAME || 'zeytnndnay',
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: false,
      quoteIdentifiers: true
    }
  );
} else {
  console.log('🔗 Falling back to SQLite database...');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../database.sqlite'),
    logging: false,
  });
}

module.exports = sequelize;


