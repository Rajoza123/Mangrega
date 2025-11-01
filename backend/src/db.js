const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5432,
  database: process.env.PG_DATABASE || 'mgnrega',
  user: process.env.PG_USER || 'mgnrega',
  password: process.env.PG_PASSWORD || 'mgnrega_pass'
});

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS mgnrega_monthly (
      id SERIAL PRIMARY KEY,
      state TEXT,
      district TEXT,
      year INT,
      month INT,
      data JSONB,
      updated_at TIMESTAMP DEFAULT now(),
      UNIQUE(state, district, year, month)
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_state_district ON mgnrega_monthly(state, district);`);
}

module.exports = { pool, init };
