import prisma from '../utils/prisma.js';
import bcrypt from 'bcryptjs';

export const getStaffs = async (req, res) => {
  try {
    const staffs = await prisma.user.findMany({ where: { tenantId: req.tenantId, role: 'tenant_staff' }, select: { id: true, name: true, email: true, role: true, isVerified: true, createdAt: true }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, staffs: staffs.map(s => ({...s, _id: s.id})) });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const createStaff = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ success: false, message: 'Email da duoc su dung' });
    const hashed = await bcrypt.hash(password, 10);
    const staff = await prisma.user.create({ data: { name, email, password: hashed, role: 'tenant_staff', tenantId: req.tenantId, isVerified: true } });
    res.status(201).json({ success: true, message: 'Tao thanh cong', staff: { id: staff.id, name: staff.name, email: staff.email, role: staff.role, isVerified: staff.isVerified, createdAt: staff.createdAt } });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const deleteStaff = async (req, res) => {
  try {
    const staff = await prisma.user.findFirst({ where: { id: req.params.id, tenantId: req.tenantId, role: 'tenant_staff' } });
    if (!staff) return res.status(404).json({ success: false, message: 'Khong tim thay nhan vien' });
    await prisma.user.update({ where: { id: req.params.id }, data: { isVerified: false } });
    res.json({ success: true, message: 'Da vo hieu hoa' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const restoreStaff = async (req, res) => {
  try {
    const staff = await prisma.user.findFirst({ where: { id: req.params.id, tenantId: req.tenantId, role: 'tenant_staff' } });
    if (!staff) return res.status(404).json({ success: false, message: 'Khong tim thay nhan vien' });
    await prisma.user.update({ where: { id: req.params.id }, data: { isVerified: true } });
    res.json({ success: true, message: 'Da mo khoa' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
