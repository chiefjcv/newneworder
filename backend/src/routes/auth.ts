import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { dbGet, dbRun } from '../database.js';
import { authenticateToken } from '../middleware/auth.js';
import { sendPasswordResetEmail } from '../email.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Check if user exists
    const existingUser = await dbGet('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await dbRun(
      'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id',
      [email, hashedPassword, name]
    );

    // Generate token
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      { userId: result.lastID, email },
      secret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: result.lastID,
        email,
        name
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await dbGet('SELECT * FROM users WHERE email = $1', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      secret,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Forgot Password - Request reset token
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user
    const user = await dbGet('SELECT * FROM users WHERE email = $1', [email]);
    if (!user) {
      // Don't reveal if email exists (security best practice)
      return res.status(200).json({ message: 'If email exists, reset link sent' });
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

    // Store reset token
    await dbRun(
      'UPDATE users SET reset_token = $1, reset_token_expires_at = $2 WHERE id = $3',
      [resetToken, resetTokenExpires, user.id]
    );

    // Send reset email
    await sendPasswordResetEmail(email, resetToken);

    res.status(200).json({
      message: 'If email exists, reset link sent'
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset Password - Validate token and set new password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    // Find user with valid reset token
    const user = await dbGet(
      'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires_at > NOW()',
      [token]
    );

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password and clear reset token
    await dbRun(
      'UPDATE users SET password = $1, reset_token = NULL, reset_token_expires_at = NULL WHERE id = $2',
      [hashedPassword, user.id]
    );

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change Password - For authenticated users
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = (req as any).userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    // Find user
    const user = await dbGet('SELECT * FROM users WHERE id = $1', [userId]);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await dbRun(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, userId]
    );

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error: any) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

