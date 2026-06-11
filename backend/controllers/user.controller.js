import prisma from '../utils/prisma.js';

export const getGlobalUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = 'all', sortBy = 'newest' } = req.query;
    const pageNum = parseInt(page); const limitNum = parseInt(limit); const skip = (pageNum - 1) * limitNum;
    const where = {};
    if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }];
    if (role !== 'all') where.role = role;
    const orderBy = sortBy === 'oldest' ? { createdAt: 'asc' } : sortBy === 'name_asc' ? { name: 'asc' } : sortBy === 'name_desc' ? { name: 'desc' } : { createdAt: 'desc' };
    const [users, totalUsers] = await Promise.all([
      prisma.user.findMany({ where, orderBy, skip, take: limitNum, select: { id: true, name: true, email: true, role: true, tenantId: true, isVerified: true, isActive: true, createdAt: true } }),
      prisma.user.count({ where })
    ]);
    res.json({ success: true, users, pagination: { page: pageNum, limit: limitNum, totalPages: Math.ceil(totalUsers / limitNum) }, stats: { totalUsers } });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const deleteGlobalUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ success: false, message: 'Khong tim thay nguoi dung' });
    if (user.role === 'super_admin') return res.status(403).json({ success: false, message: 'Khong the khoa Super Admin' });
    await prisma.user.update({ where: { id }, data: { isActive: false } });
    res.json({ success: true, message: 'Da vo hieu hoa tai khoan' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const restoreGlobalUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ success: false, message: 'Khong tim thay nguoi dung' });
    await prisma.user.update({ where: { id }, data: { isActive: true } });
    res.json({ success: true, message: 'Da kich hoat lai tai khoan' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
