import prisma from '../utils/prisma.js';
import { sendVerificationEmail } from '../email/emails.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-here';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { userId: user.id, tenantId: user.tenantId, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

res.json({
  message: "Login successful",
  user: {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
    isVerified: user.isVerified
  }
});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const checkAuth = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



export const logout = async (req, res) => {
  res.clearCookie('token');
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};

export const forgotPassword = async (req, res) => {
  res.json({ success: true, message: 'Tinh nang dang phat trien' });
};

export default { login, logout, checkAuth, forgotPassword };


export const registerTenant = async (req, res) => {
  try {
    const { storeName, name, email, password } = req.body;
    if (!storeName || !name || !email || !password) {
      return res.status(400).json({ message: 'Vui long dien day du thong tin' });
    }
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ message: 'Email da ton tai' });

    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.default.hash(password, 10);

    // Tao verification token 6 so
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const tenant = await prisma.tenant.create({
      data: { name: storeName, isActive: true }
    });

    const user = await prisma.user.create({
      data: {
        name, email, password: hashedPassword,
        role: 'tenant_admin',
        tenantId: tenant.id,
        isVerified: false,
        verificationToken,
      }
    });

    // Gui mail verify
    await sendVerificationEmail(email, verificationToken);

    res.status(201).json({
      success: true,
      message: 'Dang ky thanh cong! Vui long kiem tra email de xac nhan tai khoan.',
      tenant: { id: tenant.id, name: tenant.name },
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { code } = req.body;
    const user = await prisma.user.findFirst({
      where: { verificationToken: code, isVerified: false }
    });
    if (!user) return res.status(400).json({ success: false, message: 'Ma xac thuc khong hop le' });

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verificationToken: null }
    });

    // Set JWT cookie sau khi verify
    const jwt = await import('jsonwebtoken');
    const token = jwt.default.sign(
      { userId: updated.id, tenantId: updated.tenantId, role: updated.role },
      process.env.JWT_SECRET || 'your-jwt-secret-here',
      { expiresIn: '7d' }
    );
    res.cookie('token', token, {
      httpOnly: false, secure: false, sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      message: 'Xac thuc email thanh cong!',
      user: { id: updated.id, name: updated.name, email: updated.email, role: updated.role, tenantId: updated.tenantId, isVerified: true }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
