import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { verifyRole } from '../middleware/verifyTenant.js';
import { getStaffs, createStaff, deleteStaff, restoreStaff } from '../controllers/staff.controller.js';

const router = express.Router();

// Chỉ tenant_admin mới được quyền quản lý nhân sự
router.use(verifyToken, verifyRole(['tenant_admin']));

router.get('/', getStaffs);
router.post('/', createStaff);
router.delete('/:id', deleteStaff);
router.post('/:id/restore', restoreStaff);

export default router;
