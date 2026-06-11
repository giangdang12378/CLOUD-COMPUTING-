import prisma from '../utils/prisma.js';
import { sendInvoiceEmail } from '../mailtrap/emails.js';
import payos from '../utils/payos.js';

const genOrderNumber = () => 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

const VALID_STATUSES = ['delivered', 'cancelled'];
const VALID_PAYMENT_STATUSES = ['pending', 'paid', 'failed'];
const VALID_PAYMENT_METHODS = ['cod', 'bank_transfer', 'payos'];
const PENDING_TIMEOUT_MS = 5 * 60 * 1000; // 5 phut: pending qua thoi gian -> auto cancelled

// Auto-cleanup: don pending qua 5 phut chua thanh toan -> cancelled/failed
async function cleanupPendingOrders(tenantId) {
  const threshold = new Date(Date.now() - PENDING_TIMEOUT_MS);
  const expired = await prisma.order.findMany({
    where: { tenantId, status: 'pending', createdAt: { lt: threshold } },
    select: { id: true }
  });
  if (expired.length === 0) return;
  const ids = expired.map(o => o.id);
  await prisma.order.updateMany({
    where: { id: { in: ids } },
    data: { status: 'cancelled', paymentStatus: 'failed' }
  });
  await prisma.payment.updateMany({
    where: { orderId: { in: ids } },
    data: { status: 'failed' }
  });
}

export const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod: rawPaymentMethod, shippingFee = 0, discountAmount = 0, notes = '', status: initialStatus, paymentStatus: initialPaymentStatus, isPos = false } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ success: false, message: 'Gio hang trong' });
    if (!rawPaymentMethod) return res.status(400).json({ success: false, message: 'Chon phuong thuc thanh toan' });

    let paymentMethod = rawPaymentMethod;
    if (isPos) { if (rawPaymentMethod === 'cash') paymentMethod = 'cod'; if (rawPaymentMethod === 'transfer') paymentMethod = 'bank_transfer'; }

    let totalAmount = 0;
    const orderItems = [];
    let inferredTenantId = req.tenantId;

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) return res.status(404).json({ success: false, message: 'Khong tim thay san pham' });
      if (!inferredTenantId) inferredTenantId = product.tenantId;
      if (product.inventory < item.quantity) return res.status(400).json({ success: false, message: product.productName + ' khong du hang' });
      await prisma.product.update({ where: { id: product.id }, data: { inventory: product.inventory - item.quantity } });
      orderItems.push({ productId: product.id, quantity: item.quantity, price: Number(product.price) });
      totalAmount += Number(product.price) * item.quantity;
    }

    const finalAmount = totalAmount + Number(shippingFee) - Number(discountAmount);
    const orderNumber = genOrderNumber();
    const canSetStatus = isPos && req.user && ['tenant_admin', 'tenant_staff'].includes(req.user.role);
    const isPayos = (rawPaymentMethod === 'payos' || rawPaymentMethod === 'transfer');
    // POS tien mat -> delivered/paid luon. POS PayOS -> pending (cho webhook). Customer online -> pending.
    const finalStatus = (canSetStatus && !isPayos) ? 'delivered' : 'pending';
    const finalPaymentStatus = (canSetStatus && !isPayos) ? 'paid' : 'pending';

    const finalShippingAddress = { fullName: shippingAddress?.fullName || 'Khach le', phone: shippingAddress?.phone || '0000000000', address: shippingAddress?.address || 'Tai cua hang' };

    const order = await prisma.order.create({
      data: {
        tenantId: inferredTenantId,
        orderNumber,
        customerInfo: { name: finalShippingAddress.fullName, email: shippingAddress?.email || '' },
        totalAmount,
        shippingFee: Number(shippingFee),
        discountAmount: Number(discountAmount),
        finalAmount,
        status: finalStatus,
        paymentStatus: finalPaymentStatus,
        paymentMethod,
        items: { create: orderItems }
      },
      include: { items: { include: { product: { select: { productName: true } } } } }
    });

    const payment = await prisma.payment.create({
      data: { tenantId: inferredTenantId, orderId: order.id, amount: finalAmount, paymentMethod, status: finalPaymentStatus === 'paid' ? 'completed' : 'pending', transactionId: 'TXN-' + Date.now() }
    });

    let checkoutUrl = null;
    let generatedOrderCode = null;
    if (paymentMethod === 'payos' && payos) {
      try {
        generatedOrderCode = Number(Date.now().toString().slice(-6));
        const baseUrl = process.env.FRONTEND_URL || 'https://stylezone.duckdns.org';
        const body = {
          orderCode: generatedOrderCode,
          amount: Math.round(finalAmount),
          description: 'Don hang ' + orderNumber.slice(-10),
          returnUrl: baseUrl + '/admin/orders?payos=success&orderId=' + order.id,
          cancelUrl: baseUrl + '/admin/orders?payos=cancel&orderId=' + order.id
        };
        const link = await payos.paymentRequests.create(body);
        checkoutUrl = link.checkoutUrl;
      } catch (e) { console.error('PayOS error:', e.message); }
    }

    const customerEmail = shippingAddress?.email || '';
    if (customerEmail && finalPaymentStatus === 'paid') {
      try {
        const invoiceData = {
          customerName: shippingAddress?.fullName || 'Khach hang',
          storeName: 'StyleZone',
          transactionId: 'TXN-' + order.id.slice(-8),
          orderDate: new Date().toLocaleDateString('vi-VN'),
          paymentMethod: paymentMethod,
          orderItems: order.items.map(item => ({
            productName: item.product?.productName || 'San pham',
            quantity: item.quantity,
            price: Number(item.price)
          })),
          subtotal: totalAmount,
          shippingFee: Number(shippingFee),
          discountAmount: Number(discountAmount),
          totalAmount: finalAmount,
          storeAddress: 'Ho Chi Minh City',
          storePhone: '0123456789'
        };
        await sendInvoiceEmail(customerEmail, invoiceData);
      } catch (emailErr) {
        console.error('Email error:', emailErr.message);
      }
    }
    res.status(201).json({ success: true, message: 'Dat hang thanh cong', order, paymentId: payment.id, checkoutUrl, orderCode: generatedOrderCode });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrders = async (req, res) => {
  try {
    await cleanupPendingOrders(req.tenantId);
    const { page = 1, limit = 10, status = '', paymentStatus = '', search = '', sortBy = 'newest', startDate = '', endDate = '' } = req.query;
    const pageNum = parseInt(page); const limitNum = parseInt(limit); const skip = (pageNum - 1) * limitNum;
    // Chi hien thi don delivered/cancelled, an pending (don PayOS dang cho thanh toan)
    const where = { tenantId: req.tenantId, status: { in: ['delivered', 'cancelled'] } };
    if (status && status !== 'all') where.status = status;
    if (paymentStatus && paymentStatus !== 'all') where.paymentStatus = paymentStatus;
    if (search) where.orderNumber = { contains: search, mode: 'insensitive' };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate + 'T00:00:00+07:00');
      if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59.999+07:00');
    }
    const orderBy = sortBy === 'oldest' ? { createdAt: 'asc' } : sortBy === 'amount_asc' ? { finalAmount: 'asc' } : sortBy === 'amount_desc' ? { finalAmount: 'desc' } : { createdAt: 'desc' };
    const [orders, totalOrders] = await Promise.all([
      prisma.order.findMany({ where, orderBy, skip, take: limitNum, include: { items: { include: { product: { select: { productName: true, image: true } } } } } }),
      prisma.order.count({ where })
    ]);
    res.json({ orders: orders.map(o => ({...o, _id: o.id})), pagination: { currentPage: pageNum, totalPages: Math.ceil(totalOrders / limitNum), totalOrders, hasNextPage: pageNum < Math.ceil(totalOrders / limitNum), hasPrevPage: pageNum > 1, limit: limitNum } });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await prisma.order.findFirst({ where: { id: req.params.id, tenantId: req.tenantId }, include: { items: { include: { product: true } } } });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({...order, _id: order.id});
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status, paymentStatus, paymentMethod, note } = req.body;

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Trang thai khong hop le. Chi nhan: delivered, cancelled' });
    }
    if (paymentStatus && !VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
      return res.status(400).json({ success: false, message: 'Trang thai thanh toan khong hop le' });
    }
    if (paymentMethod && !VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'Phuong thuc thanh toan khong hop le' });
    }

    const order = await prisma.order.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!order) return res.status(404).json({ success: false, message: 'Khong tim thay don hang' });

    let finalStatus = status || order.status;
    let finalPaymentStatus = paymentStatus || order.paymentStatus;
    let finalPaymentMethod = paymentMethod || order.paymentMethod;

    // Auto-sync 1: paymentMethod = cod (tien mat) -> luon force delivered + paid
    if (paymentMethod === 'cod') {
      finalStatus = 'delivered';
      finalPaymentStatus = 'paid';
    }

    // Auto-sync 2: status = delivered -> luon force paymentStatus = paid (override)
    if (finalStatus === 'delivered') {
      finalPaymentStatus = 'paid';
    }

    // Auto-sync 3: status = cancelled -> luon force paymentStatus = failed (override)
    if (finalStatus === 'cancelled') {
      finalPaymentStatus = 'failed';
    }

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        status: finalStatus,
        paymentStatus: finalPaymentStatus,
        paymentMethod: finalPaymentMethod
      }
    });

    // Dong bo Payment record
    const paymentRecordStatus = finalPaymentStatus === 'paid' ? 'completed' : finalPaymentStatus === 'failed' ? 'failed' : 'pending';
    await prisma.payment.updateMany({
      where: { orderId: req.params.id },
      data: { status: paymentRecordStatus, paymentMethod: finalPaymentMethod }
    });

    res.json({ success: true, message: 'Cap nhat thanh cong', order: {...updated, _id: updated.id} });
  } catch (error) {
    console.error('updateOrderStatus error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    if (!VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
      return res.status(400).json({ message: 'Trang thai thanh toan khong hop le' });
    }
    const order = await prisma.order.update({ where: { id: req.params.id }, data: { paymentStatus } });
    res.json({ message: 'Updated', order });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getCustomerOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '' } = req.query;
    const pageNum = parseInt(page); const limitNum = parseInt(limit); const skip = (pageNum - 1) * limitNum;
    const where = { tenantId: req.tenantId };
    if (status && status !== 'all') where.status = status;
    const [orders, totalOrders] = await Promise.all([prisma.order.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limitNum }), prisma.order.count({ where })]);
    res.json({ orders: orders.map(o => ({...o, _id: o.id})), pagination: { currentPage: pageNum, totalPages: Math.ceil(totalOrders / limitNum), totalOrders, hasNextPage: pageNum < Math.ceil(totalOrders / limitNum), hasPrevPage: pageNum > 1, limit: limitNum } });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const cancelOrder = async (req, res) => {
  try {
    const order = await prisma.order.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status === 'cancelled') return res.status(400).json({ message: 'Don hang da bi huy' });
    if (order.status === 'delivered' && order.paymentStatus === 'paid') return res.status(400).json({ message: 'Khong the huy don hang da hoan thanh' });
    await prisma.order.update({ where: { id: req.params.id }, data: { status: 'cancelled', paymentStatus: 'failed' } });
    await prisma.payment.updateMany({ where: { orderId: req.params.id }, data: { status: 'failed' } });
    res.json({ message: 'Da huy don hang' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getOrderStats = async (req, res) => {
  try {
    await cleanupPendingOrders(req.tenantId);
    const where = { tenantId: req.tenantId, status: { in: ['delivered', 'cancelled'] } };
    const [totalOrders, orders] = await Promise.all([prisma.order.count({ where }), prisma.order.findMany({ where, select: { finalAmount: true, status: true, paymentStatus: true } })]);
    const totalRevenue = orders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + Number(o.finalAmount), 0);
    const statusMap = {};
    orders.forEach(o => {
      if (!statusMap[o.status]) statusMap[o.status] = { _id: o.status, count: 0 };
      statusMap[o.status].count++;
    });
    const statusBreakdown = Object.values(statusMap);
    res.json({ totalOrders, totalRevenue, statusBreakdown });
  } catch (error) { res.status(500).json({ message: error.message }); }
};
