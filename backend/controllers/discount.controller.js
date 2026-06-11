import prisma from '../utils/prisma.js';

export const getDiscounts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', isActive = '', discountType = '' } = req.query;
    const pageNum = parseInt(page); const limitNum = parseInt(limit); const skip = (pageNum - 1) * limitNum;
    const where = { tenantId: req.tenantId };
    if (search) where.OR = [{ code: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }];
    if (isActive === 'true') where.isActive = true;
    else if (isActive === 'false') where.isActive = false;
    if (discountType) where.discountType = discountType;
    const [discounts, totalDiscounts] = await Promise.all([
      prisma.discount.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limitNum }),
      prisma.discount.count({ where })
    ]);
    const totalPages = Math.ceil(totalDiscounts / limitNum);
    res.json({ discounts, pagination: { currentPage: pageNum, totalPages, totalDiscounts, hasNextPage: pageNum < totalPages, hasPrevPage: pageNum > 1, limit: limitNum } });
  } catch (error) { res.status(500).json({ message: 'Loi he thong' }); }
};

export const createDiscount = async (req, res) => {
  try {
    const { code, description, discountType, discountValue, minOrderValue = 0, startDate, endDate = null, usageLimit = null, isActive = true } = req.body;
    if (!code || !discountType || discountValue === undefined) return res.status(400).json({ message: 'Vui long dien day du thong tin.' });
    const normalizedCode = code.trim().toUpperCase();
    const existing = await prisma.discount.findFirst({ where: { tenantId: req.tenantId, code: normalizedCode } });
    if (existing) return res.status(400).json({ message: 'Ma khuyen mai da ton tai.' });
    const discount = await prisma.discount.create({ data: { tenantId: req.tenantId, code: normalizedCode, description, discountType, discountValue: Number(discountValue), minOrderValue: Number(minOrderValue), startDate: startDate ? new Date(startDate) : new Date(), endDate: endDate ? new Date(endDate) : null, usageLimit: usageLimit ? Number(usageLimit) : null, isActive } });
    res.status(201).json(discount);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const updateDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const discount = await prisma.discount.findFirst({ where: { id, tenantId: req.tenantId } });
    if (!discount) return res.status(404).json({ message: 'Khong tim thay ma khuyen mai.' });
    const data = {};
    const fields = ['description', 'discountType', 'isActive'];
    fields.forEach(f => { if (req.body[f] !== undefined) data[f] = req.body[f]; });
    if (req.body.discountValue !== undefined) data.discountValue = Number(req.body.discountValue);
    if (req.body.minOrderValue !== undefined) data.minOrderValue = Number(req.body.minOrderValue);
    if (req.body.startDate !== undefined) data.startDate = new Date(req.body.startDate);
    if (req.body.endDate !== undefined) data.endDate = req.body.endDate ? new Date(req.body.endDate) : null;
    if (req.body.usageLimit !== undefined) data.usageLimit = req.body.usageLimit ? Number(req.body.usageLimit) : null;
    if (req.body.code) {
      const nc = req.body.code.trim().toUpperCase();
      if (nc !== discount.code) {
        const dup = await prisma.discount.findFirst({ where: { tenantId: req.tenantId, code: nc, NOT: { id } } });
        if (dup) return res.status(400).json({ message: 'Ma khuyen mai moi bi trung.' });
        data.code = nc;
      }
    }
    const updated = await prisma.discount.update({ where: { id }, data });
    res.json(updated);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const deleteDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const discount = await prisma.discount.findFirst({ where: { id, tenantId: req.tenantId } });
    if (!discount) return res.status(404).json({ message: 'Khong tim thay ma khuyen mai.' });
    await prisma.discount.delete({ where: { id } });
    res.json({ message: 'Da xoa ma khuyen mai.' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const checkDiscount = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    if (!code) return res.status(400).json({ isValid: false, message: 'Vui long cung cap ma khuyen mai.' });
    if (!orderAmount || orderAmount <= 0) return res.status(400).json({ isValid: false, message: 'Gia tri don hang khong hop le.' });
    const normalizedCode = code.trim().toUpperCase();
    const discount = await prisma.discount.findFirst({ where: { tenantId: req.tenantId, code: normalizedCode } });
    if (!discount) return res.status(404).json({ isValid: false, message: 'Ma khuyen mai khong ton tai.' });
    if (!discount.isActive) return res.status(400).json({ isValid: false, message: 'Ma khuyen mai da ngung hoat dong.' });
    const now = new Date();
    if (discount.startDate && new Date(discount.startDate) > now) return res.status(400).json({ isValid: false, message: 'Ma chua den thoi gian su dung.' });
    if (discount.endDate && new Date(discount.endDate) < now) return res.status(400).json({ isValid: false, message: 'Ma da het han.' });
    if (discount.minOrderValue && orderAmount < Number(discount.minOrderValue)) return res.status(400).json({ isValid: false, message: 'Don hang chua dat gia tri toi thieu.' });
    let discountAmount = 0;
    if (discount.discountType === 'percentage') discountAmount = (orderAmount * Number(discount.discountValue)) / 100;
    else discountAmount = Number(discount.discountValue);
    if (discountAmount > orderAmount) discountAmount = orderAmount;
    res.json({ isValid: true, discountAmount, discount });
  } catch (error) { res.status(500).json({ isValid: false, message: error.message }); }
};
