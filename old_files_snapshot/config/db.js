const { Pool, types } = require('pg');

types.setTypeParser(types.builtins.INT8, (value) => Number(value));
types.setTypeParser(types.builtins.NUMERIC, (value) => Number(value));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || undefined,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 5432)
});

const toPostgresSql = (sql) => {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
};

const formatResult = (result) => {
  const rows = result.rows || [];
  const metadata = {
    rowCount: result.rowCount || 0,
    affectedRows: result.rowCount || 0,
    insertId: rows[0] && Object.prototype.hasOwnProperty.call(rows[0], 'id') ? rows[0].id : undefined
  };

  return [rows, metadata];
};

const executeQuery = async (client, sql, params = []) => {
  const result = await client.query(toPostgresSql(sql), params);
  return formatResult(result);
};

const createTransactionClient = async () => {
  const client = await pool.connect();

  return {
    execute: (sql, params) => executeQuery(client, sql, params),
    query: (sql, params) => executeQuery(client, sql, params),
    beginTransaction: () => client.query('BEGIN'),
    commit: () => client.query('COMMIT'),
    rollback: () => client.query('ROLLBACK'),
    release: () => client.release()
  };
};

module.exports = {
  execute: (sql, params) => executeQuery(pool, sql, params),
  query: (sql, params) => executeQuery(pool, sql, params),
  getConnection: createTransactionClient,
  end: () => pool.end()
};
