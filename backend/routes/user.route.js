import express from 'express';
import { getGlobalUsers, deleteGlobalUser, restoreGlobalUser } from '../controllers/user.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { verifyRole } from '../middleware/verifyTenant.js';

const router = express.Router();

router.use(verifyToken, verifyRole(['super_admin']));

router.get('/', getGlobalUsers);
router.delete('/:id', deleteGlobalUser);
router.post('/:id/restore', restoreGlobalUser);

export default router;
