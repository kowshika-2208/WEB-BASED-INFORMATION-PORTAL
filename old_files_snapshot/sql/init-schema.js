const fs = require('fs');
const path = require('path');
const db = require('../config/db');
require('dotenv').config();

async function initSchema() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  try {
    await db.query(schemaSql);
    console.log(`Schema initialized for database "${process.env.DB_NAME || 'cip_db'}".`);
  } finally {
    await db.end();
  }
}

initSchema().catch((error) => {
  console.error('Failed to initialize schema:', error);
  process.exit(1);
});
