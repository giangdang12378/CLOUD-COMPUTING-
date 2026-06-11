import prisma from '../utils/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import {
  sendVerificationEmail,
  sendResetPasswordEmail
} from '../mailtrap/emails.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-here';
const TOKEN_EXPIRY = '7d';

const signToken = (payload, opts = {}) =>
  jwt.sign(payload, JWT_SECRET, {
    expiresIn: opts.expiresIn || TOKEN_EXPIRY
  });

export const register = async (req, res) => {
  try {
    const { tenantName, name, email, password } = req.body;

    if (!tenantName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'tenantName, email and password are required'
      });
    }

    const existing = await prisma.user.findFirst({
      where: { email }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    const tenant = await prisma.tenant.create({
      data: {
        id: `tenant-${Date.now()}`,
        name: tenantName,
        updatedAt: new Date()
      }
    });

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        id: `user-${Date.now()}`,
        tenantId: tenant.id,
        name: name || 'Admin',
        email,
        password: hashed,
        role: 'tenant_admin',
        updatedAt: new Date()
      }
    });

    try {
      const verifyToken = signToken(
        {
          userId: user.id,
          tenantId: tenant.id,
          action: 'verifyEmail'
        },
        {
          expiresIn: '3d'
        }
      );

      await sendVerificationEmail(user.email, verifyToken);
    } catch (e) {
      console.warn('Email send failed:', e?.message || e);
    }

    const token = signToken({
      userId: user.id,
      tenantId: tenant.id,
      email: user.email,
      role: user.role
    });

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax'
    });

    return res.status(201).json({
      success: true,
      message: 'Registered successfully',
      data: {
        tenant,
        user: {
          id: user.id,
          email: user.email,
          tenantId: user.tenantId,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    console.error('Register error', error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, tenantId } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'email and password required'
      });
    }

    const user = await prisma.user.findFirst({
      where: tenantId
        ? {
            email,
            tenantId
          }
        : {
            email
          },
      include: {
        Tenant: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const ok = await bcrypt.compare(password, user.password);

    if (!ok) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        lastLogin: new Date()
      }
    });

    const token = signToken({
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role
    });

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax'
    });

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId
        },
        tenant: user.Tenant,
        token
      }
    });
  } catch (error) {
    console.error('Login error', error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const logout = async (req, res) => {
  res.clearCookie('token');

  return res.json({
    success: true,
    message: 'Logged out'
  });
};

export const checkAuth = async (req, res) => {
  try {
    const token =
      req.cookies?.token ||
      req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId
      },
      include: {
        Tenant: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body || req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token required'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (
      !decoded ||
      decoded.action !== 'verifyEmail'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token'
      });
    }

    await prisma.user.update({
      where: {
        id: decoded.userId
      },
      data: {
        isVerified: true
      }
    });

    return res.json({
      success: true,
      message: 'Email verified'
    });
  } catch (error) {
    console.error('Verify email error', error);

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email, tenantId } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email required'
      });
    }

    const user = await prisma.user.findFirst({
      where: tenantId
        ? {
            email,
            tenantId
          }
        : {
            email
          }
    });

    if (!user) {
      return res.json({
        success: true,
        message:
          'If that email exists, a reset link was sent'
      });
    }

    const resetToken = jwt.sign(
      {
        userId: user.id,
        tenantId: user.tenantId,
        action: 'resetPassword'
      },
      JWT_SECRET,
      {
        expiresIn: '1h'
      }
    );

    const resetExpires = new Date(
      Date.now() + 3600 * 1000
    );

    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires
      }
    });

    try {
      await sendResetPasswordEmail(
        user.email,
        `http://localhost:5173/reset-password/${resetToken}`
      );
    } catch (e) {
      console.warn(
        'Reset email failed:',
        e?.message || e
      );
    }

    return res.json({
      success: true,
      message:
        'If that email exists, a reset link was sent'
    });
  } catch (error) {
    console.error('Forgot password error', error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'token and newPassword required'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (
      !decoded ||
      decoded.action !== 'resetPassword'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token'
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (user.resetPasswordToken !== token) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (
      user.resetPasswordExpires &&
      new Date(user.resetPasswordExpires) <
        new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Token expired'
      });
    }

    const hashed = await bcrypt.hash(
      newPassword,
      10
    );

    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        password: hashed,
        resetPasswordToken: null,
        resetPasswordExpires: null
      }
    });

    return res.json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Reset password error', error);

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const registerTenant = async (req, res) => {
  try {
    const { storeName, ownerName, email, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ success: false, message: 'Email already exists' });

    const tenant = await prisma.tenant.create({
      data: { name: storeName || ownerName, isActive: true }
    });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name: ownerName, email, password: hashed, tenantId: tenant.id, role: 'tenant_admin', isVerified: true }
    });

    const token = signToken({ userId: user.id, tenantId: tenant.id, email: user.email, role: user.role });
    res.cookie('token', token, { httpOnly: false, secure: false, sameSite: 'lax', maxAge: 7*24*60*60*1000 });

    return res.status(201).json({
      success: true,
      message: 'Tenant registered successfully',
      tenantId: tenant.id,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const signup = async (req, res) => {
  try {
    const { name, email, password, tenantId } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ success: false, message: 'Email already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, tenantId: tenantId || 'default', role: 'staff', isVerified: true }
    });

    return res.status(201).json({ success: true, message: 'User created', user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};