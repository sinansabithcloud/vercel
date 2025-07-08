const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const router = express.Router();

// Input validation middleware
const validateRegistration = (req, res, next) => {
  const { username, email, password } = req.body;
  const errors = [];

  if (!username || username.length < 3) {
    errors.push('Username must be at least 3 characters long');
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Please provide a valid email address');
  }

  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
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

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email) {
    errors.push('Email is required');
  }

  if (!password) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors 
    });
  }

  next();
};

// Register route
router.post('/register', validateRegistration, async (req, res) => {
  const { username, email, password } = req.body;
  
  try {
    // Check if user already exists
    const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email.toLowerCase(), username.toLowerCase()]
    );
    
    if (userExists.rows.length > 0) {
      const existingUser = userExists.rows[0];
      if (existingUser.email === email.toLowerCase()) {
        return res.status(409).json({ error: 'Email already registered' });
      } else {
        return res.status(409).json({ error: 'Username already taken' });
      }
    }
    
    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Insert new user
    const newUser = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username.toLowerCase(), email.toLowerCase(), hashedPassword]
    );
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: newUser.rows[0].id,
        email: newUser.rows[0].email 
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: '7d',
        issuer: 'auth-app',
        audience: 'auth-app-users'
      }
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.rows[0].id,
        username: newUser.rows[0].username,
        email: newUser.rows[0].email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Registration failed',
      message: 'Internal server error' 
    });
  }
});

// Login route
router.post('/login', validateLogin, async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Check if user exists
    const user = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (user.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.rows[0].password);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.rows[0].id,
        email: user.rows[0].email 
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: '7d',
        issuer: 'auth-app',
        audience: 'auth-app-users'
      }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.rows[0].id,
        username: user.rows[0].username,
        email: user.rows[0].email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed',
      message: 'Internal server error' 
    });
  }
});

// Verify token route
router.post('/verify', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists
    const user = await pool.query(
      'SELECT id, username, email FROM users WHERE id = $1',
      [decoded.userId]
    );
    
    if (user.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    res.json({
      valid: true,
      user: user.rows[0]
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Token verification failed' });
  }
});

// Logout route (optional - mainly for client-side cleanup)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
