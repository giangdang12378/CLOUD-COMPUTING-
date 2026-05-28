import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', sortBy = 'newest' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    let where = { tenantId: req.tenantId };
    if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }];
    if (status === 'active') where.isVerified = true;
    else if (status === 'inactive') where.isVerified = false;
    let orderBy = { createdAt: 'desc' };
    if (sortBy === 'oldest') orderBy = { createdAt: 'asc' };
    else if (sortBy === 'name_asc') orderBy = { name: 'asc' };
    else if (sortBy === 'name_desc') orderBy = { name: 'desc' };
    const [totalCustomers, activeCustomers, customers] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.count({ where: { ...where, isVerified: true } }),
      prisma.user.findMany({ where, orderBy, skip, take: limitNum, omit: { password: true } })
    ]);
    res.json({ success: true, customers, pagination: { page: pageNum, limit: limitNum, totalPages: Math.ceil(totalCustomers / limitNum) }, stats: { totalCustomers, activeCustomers, inactiveCustomers: totalCustomers - activeCustomers } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await prisma.user.findUnique({ where: { id }, omit: { password: true } });
    if (!customer || customer.tenantId !== req.tenantId) return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng' });
    const orders = await prisma.order.findMany({ where: { tenantId: req.tenantId }, orderBy: { createdAt: 'desc' }, take: 10 });
    res.json({ success: true, customer: { ...customer, orderHistory: orders } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, isVerified } = req.body;
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing || existing.tenantId !== req.tenantId) return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng' });
    const updated = await prisma.user.update({ where: { id }, data: { ...(name && { name }), ...(email && { email }), ...(isVerified !== undefined && { isVerified }) }, omit: { password: true } });
    res.json({ success: true, message: 'Cập nhật thành công', customer: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await prisma.user.findUnique({ where: { id } });
    if (!customer || customer.tenantId !== req.tenantId) return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng' });
    await prisma.user.update({ where: { id }, data: { isVerified: false } });
    res.json({ success: true, message: "Đã vô hiệu hóa tài khoản" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const restoreCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await prisma.user.findUnique({ where: { id } });
    if (!customer) return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng' });
    await prisma.user.update({ where: { id }, data: { isVerified: true } });
    res.json({ success: true, message: "Đã khôi phục tài khoản" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCustomerStats = async (req, res) => {
  try {
    const where = { tenantId: req.tenantId };
    const [total, active] = await Promise.all([prisma.user.count({ where }), prisma.user.count({ where: { ...where, isVerified: true } })]);
    res.json({ success: true, stats: { overview: { total, active, inactive: total - active } } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
