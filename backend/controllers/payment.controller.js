import prisma from '../utils/prisma.js';
import { sendInvoiceEmail } from '../mailtrap/emails.js';
import payos from '../utils/payos.js';

export const handlePayOSWebhook = async (req, res) => {
  try {
    console.log('🔔 PayOS Webhook called:', JSON.stringify(req.body));
    const { code, data } = req.body;
    const { orderCode, amount } = data || {};
    console.log('Code:', code, 'OrderCode:', orderCode, 'Amount:', amount);

    const payment = await prisma.payment.findFirst({
      where: {
        paymentMethod: 'payos',
        status: 'pending',
        amount: String(amount)
      },
      orderBy: { createdAt: 'desc' }
    });
    console.log('Found payment:', payment?.id);

    if (payment) {
      if (code === '00') {
        // Thanh toán thành công
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'completed' }
        });
        if (payment.orderId) {
          await prisma.order.update({
            where: { id: payment.orderId },
            data: { paymentStatus: 'paid', status: 'delivered' }
          });
          console.log('Payment completed, order updated:', payment.orderId);
        }
      } else {
        // Thanh toán thất bại / bị hủy
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'failed' }
        });
        if (payment.orderId) {
          await prisma.order.update({
            where: { id: payment.orderId },
            data: { paymentStatus: 'failed', status: 'cancelled' }
          });
          console.log('Payment failed/cancelled, order cancelled:', payment.orderId);
        }
      }
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.json({ success: true });
  }
};

export const getPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', paymentMethod = '', sortBy = 'newest', dateFrom = '', dateTo = '' } = req.query;
    const pageNum = parseInt(page); const limitNum = parseInt(limit); const skip = (pageNum - 1) * limitNum;
    const where = { tenantId: req.tenantId };
    if (status && status !== 'all') where.status = status;
    if (paymentMethod && paymentMethod !== 'all') where.paymentMethod = paymentMethod;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom + 'T00:00:00+07:00');
      if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59.999+07:00');
    }
    const orderBy = sortBy === 'amount_asc' ? { amount: 'asc' } : sortBy === 'amount_desc' ? { amount: 'desc' } : sortBy === 'oldest' ? { createdAt: 'asc' } : { createdAt: 'desc' };
    const [payments, totalPayments] = await Promise.all([
      prisma.payment.findMany({ where, orderBy, skip, take: limitNum, include: { order: { select: { orderNumber: true } } } }),
      prisma.payment.count({ where })
    ]);
    const allPayments = await prisma.payment.findMany({ where });
    const totalAmount = allPayments.reduce((s, p) => s + Number(p.amount), 0);
    const completedAmount = allPayments.filter(p => p.status === 'completed').reduce((s, p) => s + Number(p.amount), 0);
    const pendingAmount = allPayments.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0);
    const failedAmount = allPayments.filter(p => p.status === 'failed').reduce((s, p) => s + Number(p.amount), 0);
    res.json({ success: true, payments, pagination: { currentPage: pageNum, totalPages: Math.ceil(totalPayments / limitNum), totalPayments, hasNextPage: pageNum < Math.ceil(totalPayments / limitNum), hasPrevPage: pageNum > 1, limit: limitNum }, stats: { totalAmount, completedAmount, pendingAmount, failedAmount, totalRefunded: 0 } });
  } catch (error) { console.error('Payment error:', error); res.status(500).json({ success: false, message: error.message }); }
};

export const getPaymentById = async (req, res) => {
  try {
    // Phai filter theo tenantId de tranh data leak giua cac tenant
    const payment = await prisma.payment.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId },
      include: { order: true }
    });
    if (!payment) return res.status(404).json({ success: false, message: 'Khong tim thay' });
    res.json({ success: true, payment });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const getPaymentStats = async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({ where: { tenantId: req.tenantId } });
    const totalRevenue = payments.filter(p => p.status === 'completed').reduce((s, p) => s + Number(p.amount), 0);
    // Group by date for dailyRevenue (theo timezone VN +07:00)
    const dailyMap = {};
    payments.forEach(p => {
      // Cong them 7h vao UTC de lay ngay theo VN
      const vnDate = new Date(p.createdAt.getTime() + 7 * 60 * 60 * 1000);
      const date = vnDate.toISOString().split('T')[0];
      if (!dailyMap[date]) dailyMap[date] = { date, revenue: 0, count: 0 };
      if (p.status === 'completed') { dailyMap[date].revenue += Number(p.amount); dailyMap[date].count++; }
    });
    const dailyRevenue = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    // Group by paymentMethod
    const methodMap = {};
    payments.forEach(p => {
      if (!methodMap[p.paymentMethod]) methodMap[p.paymentMethod] = { method: p.paymentMethod, count: 0, amount: 0 };
      methodMap[p.paymentMethod].count++;
      methodMap[p.paymentMethod].amount += Number(p.amount);
    });
    const paymentMethodBreakdown = Object.values(methodMap);

    res.json({ success: true, stats: { overview: { totalRevenue, totalTransactions: payments.length, successfulTransactions: payments.filter(p => p.status === 'completed').length, failedTransactions: payments.filter(p => p.status === 'failed').length, pendingTransactions: payments.filter(p => p.status === 'pending').length, totalRefunded: 0, avgTransactionValue: payments.length ? Math.round(totalRevenue / payments.length) : 0 }, paymentMethodBreakdown, dailyRevenue, topCustomers: [] } });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const existing = await prisma.payment.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!existing) return res.status(404).json({ success: false, message: 'Khong tim thay' });
    const payment = await prisma.payment.update({ where: { id: req.params.id }, data: { status } });
    res.json({ success: true, payment });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const processRefund = async (req, res) => {
  try {
    const existing = await prisma.payment.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!existing) return res.status(404).json({ success: false, message: 'Khong tim thay' });
    const payment = await prisma.payment.update({ where: { id: req.params.id }, data: { status: 'refunded' } });
    res.json({ success: true, payment });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const exportPayments = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const where = { tenantId: req.tenantId };
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom + 'T00:00:00+07:00');
      if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59.999+07:00');
    }
    const payments = await prisma.payment.findMany({
      where,
      include: { order: { select: { orderNumber: true } } },
      orderBy: { createdAt: 'desc' }
    });
    const formatted = payments.map(p => ({
      id: p.id,
      orderNumber: p.order?.orderNumber || 'N/A',
      amount: Number(p.amount),
      paymentMethod: p.paymentMethod,
      status: p.status,
      transactionId: p.transactionId,
      createdAt: p.createdAt?.toISOString().replace('T', ' ').slice(0, 19)
    }));
    res.json({ success: true, payments: formatted });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const verifyPayOSPayment = async (req, res) => {
  try {
    const { orderCode } = req.body;
    if (!orderCode) return res.status(400).json({ success: false, message: 'orderCode required' });

    if (!payos) return res.status(500).json({ success: false, message: 'PayOS not configured' });

    const paymentInfo = await payos.paymentRequests.get(orderCode);
    console.log('PayOS verify:', orderCode, paymentInfo.status);

    const payment = await prisma.payment.findFirst({
      where: { paymentMethod: 'payos', status: 'pending' },
      orderBy: { createdAt: 'desc' }
    });

    if (paymentInfo.status === 'PAID' && payment) {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: 'completed' } });
      if (payment.orderId) {
        await prisma.order.update({ where: { id: payment.orderId }, data: { paymentStatus: 'paid', status: 'delivered' } });
      }
      return res.json({ success: true, status: 'PAID', message: 'Thanh toan thanh cong' });
    } else if (paymentInfo.status === 'CANCELLED' && payment) {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: 'failed' } });
      if (payment.orderId) {
        await prisma.order.update({ where: { id: payment.orderId }, data: { paymentStatus: 'failed', status: 'cancelled' } });
      }
      return res.json({ success: true, status: 'CANCELLED', message: 'Thanh toan bi huy' });
    }

    return res.json({ success: true, status: paymentInfo.status, message: 'Dang cho thanh toan' });
  } catch (error) {
    console.error('Verify PayOS error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};
