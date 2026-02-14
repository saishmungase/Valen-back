const { pool } = require('../config/database');

exports.getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, age, gender, description, interests, 
              image1, image2, image3, created_at, last_online
       FROM users WHERE id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

exports.getUserById = async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      `SELECT id, username, age, gender, description, interests, 
              image1, image2, image3, last_online
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};