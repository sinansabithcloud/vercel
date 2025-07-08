const jwt = require('jsonwebtoken');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      error: 'Access denied',
      message: 'No token provided' 
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'auth-app',
      audience: 'auth-app-users'
    });
    
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Please log in again' 
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        error: 'Invalid token',
        message: 'Authentication failed' 
      });
    }
    
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      error: 'Authentication failed',
      message: 'Internal server error' 
    });
  }
};

module.exports = authenticateToken;
