import express from 'express';
import {
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus,
    updatePaymentStatus,
    getCustomerOrders,
    cancelOrder,
    getOrderStats
} from '../controllers/order.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { verifyRole } from '../middleware/verifyTenant.js';

const router = express.Router();

// Customer routes (requires authentication)
router.post('/', verifyToken, createOrder); // Tạo đơn hàng mới
router.get('/my-orders', verifyToken, getCustomerOrders); // Lấy đơn hàng của customer
router.post('/:id/cancel', verifyToken, cancelOrder); // Hủy đơn hàng (customer only)

// Shared routes (customer can view their own orders, admin can view all)
router.get('/:id', verifyToken, getOrderById); // Lấy chi tiết đơn hàng

// Admin routes (requires appropriate roles)
router.get('/', verifyToken, verifyRole('admin', 'tenant_admin', 'tenant_staff'), getOrders); // Lấy tất cả đơn hàng
router.put('/:id/status', verifyToken, verifyRole('admin', 'tenant_admin', 'tenant_staff'), updateOrderStatus); // Cập nhật trạng thái đơn hàng
router.put('/:id/payment', verifyToken, verifyRole('admin', 'tenant_admin', 'tenant_staff'), updatePaymentStatus); // Cập nhật trạng thái thanh toán

// Revenue Reports - Restricted to admins only
router.get('/admin/stats', verifyToken, verifyRole('admin', 'tenant_admin'), getOrderStats); // Thống kê đơn hàng (admin only)

export default router;