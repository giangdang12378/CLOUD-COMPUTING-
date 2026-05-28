import prisma from '../utils/prisma.js';

const fmt = (d) => ({ ...d, _id: d.id, discountValue: parseFloat(d.discountValue), minOrderValue: parseFloat(d.minOrderValue) });

export const getDiscounts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', isActive = '', discountType = '' } = req.query;
    const pageNum = parseInt(page); const limitNum = parseInt(limit); const skip = (pageNum - 1) * limitNum;
    const where = { tenantId: req.tenantId };
    if (search) where.OR = [{ code: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }];
    if (isActive === 'true') where.isActive = true; else if (isActive === 'false') where.isActive = false;
    if (discountType) where.discountType = discountType;
    const [discounts, totalDiscounts] = await Promise.all([prisma.discount.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limitNum }), prisma.discount.count({ where })]);
    res.json({ discounts: discounts.map(fmt), pagination: { currentPage: pageNum, totalPages: Math.ceil(totalDiscounts / limitNum), totalDiscounts, hasNextPage: pageNum < Math.ceil(totalDiscounts / limitNum), hasPrevPage: pageNum > 1, limit: limitNum } });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const createDiscount = async (req, res) => {
  try {
    const { code, description, discountType, discountValue, minOrderValue = 0, startDate, endDate = null, usageLimit = null, isActive = true } = req.body;
    if (!code || !discountType || discountValue === undefined) return res.status(400).json({ message: 'Vui long dien day du thong tin.' });
    const normalizedCode = code.trim().toUpperCase();
    const existing = await prisma.discount.findFirst({ where: { tenantId: req.tenantId, code: normalizedCode } });
    if (existing) return res.status(400).json({ message: 'Ma khuyen mai da ton tai.' });
    const discount = await prisma.discount.create({ data: { tenantId: req.tenantId, code: normalizedCode, description, discountType, discountValue: Number(discountValue), minOrderValue: Number(minOrderValue), startDate: startDate ? new Date(startDate) : new Date(), endDate: endDate ? new Date(endDate) : null, usageLimit: usageLimit ? Number(usageLimit) : null, isActive } });
    res.status(201).json(fmt(discount));
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const updateDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const discount = await prisma.discount.findFirst({ where: { id, tenantId: req.tenantId } });
    if (!discount) return res.status(404).json({ message: 'Khong tim thay.' });
    const data = {};
    if (req.body.description !== undefined) data.description = req.body.description;
    if (req.body.discountType !== undefined) data.discountType = req.body.discountType;
    if (req.body.isActive !== undefined) data.isActive = req.body.isActive;
    if (req.body.discountValue !== undefined) data.discountValue = Number(req.body.discountValue);
    if (req.body.minOrderValue !== undefined) data.minOrderValue = Number(req.body.minOrderValue);
    if (req.body.startDate !== undefined) data.startDate = new Date(req.body.startDate);
    if (req.body.endDate !== undefined) data.endDate = req.body.endDate ? new Date(req.body.endDate) : null;
    if (req.body.usageLimit !== undefined) data.usageLimit = req.body.usageLimit ? Number(req.body.usageLimit) : null;
    if (req.body.code) { const nc = req.body.code.trim().toUpperCase(); if (nc !== discount.code) { const dup = await prisma.discount.findFirst({ where: { tenantId: req.tenantId, code: nc, NOT: { id } } }); if (dup) return res.status(400).json({ message: 'Ma bi trung.' }); data.code = nc; } }
    const updated = await prisma.discount.update({ where: { id }, data });
    res.json(fmt(updated));
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const deleteDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const discount = await prisma.discount.findFirst({ where: { id, tenantId: req.tenantId } });
    if (!discount) return res.status(404).json({ message: 'Khong tim thay.' });
    await prisma.discount.delete({ where: { id } });
    res.json({ message: 'Da xoa.' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const checkDiscount = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    if (!code) return res.status(400).json({ isValid: false, message: 'Vui long cung cap ma.' });
    if (!orderAmount || orderAmount <= 0) return res.status(400).json({ isValid: false, message: 'Gia tri khong hop le.' });
    const discount = await prisma.discount.findFirst({ where: { tenantId: req.tenantId, code: code.trim().toUpperCase() } });
    if (!discount) return res.status(404).json({ isValid: false, message: 'Ma khong ton tai.' });
    if (!discount.isActive) return res.status(400).json({ isValid: false, message: 'Ma da ngung hoat dong.' });
    const now = new Date();
    if (discount.startDate && new Date(discount.startDate) > now) return res.status(400).json({ isValid: false, message: 'Ma chua den thoi gian.' });
    if (discount.endDate && new Date(discount.endDate) < now) return res.status(400).json({ isValid: false, message: 'Ma da het han.' });
    if (discount.minOrderValue && orderAmount < Number(discount.minOrderValue)) return res.status(400).json({ isValid: false, message: 'Don hang chua dat gia tri toi thieu.' });
    let discountAmount = discount.discountType === 'percentage' ? (orderAmount * Number(discount.discountValue)) / 100 : Number(discount.discountValue);
    if (discountAmount > orderAmount) discountAmount = orderAmount;
    res.json({ isValid: true, discountAmount, discount: fmt(discount) });
  } catch (error) { res.status(500).json({ isValid: false, message: error.message }); }
};
