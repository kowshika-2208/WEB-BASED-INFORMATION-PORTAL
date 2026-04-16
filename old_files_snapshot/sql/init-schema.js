const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function initSchema() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 3306,
    multipleStatements: true
  });

  try {
    await connection.query(schemaSql);
    console.log(`Schema initialized for database "${process.env.DB_NAME || 'cip_db'}".`);
  } finally {
    await connection.end();
  }
}

initSchema().catch((error) => {
  console.error('Failed to initialize schema:', error);
  process.exit(1);
});
