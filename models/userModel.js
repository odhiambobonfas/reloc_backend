const pool = global.db || require('../db/db');

class User {
  static async getUserById(id) {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async getAllUsers() {
    const result = await pool.query('SELECT id, name FROM users');
    return result.rows;
  }
}

module.exports = User;
