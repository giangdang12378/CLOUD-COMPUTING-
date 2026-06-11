import prisma from '../utils/prisma.js';

export const getTenants = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const pageNum = parseInt(page); const limitNum = parseInt(limit); const skip = (pageNum - 1) * limitNum;
    const where = {};
    if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }, { domain: { contains: search, mode: 'insensitive' } }];
    const [tenants, totalTenants] = await Promise.all([
      prisma.tenant.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limitNum }),
      prisma.tenant.count({ where })
    ]);
    const totalPages = Math.ceil(totalTenants / limitNum);
    res.json({ tenants, pagination: { currentPage: pageNum, totalPages, totalTenants, hasNextPage: pageNum < totalPages, hasPrevPage: pageNum > 1, limit: limitNum } });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const updateTenantStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, lockReason } = req.body;
    const updateData = { isActive };
    if (isActive) updateData.lockReason = '';
    else updateData.lockReason = lockReason || 'Không có lý do cụ thể';
    const tenant = await prisma.tenant.update({ where: { id }, data: updateData });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    res.json({ message: 'Cap nhat thanh cong', tenant });
  } catch (error) { res.status(500).json({ message: error.message }); }
};
