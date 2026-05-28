import express from 'express';
import { getTenants, updateTenantStatus } from '../controllers/tenant.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { verifyRole } from '../middleware/verifyTenant.js';

const router = express.Router();

// Tất cả route cho Tenant đều yêu cầu đăng nhập và quyền super_admin
router.use(verifyToken, verifyRole(['super_admin']));

router.get('/', getTenants);
router.patch('/:id/status', updateTenantStatus);

export default router;
