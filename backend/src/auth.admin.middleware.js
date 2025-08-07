const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
 
function requireAdmin(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  
  console.log('🔐 Admin middleware - checking authorization');
  console.log('🔍 Auth header present:', authHeader ? 'Yes' : 'No');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ Missing or invalid Authorization header');
    return res.status(401).json({ 
      message: 'Missing or invalid Authorization header',
      details: 'Please provide a valid Bearer token'
    });
  }
  
  const token = authHeader.replace('Bearer ', '');
  console.log('🎫 Token extracted, length:', token.length);
  
  try {
    const payload = jwt.verify(token, JWT_SECRET); 
    console.log('✅ JWT verified successfully for user:', payload.email);
    console.log('🔍 User permissions:', {
      is_superuser: payload.is_superuser,
      is_staff: payload.is_staff
    });
    
    if (payload.is_superuser || payload.is_staff) {
      req.user = payload;
      console.log('✅ Admin access granted');
      return next();
    }
    
    console.log('❌ Permission denied: user is not admin/staff');
    return res.status(403).json({ 
      message: 'Permission denied: not admin/staff',
      details: 'This endpoint requires administrator or staff privileges'
    });
  } catch (err) {
    console.log('❌ JWT verification failed:', err.message);
    
    let errorMessage = 'Invalid token';
    if (err.name === 'TokenExpiredError') {
      errorMessage = 'Token has expired';
    } else if (err.name === 'JsonWebTokenError') {
      errorMessage = 'Invalid token format';
    } else if (err.name === 'NotBeforeError') {
      errorMessage = 'Token not active yet';
    }
    
    return res.status(401).json({ 
      message: errorMessage, 
      error: err.message,
      details: 'Please login again to get a new token'
    });
  }
}

module.exports = { requireAdmin };