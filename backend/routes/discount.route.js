import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { verifyRole } from '../middleware/verifyTenant.js';
import {
    getDiscounts,
    createDiscount,
    updateDiscount,
    deleteDiscount,
    checkDiscount
} from '../controllers/discount.controller.js';

const router = express.Router();

// 1. Kiểm tra mã khuyến mãi khi checkout (staff & admin đều dùng được)
router.post('/check', verifyToken, verifyRole('tenant_admin', 'tenant_staff'), checkDiscount);

// Các route quản lý mã khuyến mãi CRUD (chỉ tenant_admin hoặc tenant_staff được phép)
router.get('/', verifyToken, verifyRole('tenant_admin', 'tenant_staff'), getDiscounts);
router.post('/', verifyToken, verifyRole('tenant_admin', 'tenant_staff'), createDiscount);
router.put('/:id', verifyToken, verifyRole('tenant_admin', 'tenant_staff'), updateDiscount);
router.delete('/:id', verifyToken, verifyRole('tenant_admin', 'tenant_staff'), deleteDiscount);

export default router;
