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

  static async syncUser(userData) {
    const { id, name, email, phone, photo_url, displayName, photoURL, company, role } = userData;
    
    const result = await pool.query(
      `INSERT INTO users (id, name, email, phone, photo_url, displayName, photoURL, company, role, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       ON CONFLICT (id) 
       DO UPDATE SET 
         name = COALESCE($2, users.name),
         email = COALESCE($3, users.email),
         phone = COALESCE($4, users.phone),
         photo_url = COALESCE($5, users.photo_url),
         displayName = COALESCE($6, users.displayName),
         photoURL = COALESCE($7, users.photoURL),
         company = COALESCE($8, users.company),
         role = COALESCE($9, users.role),
         updated_at = NOW()
       RETURNING *`,
      [id, name, email, phone, photo_url, displayName, photoURL, company, role]
    );
    
    return result.rows[0];
  }
}

module.exports = User;
