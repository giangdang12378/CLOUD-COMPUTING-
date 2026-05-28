import prisma from '../utils/prisma.js';

export const reduceInventory = async (productId, quantity) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return;
  await prisma.product.update({ where: { id: productId }, data: { inventory: Math.max(0, product.inventory - quantity) } });
};

export const increaseInventory = async (productId, quantity) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return;
  await prisma.product.update({ where: { id: productId }, data: { inventory: product.inventory + quantity } });
};

export const getInventory = async (req, res) => {
  try {
    const products = await prisma.product.findMany({ where: { tenantId: req.tenantId }, select: { id: true, productName: true, inventory: true, status: true } });
    res.json({ success: true, products });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const updateInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { inventory } = req.body;
    const product = await prisma.product.update({ where: { id }, data: { inventory: Number(inventory) } });
    res.json({ success: true, product });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const getAdminStats = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const [totalProducts, totalOrders, payments] = await Promise.all([
      prisma.product.count({ where: { tenantId } }),
      prisma.order.count({ where: { tenantId } }),
      prisma.payment.findMany({ where: { tenantId, status: 'completed' }, select: { amount: true } })
    ]);
    const totalRevenue = payments.reduce((s, p) => s + Number(p.amount), 0);
    res.json({ totalProducts, totalOrders, totalRevenue, totalCustomers: 0 });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const checkInventory = async (req, res) => {
  try {
    const { items } = req.body;
    const results = [];
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      results.push({ productId: item.productId, available: product ? product.inventory >= item.quantity : false, inventory: product?.inventory || 0 });
    }
    res.json({ success: true, results });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const processOrder = async (req, res) => {
  try {
    const { items } = req.body;
    for (const item of items) await reduceInventory(item.productId, item.quantity);
    res.json({ success: true, message: 'Inventory updated' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const cancelOrder = async (req, res) => {
  try {
    const { items } = req.body;
    for (const item of items) await increaseInventory(item.productId, item.quantity);
    res.json({ success: true, message: 'Inventory restored' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
