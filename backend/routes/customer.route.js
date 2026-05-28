/**
 * Đây là file định nghĩa các route (đường dẫn API) cho customer management (quản lý khách hàng).
 * File này sử dụng Express Router để tổ chức các endpoint dành cho Admin quản lý khách hàng.
 */

import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import {
    getCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
    restoreCustomer,
    getCustomerStats
} from '../controllers/customer.controller.js';

import { verifyRole } from '../middleware/verifyTenant.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);
router.use(verifyRole(['tenant_admin', 'admin']));

// Định nghĩa các route cho customer management:

// 1. Lấy danh sách tất cả khách hàng với pagination và filters
//    - GET /api/customers
//    - Query params: page, limit, search, status, sortBy, dateFrom, dateTo
//    - Trả về danh sách customers với thống kê
router.get('/', getCustomers);

// 2. Lấy thống kê khách hàng
//    - GET /api/customers/stats
//    - Query params: period (7d, 30d, 90d, 1y)
//    - Trả về overview stats, growth data, top customers
router.get('/stats', getCustomerStats);

// 3. Lấy chi tiết một khách hàng
//    - GET /api/customers/:id
//    - Trả về thông tin chi tiết customer + order history + stats
router.get('/:id', getCustomerById);

// 4. Cập nhật thông tin khách hàng
//    - PUT /api/customers/:id
//    - Body: { name, email, isVerified }
//    - Cập nhật thông tin cơ bản của customer
router.put('/:id', updateCustomer);

// 5. Xóa khách hàng (soft delete)
//    - DELETE /api/customers/:id
//    - Vô hiệu hóa tài khoản (set isVerified = false)
router.delete('/:id', deleteCustomer);

// 6. Khôi phục khách hàng
//    - POST /api/customers/:id/restore
//    - Khôi phục tài khoản đã bị vô hiệu hóa
router.post('/:id/restore', restoreCustomer);

export default router;