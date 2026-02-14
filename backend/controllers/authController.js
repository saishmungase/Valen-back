const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { generateVerificationCode, sendVerificationEmail } = require('../config/email');
const { uploadImage } = require('../config/supabase');

exports.sendCode = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await pool.query('DELETE FROM verification_codes WHERE email = $1', [email]);

    await pool.query(
      'INSERT INTO verification_codes (email, code, expires_at) VALUES ($1, $2, $3)',
      [email, code, expiresAt]
    );

    await sendVerificationEmail(email, code);

    res.json({ success: true, message: 'Verification code sent' });
  } catch (error) {
    console.error('Send code error:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
};

exports.verifiedSignup = async (req, res) => {
  const { email, code, username, password, age, gender, description, interests } = req.body;
  const images = req.files; 

  console.log('Received signup data:', { email, username, age, gender, interests, interestsType: typeof interests });

  if (!email || !code || !username || !password || !age || !gender) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!images || images.length !== 3) {
    return res.status(400).json({ error: 'Exactly 3 images are required' });
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const codeResult = await client.query(
      'SELECT * FROM verification_codes WHERE email = $1 AND code = $2 AND expires_at > NOW()',
      [email, code]
    );

    if (codeResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    const usernameCheck = await client.query('SELECT id FROM users WHERE username = $1', [username]);
    if (usernameCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const tempUserId = `temp_${Date.now()}`;
    const imageUrls = await Promise.all([
      uploadImage(images[0], tempUserId, 1),
      uploadImage(images[1], tempUserId, 2),
      uploadImage(images[2], tempUserId, 3)
    ]);

    let interestsArray = [];
    if (interests) {
      if (typeof interests === 'string') {
        try {
          const parsed = JSON.parse(interests);
          if (Array.isArray(parsed)) {
            interestsArray = parsed;
          } else {
            interestsArray = [parsed];
          }
        } catch (e) {
          interestsArray = interests.split(',').map(i => i.trim()).filter(Boolean);
        }
      } else if (Array.isArray(interests)) {
        interestsArray = interests;
      }
    }

    console.log('Parsed interests array:', interestsArray);

    const userResult = await client.query(
      `INSERT INTO users (username, email, password, age, gender, description, interests, image1, image2, image3)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, username, email, age, gender`,
      [
        username, 
        email, 
        hashedPassword, 
        parseInt(age), 
        gender, 
        description || '', 
        interestsArray, 
        imageUrls[0], 
        imageUrls[1], 
        imageUrls[2]
      ]
    );

    await client.query('DELETE FROM verification_codes WHERE email = $1', [email]);

    await client.query('COMMIT');

    const user = userResult.rows[0];
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        age: user.age,
        gender: user.gender
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Registration failed: ' + error.message });
  } finally {
    client.release();
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await pool.query('UPDATE users SET last_online = NOW() WHERE id = $1', [user.id]);

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        age: user.age,
        gender: user.gender
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};