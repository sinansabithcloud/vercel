const express = require('express');
const pool = require('../config/database');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

// Input validation middleware
const validateProfileUpdate = (req, res, next) => {
  const { username, email } = req.body;
  const errors = [];

  if (!username || username.length < 3) {
    errors.push('Username must be at least 3 characters long');
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Please provide a valid email address');
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, and underscores');
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors 
    });
  }

  next();
};

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await pool.query(
      'SELECT id, username, email, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );
    
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      success: true,
      user: user.rows[0]
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch profile',
      message: 'Internal server error' 
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, validateProfileUpdate, async (req, res) => {
  const { username, email } = req.body;
  
  try {
    // Check if username or email already exists for other users
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE (username = $1 OR email = $2) AND id != $3',
      [username.toLowerCase(), email.toLowerCase(), req.user.userId]
    );
    
    if (existingUser.rows.length > 0) {
      const existing = existingUser.rows[0];
      if (existing.email === email.toLowerCase()) {
        return res.status(409).json({ error: 'Email already in use by another account' });
      } else {
        return res.status(409).json({ error: 'Username already taken' });
      }
    }
    
    const updatedUser = await pool.query(
      'UPDATE users SET username = $1, email = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, username, email, updated_at',
      [username.toLowerCase(), email.toLowerCase(), req.user.userId]
    );
    
    if (updatedUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser.rows[0]
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ 
      error: 'Failed to update profile',
      message: 'Internal server error' 
    });
  }
});

// Get user statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const [userCountResult, userInfoResult] = await Promise.all([
      pool.query('SELECT COUNT(*) as total_users FROM users'),
      pool.query('SELECT created_at FROM users WHERE id = $1', [req.user.userId])
    ]);
    
    if (userInfoResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      success: true,
      stats: {
        totalUsers: parseInt(userCountResult.rows[0].total_users),
        memberSince: userInfoResult.rows[0].created_at,
        currentUserId: req.user.userId
      }
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch statistics',
      message: 'Internal server error' 
    });
  }
});

// Change password endpoint
router.put('/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ 
      error: 'Current password and new password are required' 
    });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({ 
      error: 'New password must be at least 6 characters long' 
    });
  }
  
  try {
    // Get current user's password
    const user = await pool.query(
      'SELECT password FROM users WHERE id = $1',
      [req.user.userId]
    );
    
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify current password
    const bcrypt = require('bcryptjs');
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.rows[0].password);
    
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update password
    await pool.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedNewPassword, req.user.userId]
    );
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ 
      error: 'Failed to change password',
      message: 'Internal server error' 
    });
  }
});

// Delete account endpoint
router.delete('/account', authenticateToken, async (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ 
      error: 'Password confirmation is required to delete account' 
    });
  }
  
  try {
    // Get user's password for verification
    const user = await pool.query(
      'SELECT password FROM users WHERE id = $1',
      [req.user.userId]
    );
    
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify password
    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(password, user.rows[0].password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Password is incorrect' });
    }
    
    // Delete user account
    await pool.query('DELETE FROM users WHERE id = $1', [req.user.userId]);
    
    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ 
      error: 'Failed to delete account',
      message: 'Internal server error' 
    });
  }
});

module.exports = router;
