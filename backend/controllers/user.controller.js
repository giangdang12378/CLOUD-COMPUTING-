import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getGlobalUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', role = 'all', status = 'all', sortBy = 'newest' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        let where = {};
        if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }];
        if (role !== 'all') where.role = role;
        if (status === 'active') where.isVerified = true;
        else if (status === 'inactive') where.isVerified = false;
        let orderBy = { createdAt: 'desc' };
        if (sortBy === 'oldest') orderBy = { createdAt: 'asc' };
        else if (sortBy === 'name_asc') orderBy = { name: 'asc' };
        else if (sortBy === 'name_desc') orderBy = { name: 'desc' };
        const [totalUsers, activeUsers, users] = await Promise.all([
            prisma.user.count({ where }),
            prisma.user.count({ where: { ...where, isVerified: true } }),
            prisma.user.findMany({ where, orderBy, skip, take: limitNum, omit: { password: true } })
        ]);
        res.json({ success: true, users, pagination: { page: pageNum, limit: limitNum, totalPages: Math.ceil(totalUsers / limitNum) }, stats: { totalUsers, activeUsers, inactiveUsers: totalUsers - activeUsers } });
    } catch (error) {
        console.error('Error getting global users:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteGlobalUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        if (user.role === 'super_admin') return res.status(403).json({ success: false, message: 'Không thể khóa Super Admin' });
        await prisma.user.update({ where: { id }, data: { isVerified: false } });
        res.json({ success: true, message: "Đã vô hiệu hóa tài khoản" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const restoreGlobalUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        await prisma.user.update({ where: { id }, data: { isVerified: true } });
        res.json({ success: true, message: "Đã kích hoạt lại tài khoản" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
