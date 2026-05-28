import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';

const tenantMiddleware = async (req, res, next) => {
  // Bỏ qua auth routes
  const publicPaths = ['/api/auth/login', '/api/auth/logout', '/api/auth/register-tenant', '/api/auth/verify-email', '/api/auth/forgot-password', '/api/auth/reset-password'];
  if (publicPaths.some(path => req.path === path || req.originalUrl.startsWith(path))) {
    return next();
  }
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      req.tenantId = decoded.tenantId || decoded.tenant_id;
      if (!req.tenantId && decoded.userId) {
        const user = await prisma.user.findUnique({ where: { id: decoded.userId }, select: { tenantId: true } });
        if (user && user.tenantId) req.tenantId = user.tenantId;
      }
    }
    if (!req.tenantId && req.headers['x-tenant-id']) {
      req.tenantId = req.headers['x-tenant-id'];
    }
    console.log('tenantId resolved:', req.tenantId);
    if (!req.tenantId) {
      return res.status(401).json({ success: false, message: 'Tenant ID is required' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

export default tenantMiddleware;
