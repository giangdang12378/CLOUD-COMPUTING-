import prisma from '../utils/prisma.js';
import bcrypt from 'bcryptjs';

export const getStaffs = async (req, res) => {
  try {
    const staffs = await prisma.user.findMany({
      where: { tenantId: req.tenantId, role: 'tenant_staff' },
      select: { id: true, name: true, email: true, role: true, isVerified: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, staffs });
  } catch (error) { res.status(500).json({ success: false, message: 'Khong the lay danh sach nhan vien' }); }
};

export const createStaff = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ success: false, message: 'Email nay da duoc su dung' });
    const hashed = await bcrypt.hash(password, 10);
    const staff = await prisma.user.create({ data: { name, email, password: hashed, role: 'tenant_staff', tenantId: req.tenantId, isVerified: true, isActive: true } });
    res.status(201).json({ success: true, message: 'Tao tai khoan nhan vien thanh cong', staff: { id: staff.id, name: staff.name, email: staff.email, role: staff.role, isVerified: staff.isVerified, isActive: staff.isActive, createdAt: staff.createdAt } });
  } catch (error) { res.status(500).json({ success: false, message: 'Khong the tao tai khoan nhan vien' }); }
};

export const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const staff = await prisma.user.findFirst({ where: { id, tenantId: req.tenantId, role: 'tenant_staff' } });
    if (!staff) return res.status(404).json({ success: false, message: 'Khong tim thay nhan vien' });
    await prisma.user.update({ where: { id }, data: { isVerified: false } });
    res.json({ success: true, message: 'Da vo hieu hoa tai khoan nhan vien' });
  } catch (error) { res.status(500).json({ success: false, message: 'Loi server' }); }
};

export const restoreStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const staff = await prisma.user.findFirst({ where: { id, tenantId: req.tenantId, role: 'tenant_staff' } });
    if (!staff) return res.status(404).json({ success: false, message: 'Khong tim thay nhan vien' });
    await prisma.user.update({ where: { id }, data: { isVerified: true } });
    res.json({ success: true, message: 'Da mo khoa tai khoan nhan vien' });
  } catch (error) { res.status(500).json({ success: false, message: 'Loi server' }); }
};
