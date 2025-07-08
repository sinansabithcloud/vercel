const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
  connectionTimeoutMillis: 2000, // How long to wait when connecting
});

// Test connection and log status
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT, closing database pool...');
  pool.end(() => {
    console.log('Database pool has ended');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, closing database pool...');
  pool.end(() => {
    console.log('Database pool has ended');
    process.exit(0);
  });
});

module.exports = pool;
