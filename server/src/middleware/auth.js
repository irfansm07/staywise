const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

async function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token missing or invalid' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'society_management_super_secret_key_12345');
    
    // Fast path: attached JWT payload contains verified user claims (0ms DB delay!)
    if (payload && payload.id && payload.role && payload.email) {
      req.user = {
        id: payload.id,
        email: payload.email,
        name: payload.name || 'User',
        role: payload.role,
        societyName: payload.societyName || null,
        apartmentName: payload.apartmentName || null,
        flatNumber: payload.flatNumber || null,
        phoneNumber: payload.phoneNumber || null,
        occupancyType: payload.occupancyType || 'OWNER',
        isVerified: payload.isVerified !== undefined ? payload.isVerified : true,
      };
      return next();
    }

    // Fallback path: Legacy tokens lacking complete claims
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        societyName: true,
        apartmentName: true,
        flatNumber: true,
        phoneNumber: true,
        occupancyType: true,
        isVerified: true,
      },
    });
    
    if (!user) {
      return res.status(401).json({ error: 'User session not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ error: `Forbidden: requires ${role} role` });
    }
    next();
  };
}

module.exports = {
  authenticateJWT,
  requireRole,
};
