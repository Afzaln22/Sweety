import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { generateToken } from '../middleware/authMiddleware.js';

export async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1;', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists.'
      });
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at;`,
      [name.trim(), normalizedEmail, passwordHash]
    );

    const newUser = result.rows[0];
    const token = generateToken({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email
        },
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while creating your account.'
    });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find user by email
    const result = await pool.query(
      `SELECT id, name, email, password_hash FROM users WHERE email = $1;`,
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    const user = result.rows[0];

    // Verify bcrypt password hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    const token = generateToken({
      id: user.id,
      name: user.name,
      email: user.email
    });

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while logging in.'
    });
  }
}

export async function getCurrentUser(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, name, email, created_at FROM users WHERE id = $1;`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found.'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: result.rows[0]
      }
    });
  } catch (error) {
    console.error('getCurrentUser error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch current user profile.'
    });
  }
}

