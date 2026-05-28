import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getTenants = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        let where = {};
        if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }, { domain: { contains: search, mode: 'insensitive' } }];
        const [totalTenants, tenants] = await Promise.all([
            prisma.tenant.count({ where }),
            prisma.tenant.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limitNum })
        ]);
        const totalPages = Math.ceil(totalTenants / limitNum);
        res.json({ tenants, pagination: { currentPage: pageNum, totalPages, totalTenants, hasNextPage: pageNum < totalPages, hasPrevPage: pageNum > 1, limit: limitNum } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateTenantStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive, lockReason } = req.body;
        const tenant = await prisma.tenant.update({ where: { id }, data: { isActive, lockReason: isActive ? '' : (lockReason || 'Không có lý do') } });
        res.json({ message: "Cập nhật trạng thái thành công", tenant });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
