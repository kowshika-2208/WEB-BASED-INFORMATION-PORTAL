const db = require('../config/db');

const findByEmail = async (email) => {
  const [rows] = await db.execute(
    'SELECT id, name, email, password, role FROM users WHERE email = ?',
    [email]
  );
  return rows[0] || null;
};

const countUsersByRole = async (role) => {
  const [rows] = await db.execute('SELECT COUNT(*) AS total FROM users WHERE role = ?', [role]);
  return rows[0].total;
};

module.exports = {
  findByEmail,
  countUsersByRole
};